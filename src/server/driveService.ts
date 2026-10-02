import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { Book } from '../types.ts';
import { getAuthorizedDriveClient, extractBearerToken, DRIVE_TARGET_ACCOUNT } from './driveAuth.ts';

export const DRIVE_LIBRARY_FOLDER_NAME = '📚 LA BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE';

export interface DriveOperationLog {
  id: string;
  timestamp: string;
  action: 'upload' | 'delete' | 'sync' | 'auth' | 'stream';
  target: string;
  details: string;
  success: boolean;
  driveFileId?: string;
}

export interface LibraryFolderInfo {
  id: string;
  name: string;
  webViewLink: string;
  createdTime?: string;
  isSimulated?: boolean;
}

// In-memory cache for folder and activity log
let cachedFolderInfo: LibraryFolderInfo | null = null;
const driveAuditLogs: DriveOperationLog[] = [
  {
    id: 'log-init-1',
    timestamp: new Date().toISOString(),
    action: 'auth',
    target: DRIVE_TARGET_ACCOUNT,
    details: 'Initialisation du canal officiel Google Drive API (OAuth 2.0).',
    success: true
  }
];

export function addDriveLog(action: DriveOperationLog['action'], target: string, details: string, success: boolean = true, driveFileId?: string) {
  const log: DriveOperationLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    action,
    target,
    details,
    success,
    driveFileId
  };
  driveAuditLogs.unshift(log);
  if (driveAuditLogs.length > 100) {
    driveAuditLogs.pop();
  }
  return log;
}

export function getDriveLogs(): DriveOperationLog[] {
  return [...driveAuditLogs];
}

/**
 * Finds or automatically creates the primary Library folder in Google Drive:
 * « 📚 LA BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE »
 */
export async function ensureLibraryFolder(driveClient?: drive_v3.Drive | null): Promise<LibraryFolderInfo> {
  const drive = driveClient || getAuthorizedDriveClient();

  if (!drive) {
    if (!cachedFolderInfo) {
      cachedFolderInfo = {
        id: 'folder-bibliotheque-derniere-heure-01',
        name: DRIVE_LIBRARY_FOLDER_NAME,
        webViewLink: 'https://drive.google.com/drive/folders/folder-bibliotheque-derniere-heure-01',
        isSimulated: true
      };
    }
    return cachedFolderInfo;
  }

  try {
    // 1. Search for existing folder
    const searchRes = await drive.files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and name = '${DRIVE_LIBRARY_FOLDER_NAME.replace(/'/g, "\\'")}' and trashed = false`,
      fields: 'files(id, name, webViewLink, createdTime)',
      spaces: 'drive',
      pageSize: 1
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      const existing = searchRes.data.files[0];
      cachedFolderInfo = {
        id: existing.id || 'folder-found',
        name: existing.name || DRIVE_LIBRARY_FOLDER_NAME,
        webViewLink: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`,
        createdTime: existing.createdTime || undefined,
        isSimulated: false
      };
      return cachedFolderInfo;
    }

    // 2. Folder does not exist yet -> Create it automatically!
    const createRes = await drive.files.create({
      requestBody: {
        name: DRIVE_LIBRARY_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Dossier principal de stockage cloud des livres de La Bibliothèque Chrétienne de la Dernière Heure.'
      },
      fields: 'id, name, webViewLink, createdTime'
    });

    const newFolderId = createRes.data.id!;
    const webViewLink = createRes.data.webViewLink || `https://drive.google.com/drive/folders/${newFolderId}`;

    // Make the folder accessible for library reading
    try {
      await drive.permissions.create({
        fileId: newFolderId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
    } catch (permErr: any) {
      console.warn('Note: Permission publique sur le dossier Drive non accordée (continuation normale) :', permErr.message);
    }

    cachedFolderInfo = {
      id: newFolderId,
      name: DRIVE_LIBRARY_FOLDER_NAME,
      webViewLink,
      createdTime: createRes.data.createdTime || undefined,
      isSimulated: false
    };

    addDriveLog('upload', DRIVE_LIBRARY_FOLDER_NAME, `Création du dossier principal Google Drive : ${newFolderId}`, true, newFolderId);
    return cachedFolderInfo;

  } catch (err: any) {
    console.error('Erreur lors de la création/recherche du dossier Google Drive :', err);
    // Fallback info
    return {
      id: 'folder-bibliotheque-derniere-heure-01',
      name: DRIVE_LIBRARY_FOLDER_NAME,
      webViewLink: 'https://drive.google.com/drive/folders/folder-bibliotheque-derniere-heure-01',
      isSimulated: true
    };
  }
}

export interface UploadPdfOptions {
  buffer: Buffer;
  fileName: string;
  title: string;
  author: string;
  category: string;
  description?: string;
  keywords?: string[];
  mimeType?: string;
}

export interface UploadResult {
  driveFileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink: string;
  sizeBytes: number;
  createdTime: string;
  folderId: string;
  isSimulated: boolean;
}

/**
 * Uploads a PDF directly into Google Drive folder
 * « 📚 LA BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE »
 */
export async function uploadBookPdfToDrive(options: UploadPdfOptions): Promise<UploadResult> {
  const { buffer, fileName, title, author, category, description, keywords } = options;

  // Validation 1: Size check (max 50MB)
  const maxBytes = 50 * 1024 * 1024;
  if (buffer.length > maxBytes) {
    throw new Error(`La taille du fichier PDF (${(buffer.length / (1024 * 1024)).toFixed(1)} Mo) dépasse la limite autorisée de 50 Mo.`);
  }

  // Validation 2: Format & Magic bytes check
  const isPdfHeader = buffer.slice(0, 5).toString('ascii').startsWith('%PDF');
  if (!isPdfHeader && !fileName.toLowerCase().endsWith('.pdf')) {
    throw new Error('Format de fichier invalide. Seuls les documents PDF légitimes (%PDF) sont acceptés.');
  }

  const drive = getAuthorizedDriveClient();
  const folder = await ensureLibraryFolder(drive);

  // If live Google Drive API client is connected
  if (drive) {
    try {
      const sanitizedFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      const stream = Readable.from(buffer);

      const fileMetadata: drive_v3.Schema$File = {
        name: sanitizedFileName,
        parents: [folder.id],
        description: `${title} - Par ${author}. Catégorie : ${category}. ${description || ''}`.trim(),
        properties: {
          library: 'bibliotheque-chretienne-derniere-heure',
          author,
          category,
          title
        }
      };

      const media = {
        mimeType: 'application/pdf',
        body: stream
      };

      const uploadRes = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, webViewLink, webContentLink, size, createdTime'
      });

      const fileId = uploadRes.data.id!;
      const createdTime = uploadRes.data.createdTime || new Date().toISOString();
      const sizeBytes = Number(uploadRes.data.size) || buffer.length;
      
      // Standard public Google Drive links
      const webViewLink = uploadRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
      const webContentLink = uploadRes.data.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`;

      // Set readable permission so visitors can view/download
      try {
        await drive.permissions.create({
          fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
      } catch (e: any) {
        console.warn('Note sur permissions fichier Drive :', e.message);
      }

      addDriveLog('upload', sanitizedFileName, `Téléversement réussi dans Google Drive (${(sizeBytes / 1024).toFixed(0)} Ko).`, true, fileId);

      return {
        driveFileId: fileId,
        fileName: sanitizedFileName,
        webViewLink,
        webContentLink,
        sizeBytes,
        createdTime,
        folderId: folder.id,
        isSimulated: false
      };

    } catch (err: any) {
      console.error('Erreur API Drive lors de l\'envoi du fichier :', err);
      addDriveLog('upload', fileName, `Échec téléversement Google Drive : ${err.message}`, false);
      throw new Error(`Échec de l'envoi vers Google Drive : ${err.message}`);
    }
  }

  // Development / Offline simulation mode
  const simulatedFileId = `1DRIVE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const sanitizedFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const sizeBytes = buffer.length;
  const createdTime = new Date().toISOString();

  addDriveLog(
    'upload',
    sanitizedFileName,
    `Enregistrement Drive simulé pour « ${title} » (${(sizeBytes / 1024).toFixed(0)} Ko).`,
    true,
    simulatedFileId
  );

  return {
    driveFileId: simulatedFileId,
    fileName: sanitizedFileName,
    webViewLink: `https://drive.google.com/file/d/${simulatedFileId}/view`,
    webContentLink: `https://drive.google.com/uc?export=download&id=${simulatedFileId}`,
    sizeBytes,
    createdTime,
    folderId: folder.id,
    isSimulated: true
  };
}

/**
 * Permanently deletes a file from Google Drive
 */
export async function deleteFileFromDrive(driveFileId: string): Promise<boolean> {
  const drive = getAuthorizedDriveClient();
  if (!drive || driveFileId.startsWith('1DRIVE-') || driveFileId.startsWith('mock_')) {
    addDriveLog('delete', driveFileId, 'Suppression simulée du fichier dans Google Drive.', true, driveFileId);
    return true;
  }

  try {
    await drive.files.delete({
      fileId: driveFileId
    });
    addDriveLog('delete', driveFileId, `Suppression physique réussie du fichier Google Drive ${driveFileId}.`, true, driveFileId);
    return true;
  } catch (err: any) {
    console.error(`Erreur lors de la suppression Drive (${driveFileId}) :`, err);
    addDriveLog('delete', driveFileId, `Échec suppression Drive : ${err.message}`, false, driveFileId);
    return false;
  }
}

/**
 * Bidirectional Sync: Scans Google Drive folder for any PDFs added directly
 * in the folder by an admin, and reconciles them with existing books.
 */
export async function syncBooksFromDriveFolder(existingBooks: Book[]): Promise<{
  newBooksAdded: Book[];
  totalDriveFilesFound: number;
  folderInfo: LibraryFolderInfo;
  message: string;
}> {
  const drive = getAuthorizedDriveClient();
  const folder = await ensureLibraryFolder(drive);

  const existingDriveIds = new Set(
    existingBooks
      .map(b => b.google_drive_file_id || extractFileIdFromDriveUrl(b.google_drive_url))
      .filter(Boolean)
  );

  if (!drive) {
    // Offline simulated drive sync
    const sampleUnsynced: Book[] = [
      {
        id: `book-drive-sync-${Date.now()}`,
        title: "Manuel Pratique de Prière et de Veille Spirituelle",
        author: "Docteur LEMBA KAVUMBULA MOÏSE",
        category: "Prière & Intercession",
        description: "Guide méthodologique et scripturaire pour la veille de prière de la dernière heure, synchronisé automatiquement depuis le dossier Google Drive de la bibliothèque.",
        cover_image: "/images/cinq-etapes-spirituelles.jpg",
        google_drive_url: "https://drive.google.com/file/d/3-manuel-de-priere-et-de-veille/view",
        google_drive_file_id: "3-manuel-de-priere-et-de-veille",
        google_drive_folder_id: folder.id,
        file_size_bytes: 4820000,
        reading_file: "Manuel Pratique de Prière et de Veille Spirituelle — Principes fondamentaux de l'intercession de la dernière heure.",
        chapters: [
          {
            title: "Chapitre 1 : L'Heure de la Veille",
            content: "« Veillez et priez, afin que vous ne tombiez pas en tentation » (Matthieu 26:41). La veille chrétienne est une sentinelle d'amour et de fidélité dans la nuit spirituelle."
          }
        ],
        pdf_url: "https://drive.google.com/file/d/3-manuel-de-priere-et-de-veille/preview",
        created_at: new Date().toISOString().split('T')[0],
        status: "Publié",
        page_count: 180,
        reading_time_min: 130,
        downloads_count: 145,
        views_count: 420,
        ai_indexed_content: {
          summary: "Guide d'intercession et de veille spirituelle synchronisé depuis Google Drive.",
          keyThemes: ["Prière", "Veille", "Intercession", "Dernière Heure"],
          chaptersSummary: [
            { chapter: "Chapitre 1", summary: "Les fondements bibliques de la sentinelle d'intercession." }
          ],
          biblicalReferences: ["Matthieu 26:41", "Éphésiens 6:18", "Luc 18:1"],
          indexedAt: new Date().toISOString()
        }
      }
    ];

    // Filter out if already present
    const newlyAdded = sampleUnsynced.filter(b => !existingDriveIds.has(b.google_drive_file_id));

    addDriveLog('sync', folder.name, `Synchronisation Drive effectuée : ${newlyAdded.length} nouvel ouvrage importé.`, true);

    return {
      newBooksAdded: newlyAdded,
      totalDriveFilesFound: existingBooks.length + newlyAdded.length,
      folderInfo: folder,
      message: newlyAdded.length > 0 
        ? `${newlyAdded.length} nouvel ouvrage détecté dans le dossier Google Drive et ajouté à la bibliothèque.`
        : 'La bibliothèque est déjà parfaitement synchronisée avec le dossier Google Drive.'
    };
  }

  // Live Google Drive API scanning
  try {
    const listRes = await drive.files.list({
      q: `'${folder.id}' in parents and mimeType = 'application/pdf' and trashed = false`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, properties, description)',
      pageSize: 50
    });

    const driveFiles = listRes.data.files || [];
    const newBooksAdded: Book[] = [];

    for (const file of driveFiles) {
      const fileId = file.id;
      if (!fileId || existingDriveIds.has(fileId)) {
        continue;
      }

      // Parse metadata from title / properties
      const rawTitle = file.properties?.title || file.name?.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ') || 'Ouvrage sans titre';
      const author = file.properties?.author || 'Docteur LEMBA KAVUMBULA MOÏSE';
      const category = file.properties?.category || 'Vie Chrétienne & Sanctification';
      const description = file.description || `Livre PDF synchronisé directement depuis le dossier Google Drive « ${DRIVE_LIBRARY_FOLDER_NAME} ».`;
      const sizeBytes = Number(file.size) || 1500000;
      const webViewLink = file.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
      const webContentLink = file.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`;

      const newBook: Book = {
        id: `book-drive-${fileId.substring(0, 16)}`,
        title: rawTitle,
        author,
        category,
        description,
        cover_image: '/images/les-5-etapes-spirituelles.jpg',
        google_drive_url: webViewLink,
        google_drive_file_id: fileId,
        google_drive_folder_id: folder.id,
        file_size_bytes: sizeBytes,
        pdf_url: `https://drive.google.com/file/d/${fileId}/preview`,
        reading_file: `Ouvrage « ${rawTitle} » par ${author}. Fichier Google Drive : ${file.name}.`,
        chapters: [
          {
            title: "Document Complet (Google Drive)",
            content: `Cet ouvrage est accessible en lecture numérique directe et téléchargeable via son fichier Google Drive (${(sizeBytes / (1024 * 1024)).toFixed(1)} Mo).`
          }
        ],
        created_at: file.createdTime ? file.createdTime.split('T')[0] : new Date().toISOString().split('T')[0],
        status: 'Publié',
        page_count: Math.max(30, Math.round(sizeBytes / 35000)),
        reading_time_min: Math.max(20, Math.round(sizeBytes / 45000)),
        downloads_count: 0,
        views_count: 1,
        ai_indexed_content: {
          summary: description,
          keyThemes: [category, "Google Drive", "Bibliothèque Chrétienne"],
          chaptersSummary: [
            { chapter: "Texte Intégral", summary: "Manuscrit numérisé dans Google Drive." }
          ],
          biblicalReferences: [],
          indexedAt: new Date().toISOString()
        }
      };

      newBooksAdded.push(newBook);
    }

    addDriveLog('sync', folder.name, `Scan Drive terminé : ${driveFiles.length} fichiers trouvés, ${newBooksAdded.length} nouveaux ajoutés.`, true);

    return {
      newBooksAdded,
      totalDriveFilesFound: driveFiles.length,
      folderInfo: folder,
      message: newBooksAdded.length > 0
        ? `Synchronisation réussie : ${newBooksAdded.length} nouvel(s) ouvrage(s) importé(s) depuis Google Drive.`
        : `Synchronisation à jour : ${driveFiles.length} fichier(s) vérifié(s) dans le dossier Google Drive.`
    };

  } catch (err: any) {
    console.error('Erreur lors du scan du dossier Google Drive :', err);
    addDriveLog('sync', folder.name, `Erreur synchronisation Drive : ${err.message}`, false);
    throw new Error(`Erreur lors de la synchronisation avec Google Drive : ${err.message}`);
  }
}

/**
 * Helper to extract Google Drive file ID from URL
 */
export function extractFileIdFromDriveUrl(url?: string): string | null {
  if (!url) return null;
  // Patterns: /file/d/{id}/, id={id}, /folders/{id}
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch) return fileDMatch[1];

  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch) return idParamMatch[1];

  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  return null;
}
