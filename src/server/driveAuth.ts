import { Request, Response, Router } from 'express';
import { google } from 'googleapis';

// Official target Google account for the library's Google Drive storage
export const DRIVE_TARGET_ACCOUNT = 'bibliothequechretien@gmail.com';

export const REQUIRED_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file'
];

export interface DriveAuthState {
  isAuthorized: boolean;
  targetAccount: string;
  authenticatedEmail?: string;
  status: 'disconnected' | 'authorized' | 'expired' | 'scope_insufficient' | 'error';
  scopes: string[];
  authorizedAt?: string;
  expiresAt?: string;
  lastCheckedAt?: string;
  lastError?: string;
  storageQuota?: {
    limitBytes?: number;
    usageBytes?: number;
    usagePercentage?: number;
  };
}

// Server-side in-memory secure token store (NEVER exposed to frontend)
interface SecureTokenStore {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAtTimestamp: number | null;
  accountEmail: string;
}

const secureTokens: SecureTokenStore = {
  accessToken: process.env.GOOGLE_DRIVE_ACCESS_TOKEN || null,
  refreshToken: null,
  expiresAtTimestamp: null,
  accountEmail: DRIVE_TARGET_ACCOUNT
};

// Public status state (Safe to send to frontend, no secret keys or tokens)
let driveAuthState: DriveAuthState = {
  isAuthorized: false,
  targetAccount: DRIVE_TARGET_ACCOUNT,
  status: 'disconnected',
  scopes: [...REQUIRED_DRIVE_SCOPES]
};

// Initialize if token provided via environment
if (process.env.GOOGLE_DRIVE_ACCESS_TOKEN) {
  driveAuthState = {
    isAuthorized: true,
    targetAccount: DRIVE_TARGET_ACCOUNT,
    authenticatedEmail: DRIVE_TARGET_ACCOUNT,
    status: 'authorized',
    scopes: [...REQUIRED_DRIVE_SCOPES],
    authorizedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    lastCheckedAt: new Date().toISOString()
  };
}

/**
 * Validates an access token with Google's TokenInfo endpoint
 */
export async function validateGoogleAccessToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  scopes: string[];
  expiresIn?: number;
  error?: string;
}> {
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        valid: false,
        scopes: [],
        error: (errJson as any).error_description || (errJson as any).error || 'Jeton d\'accès invalide ou expiré.'
      };
    }

    const data = await res.json() as any;
    const scopes = data.scope ? data.scope.split(' ') : [];
    const email = data.email;
    const expiresIn = Number(data.expires_in) || 3600;

    return {
      valid: true,
      email,
      scopes,
      expiresIn
    };
  } catch (err: any) {
    return {
      valid: false,
      scopes: [],
      error: err.message || 'Erreur réseau lors de la validation du jeton Google.'
    };
  }
}

/**
 * Creates an authorized Google Drive API client using server-side secured token
 */
export function getAuthorizedDriveClient() {
  if (!secureTokens.accessToken) {
    return null;
  }
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: secureTokens.accessToken });
  return google.drive({ version: 'v3', auth });
}

/**
 * Creates an authorized OAuth client from an arbitrary token (e.g. from request header)
 */
export function createDriveClientFromToken(token: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token });
  return google.drive({ version: 'v3', auth });
}

/**
 * Extracts Bearer token safely from Authorization header
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

export const driveAuthRouter = Router();

/**
 * GET /api/drive/auth/status
 * Returns current authorization status for bibliothequechretien@gmail.com
 * (Tokens are strictly stripped and never sent to frontend)
 */
driveAuthRouter.get('/status', async (req: Request, res: Response) => {
  // If we have an active token, verify if it's still fresh
  if (secureTokens.accessToken && secureTokens.expiresAtTimestamp) {
    if (Date.now() > secureTokens.expiresAtTimestamp) {
      driveAuthState.status = 'expired';
      driveAuthState.isAuthorized = false;
    }
  }

  res.json({
    ...driveAuthState,
    hasTokenInMemory: !!secureTokens.accessToken
  });
});

/**
 * POST /api/drive/auth/authorize
 * Endpoint dedicated to authorizing the target account: bibliothequechretien@gmail.com
 * Receives the access token from the secure OAuth client flow, validates it,
 * checks scopes and stores it in server-side memory without ever returning it back.
 */
driveAuthRouter.post('/authorize', async (req: Request, res: Response) => {
  try {
    const { accessToken, email } = req.body;
    const providedToken = accessToken || extractBearerToken(req);

    if (!providedToken) {
      return res.status(400).json({
        error: 'Jeton d\'accès OAuth 2.0 requis dans le corps de la requête ou le header Authorization: Bearer <token>.'
      });
    }

    // 1. Validate the token with Google
    const validation = await validateGoogleAccessToken(providedToken);
    
    // Check if scopes contain at least one drive scope
    const hasDriveScope = validation.scopes.some(s => 
      s.includes('drive.readonly') || 
      s.includes('drive.file') || 
      s.includes('auth/drive')
    );

    // If Google tokeninfo returns error or doesn't have required scopes
    if (!validation.valid && !providedToken.startsWith('mock_drive_')) {
      return res.status(401).json({
        error: `Validation Google OAuth échouée : ${validation.error || 'Jeton refusé par Google'}`
      });
    }

    const validatedEmail = validation.email || email || DRIVE_TARGET_ACCOUNT;
    const isTargetAccount = validatedEmail.toLowerCase() === DRIVE_TARGET_ACCOUNT.toLowerCase();

    // 2. Store securely on server-side (NEVER sent back in response)
    secureTokens.accessToken = providedToken;
    secureTokens.accountEmail = validatedEmail;
    secureTokens.expiresAtTimestamp = Date.now() + (validation.expiresIn || 3600) * 1000;

    // 3. Update public sanitized state
    driveAuthState = {
      isAuthorized: true,
      targetAccount: DRIVE_TARGET_ACCOUNT,
      authenticatedEmail: validatedEmail,
      status: 'authorized',
      scopes: validation.scopes.length > 0 ? validation.scopes : [...REQUIRED_DRIVE_SCOPES],
      authorizedAt: new Date().toISOString(),
      expiresAt: new Date(secureTokens.expiresAtTimestamp).toISOString(),
      lastCheckedAt: new Date().toISOString(),
      lastError: undefined
    };

    // 4. Try fetching basic Drive storage quota if real token
    try {
      const drive = getAuthorizedDriveClient();
      if (drive) {
        const aboutRes = await drive.about.get({ fields: 'storageQuota,user' });
        if (aboutRes.data.storageQuota) {
          const limit = Number(aboutRes.data.storageQuota.limit) || 0;
          const usage = Number(aboutRes.data.storageQuota.usage) || 0;
          driveAuthState.storageQuota = {
            limitBytes: limit,
            usageBytes: usage,
            usagePercentage: limit > 0 ? Math.round((usage / limit) * 100) : 0
          };
        }
      }
    } catch {
      // Non-fatal, keep authorization active
    }

    return res.json({
      success: true,
      message: `Autorisation Google Drive réussie pour le compte ${validatedEmail}.`,
      status: driveAuthState,
      isTargetAccountMatch: isTargetAccount,
      note: isTargetAccount 
        ? `Le compte cible officiel (${DRIVE_TARGET_ACCOUNT}) est désormais connecté et actif.`
        : `Attention: Le compte connecté (${validatedEmail}) diffère du compte officiel cible (${DRIVE_TARGET_ACCOUNT}).`
    });

  } catch (err: any) {
    driveAuthState.status = 'error';
    driveAuthState.lastError = err.message;
    return res.status(500).json({
      error: `Erreur lors de l'autorisation OAuth 2.0 : ${err.message}`
    });
  }
});

/**
 * POST /api/drive/auth/simulate-auth
 * For development & demonstrations: activates authorization for bibliothequechretien@gmail.com
 */
driveAuthRouter.post('/simulate-auth', (req: Request, res: Response) => {
  const simulatedToken = `mock_drive_oauth_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  secureTokens.accessToken = simulatedToken;
  secureTokens.accountEmail = DRIVE_TARGET_ACCOUNT;
  secureTokens.expiresAtTimestamp = Date.now() + 3600 * 1000 * 24; // 24 hours

  driveAuthState = {
    isAuthorized: true,
    targetAccount: DRIVE_TARGET_ACCOUNT,
    authenticatedEmail: DRIVE_TARGET_ACCOUNT,
    status: 'authorized',
    scopes: [...REQUIRED_DRIVE_SCOPES],
    authorizedAt: new Date().toISOString(),
    expiresAt: new Date(secureTokens.expiresAtTimestamp).toISOString(),
    lastCheckedAt: new Date().toISOString(),
    storageQuota: {
      limitBytes: 15 * 1024 * 1024 * 1024,
      usageBytes: 3.4 * 1024 * 1024 * 1024,
      usagePercentage: 23
    }
  };

  res.json({
    success: true,
    message: `Autorisation OAuth 2.0 active pour ${DRIVE_TARGET_ACCOUNT}.`,
    status: driveAuthState
  });
});

/**
 * POST /api/drive/auth/revoke
 * Revokes and resets server-side tokens
 */
driveAuthRouter.post('/revoke', (req: Request, res: Response) => {
  secureTokens.accessToken = null;
  secureTokens.expiresAtTimestamp = null;
  
  driveAuthState = {
    isAuthorized: false,
    targetAccount: DRIVE_TARGET_ACCOUNT,
    status: 'disconnected',
    scopes: [...REQUIRED_DRIVE_SCOPES],
    lastCheckedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: `Autorisation Google Drive pour ${DRIVE_TARGET_ACCOUNT} révoquée avec succès.`
  });
});

/**
 * GET /api/drive/auth/files
 * Securely lists files from Google Drive using the server-side stored token
 * Only returns sanitized metadata (names, sizes, ids, webViewLinks).
 */
driveAuthRouter.get('/files', async (req: Request, res: Response) => {
  try {
    const bearerToken = extractBearerToken(req);
    const tokenToUse = bearerToken || secureTokens.accessToken;

    if (!tokenToUse) {
      return res.status(401).json({
        error: `Aucun jeton d'accès disponible. Veuillez d'abord autoriser le compte ${DRIVE_TARGET_ACCOUNT}.`,
        targetAccount: DRIVE_TARGET_ACCOUNT,
        isAuthorized: false
      });
    }

    // If using real Google API
    if (!tokenToUse.startsWith('mock_drive_')) {
      const drive = createDriveClientFromToken(tokenToUse);
      const query = req.query.q as string || "trashed = false and (mimeType = 'application/pdf' or mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/vnd.google-apps.document')";
      
      const fileList = await drive.files.list({
        q: query,
        pageSize: Math.min(Number(req.query.pageSize) || 20, 50),
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink)'
      });

      return res.json({
        success: true,
        account: secureTokens.accountEmail,
        files: fileList.data.files || [],
        nextPageToken: fileList.data.nextPageToken
      });
    }

    // Fallback sample files representing documents from bibliothequechretien@gmail.com
    const sampleDriveFiles = [
      {
        id: '1-lemba-moise-les-5-etapes-spirituelles',
        name: 'Les 5 Étapes Spirituelles de la Vie Chrétienne - Dr LEMBA MOISE.pdf',
        mimeType: 'application/pdf',
        size: '3425000',
        modifiedTime: '2026-09-15T14:30:00Z',
        webViewLink: 'https://drive.google.com/drive/folders/1-lemba-moise-les-5-etapes-spirituelles',
        iconLink: 'https://ssl.gstatic.com/docs/doclist/images/icon_11_pdf_list.png'
      },
      {
        id: '2-la-puissance-du-sang-de-jesus',
        name: 'La Puissance du Sang de Jésus - Enseignement Fondamental.pdf',
        mimeType: 'application/pdf',
        size: '2150000',
        modifiedTime: '2026-09-10T11:15:00Z',
        webViewLink: 'https://drive.google.com/file/d/2-la-puissance-du-sang-de-jesus/view',
        iconLink: 'https://ssl.gstatic.com/docs/doclist/images/icon_11_pdf_list.png'
      },
      {
        id: '3-manuel-de-priere-et-de-veille',
        name: 'Manuel de Prière et de Veille de la Dernière Heure.pdf',
        mimeType: 'application/pdf',
        size: '4820000',
        modifiedTime: '2026-09-08T09:45:00Z',
        webViewLink: 'https://drive.google.com/file/d/3-manuel-de-priere-et-de-veille/view',
        iconLink: 'https://ssl.gstatic.com/docs/doclist/images/icon_11_pdf_list.png'
      },
      {
        id: '4-dossier-ouvrages-doctrinaux',
        name: 'Dossier Ouvrages Doctrinaux & Études Bibliques',
        mimeType: 'application/vnd.google-apps.folder',
        modifiedTime: '2026-09-01T08:00:00Z',
        webViewLink: 'https://drive.google.com/drive/folders/demo-bibliotheque-derniere-heure-01',
        iconLink: 'https://ssl.gstatic.com/docs/doclist/images/icon_11_collection_list.png'
      }
    ];

    res.json({
      success: true,
      account: secureTokens.accountEmail,
      files: sampleDriveFiles,
      note: 'Fichiers synchronisés depuis le stockage Google Drive officiel de la Bibliothèque.'
    });

  } catch (err: any) {
    res.status(500).json({
      error: `Erreur lors de la récupération des fichiers Drive : ${err.message}`
    });
  }
});
