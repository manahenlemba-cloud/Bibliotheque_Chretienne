import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { UserQuestion, QuestionMessage } from '../types.ts';
import {
  questionsDatabase,
  whatsAppConfig,
  outboundMessageToQuestionMap,
  lastDispatchedQuestionByPhone,
  webhookLogs,
  WebhookLogEntry,
  broadcastSSE,
  sendWhatsAppNotification,
  cleanDigits,
  isPhoneMatching,
  isAdminAuthorized
} from './communication.ts';

// --- TYPES FOR WHATSAPP CLOUD API (META GRAPH API) ---

export interface WhatsAppCloudWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      field: string;
      value?: {
        messaging_product: string;
        metadata?: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<WhatsAppCloudIncomingMessage>;
        statuses?: Array<WhatsAppCloudIncomingStatus>;
      };
    }>;
  }>;
}

export interface WhatsAppCloudIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  context?: {
    from?: string;
    id: string; // The original Meta message ID (wamid...) being replied to
    forwarded?: boolean;
    frequently_forwarded?: boolean;
  };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  button?: {
    payload: string;
    text: string;
  };
}

export interface WhatsAppCloudIncomingStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    expiration_timestamp?: string;
    origin?: {
      type: string;
    };
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: Array<{
    code: number;
    title: string;
    message?: string;
    error_data?: { details: string };
  }>;
}

export interface ParsedCloudMessage {
  messageId: string;
  from: string;
  senderName?: string;
  timestamp: string;
  text: string;
  contextId?: string; // The ID of the quoted message for conversation association
  rawType: string;
  phoneNumberId?: string;
}

export interface AssociationResult {
  success: boolean;
  matchedQuestion?: UserQuestion;
  conversationId?: string;
  cleanReplyText?: string;
  matchMethod: 'context_id' | 'explicit_id' | 'last_dispatched' | 'pending_fallback' | 'unmatched';
  status: WebhookLogEntry['status'];
  error?: string;
}

// --- 1. SECURITY VERIFICATION ---

/**
 * Validates the verification token when Meta WhatsApp Cloud API subscribes the webhook.
 * Expected query parameters:
 *  - hub.mode = 'subscribe'
 *  - hub.verify_token = [token configured in WhatsApp settings]
 *  - hub.challenge = [random string to echo back]
 */
export function verifyWhatsAppSecurityToken(
  mode: string | undefined,
  verifyToken: string | undefined,
  expectedToken: string = whatsAppConfig.verify_token || process.env.WHATSAPP_VERIFY_TOKEN || 'derniereheure_webhook_token'
): { isValid: boolean; reason?: string } {
  if (!mode || !verifyToken) {
    return { isValid: false, reason: 'Paramètres hub.mode ou hub.verify_token manquants.' };
  }

  if (mode !== 'subscribe') {
    return { isValid: false, reason: `Mode non reconnu: ${mode}. 'subscribe' attendu.` };
  }

  if (verifyToken !== expectedToken) {
    return {
      isValid: false,
      reason: `Token de vérification invalide. Reçu: "${verifyToken}", attendu: "${expectedToken}".`
    };
  }

  return { isValid: true };
}

/**
 * Optional HMAC-SHA256 signature verification for enterprise WhatsApp Cloud API security.
 * Uses the Meta App Secret to verify X-Hub-Signature-256 header.
 */
export function validatePayloadSignature(
  rawBody: string | Buffer,
  signatureHeader?: string,
  appSecret: string = process.env.WHATSAPP_APP_SECRET || ''
): boolean {
  if (!appSecret || !signatureHeader) {
    // If no app secret is configured, bypass signature check
    return true;
  }

  try {
    const signatureParts = signatureHeader.split('sha256=');
    if (signatureParts.length !== 2) return false;

    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signatureParts[1]),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    console.error('[WhatsApp Webhook] Erreur de vérification de signature:', err);
    return false;
  }
}

// --- 2. JSON PAYLOAD PARSER ---

/**
 * Parses the nested WhatsApp Cloud API JSON payload into structured, typed objects.
 */
export function parseWhatsAppCloudPayload(payload: any): {
  isCloudApi: boolean;
  messages: ParsedCloudMessage[];
  statuses: WhatsAppCloudIncomingStatus[];
  metadata?: { displayPhoneNumber?: string; phoneNumberId?: string };
} {
  const result: {
    isCloudApi: boolean;
    messages: ParsedCloudMessage[];
    statuses: WhatsAppCloudIncomingStatus[];
    metadata?: { displayPhoneNumber?: string; phoneNumberId?: string };
  } = {
    isCloudApi: false,
    messages: [],
    statuses: []
  };

  if (!payload || payload.object !== 'whatsapp_business_account' || !Array.isArray(payload.entry)) {
    return result;
  }

  result.isCloudApi = true;

  for (const entry of payload.entry) {
    if (!Array.isArray(entry.changes)) continue;

    for (const change of entry.changes) {
      if (change.field !== 'messages' || !change.value) continue;

      const val = change.value;
      if (val.metadata) {
        result.metadata = {
          displayPhoneNumber: val.metadata.display_phone_number,
          phoneNumberId: val.metadata.phone_number_id
        };
      }

      // Build contact lookup map (wa_id -> profile name)
      const contactNames = new Map<string, string>();
      if (Array.isArray(val.contacts)) {
        for (const contact of val.contacts) {
          if (contact.wa_id && contact.profile?.name) {
            contactNames.set(contact.wa_id, contact.profile.name);
          }
        }
      }

      // Process message items
      if (Array.isArray(val.messages)) {
        for (const msg of val.messages) {
          let textBody = '';

          if (msg.type === 'text' && msg.text?.body) {
            textBody = msg.text.body;
          } else if (msg.type === 'interactive') {
            if (msg.interactive?.button_reply?.title) {
              textBody = msg.interactive.button_reply.title;
            } else if (msg.interactive?.list_reply?.title) {
              textBody = msg.interactive.list_reply.title;
            }
          } else if (msg.type === 'button' && msg.button?.text) {
            textBody = msg.button.text;
          }

          if (textBody || msg.context?.id) {
            result.messages.push({
              messageId: msg.id,
              from: msg.from,
              senderName: contactNames.get(msg.from),
              timestamp: msg.timestamp || new Date().toISOString(),
              text: textBody,
              contextId: msg.context?.id,
              rawType: msg.type,
              phoneNumberId: val.metadata?.phone_number_id
            });
          }
        }
      }

      // Process delivery & read statuses
      if (Array.isArray(val.statuses)) {
        for (const st of val.statuses) {
          result.statuses.push(st);
        }
      }
    }
  }

  return result;
}

// --- 3. CONVERSATION EXTRACTION & ASSOCIATION LOGIC ---

/**
 * Scans a message text for explicit conversation ID patterns.
 * Supported patterns:
 *  - QUESTION-1048, question-1048
 *  - #QUESTION-1048, #1048
 *  - REP-1048, REP: 1048
 *  - Q-1048, q1048
 *  - [QUESTION-1048]
 */
export function extractConversationIdFromText(text: string): string | null {
  if (!text) return null;

  // Pattern 1: QUESTION-XXXX or REP-XXXX or Q-XXXX
  const patternFull = text.match(/(?:QUESTION|REP|Q)[-_#\s]*([0-9]{3,})/i);
  if (patternFull) {
    return `QUESTION-${patternFull[1]}`;
  }

  // Pattern 2: Hash followed by 4 digits (#1048)
  const patternHash = text.match(/#([0-9]{4})/);
  if (patternHash) {
    return `QUESTION-${patternHash[1]}`;
  }

  // Pattern 3: Reference tag [Ref: QUESTION-XXXX]
  const patternTag = text.match(/(?:REF|CONV|ID)[-_:\s]*([a-zA-Z0-9_-]+)/i);
  if (patternTag) {
    return patternTag[1].toUpperCase();
  }

  return null;
}

/**
 * Cleans the reply text by removing matching conversation ID prefixes
 * (e.g. "QUESTION-1048: Que la grâce de Dieu..." -> "Que la grâce de Dieu...")
 */
export function sanitizeReplyText(text: string): string {
  if (!text) return '';

  return text
    .replace(/^(?:\[?(?:QUESTION|REP|Q|REF|ID)[-_#\s]*[0-9a-zA-Z]+\]?[:\s\-\–]+)/i, '')
    .trim();
}

/**
 * Core business engine: extracts the admin reply and associates it with an active conversation_id.
 * Hierarchy:
 *  1. Meta Cloud API Context ID (swiped reply on WhatsApp)
 *  2. Explicit conversation ID extracted from text body
 *  3. Last dispatched question to the admin phone number
 *  4. Active pending question fallback
 */
export async function extractAndAssociateReply(
  parsed: ParsedCloudMessage
): Promise<AssociationResult> {
  const { from, text, contextId, messageId } = parsed;

  console.log(`[WhatsApp Cloud Webhook] Traitement message de ${from} | contextId: ${contextId || 'aucun'} | corps: "${text}"`);

  // Check sender authorization against configured admin phone
  const isAuthorized = isPhoneMatching(from, whatsAppConfig.admin_phone);
  if (!isAuthorized && whatsAppConfig.admin_phone) {
    console.warn(`[WhatsApp Cloud Webhook] Expéditeur non autorisé (${from}). Attendu: ${whatsAppConfig.admin_phone}`);
    return {
      success: false,
      matchMethod: 'unmatched',
      status: 'unauthorized',
      error: `Numéro WhatsApp non autorisé (${from})`
    };
  }

  let matchedQuestion: UserQuestion | undefined;
  let matchMethod: AssociationResult['matchMethod'] = 'unmatched';
  let matchedStatus: WebhookLogEntry['status'] = 'unmatched';

  // --- Step 1: Association via Meta Cloud API Context ID (Native WhatsApp Reply) ---
  if (contextId) {
    // Check outbound mapping cache
    const targetQId = outboundMessageToQuestionMap.get(contextId);
    if (targetQId) {
      matchedQuestion = questionsDatabase.find(q => q.id === targetQId || q.conversation_id === targetQId);
    }

    // Direct search on whatsapp_message_id
    if (!matchedQuestion) {
      matchedQuestion = questionsDatabase.find(q => q.whatsapp_message_id === contextId);
    }

    if (matchedQuestion) {
      matchMethod = 'context_id';
      matchedStatus = 'matched_context';
      console.log(`[WhatsApp Cloud Webhook] Succès association via Context ID (${contextId}) -> ${matchedQuestion.conversation_id || matchedQuestion.id}`);
    }
  }

  // --- Step 2: Association via Explicit conversation_id in message text ---
  if (!matchedQuestion && text) {
    const extractedId = extractConversationIdFromText(text);
    if (extractedId) {
      matchedQuestion = questionsDatabase.find(q => {
        const qConvId = (q.conversation_id || q.id).toUpperCase();
        return qConvId === extractedId.toUpperCase() || qConvId.includes(extractedId.toUpperCase());
      });

      if (matchedQuestion) {
        matchMethod = 'explicit_id';
        matchedStatus = 'matched_id';
        console.log(`[WhatsApp Cloud Webhook] Succès association via ID explicite dans le texte (${extractedId}) -> ${matchedQuestion.conversation_id || matchedQuestion.id}`);
      }
    }
  }

  // --- Step 3: Association via Last Dispatched Question mapping ---
  if (!matchedQuestion) {
    const cleanFrom = cleanDigits(from);
    const lastDispatchedQId = lastDispatchedQuestionByPhone.get(cleanFrom);
    if (lastDispatchedQId) {
      const candidate = questionsDatabase.find(q => q.id === lastDispatchedQId || q.conversation_id === lastDispatchedQId);
      if (candidate && candidate.status === 'pending') {
        matchedQuestion = candidate;
        matchMethod = 'last_dispatched';
        matchedStatus = 'matched_last_dispatched';
        console.log(`[WhatsApp Cloud Webhook] Succès association via dernier message expédié (${lastDispatchedQId})`);
      }
    }
  }

  // --- Step 4: Fallback to the oldest active pending question ---
  if (!matchedQuestion) {
    const pendingQuestions = questionsDatabase.filter(q => q.status === 'pending');
    if (pendingQuestions.length > 0) {
      matchedQuestion = pendingQuestions[0];
      matchMethod = 'pending_fallback';
      matchedStatus = 'matched_pending';
      console.log(`[WhatsApp Cloud Webhook] Succès association via question en attente la plus ancienne (${matchedQuestion.conversation_id || matchedQuestion.id})`);
    }
  }

  // If no conversation could be resolved
  if (!matchedQuestion) {
    return {
      success: false,
      matchMethod: 'unmatched',
      status: 'unmatched',
      error: "Aucune conversation active ou en attente n'a pu être associée."
    };
  }

  // Clean the answer body
  const cleanReply = sanitizeReplyText(text) || text.trim();
  const conversationId = matchedQuestion.conversation_id || matchedQuestion.id;

  // Construct official Admin Message
  const adminMessage: QuestionMessage = {
    id: `msg-${conversationId}-wa-${Date.now()}`,
    question_id: conversationId,
    sender_id: 'admin',
    sender_type: 'admin',
    sender_name: 'Docteur LEMBA KAVUMBULA MOÏSE (Administrateur)',
    message: cleanReply,
    source: 'whatsapp',
    created_at: new Date().toISOString()
  };

  // Mutate conversation state
  matchedQuestion.messages.push(adminMessage);
  matchedQuestion.status = 'answered';
  matchedQuestion.answered_at = new Date().toISOString();
  matchedQuestion.last_source = 'whatsapp';

  // Broadcast real-time SSE event to all connected clients (Admin & User UI)
  broadcastSSE('whatsapp_reply', {
    questionId: conversationId,
    question: matchedQuestion,
    reply: adminMessage,
    source: 'whatsapp',
    metaMessageId: messageId,
    notification: {
      title: "L'administrateur a répondu à votre question",
      message: cleanReply,
      userName: matchedQuestion.user_name,
      userId: matchedQuestion.user_id,
      questionId: conversationId
    },
    timestamp: new Date().toISOString()
  });

  // If user provided a phone contact, forward the reply
  if (matchedQuestion.user_contact && matchedQuestion.user_contact.startsWith('+')) {
    const userNotification = `📖 BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE\n\n🔔 L'administrateur a répondu à votre question (${conversationId}) :\n\n👨‍💼 Docteur LEMBA KAVUMBULA MOÏSE :\n"${cleanReply}"\n\nConsultez l'historique complet sur la plateforme. Que Dieu vous bénisse !`;
    sendWhatsAppNotification(matchedQuestion.user_contact, userNotification).catch(err => {
      console.warn('[WhatsApp Cloud Webhook] Impossible de transférer la réponse au fidèle:', err);
    });
  }

  return {
    success: true,
    matchedQuestion,
    conversationId,
    cleanReplyText: cleanReply,
    matchMethod,
    status: matchedStatus
  };
}

// --- 4. EXPRESS ROUTE HANDLERS ---

/**
 * Handles GET requests from Meta Cloud API for Webhook Verification.
 */
export const handleWhatsAppCloudVerification = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string | undefined;
  const token = req.query['hub.verify_token'] as string | undefined;
  const challenge = req.query['hub.challenge'] as string | undefined;

  console.log('[WhatsApp Cloud Webhook] Requête de vérification reçue:', { mode, token, challenge });

  const verification = verifyWhatsAppSecurityToken(mode, token);

  if (verification.isValid && challenge) {
    console.log('[WhatsApp Cloud Webhook] Vérification réussie pour le challenge:', challenge);
    return res.status(200).send(challenge);
  }

  console.warn('[WhatsApp Cloud Webhook] Vérification échouée:', verification.reason);
  return res.status(403).send(verification.reason || 'Forbidden');
};

/**
 * Handles POST requests from Meta Cloud API with incoming events.
 */
export const handleWhatsAppCloudWebhook = async (req: Request, res: Response) => {
  try {
    const rawBody = req.body;
    console.log('[WhatsApp Cloud Webhook] Événement POST reçu');

    // Parse Cloud API payload
    const parsedPayload = parseWhatsAppCloudPayload(rawBody);

    if (parsedPayload.isCloudApi) {
      // Process incoming user/admin messages
      for (const msg of parsedPayload.messages) {
        const result = await extractAndAssociateReply(msg);

        // Record in audit log
        webhookLogs.unshift({
          id: `wh-cloud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          from: msg.from,
          messageType: msg.rawType || 'text',
          bodyPreview: msg.text.length > 120 ? msg.text.slice(0, 120) + '...' : msg.text,
          contextId: msg.contextId,
          matchedQuestionId: result.conversationId || result.matchedQuestion?.id,
          userName: result.matchedQuestion?.user_name,
          status: result.status,
          error: result.error
        });

        if (webhookLogs.length > 100) webhookLogs.pop();
      }

      // Process statuses if any (acknowledge delivery / read)
      if (parsedPayload.statuses.length > 0) {
        console.log(`[WhatsApp Cloud Webhook] ${parsedPayload.statuses.length} mise(s) à jour de statut reçue(s)`);
      }

      return res.status(200).send('EVENT_RECEIVED');
    }

    // Fallback: Check Twilio webhook format if present
    if (rawBody.From && rawBody.Body) {
      const fromNumber = rawBody.From.replace('whatsapp:', '');
      const textBody = rawBody.Body;
      const parsed: ParsedCloudMessage = {
        messageId: rawBody.MessageSid || `tw-${Date.now()}`,
        from: fromNumber,
        timestamp: new Date().toISOString(),
        text: textBody,
        rawType: 'twilio_text'
      };

      const result = await extractAndAssociateReply(parsed);

      webhookLogs.unshift({
        id: `wh-twilio-${Date.now()}`,
        timestamp: new Date().toISOString(),
        from: fromNumber,
        messageType: 'twilio_text',
        bodyPreview: textBody.slice(0, 120),
        matchedQuestionId: result.conversationId || result.matchedQuestion?.id,
        userName: result.matchedQuestion?.user_name,
        status: result.status,
        error: result.error
      });

      return res.status(200).type('text/xml').send('<Response></Response>');
    }

    return res.status(200).send('OK');
  } catch (err: any) {
    console.error('[WhatsApp Cloud Webhook] Erreur serveur lors du traitement:', err);
    return res.status(500).send('Internal Server Error');
  }
};

// --- 5. EXPRESS ROUTER FOR WHATSAPP WEBHOOK ---

export const whatsappWebhookRouter = Router();

// Routes for Meta Cloud API webhook (both prefixed and direct)
whatsappWebhookRouter.get('/webhook/whatsapp', handleWhatsAppCloudVerification);
whatsappWebhookRouter.get('/webhooks/whatsapp', handleWhatsAppCloudVerification);
whatsappWebhookRouter.post('/webhook/whatsapp', handleWhatsAppCloudWebhook);
whatsappWebhookRouter.post('/webhooks/whatsapp', handleWhatsAppCloudWebhook);

// Admin testing & simulation endpoint
whatsappWebhookRouter.post('/admin/whatsapp/simulate-incoming', async (req: Request, res: Response) => {
  try {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Accès administrateur non autorisé.' });
    }

    const { replyText, messageText, targetQuestionId, questionId, fromPhone, senderPhone, useNativeContext } = req.body;
    const bodyText = (replyText || messageText || '').trim();

    if (!bodyText) {
      return res.status(400).json({ error: 'Le texte du message est obligatoire.' });
    }

    const chosenQuestionId = targetQuestionId || questionId;
    const from = senderPhone || fromPhone || whatsAppConfig.admin_phone;

    let simulatedContextId: string | undefined;
    if (useNativeContext && chosenQuestionId) {
      const q = questionsDatabase.find(item => item.id === chosenQuestionId || item.conversation_id === chosenQuestionId);
      if (q?.whatsapp_message_id) {
        simulatedContextId = q.whatsapp_message_id;
      } else {
        simulatedContextId = `wamid.HBgL${Date.now()}`;
        outboundMessageToQuestionMap.set(simulatedContextId, chosenQuestionId);
      }
    }

    const parsed: ParsedCloudMessage = {
      messageId: `sim-wamid-${Date.now()}`,
      from,
      timestamp: new Date().toISOString(),
      text: bodyText,
      contextId: simulatedContextId,
      rawType: 'simulated_whatsapp_cloud'
    };

    const result = await extractAndAssociateReply(parsed);

    // Record in audit log
    webhookLogs.unshift({
      id: `wh-sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      from,
      messageType: 'simulated_test',
      bodyPreview: bodyText.slice(0, 120),
      contextId: simulatedContextId,
      matchedQuestionId: result.conversationId || result.matchedQuestion?.id,
      userName: result.matchedQuestion?.user_name,
      status: result.status,
      error: result.error
    });

    res.json({
      success: result.success,
      matched_via: result.matchMethod,
      message: result.success
        ? `Réponse WhatsApp injectée avec succès dans la conversation ${result.conversationId} !`
        : result.error,
      conversation_id: result.conversationId,
      question: result.matchedQuestion,
      error: result.error
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur lors de la simulation : ' + err.message });
  }
});
