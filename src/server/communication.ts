import { Router, Request, Response } from 'express';
import { UserProfile, UserQuestion, QuestionMessage, WhatsAppConfig } from '../types.ts';
import { sendAdminGmailNotification, adminEmailLogs, ADMIN_OFFICIAL_GMAIL } from './adminEmailNotification.ts';

const router = Router();

// In-memory persistent database for users
let usersDatabase: UserProfile[] = [
  {
    id: 'usr-1',
    name: 'Frère David Kalombo',
    email: 'david.kalombo@gmail.com',
    auth_provider: 'google',
    token: 'tok-david-demo-1',
    created_at: '2025-03-10T10:00:00Z'
  },
  {
    id: 'usr-2',
    name: 'Sœur Grace Mbemba',
    email: 'grace.mbemba@gmail.com',
    auth_provider: 'google',
    token: 'tok-grace-demo-2',
    created_at: '2025-03-12T15:30:00Z'
  }
];

// Anti-spam rate limiting: userId -> array of timestamps
const userRateLimits = new Map<string, number[]>();

// Sequence counter for professional unique question IDs (e.g. QUESTION-1048)
let questionSequence = 1047;
export function generateQuestionId(): string {
  questionSequence += 1;
  return `QUESTION-${questionSequence}`;
}

// In-memory persistent questions database
export let questionsDatabase: UserQuestion[] = [
  {
    id: 'QUESTION-1046',
    conversation_id: 'QUESTION-1046',
    user_id: 'usr-1',
    user_name: 'Frère David Kalombo',
    user_contact: '+243812345678',
    auth_provider: 'visitor',
    subject: 'Compréhension de la Bible & Prophétie',
    status: 'answered',
    created_at: '2025-03-14T09:15:00Z',
    answered_at: '2025-03-14T11:42:00Z',
    whatsapp_notified: true,
    whatsapp_direct_link: 'https://wa.me/243811733778',
    last_source: 'platform',
    messages: [
      {
        id: 'msg-q101-1',
        question_id: 'QUESTION-1046',
        sender_id: 'usr-1',
        sender_type: 'user',
        sender_name: 'Frère David Kalombo',
        message: 'Paix du Christ, Pasteur Moïse. Comment vivre concrètement la sanctification et la sainte veille décrites dans 1 Jean 2:18 dans un environnement professionnel souvent hostile à l\'Évangile ?',
        source: 'platform',
        created_at: '2025-03-14T09:15:00Z'
      },
      {
        id: 'msg-q101-2',
        question_id: 'QUESTION-1046',
        sender_id: 'admin',
        sender_type: 'admin',
        sender_name: 'Docteur LEMBA KAVUMBULA MOÏSE (Administrateur)',
        message: 'Que la paix de Notre Seigneur Jésus-Christ repose sur vous, bien-aimé frère David. La sanctification dans le milieu professionnel n\'exige pas de fuir le monde, mais de porter la présence de Dieu comme le sel et la lumière (Matthieu 5:13-16). Prenez chaque matin un temps de consécration dans la prière et la lecture de la Parole. Ne faites aucun compromis avec le mensonge ou la corruption, et que votre douceur ainsi que votre compétence témoignent pour la gloire de Dieu. Soyez fortifié !',
        source: 'whatsapp',
        created_at: '2025-03-14T11:42:00Z'
      }
    ]
  },
  {
    id: 'QUESTION-1047',
    conversation_id: 'QUESTION-1047',
    user_id: 'usr-2',
    user_name: 'Sœur Grace Mbemba',
    user_contact: 'grace.mbemba@gmail.com',
    auth_provider: 'google',
    subject: 'Vie Chrétienne & Sanctification',
    status: 'pending',
    created_at: '2025-03-15T16:20:00Z',
    whatsapp_notified: true,
    last_source: 'platform',
    messages: [
      {
        id: 'msg-q102-1',
        question_id: 'QUESTION-1047',
        sender_id: 'usr-2',
        sender_type: 'user',
        sender_name: 'Sœur Grace Mbemba',
        message: 'Bonjour Docteur Moïse. J\'ai commencé la lecture de votre ouvrage « Les 5 Étapes Spirituelles Pour Devenir Chrétien ». Concernant la repentance et le renoncement, comment surmonter les doutes et les sentiments de culpabilité passée après avoir reçu le Seigneur ?',
        source: 'platform',
        created_at: '2025-03-15T16:20:00Z'
      }
    ]
  }
];

// Mapping: Meta Outbound WhatsApp Message ID (wamid...) -> Question ID
export const outboundMessageToQuestionMap = new Map<string, string>();

// Mapping: Admin Phone Number -> Last Dispatched Question ID (robust fallback when admin doesn't quote)
export const lastDispatchedQuestionByPhone = new Map<string, string>();

// Server-Sent Events (SSE) active clients for zero-latency real-time updates
export const sseClients = new Set<Response>();

export function broadcastSSE(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// In-memory Webhook Audit Log
export interface WebhookLogEntry {
  id: string;
  timestamp: string;
  from: string;
  messageType: string;
  bodyPreview: string;
  contextId?: string;
  matchedQuestionId?: string;
  userName?: string;
  status: 'matched_context' | 'matched_id' | 'matched_last_dispatched' | 'matched_pending' | 'unmatched' | 'unauthorized' | 'ignored';
  error?: string;
}
export const webhookLogs: WebhookLogEntry[] = [];

// WhatsApp Admin configuration
export let whatsAppConfig: WhatsAppConfig = {
  admin_phone: process.env.WHATSAPP_ADMIN_NUMBER || process.env.ADMIN_WHATSAPP_PHONE || '+243811733778',
  provider: (process.env.WHATSAPP_ACCESS_TOKEN ? 'meta' : 'none') as 'meta' | 'twilio' | 'none',
  phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  access_token: process.env.WHATSAPP_ACCESS_TOKEN || '',
  business_account_id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  verify_token: process.env.WHATSAPP_VERIFY_TOKEN || 'derniereheure_webhook_token',
  twilio_account_sid: process.env.TWILIO_ACCOUNT_SID || '',
  twilio_auth_token: process.env.TWILIO_AUTH_TOKEN || '',
  twilio_from_phone: process.env.TWILIO_PHONE_NUMBER || '',
  webhook_url: '/api/webhooks/whatsapp',
  last_test_status: 'untested'
};

// Helper: Clean digits only
export function cleanDigits(phone: string): string {
  return phone ? phone.replace(/[^0-9]/g, '') : '';
}

// Helper: Normalize phone numbers (stripping spaces, dashes, etc.)
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned.slice(1);
  }
  return cleaned;
}

// Helper: Flexible international phone matching
export function isPhoneMatching(p1: string, p2: string): boolean {
  if (!p1 || !p2) return false;
  const d1 = cleanDigits(p1);
  const d2 = cleanDigits(p2);
  if (d1 === d2) return true;
  if (d1.endsWith(d2) || d2.endsWith(d1)) {
    const minLen = Math.min(d1.length, d2.length);
    return minLen >= 8;
  }
  return false;
}

// Helper: Real WhatsApp notification sender with Meta Cloud API tracking
export async function sendWhatsAppNotification(
  toPhone: string,
  messageText: string,
  questionId?: string
): Promise<{ success: boolean; error?: string; directUrl: string; responseData?: any; messageId?: string }> {
  const cleanPhone = normalizePhone(toPhone);
  const directUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  // Option 1: Meta WhatsApp Cloud API (Graph API)
  if (whatsAppConfig.provider === 'meta' && whatsAppConfig.access_token && whatsAppConfig.phone_number_id) {
    try {
      const endpoint = `https://graph.facebook.com/v21.0/${whatsAppConfig.phone_number_id}/messages`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsAppConfig.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: messageText
          }
        })
      });

      const resData = await response.json();
      if (response.ok && resData.messages && resData.messages.length > 0) {
        const outboundMsgId = resData.messages[0].id;
        if (questionId && outboundMsgId) {
          outboundMessageToQuestionMap.set(outboundMsgId, questionId);
          lastDispatchedQuestionByPhone.set(cleanDigits(cleanPhone), questionId);
        }
        return { success: true, directUrl, responseData: resData, messageId: outboundMsgId };
      } else {
        const errMsg = resData.error?.message || 'Erreur API WhatsApp Meta';
        console.warn('Meta WhatsApp Cloud API error:', errMsg);
        return { success: false, error: errMsg, directUrl, responseData: resData };
      }
    } catch (err: any) {
      console.error('Fetch error during WhatsApp dispatch:', err);
      return { success: false, error: err.message, directUrl };
    }
  }

  // Option 2: Twilio WhatsApp API
  if (whatsAppConfig.provider === 'twilio' && whatsAppConfig.twilio_account_sid && whatsAppConfig.twilio_auth_token) {
    try {
      const accountSid = whatsAppConfig.twilio_account_sid;
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${whatsAppConfig.twilio_auth_token}`).toString('base64');

      const formData = new URLSearchParams();
      formData.append('From', `whatsapp:${whatsAppConfig.twilio_from_phone || '+14155238886'}`);
      formData.append('To', `whatsapp:+${cleanPhone}`);
      formData.append('Body', messageText);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      const resData = await response.json();
      if (response.ok && resData.sid) {
        if (questionId) {
          outboundMessageToQuestionMap.set(resData.sid, questionId);
          lastDispatchedQuestionByPhone.set(cleanDigits(cleanPhone), questionId);
        }
        return { success: true, directUrl, responseData: resData, messageId: resData.sid };
      } else {
        const errMsg = resData.message || 'Erreur Twilio API';
        return { success: false, error: errMsg, directUrl, responseData: resData };
      }
    } catch (err: any) {
      return { success: false, error: err.message, directUrl };
    }
  }

  // Option 3: Fallback when API credentials are not yet configured
  if (questionId) {
    lastDispatchedQuestionByPhone.set(cleanDigits(cleanPhone), questionId);
  }
  return {
    success: false,
    error: 'Passerelle WhatsApp API non configurée. Le lien direct sécurisé est prêt.',
    directUrl
  };
}

// Helper: Extract user from Authorization header
function getUserFromRequest(req: Request): UserProfile | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  return usersDatabase.find(u => u.token === token) || null;
}

// Helper: Check Admin Authorization
export function isAdminAuthorized(req: Request): boolean {
  const authHeader = req.headers.authorization;
  const adminPasscode = req.headers['x-admin-passcode'] as string;
  const validCodes = ['admin123', 'derniereheure', 'maranatha'];

  if (authHeader && authHeader.includes('token-admin-session-auth')) {
    return true;
  }
  if (adminPasscode && validCodes.includes(adminPasscode.toLowerCase().trim())) {
    return true;
  }
  return false;
}

// --- AUTHENTICATION ROUTES ---

// Authenticate via Google / Gmail (OAuth token / profile)
router.post('/auth/google', (req: Request, res: Response) => {
  try {
    const { email, name, avatar, googleId } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Une adresse e-mail valide est requise.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find or create user
    let user = usersDatabase.find(u => u.email === cleanEmail);
    if (!user) {
      user = {
        id: `usr-${Date.now()}`,
        name: name?.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
        auth_provider: 'google',
        token: `tok-goog-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        created_at: new Date().toISOString()
      };
      usersDatabase.push(user);
    } else {
      if (name && name.trim()) user.name = name.trim();
      if (avatar) user.avatar = avatar;
    }

    res.json({
      success: true,
      user,
      token: user.token
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur lors de la connexion Google : ' + err.message });
  }
});

// Get current authenticated user profile
router.get('/auth/me', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Session non authentifiée ou expirée.' });
  }
  res.json({ user });
});

// Update current user profile name
router.put('/auth/profile', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié.' });
  }

  const { name } = req.body;
  if (name && typeof name === 'string' && name.trim()) {
    user.name = name.trim();
  }

  res.json({ success: true, user });
});

// --- QUESTIONS (USER ENDPOINTS) ---

// Get all questions of the authenticated user or visitor
router.get('/user/questions', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const visitorId = req.headers['x-visitor-id'] as string;
  const conversationId = req.query.conversationId as string;
  const queryIds = (req.query.ids as string)?.split(',').map(s => s.trim()).filter(Boolean);
  const queryEmail = (req.query.email as string)?.trim().toLowerCase();

  let userQuestions = [...questionsDatabase];
  if (user) {
    userQuestions = userQuestions.filter(q => 
      q.user_id === user.id || (user.email && q.user_email?.toLowerCase() === user.email.toLowerCase())
    );
  } else if (visitorId) {
    userQuestions = userQuestions.filter(q => 
      q.user_id === visitorId || (queryIds && queryIds.includes(q.id))
    );
  } else if (queryIds && queryIds.length > 0) {
    userQuestions = userQuestions.filter(q => 
      queryIds.includes(q.id) || queryIds.includes(q.conversation_id || '')
    );
  } else if (queryEmail) {
    userQuestions = userQuestions.filter(q => 
      q.user_email?.toLowerCase() === queryEmail || q.user_contact?.toLowerCase().includes(queryEmail)
    );
  } else if (conversationId) {
    userQuestions = userQuestions.filter(q => 
      q.id === conversationId || q.conversation_id === conversationId
    );
  } else {
    // Return questions accessible in public/guest mode
    userQuestions = userQuestions.slice(0, 10);
  }

  const sortedQuestions = [...userQuestions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  res.json({
    total: sortedQuestions.length,
    questions: sortedQuestions
  });
});

// Get single question with conversation history
router.get('/user/questions/:id', (req: Request, res: Response) => {
  const question = questionsDatabase.find(q => q.id === req.params.id || q.conversation_id === req.params.id);
  if (!question) {
    return res.status(404).json({ error: 'Question introuvable.' });
  }

  res.json(question);
});

// Create a new question to the Administrator
router.post('/user/questions', async (req: Request, res: Response) => {
  try {
    let user = getUserFromRequest(req);
    const { 
      subject, 
      question, 
      visitorName, 
      visitorContact, 
      visitorEmail,
      question_category_type, 
      bookId, 
      bookTitle, 
      bookChapter 
    } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length < 5) {
      return res.status(400).json({ error: 'Votre question doit comporter au moins 5 caractères.' });
    }
    if (question.length > 3500) {
      return res.status(400).json({ error: 'La question ne peut pas dépasser 3 500 caractères.' });
    }

    // Determine email contact (clean email format)
    const effectiveEmail = (visitorEmail && visitorEmail.includes('@'))
      ? visitorEmail.trim().toLowerCase()
      : (visitorContact && visitorContact.includes('@'))
      ? visitorContact.trim().toLowerCase()
      : user?.email;

    // If visitor is not authenticated yet, create a session profile for them
    let createdToken: string | undefined;
    if (!user) {
      const cleanContact = effectiveEmail || ((visitorContact && typeof visitorContact === 'string') ? visitorContact.trim() : '');
      const cleanName = (visitorName && typeof visitorName === 'string' && visitorName.trim())
        ? visitorName.trim()
        : (cleanContact ? `Fidèle (${cleanContact})` : 'Visiteur de la Bibliothèque');

      user = {
        id: `usr-visiteur-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        email: effectiveEmail,
        auth_provider: effectiveEmail ? 'google' : 'visitor',
        token: `tok-visiteur-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        created_at: new Date().toISOString()
      };
      usersDatabase.push(user);
      createdToken = user.token;
    }

    // Rate limiting: max 5 questions per 10 minutes per user/visitor
    const now = Date.now();
    const timestamps = userRateLimits.get(user.id) || [];
    const recent = timestamps.filter(t => now - t < 10 * 60 * 1000);
    if (recent.length >= 5) {
      return res.status(429).json({
        error: 'Vous avez posé plusieurs questions récemment. Veuillez patienter quelques minutes avant de renouveler votre demande.'
      });
    }
    recent.push(now);
    userRateLimits.set(user.id, recent);

    const questionId = generateQuestionId();
    const cleanSubject = subject?.trim() || (bookTitle ? `Question sur « ${bookTitle} »` : 'Question spirituelle générale');
    const cleanContent = question.trim();
    const contactInfo = user.email || effectiveEmail || (visitorContact?.trim()) || 'Visiteur du site';
    const cleanBookId = (bookId && typeof bookId === 'string') ? bookId.trim() : undefined;
    const cleanBookTitle = (bookTitle && typeof bookTitle === 'string') ? bookTitle.trim() : undefined;
    const cleanBookChapter = (bookChapter && typeof bookChapter === 'string') ? bookChapter.trim() : undefined;
    const questionCategoryType: 'book_question' | 'admin_direct' = 
      (question_category_type === 'book_question' || !!cleanBookId) ? 'book_question' : 'admin_direct';

    const newQuestion: UserQuestion = {
      id: questionId,
      conversation_id: questionId,
      user_id: user.id,
      user_name: user.name,
      user_contact: contactInfo,
      user_email: user.email || effectiveEmail,
      auth_provider: user.auth_provider,
      subject: cleanSubject,
      question_category_type: questionCategoryType,
      book_id: cleanBookId,
      book_title: cleanBookTitle,
      book_chapter: cleanBookChapter,
      status: 'pending',
      created_at: new Date().toISOString(),
      messages: [
        {
          id: `msg-${questionId}-1`,
          question_id: questionId,
          sender_id: user.id,
          sender_type: 'user',
          sender_name: user.name,
          message: cleanContent,
          source: 'platform',
          created_at: new Date().toISOString()
        }
      ]
    };

    // Save in database
    questionsDatabase.unshift(newQuestion);

    // Send instant official Gmail notification to the administrator (bibliothequechretien@gmail.com)
    const emailResult = await sendAdminGmailNotification({
      questionId,
      questionType: questionCategoryType,
      subject: cleanSubject,
      questionText: cleanContent,
      userName: user.name,
      userEmail: user.email || effectiveEmail,
      userContact: contactInfo,
      bookTitle: cleanBookTitle,
      bookChapter: cleanBookChapter
    });

    newQuestion.email_notified = emailResult.success;
    newQuestion.admin_email_notified = ADMIN_OFFICIAL_GMAIL;
    newQuestion.admin_email_sent_at = new Date().toISOString();

    // Broadcast new question in real-time to the administrator panel
    broadcastSSE('new_question', {
      questionId,
      question: newQuestion,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: `Votre question a été transmise à l'administrateur. Une notification a été envoyée sur son Gmail officiel (${ADMIN_OFFICIAL_GMAIL}).`,
      question: newQuestion,
      user,
      token: createdToken || user.token,
      emailStatus: {
        dispatched: emailResult.success,
        recipient: ADMIN_OFFICIAL_GMAIL,
        note: `Notification transmise à l'adresse Gmail de l'administrateur (${ADMIN_OFFICIAL_GMAIL}).`
      }
    });
  } catch (err: any) {
    console.error('Error creating question:', err);
    res.status(500).json({ error: 'Votre question n\'a pas pu être envoyée. Veuillez vérifier votre connexion et réessayer.' });
  }
});

// Admin endpoint: List all sent Gmail notifications
router.get('/admin/email-logs', (req: Request, res: Response) => {
  res.json({
    adminOfficialEmail: ADMIN_OFFICIAL_GMAIL,
    total: adminEmailLogs.length,
    logs: adminEmailLogs
  });
});

// Follow-up message by user or visitor in an existing conversation
router.post('/user/questions/:id/reply', async (req: Request, res: Response) => {
  try {
    let user = getUserFromRequest(req);
    const question = questionsDatabase.find(q => q.id === req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question introuvable.' });
    }

    if (!user) {
      const visitorId = (req.headers['x-visitor-id'] as string) || req.body.visitorId;
      user = {
        id: visitorId || question.user_id,
        name: question.user_name || 'Visiteur de la Bibliothèque',
        email: question.user_email,
        auth_provider: 'visitor',
        token: `tok-visiteur-${Date.now()}`,
        created_at: new Date().toISOString()
      };
    }

    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Le message ne peut pas être vide.' });
    }

    const cleanMsg = message.trim();
    const newMsg: QuestionMessage = {
      id: `msg-${question.id}-${Date.now()}`,
      question_id: question.id,
      sender_id: user.id,
      sender_type: 'user',
      sender_name: user.name,
      message: cleanMsg,
      created_at: new Date().toISOString()
    };

    question.messages.push(newMsg);
    // Mark as pending again if admin already answered
    question.status = 'pending';

    // Notify administrator by official Gmail (bibliothequechretien@gmail.com)
    await sendAdminGmailNotification({
      questionId: question.id,
      questionType: question.question_category_type || 'admin_direct',
      subject: `Nouveau message dans #${question.conversation_id || question.id} : ${question.subject}`,
      questionText: cleanMsg,
      userName: user.name,
      userEmail: user.email,
      userContact: user.email || user.name,
      bookTitle: question.book_title
    });

    res.json({ success: true, message: newMsg, question });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message : ' + err.message });
  }
});

// --- ADMINISTRATOR ENDPOINTS ---

// Get all questions for Admin Dashboard
router.get('/admin/questions', (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: 'Accès administrateur non autorisé.' });
  }

  const { status, search } = req.query;
  let list = [...questionsDatabase];

  if (status && status !== 'all') {
    list = list.filter(q => q.status === status);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const qTerm = search.toLowerCase().trim();
    list = list.filter(q =>
      q.subject.toLowerCase().includes(qTerm) ||
      q.user_name.toLowerCase().includes(qTerm) ||
      q.user_contact.toLowerCase().includes(qTerm) ||
      q.messages.some(m => m.message.toLowerCase().includes(qTerm))
    );
  }

  const pendingCount = questionsDatabase.filter(q => q.status === 'pending').length;
  const answeredCount = questionsDatabase.filter(q => q.status === 'answered').length;

  res.json({
    total: questionsDatabase.length,
    pending: pendingCount,
    answered: answeredCount,
    questions: list
  });
});

// Get single question by ID for Admin
router.get('/admin/questions/:id', (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: 'Accès administrateur non autorisé.' });
  }

  const question = questionsDatabase.find(q => q.id === req.params.id);
  if (!question) {
    return res.status(404).json({ error: 'Question introuvable.' });
  }

  res.json(question);
});

// Reply to a question by Admin
router.post('/admin/questions/:id/reply', async (req: Request, res: Response) => {
  try {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Accès administrateur non autorisé.' });
    }

    const { reply } = req.body;
    if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
      return res.status(400).json({ error: 'La réponse ne peut pas être vide.' });
    }

    const question = questionsDatabase.find(q => q.id === req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question introuvable.' });
    }

    const cleanReply = reply.trim();
    const adminMessage: QuestionMessage = {
      id: `msg-${question.id}-admin-${Date.now()}`,
      question_id: question.id,
      sender_id: 'admin',
      sender_type: 'admin',
      sender_name: 'Docteur LEMBA KAVUMBULA MOÏSE (Administrateur)',
      message: cleanReply,
      source: 'platform',
      created_at: new Date().toISOString()
    };

    question.messages.push(adminMessage);
    question.status = 'answered';
    question.answered_at = new Date().toISOString();
    question.last_source = 'platform';

    // Broadcast in real-time to both user interface and admin panels
    broadcastSSE('admin_reply', {
      questionId: question.id,
      question,
      reply: adminMessage,
      source: 'platform',
      notification: {
        title: "L'administrateur a répondu à votre question",
        message: cleanReply,
        userName: question.user_name,
        userId: question.user_id,
        questionId: question.id
      },
      timestamp: new Date().toISOString()
    });

    // If user provided a phone contact, send notification back to the user
    if (question.user_contact && (question.user_contact.startsWith('+') || question.user_contact.startsWith('00'))) {
      const userNotification = `📖 BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE\n\n🔔 L'administrateur a répondu à votre question : « ${question.subject} »\n\n💬 Réponse pastorale :\n"${cleanReply}"\n\nConsultez l'historique complet directement dans la plateforme. Que Dieu vous bénisse !`;
      sendWhatsAppNotification(question.user_contact, userNotification).catch(e => {
        console.warn('Could not forward WhatsApp notification to user:', e);
      });
    }

    res.json({
      success: true,
      message: 'Réponse enregistrée avec succès et visible pour l\'utilisateur.',
      question
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la réponse : ' + err.message });
  }
});

// Delete a question (Admin)
router.delete('/admin/questions/:id', (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: 'Accès administrateur non autorisé.' });
  }

  const idx = questionsDatabase.findIndex(q => q.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Question non trouvée.' });
  }

  const deleted = questionsDatabase.splice(idx, 1)[0];
  res.json({ success: true, message: 'Question supprimée.', question: deleted });
});

// Get registered users (Admin)
router.get('/admin/users', (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: 'Accès administrateur non autorisé.' });
  }

  const usersWithCounts = usersDatabase.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    auth_provider: u.auth_provider,
    created_at: u.created_at,
    questions_count: questionsDatabase.filter(q => q.user_id === u.id).length
  }));

  res.json({
    total: usersDatabase.length,
    users: usersWithCounts
  });
});

// --- WHATSAPP CONFIGURATION & WEBHOOK ENDPOINTS ---

// Get current WhatsApp configuration (safe, tokens masked)
router.get('/admin/whatsapp-config', (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: 'Accès administrateur non autorisé.' });
  }

  res.json({
    ...whatsAppConfig,
    access_token_configured: !!whatsAppConfig.access_token,
    twilio_auth_configured: !!whatsAppConfig.twilio_auth_token,
    // Masked token preview for security
    access_token: whatsAppConfig.access_token
      ? `${whatsAppConfig.access_token.slice(0, 6)}...${whatsAppConfig.access_token.slice(-4)}`
      : '',
    twilio_auth_token: whatsAppConfig.twilio_auth_token
      ? `${whatsAppConfig.twilio_auth_token.slice(0, 4)}...`
      : ''
  });
});

// Update WhatsApp configuration
router.put('/admin/whatsapp-config', (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: 'Accès administrateur non autorisé.' });
  }

  const updates = req.body;
  if (updates.admin_phone) whatsAppConfig.admin_phone = updates.admin_phone;
  if (updates.provider) whatsAppConfig.provider = updates.provider;
  if (updates.phone_number_id !== undefined) whatsAppConfig.phone_number_id = updates.phone_number_id;
  if (updates.access_token && !updates.access_token.includes('...')) {
    whatsAppConfig.access_token = updates.access_token;
  }
  if (updates.verify_token) whatsAppConfig.verify_token = updates.verify_token;
  if (updates.twilio_account_sid !== undefined) whatsAppConfig.twilio_account_sid = updates.twilio_account_sid;
  if (updates.twilio_auth_token && !updates.twilio_auth_token.includes('...')) {
    whatsAppConfig.twilio_auth_token = updates.twilio_auth_token;
  }
  if (updates.twilio_from_phone !== undefined) whatsAppConfig.twilio_from_phone = updates.twilio_from_phone;

  res.json({
    success: true,
    message: 'Configuration WhatsApp mise à jour avec succès.',
    config: {
      admin_phone: whatsAppConfig.admin_phone,
      provider: whatsAppConfig.provider,
      phone_number_id: whatsAppConfig.phone_number_id,
      access_token_configured: !!whatsAppConfig.access_token,
      verify_token: whatsAppConfig.verify_token,
      webhook_url: whatsAppConfig.webhook_url
    }
  });
});

// Test WhatsApp notification
router.post('/admin/whatsapp/test', async (req: Request, res: Response) => {
  try {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Accès administrateur non autorisé.' });
    }

    const testPhone = req.body.phone || whatsAppConfig.admin_phone;
    const testMessage = `🔔 TEST DE NOTIFICATION WHATSAPP\n\nPlateforme : La Bibliothèque Chrétienne de la Dernière Heure\nDate : ${new Date().toLocaleString('fr-FR')}\nStatut : Vos notifications WhatsApp administrateur sont correctement configurées.`;

    const result = await sendWhatsAppNotification(testPhone, testMessage);

    whatsAppConfig.last_tested_at = new Date().toISOString();
    whatsAppConfig.last_test_status = result.success ? 'success' : 'error';
    whatsAppConfig.last_test_message = result.error || 'Message de test expédié avec succès via l\'API.';

    res.json({
      success: result.success,
      message: result.success
        ? 'Message de test envoyé avec succès au numéro WhatsApp de l\'administrateur !'
        : 'Échec de l\'envoi automatique de test via l\'API : ' + (result.error || 'Identifiants invalides'),
      directUrl: result.directUrl,
      diagnostic: {
        provider: whatsAppConfig.provider,
        targetPhone: testPhone,
        hasAccessToken: !!whatsAppConfig.access_token,
        hasPhoneId: !!whatsAppConfig.phone_number_id,
        rawResult: result.responseData
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur lors du test WhatsApp : ' + err.message });
  }
});

// --- REAL-TIME SERVER-SENT EVENTS (SSE) STREAM ---

// Event stream for instant frontend updates without manual polling
router.get(['/realtime/stream', '/questions/stream'], (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`);

  sseClients.add(res);

  // Heartbeat keep-alive every 25 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// --- CORE WHATSAPP MESSAGE PROCESSING ENGINE ---

// Core business logic: maps incoming WhatsApp replies to questions and updates conversation
async function processIncomingWhatsAppMessage(
  fromNumber: string,
  textBody: string,
  contextId?: string,
  messageId?: string
): Promise<{ success: boolean; matchedQuestion?: UserQuestion; status: WebhookLogEntry['status']; error?: string }> {
  console.log(`[WhatsApp Webhook] Incoming message from ${fromNumber} | context: ${contextId || 'none'} | body: "${textBody}"`);

  // Check admin authorization
  const isAuthorized = isPhoneMatching(fromNumber, whatsAppConfig.admin_phone);
  if (!isAuthorized && whatsAppConfig.admin_phone) {
    console.warn(`[WhatsApp Webhook] Unauthorized sender ${fromNumber} (Expected admin: ${whatsAppConfig.admin_phone})`);
    return { success: false, status: 'unauthorized', error: `Numéro non autorisé (${fromNumber})` };
  }

  // Conversation Identification Hierarchy:
  let matchedQuestion: UserQuestion | undefined;
  let matchStatus: WebhookLogEntry['status'] = 'unmatched';

  // 1. WhatsApp Native "Reply-To" Context ID (Admin swiped or quoted the message in WhatsApp)
  if (contextId && outboundMessageToQuestionMap.has(contextId)) {
    const qId = outboundMessageToQuestionMap.get(contextId)!;
    matchedQuestion = questionsDatabase.find(q => q.id === qId);
    if (matchedQuestion) {
      matchStatus = 'matched_context';
      console.log(`[WhatsApp Webhook] MATCH via WhatsApp Native Reply Context (${contextId}) -> ${matchedQuestion.id}`);
    }
  }

  // 2. Explicit ID Pattern in message text: QUESTION-1048, #QUESTION-1048, REP-1048, etc.
  if (!matchedQuestion) {
    const idMatch = textBody.match(/(?:QUESTION|REP|Q)[-_#\s]*([0-9]{3,})/i) || textBody.match(/#?([0-9]{4})/);
    if (idMatch) {
      const num = idMatch[1];
      matchedQuestion = questionsDatabase.find(
        q => q.id.toLowerCase() === `question-${num}`.toLowerCase() || q.id.includes(num)
      );
      if (matchedQuestion) {
        matchStatus = 'matched_id';
        console.log(`[WhatsApp Webhook] MATCH via explicit ID in text -> ${matchedQuestion.id}`);
      }
    }
  }

  // 3. Last Dispatched Question fallback (Admin received the question notification and just answered directly without quoting)
  if (!matchedQuestion) {
    const cleanFromDigits = cleanDigits(fromNumber);
    const lastQId = lastDispatchedQuestionByPhone.get(cleanFromDigits);
    if (lastQId) {
      const found = questionsDatabase.find(q => q.id === lastQId);
      if (found && found.status === 'pending') {
        matchedQuestion = found;
        matchStatus = 'matched_last_dispatched';
        console.log(`[WhatsApp Webhook] MATCH via last dispatched phone mapping -> ${matchedQuestion.id}`);
      }
    }
  }

  // 4. Oldest Pending Question fallback if single pending conversation exists
  if (!matchedQuestion) {
    const pending = questionsDatabase.filter(q => q.status === 'pending');
    if (pending.length > 0) {
      matchedQuestion = pending[0];
      matchStatus = 'matched_pending';
      console.log(`[WhatsApp Webhook] MATCH via oldest pending question -> ${matchedQuestion.id}`);
    }
  }

  if (!matchedQuestion) {
    return { success: false, status: 'unmatched', error: 'Aucune question active correspondante trouvée' };
  }

  // Clean reply text (remove any accidental "#QUESTION-1048: " or "REP: " prefix)
  const cleanReply = textBody.replace(/^(?:(?:QUESTION|REP|Q)[-_#\s]*[0-9]+[:\s]+)/i, '').trim() || textBody.trim();

  // Create admin reply message
  const adminReply: QuestionMessage = {
    id: `msg-${matchedQuestion.id}-wa-${Date.now()}`,
    question_id: matchedQuestion.id,
    sender_id: 'admin',
    sender_type: 'admin',
    sender_name: 'Docteur LEMBA KAVUMBULA MOÏSE (Administrateur)',
    message: cleanReply,
    source: 'whatsapp',
    created_at: new Date().toISOString()
  };

  matchedQuestion.messages.push(adminReply);
  matchedQuestion.status = 'answered';
  matchedQuestion.answered_at = new Date().toISOString();
  matchedQuestion.last_source = 'whatsapp';

  // Real-time broadcast to platform (both Admin panel and User interface)
  broadcastSSE('whatsapp_reply', {
    questionId: matchedQuestion.id,
    question: matchedQuestion,
    reply: adminReply,
    source: 'whatsapp',
    notification: {
      title: "L'administrateur a répondu à votre question",
      message: cleanReply,
      userName: matchedQuestion.user_name,
      userId: matchedQuestion.user_id,
      questionId: matchedQuestion.id
    },
    timestamp: new Date().toISOString()
  });

  // If user provided a phone contact, send notification to user's phone as well
  if (matchedQuestion.user_contact && (matchedQuestion.user_contact.startsWith('+') || matchedQuestion.user_contact.startsWith('00'))) {
    const userNotification = `📖 BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE\n\n🔔 L'administrateur a répondu à votre question (${matchedQuestion.id}) :\n\n👨‍💼 Docteur LEMBA KAVUMBULA MOÏSE :\n"${cleanReply}"\n\nConsultez l'historique complet directement sur la plateforme. Que Dieu vous bénisse !`;
    sendWhatsAppNotification(matchedQuestion.user_contact, userNotification).catch(e => {
      console.warn('Could not forward WhatsApp reply to user phone:', e);
    });
  }

  return { success: true, matchedQuestion, status: matchStatus };
}

// --- OFFICIAL WEBHOOK HANDLERS FOR WHATSAPP BUSINESS PLATFORM / META CLOUD API ---

// Meta Webhook Verification Handler (GET /api/webhook/whatsapp and /api/webhooks/whatsapp)
const handleWebhookVerification = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === (whatsAppConfig.verify_token || 'derniereheure_webhook_token')) {
      console.log('[WhatsApp Webhook] Verification successful for challenge:', challenge);
      return res.status(200).send(challenge);
    } else {
      console.warn('[WhatsApp Webhook] Verification token mismatch. Expected:', whatsAppConfig.verify_token, 'Got:', token);
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
};

// Meta Webhook Incoming Message Handler (POST /api/webhook/whatsapp and /api/webhooks/whatsapp)
const handleIncomingWebhook = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Handle Meta Graph API payload format
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      if (message && message.type === 'text') {
        const fromNumber = message.from;
        const textBody = message.text?.body || '';
        const contextId = message.context?.id; // The Meta message ID being replied to!
        const messageId = message.id;

        const result = await processIncomingWhatsAppMessage(fromNumber, textBody, contextId, messageId);

        // Record entry in Webhook Audit Log
        webhookLogs.unshift({
          id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          from: fromNumber,
          messageType: 'text',
          bodyPreview: textBody.length > 120 ? textBody.slice(0, 120) + '...' : textBody,
          contextId,
          matchedQuestionId: result.matchedQuestion?.id,
          userName: result.matchedQuestion?.user_name,
          status: result.status,
          error: result.error
        });
        if (webhookLogs.length > 100) webhookLogs.pop();
      }

      return res.status(200).send('EVENT_RECEIVED');
    }

    // Handle Twilio format fallback
    if (body.From && body.Body) {
      const fromNumber = body.From.replace('whatsapp:', '');
      const textBody = body.Body;
      const result = await processIncomingWhatsAppMessage(fromNumber, textBody);

      webhookLogs.unshift({
        id: `wh-${Date.now()}`,
        timestamp: new Date().toISOString(),
        from: fromNumber,
        messageType: 'twilio_text',
        bodyPreview: textBody.slice(0, 120),
        matchedQuestionId: result.matchedQuestion?.id,
        userName: result.matchedQuestion?.user_name,
        status: result.status,
        error: result.error
      });
      return res.status(200).send('<Response></Response>');
    }

    res.status(200).send('OK');
  } catch (err: any) {
    console.error('[WhatsApp Webhook] Processing error:', err);
    res.status(500).send('Internal Server Error');
  }
};

// Mount both standard routes
router.get('/webhook/whatsapp', handleWebhookVerification);
router.get('/webhooks/whatsapp', handleWebhookVerification);
router.post('/webhook/whatsapp', handleIncomingWebhook);
router.post('/webhooks/whatsapp', handleIncomingWebhook);

// --- ADMIN AUDIT AND SIMULATION TOOLS ---

// Get Webhook audit logs
router.get('/admin/whatsapp/webhook-logs', (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: 'Accès administrateur non autorisé.' });
  }

  res.json({
    total: webhookLogs.length,
    logs: webhookLogs,
    activeTrackedOutboundCount: outboundMessageToQuestionMap.size
  });
});

// Admin tool: Test incoming message through the exact webhook logic
router.post('/admin/whatsapp/simulate-incoming', async (req: Request, res: Response) => {
  try {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Accès administrateur non autorisé.' });
    }

    const { replyText, messageText, questionId, targetQuestionId, fromPhone, senderPhone, useNativeContext } = req.body;
    const bodyText = (replyText || messageText || '').trim();
    if (!bodyText) {
      return res.status(400).json({ error: 'Le texte de la réponse est requis.' });
    }

    const senderPhoneFinal = senderPhone || fromPhone || whatsAppConfig.admin_phone;
    const chosenQuestionId = questionId || targetQuestionId;
    let contextId: string | undefined;

    if (useNativeContext && chosenQuestionId) {
      // Find or synthesize outbound message ID
      const question = questionsDatabase.find(q => q.id === chosenQuestionId || q.conversation_id === chosenQuestionId);
      if (question?.whatsapp_message_id) {
        contextId = question.whatsapp_message_id;
      } else {
        contextId = `wamid.HBgL${Date.now()}`;
        outboundMessageToQuestionMap.set(contextId, chosenQuestionId);
      }
    }

    const result = await processIncomingWhatsAppMessage(
      senderPhoneFinal,
      bodyText,
      contextId,
      `wamid.inbound.${Date.now()}`
    );

    // Record in audit log
    webhookLogs.unshift({
      id: `sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      from: senderPhone,
      messageType: 'simulated_test',
      bodyPreview: replyText.slice(0, 120),
      contextId,
      matchedQuestionId: result.matchedQuestion?.id,
      userName: result.matchedQuestion?.user_name,
      status: result.status,
      error: result.error
    });

    res.json({
      success: result.success,
      status: result.status,
      error: result.error,
      matchedQuestionId: result.matchedQuestion?.id,
      matchedQuestion: result.matchedQuestion
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur lors de la simulation : ' + err.message });
  }
});

export { router };
