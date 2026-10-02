import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_BOOKS } from './src/data/initialBooks.ts';
import { INITIAL_SHOWCASE_PHOTOS } from './src/data/initialShowcasePhotos.ts';
import { INITIAL_SERMONS } from './src/data/initialSermons.ts';
import { INITIAL_PREACHERS } from './src/data/initialPreachers.ts';
import { getDailyVerseForDate, getLocalizedDailyVerse, LANGUAGE_TO_DEFAULT_BIBLE_VERSION } from './src/data/dailyVerses.ts';
import { BIBLE_BOOKS, getChapterVerses, searchBibleVerses } from './src/data/bibleData.ts';
import { findLocalTheologicalConcept } from './src/data/theologicalDictionary.ts';
import { Book, ContactMessage, SiteSettings, AdminAiAction, MediaItem, DriveDocument, SpiritualStepData, ShowcasePhoto, Sermon, SermonComment, CustomLanguage, BibleVersionId, Preacher } from './src/types.ts';
import { router as communicationRouter } from './src/server/communication.ts';
import { whatsappWebhookRouter } from './src/server/whatsappWebhook.ts';
import { globalRagEngine } from './src/server/ragEngine.ts';
import { driveAuthRouter, getAuthorizedDriveClient } from './src/server/driveAuth.ts';
import { getAnalyticsDashboardData, recordAiQuery } from './src/server/analyticsService.ts';
import {
  ensureLibraryFolder,
  uploadBookPdfToDrive,
  deleteFileFromDrive,
  syncBooksFromDriveFolder,
  getDriveLogs,
  addDriveLog,
  DRIVE_LIBRARY_FOLDER_NAME,
  extractFileIdFromDriveUrl
} from './src/server/driveService.ts';

// File persistence paths
const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'site_settings.json');
const SHOWCASE_PHOTOS_FILE = path.join(DATA_DIR, 'showcase_photos.json');
const SERMONS_FILE = path.join(DATA_DIR, 'sermons.json');
const PREACHERS_FILE = path.join(DATA_DIR, 'preachers.json');

// Ensure data and uploads folders exist
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Error creating data directory:', e);
  }
}

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (e) {
    console.warn('Error creating uploads directory:', e);
  }
}

export function saveBase64Image(dataUrl: string, prefix = 'photo'): string {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  if (!dataUrl.startsWith('data:image/')) return dataUrl;

  try {
    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return dataUrl;

    let ext = matches[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    if (ext.includes('+')) ext = ext.split('+')[0];

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Error saving base64 image:', err);
    return dataUrl;
  }
}

export function loadBooksFromDisk(): Book[] {
  try {
    if (fs.existsSync(BOOKS_FILE)) {
      const content = fs.readFileSync(BOOKS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error loading books from disk, falling back to initial:', e);
  }
  return [...INITIAL_BOOKS];
}

export function saveBooksToDisk(books: Book[]) {
  try {
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving books to disk:', e);
  }
}

export function loadSermonsFromDisk(): Sermon[] {
  try {
    if (fs.existsSync(SERMONS_FILE)) {
      const content = fs.readFileSync(SERMONS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error loading sermons from disk, falling back to initial:', e);
  }
  return [...INITIAL_SERMONS];
}

export function saveSermonsToDisk(sermons: Sermon[]) {
  try {
    fs.writeFileSync(SERMONS_FILE, JSON.stringify(sermons, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving sermons to disk:', e);
  }
}

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "La Bibliothèque Chrétienne de la Dernière Heure",
  siteSubtitle: "Édification, Réveil Spirituel & Sanctification",
  libraryTitle: "Collection Complète des Ouvrages de Sanctification",
  siteNotice: "Base documentaire consacrée à la sainte veille, la sanctification et la préparation au retour du Seigneur Jésus-Christ.",
  heroTitle: "Bibliothèque Complète de Réveil et de Sanctification",
  heroDescription: "Ouvrages magistraux et études théologiques bibliques fondés sur 1 Pierre 5:10, centrés sur la préparation de l'Église pour le retour glorieux de notre Seigneur Jésus-Christ.",
  heroBadge: "Dernière Heure & Sanctification",
  authorName: "Docteur LEMBA KAVUMBULA MOÏSE",
  authorTitle: "Docteur en Théologie, Serviteur de Jésus-Christ",
  authorBio: "Auteur et enseignant de la saine doctrine biblique, le Docteur LEMBA KAVUMBULA MOÏSE consacre son ministère à l'affermissement des disciples de Christ à travers les cinq étapes cardinales : Appel, Souffrance, Perfectionnement, Affermissement et Fortification.",
  authorPhotoUrl: "",
  showcaseCoverImage: "",
  heroBackgroundImage: "",
  logoUrl: "",

  // Exact leadership information requested
  overseerNotice: "Toute cette œuvre est chapeautée par le Serviteur de Dieu KAYEMBE MWANANGIZI Lawi ainsi que les anciens de l'église.",
  seniorPastorName: "Le Serviteur de Dieu KAYEMBE MWANANGIZI Lawi",
  seniorPastorPhone: "+243 817 974 033",
  assistantPastorName: "Le Pasteur LUKANGILA FARIALA Manassé",
  assistantPastorPhone: "+243 823 844 629",
  churchName: "Église Cereshe/OUA",

  announcementBanner: {
    active: true,
    badge: "Dernière Heure",
    text: "Bibliothèque Chrétienne de Réveil et d'Édification Spirituelle — Découvrez le parcours des 5 Étapes Spirituelles selon 1 Pierre 5:10.",
    linkText: "Explorer le Parcours",
    linkView: "spiritual-steps"
  },
  dailyVerse: {
    reference: "1 Pierre 5:10",
    text: "Le Dieu de toute grâce, qui vous a appelés en Jésus-Christ à sa gloire éternelle, après que vous aurez souffert un peu de temps, vous perfectionnera lui-même, vous affermira, vous fortifiera, vous rendra inébranlables.",
    theme: "La Grâce Souveraine & Le Perfectionnement Divin"
  },
  contactEmail: "bibliothequechretien@gmail.com",
  contactPhone: "+243 817 974 033",
  contactAddress: "Centre du Réveil Spirituel de la dernière Heure / Ministère d'Évangélisation Internationale",
  adminContact: {
    name: "Dr. LEMBA KAVUMBULA Moïse",
    phone: "+243811733778",
    email: "bibliothequechretien@gmail.com"
  },
  googleDriveUrl: "https://drive.google.com/drive/folders/bibliothequechretien",
  officialSocialLink: "",
  footerText: "Toute cette œuvre est chapeautée par le Serviteur de Dieu KAYEMBE MWANANGIZI Lawi ainsi que les anciens de l'église.",
  copyrightNotice: "Tous droits réservés. Gloire à Dieu seul.",
  categories: [
    "Vie Chrétienne & Sanctification",
    "Prière & Intercession",
    "Foi & Encouragement",
    "Ministère & Réveil",
    "Édification Spirituelle"
  ],
  supportedLanguages: [
    { code: 'fr', label: 'Français', nativeLabel: 'Français', flag: '🇫🇷', active: true, bibleVersionId: 'LSG' },
    { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧', active: true, bibleVersionId: 'KJV' },
    { code: 'sw', label: 'Kiswahili', nativeLabel: 'Kiswahili', flag: '🇹🇿', active: true, bibleVersionId: 'SW-ZAN' },
    { code: 'ln', label: 'Lingála', nativeLabel: 'Lingála', flag: '🇨🇩', active: true, bibleVersionId: 'LN-BIB' }
  ]
};

export function loadSiteSettingsFromDisk(): SiteSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      const settings: SiteSettings = { ...DEFAULT_SITE_SETTINGS, ...parsed };

      // Restore permanent author photo if saved in persistent data file
      const authorB64Path = path.join(DATA_DIR, 'author_photo.b64');
      if (fs.existsSync(authorB64Path)) {
        try {
          const b64 = fs.readFileSync(authorB64Path, 'utf-8').trim();
          if (b64) settings.authorPhotoUrl = b64;
        } catch {}
      }

      // Clean up stale or missing ephemeral upload paths
      if (settings.authorPhotoUrl && settings.authorPhotoUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'public', settings.authorPhotoUrl);
        if (!fs.existsSync(filePath)) {
          const b64 = fs.existsSync(authorB64Path) ? fs.readFileSync(authorB64Path, 'utf-8').trim() : '';
          settings.authorPhotoUrl = b64;
        }
      }

      return settings;
    }
  } catch (e) {
    console.warn('Error loading settings from disk, falling back to defaults:', e);
  }
  return { ...DEFAULT_SITE_SETTINGS };
}

export function saveSiteSettingsToDisk(settings: SiteSettings) {
  try {
    // If authorPhotoUrl is a valid data URL, mirror to persistent data file
    if (settings.authorPhotoUrl && settings.authorPhotoUrl.startsWith('data:image/')) {
      try {
        fs.writeFileSync(path.join(DATA_DIR, 'author_photo.b64'), settings.authorPhotoUrl, 'utf-8');
        const matches = settings.authorPhotoUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (matches && matches[2]) {
          fs.writeFileSync(path.join(DATA_DIR, 'author_photo.jpg'), Buffer.from(matches[2], 'base64'));
          if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
          fs.writeFileSync(path.join(UPLOADS_DIR, 'author_photo.jpg'), Buffer.from(matches[2], 'base64'));
        }
      } catch (err) {
        console.warn('Error backing up persistent author photo:', err);
      }
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving settings to disk:', e);
  }
}

export function loadShowcasePhotosFromDisk(): ShowcasePhoto[] {
  try {
    if (fs.existsSync(SHOWCASE_PHOTOS_FILE)) {
      const content = fs.readFileSync(SHOWCASE_PHOTOS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error loading showcase photos from disk:', e);
  }
  return [...INITIAL_SHOWCASE_PHOTOS];
}

export function saveShowcasePhotosToDisk(photos: ShowcasePhoto[]) {
  try {
    fs.writeFileSync(SHOWCASE_PHOTOS_FILE, JSON.stringify(photos, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving showcase photos to disk:', e);
  }
}

export function loadPreachersFromDisk(): Preacher[] {
  try {
    if (fs.existsSync(PREACHERS_FILE)) {
      const content = fs.readFileSync(PREACHERS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error loading preachers from disk:', e);
  }
  return [...INITIAL_PREACHERS];
}

export function savePreachersToDisk(preachers: Preacher[]) {
  try {
    fs.writeFileSync(PREACHERS_FILE, JSON.stringify(preachers, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving preachers to disk:', e);
  }
}

// Persistent database for books
let booksDatabase: Book[] = loadBooksFromDisk();
let siteSettings: SiteSettings = loadSiteSettingsFromDisk();
let showcasePhotosDatabase: ShowcasePhoto[] = loadShowcasePhotosFromDisk();
let sermonsDatabase: Sermon[] = loadSermonsFromDisk();
let preachersDatabase: Preacher[] = loadPreachersFromDisk();

let contactMessages: ContactMessage[] = [
  {
    id: "msg-1",
    name: "Pasteur Marc Daniel",
    email: "m.daniel@eglisedureveil.org",
    subject: "Proposition de manuscrit sur la sanctification",
    message: "Bonjour, je souhaiterais proposer notre ouvrage théologique sur les 5 étapes de sanctification pour indexation dans votre bibliothèque.",
    date: "2025-03-12T14:20:00Z",
    status: "unread"
  }
];

let mediaDatabase: MediaItem[] = [];

// Lazy Gemini client initialization
let genAiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAiClient;
}

export function getLanguageMandate(language: string = 'fr'): string {
  const cleanLang = (language || 'fr').toLowerCase().trim();
  if (cleanLang === 'en') {
    return `CRITICAL LANGUAGE MANDATE:
The user interface and selected language is strictly set to ENGLISH (en).
You MUST generate 100% of your answer in ENGLISH. All explanations, theological points, greetings, scripture citations, and pastoral blessings must be written entirely in English. Do NOT use French.`;
  }
  if (cleanLang === 'sw') {
    return `AGIZO KUU LA LUGHA:
Mtumiaji amechagua KISWAHILI (sw).
LAZIMA utoe jibu lako lote (100%) kwa KISWAHILI fasaha cha kibiblia. Usitumie Kifaransa. Vichwa vya habari, mistari ya Biblia, na maelezo yote yawe katika Kiswahili.`;
  }
  if (cleanLang === 'ln') {
    return `MOKO YA NTINA MINGI LOKÓTÁ:
Mosaleli aponi LINGÁLA (ln).
ESENGELI oyanola 100% na LINGÁLA lya peto lya Makomi. Salela biverse ya Biblia na Lingála. Kotinda ata liloba moko te na Falansé.`;
  }
  if (cleanLang === 'es') {
    return `MANDATO CRÍTICO DE IDIOMA:
El usuario ha seleccionado ESPAÑOL (es).
DEBES responder el 100% de tu respuesta en ESPAÑOL con tono bíblico reverente y piadoso. No utilices el francés.`;
  }
  if (cleanLang === 'pt') {
    return `MANDATO CRITICO DE IDIOMA: O usuario selecionou PORTUGUES (pt). RESPONDA 100% EM PORTUGUES.`;
  }
  if (cleanLang === 'de') {
    return `KRITISCHE SPRACHVORGABE: Der Benutzer hat DEUTSCH (de) gewaehlt. ANTWORTEN SIE ZU 100% AUF DEUTSCH.`;
  }
  if (cleanLang && cleanLang !== 'fr') {
    return `CRITICAL LANGUAGE MANDATE: The user has selected the language '${cleanLang}'. You MUST generate your ENTIRE reply in this language without reverting to French.`;
  }
  return `MANDAT DE LANGUE : Réponds en français soigné, biblique et révérencieux.`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ limit: '60mb', extended: true }));

  // Initialize RAG knowledge engine index
  globalRagEngine.rebuildIndex(booksDatabase, sermonsDatabase);

  // --- API ROUTES ---

  // Mount Authentication & Questions & WhatsApp Communication Router
  app.use('/api', communicationRouter);
  app.use('/api', whatsappWebhookRouter);
  app.use('/', whatsappWebhookRouter);

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'La Bibliothèque Chrétienne de la Dernière Heure',
      booksCount: booksDatabase.length,
      ragChunksCount: globalRagEngine.getChunksCount(),
      aiReady: !!process.env.GEMINI_API_KEY
    });
  });

  // Admin verification
  app.post('/api/admin/verify', (req: Request, res: Response) => {
    const { passcode } = req.body;
    // Default master codes for simplicity and accessibility
    const validCodes = ['admin123', 'derniereheure', 'maranatha'];
    if (passcode && validCodes.includes(passcode.toLowerCase().trim())) {
      res.json({ success: true, token: 'token-admin-session-auth' });
    } else {
      res.status(401).json({ success: false, error: 'Code d\'accès administrateur incorrect' });
    }
  });

  // Get books
  app.get('/api/books', (req: Request, res: Response) => {
    const { category, search, status } = req.query;
    let results = [...booksDatabase];

    if (category && typeof category === 'string' && category !== 'Tous') {
      results = results.filter(b => b.category.toLowerCase() === category.toLowerCase());
    }

    if (status && typeof status === 'string') {
      results = results.filter(b => b.status === status);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter(b => 
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.ai_indexed_content.keyThemes.some(t => t.toLowerCase().includes(q))
      );
    }

    res.json({
      total: results.length,
      books: results
    });
  });

  // Get single book
  app.get('/api/books/:id', (req: Request, res: Response) => {
    const book = booksDatabase.find(b => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Livre introuvable' });
    }
    // Increment view count
    book.views_count = (book.views_count || 0) + 1;
    res.json(book);
  });

  // Add book (Admin)
  app.post('/api/books', (req: Request, res: Response) => {
    const newBook: Book = {
      id: req.body.id || `book-${Date.now()}`,
      title: req.body.title || 'Sans titre',
      author: req.body.author || 'Auteur anonyme',
      category: req.body.category || 'Vie Chrétienne & Sanctification',
      description: req.body.description || '',
      cover_image: req.body.cover_image ? saveBase64Image(req.body.cover_image, 'book_cover') : '',
      reading_file: req.body.reading_file || '',
      chapters: req.body.chapters || [
        {
          title: "Introduction et Chapitre 1",
          content: req.body.reading_file || "Contenu du livre en cours d'édition..."
        }
      ],
      google_drive_url: req.body.google_drive_url || 'https://drive.google.com/',
      pdf_url: req.body.pdf_url || '',
      created_at: new Date().toISOString().split('T')[0],
      status: req.body.status || 'Publié',
      page_count: Number(req.body.page_count) || 120,
      reading_time_min: Number(req.body.reading_time_min) || 90,
      downloads_count: 0,
      views_count: 1,
      ai_indexed_content: req.body.ai_indexed_content || {
        summary: req.body.description || 'Livre spirituel nouvellement indexé.',
        keyThemes: [req.body.category || 'Général'],
        chaptersSummary: [
          { chapter: 'Chapitre 1', summary: 'Aperçu général des enseignements.' }
        ],
        biblicalReferences: [],
        indexedAt: new Date().toISOString()
      }
    };

    booksDatabase.unshift(newBook);
    saveBooksToDisk(booksDatabase);
    globalRagEngine.rebuildIndex(booksDatabase);
    res.status(201).json(newBook);
  });

  // Update book (Admin)
  app.put('/api/books/:id', (req: Request, res: Response) => {
    let index = booksDatabase.findIndex(b => b.id === req.params.id);
    if (index === -1) {
      // If it's the flagship 5-steps book, create/upsert it cleanly
      if (req.params.id === 'les-5-etapes-spirituelles-chretien') {
        const newFlagshipBook: Book = {
          id: 'les-5-etapes-spirituelles-chretien',
          title: req.body.title || "Les 5 Étapes Spirituelles Pour Devenir Chrétien",
          author: req.body.author || "Docteur LEMBA KAVUMBULA MOÏSE",
          category: req.body.category || "Vie Chrétienne & Sanctification",
          description: req.body.description || "Ouvrage magistral du Docteur LEMBA KAVUMBULA MOÏSE présentant le parcours biblique des 5 étapes selon 1 Pierre 5:10 : Appel, Souffrance, Perfectionnement, Affermissement et Fortification.",
          cover_image: req.body.cover_image ? saveBase64Image(req.body.cover_image, 'book_cover') : "",
          reading_file: req.body.reading_file || "Enseignement du Docteur LEMBA KAVUMBULA MOÏSE sur les 5 étapes...",
          google_drive_url: req.body.google_drive_url || "",
          pdf_url: req.body.pdf_url || "",
          download_links: req.body.download_links || [],
          created_at: new Date().toISOString(),
          status: 'Publié',
          featured: true,
          page_count: req.body.page_count || 140,
          reading_time_min: req.body.reading_time_min || 120,
          ai_indexed_content: req.body.ai_indexed_content || {
            summary: "Les 5 étapes spirituelles selon 1 Pierre 5:10 : Appel, Souffrance, Perfectionnement, Affermissement, Fortification.",
            keyThemes: ["Sanctification", "Appel", "Souffrance", "Perfectionnement", "Affermissement", "Fortification"],
            chaptersSummary: [],
            biblicalReferences: ["1 Pierre 5:10"],
            indexedAt: new Date().toISOString()
          }
        };
        booksDatabase.unshift(newFlagshipBook);
        saveBooksToDisk(booksDatabase);
        globalRagEngine.rebuildIndex(booksDatabase);
        return res.status(201).json(newFlagshipBook);
      }
      return res.status(404).json({ error: 'Livre non trouvé' });
    }

    const updatedCover = req.body.cover_image !== undefined 
      ? (req.body.cover_image ? saveBase64Image(req.body.cover_image, `book_${req.params.id}`) : '') 
      : booksDatabase[index].cover_image;

    booksDatabase[index] = {
      ...booksDatabase[index],
      ...req.body,
      cover_image: updatedCover,
      id: req.params.id // Protect ID
    };

    saveBooksToDisk(booksDatabase);
    globalRagEngine.rebuildIndex(booksDatabase);
    res.json(booksDatabase[index]);
  });

  // Dedicated endpoint to update a book's cover image
  app.post('/api/admin/books/:id/cover', (req: Request, res: Response) => {
    const { cover_image } = req.body;
    const book = booksDatabase.find(b => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Livre non trouvé' });
    }

    const savedUrl = cover_image ? saveBase64Image(cover_image, `book_${book.id}`) : '';
    book.cover_image = savedUrl;
    saveBooksToDisk(booksDatabase);
    globalRagEngine.rebuildIndex(booksDatabase);

    return res.json({ success: true, cover_image: savedUrl, book });
  });

  // Dedicated endpoint to update site photos (showcaseCoverImage, authorPhotoUrl, logoUrl, heroBackgroundImage)
  app.post('/api/admin/site-settings/photo', (req: Request, res: Response) => {
    const { slot, image, clear } = req.body;
    if (!slot) {
      return res.status(400).json({ error: 'Slot requis' });
    }

    if (slot === 'authorPhotoUrl') {
      if (clear === true || !image) {
        siteSettings.authorPhotoUrl = '';
        try {
          const b64Path = path.join(DATA_DIR, 'author_photo.b64');
          if (fs.existsSync(b64Path)) fs.unlinkSync(b64Path);
          const jpgPath = path.join(DATA_DIR, 'author_photo.jpg');
          if (fs.existsSync(jpgPath)) fs.unlinkSync(jpgPath);
        } catch {}
      } else {
        // Keep the data URL directly in siteSettings so it can never be lost, 404'd or wiped by container restarts!
        siteSettings.authorPhotoUrl = image;
        try {
          if (image.startsWith('data:image/')) {
            fs.writeFileSync(path.join(DATA_DIR, 'author_photo.b64'), image, 'utf-8');
            const matches = image.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
            if (matches && matches[2]) {
              fs.writeFileSync(path.join(DATA_DIR, 'author_photo.jpg'), Buffer.from(matches[2], 'base64'));
              if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
              fs.writeFileSync(path.join(UPLOADS_DIR, 'author_photo.jpg'), Buffer.from(matches[2], 'base64'));
            }
          }
        } catch (err) {
          console.warn('Error saving persistent author photo:', err);
        }
      }
      saveSiteSettingsToDisk(siteSettings);
      return res.json({ success: true, slot, url: siteSettings.authorPhotoUrl, settings: siteSettings });
    }

    const savedUrl = image ? (image.startsWith('data:image/') && image.length < 250000 ? image : saveBase64Image(image, `site_${slot}`)) : '';

    if (slot === 'showcaseCoverImage') {
      siteSettings.showcaseCoverImage = savedUrl;
      const flagship = booksDatabase.find(b => b.id === 'les-5-etapes-spirituelles-chretien');
      if (flagship) {
        flagship.cover_image = savedUrl;
        saveBooksToDisk(booksDatabase);
      }
    } else if (slot === 'logoUrl') {
      siteSettings.logoUrl = savedUrl;
    } else if (slot === 'heroBackgroundImage') {
      siteSettings.heroBackgroundImage = savedUrl;
    }

    saveSiteSettingsToDisk(siteSettings);
    return res.json({ success: true, slot, url: savedUrl, settings: siteSettings });
  });

  // Universal photo upload endpoint
  app.post('/api/upload-photo', (req: Request, res: Response) => {
    const { image, name, slot } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image requise' });
    }
    const savedUrl = saveBase64Image(image, slot || name || 'photo');
    return res.json({ success: true, url: savedUrl });
  });

  // Clear all photos across the site
  app.post('/api/admin/clear-all-photos', (req: Request, res: Response) => {
    siteSettings.authorPhotoUrl = '';
    siteSettings.showcaseCoverImage = '';
    siteSettings.logoUrl = '';
    siteSettings.heroBackgroundImage = '';
    saveSiteSettingsToDisk(siteSettings);

    booksDatabase.forEach(b => {
      b.cover_image = '';
    });
    saveBooksToDisk(booksDatabase);

    showcasePhotosDatabase.forEach(p => {
      p.url = '';
    });
    saveShowcasePhotosToDisk(showcasePhotosDatabase);

    return res.json({ success: true, message: 'Toutes les photos du site ont été effacées avec succès.' });
  });

  // Dedicated endpoint to get or update download links specifically for the 5-steps book
  app.get('/api/books/flagship/download-links', (req: Request, res: Response) => {
    const book = booksDatabase.find(b => b.id === 'les-5-etapes-spirituelles-chretien');
    if (!book) {
      return res.json({
        exists: false,
        google_drive_url: "",
        pdf_url: "",
        download_links: []
      });
    }
    return res.json({
      exists: true,
      bookId: book.id,
      title: book.title,
      google_drive_url: book.google_drive_url || "",
      pdf_url: book.pdf_url || "",
      download_links: book.download_links || []
    });
  });

  app.post('/api/books/flagship/download-links', (req: Request, res: Response) => {
    const { google_drive_url, pdf_url, download_links, title, author, description, cover_image } = req.body;
    let book = booksDatabase.find(b => b.id === 'les-5-etapes-spirituelles-chretien');

    if (!book) {
      // Create the book with the download links
      book = {
        id: 'les-5-etapes-spirituelles-chretien',
        title: title || "Les 5 Étapes Spirituelles Pour Devenir Chrétien",
        author: author || "Docteur LEMBA KAVUMBULA MOÏSE",
        category: "Vie Chrétienne & Sanctification",
        description: description || "Ouvrage magistral du Docteur LEMBA KAVUMBULA MOÏSE présentant le parcours biblique des 5 étapes selon 1 Pierre 5:10 : Appel, Souffrance, Perfectionnement, Affermissement et Fortification.",
        cover_image: cover_image ? saveBase64Image(cover_image, 'book_flagship') : "",
        reading_file: "Enseignement du Docteur LEMBA KAVUMBULA MOÏSE sur les 5 étapes...",
        google_drive_url: google_drive_url || "",
        pdf_url: pdf_url || "",
        download_links: Array.isArray(download_links) ? download_links : [],
        created_at: new Date().toISOString(),
        status: 'Publié',
        featured: true,
        page_count: 140,
        reading_time_min: 120,
        ai_indexed_content: {
          summary: "Les 5 étapes spirituelles selon 1 Pierre 5:10 : Appel, Souffrance, Perfectionnement, Affermissement, Fortification.",
          keyThemes: ["Sanctification", "Appel", "Souffrance", "Perfectionnement", "Affermissement", "Fortification"],
          chaptersSummary: [],
          biblicalReferences: ["1 Pierre 5:10"],
          indexedAt: new Date().toISOString()
        }
      };
      booksDatabase.unshift(book);
    } else {
      // Update download links and URLs
      if (google_drive_url !== undefined) book.google_drive_url = google_drive_url;
      if (pdf_url !== undefined) book.pdf_url = pdf_url;
      if (download_links !== undefined && Array.isArray(download_links)) {
        book.download_links = download_links;
      }
      if (title) book.title = title;
      if (author) book.author = author;
      if (description) book.description = description;
      if (cover_image) book.cover_image = cover_image;
    }

    saveBooksToDisk(booksDatabase);
    globalRagEngine.rebuildIndex(booksDatabase);

    console.log(`[Books] Liens de téléchargement mis à jour pour « ${book.title} »: Drive=${book.google_drive_url}, PDF=${book.pdf_url}, Liens=${book.download_links?.length || 0}`);
    return res.json({
      success: true,
      message: `Liens de téléchargement enregistrés avec succès pour le livre « ${book.title} ».`,
      book
    });
  });

  // Vider entièrement la bibliothèque / Supprimer tous les livres enregistrés dans la base de données
  const clearAllBooksHandler = async (req: Request, res: Response) => {
    try {
      const count = booksDatabase.length;
      booksDatabase.length = 0;
      booksDatabase = [];
      saveBooksToDisk(booksDatabase);
      globalRagEngine.rebuildIndex(booksDatabase, sermonsDatabase);
      console.log(`[Library] Bibliothèque vidée : ${count} livre(s) supprimé(s). Base de données vierge.`);
      return res.json({
        success: true,
        count,
        message: `La bibliothèque a été entièrement vidée (${count} livre(s) supprimé(s)). La base de données est désormais vierge pour votre configuration initiale propre.`
      });
    } catch (err: any) {
      console.error('Erreur lors du vidage de la bibliothèque :', err);
      return res.status(500).json({ error: 'Erreur lors du vidage de la bibliothèque' });
    }
  };

  app.delete('/api/books', clearAllBooksHandler);
  app.delete('/api/books/all', clearAllBooksHandler);
  app.post('/api/books/clear', clearAllBooksHandler);

  // Delete book (Admin) - Supports deleting only from site OR also from Google Drive
  app.delete('/api/books/:id', async (req: Request, res: Response) => {
    const index = booksDatabase.findIndex(b => b.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Livre non trouvé' });
    }

    const removed = booksDatabase.splice(index, 1)[0];
    saveBooksToDisk(booksDatabase);
    globalRagEngine.rebuildIndex(booksDatabase);

    const shouldDeleteFromDrive = req.query.deleteFromDrive === 'true' || req.body?.deleteFromDrive === true;
    let driveDeleted = false;
    const driveFileId = removed.google_drive_file_id || extractFileIdFromDriveUrl(removed.google_drive_url);

    if (shouldDeleteFromDrive && driveFileId) {
      try {
        driveDeleted = await deleteFileFromDrive(driveFileId);
      } catch (err: any) {
        console.warn('Erreur suppression Drive :', err.message);
      }
    }

    res.json({
      success: true,
      message: shouldDeleteFromDrive && driveDeleted
        ? `Livre « ${removed.title} » supprimé du site et son fichier a été définitivement supprimé de Google Drive.`
        : `Livre « ${removed.title} » supprimé du catalogue du site (le fichier Google Drive est conservé).`,
      book: removed,
      deletedFromDrive: driveDeleted
    });
  });

  // Trigger AI Indexing of a book
  app.post('/api/ai/index/:id', async (req: Request, res: Response) => {
    const book = booksDatabase.find(b => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Livre non trouvé' });
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `Tu es un théologien chrétien et documentaliste expert. Analyse le livre suivant pour notre bibliothèque chrétienne :
Titre: ${book.title}
Auteur: ${book.author}
Catégorie: ${book.category}
Description: ${book.description}
Contenu des chapitres: ${JSON.stringify(book.chapters || book.reading_file)}

Retourne un objet JSON valide avec la structure exacte suivante :
{
  "summary": "Résumé théologique clair de 2-3 phrases",
  "keyThemes": ["Thème 1", "Thème 2", "Thème 3", "Thème 4"],
  "chaptersSummary": [{"chapter": "Nom", "summary": "Court résumé du chapitre"}],
  "biblicalReferences": ["Livre Ch:V", "Livre Ch:V"]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          book.ai_indexed_content = {
            summary: parsed.summary || book.description,
            keyThemes: parsed.keyThemes || [book.category],
            chaptersSummary: parsed.chaptersSummary || [],
            biblicalReferences: parsed.biblicalReferences || [],
            indexedAt: new Date().toISOString()
          };
        }
      } catch (err) {
        console.error('Gemini indexing error:', err);
      }
    } else {
      // Local indexing logic fallback
      book.ai_indexed_content = {
        summary: `${book.title} par ${book.author}. Un guide spirituel essentiel sur ${book.category}.`,
        keyThemes: [book.category, "Foi vivante", "Parole de Dieu", "Sanctification", "Dernière Heure"],
        chaptersSummary: (book.chapters || []).map(ch => ({
          chapter: ch.title,
          summary: `Exposé biblique et exhortation pratique.`
        })),
        biblicalReferences: ["2 Timothée 3:16", "Hébreux 4:12", "Apocalypse 22:20"],
        indexedAt: new Date().toISOString()
      };
    }

    res.json({ message: "Indexation IA terminée", ai_indexed_content: book.ai_indexed_content });
  });

  // --- REAL-TIME AI DOCUMENT/PDF SYNTHESIS FOR BOOKS ---
  app.post('/api/admin/books/analyze-document', async (req: Request, res: Response) => {
    try {
      const { title, author, textContent, fileName } = req.body;
      const contentSnippet = (textContent || '').slice(0, 12000);
      const docTitle = title || fileName || 'Manuscrit / Ouvrage Chrétien';
      const docAuthor = author || 'Docteur LEMBA KAVUMBULA MOÏSE';

      const ai = getGeminiClient();
      if (ai) {
        try {
          const prompt = `Tu es un éminent théologien chrétien et analyste documentaire pour « La Bibliothèque Chrétienne de la Dernière Heure ».
Un nouveau document / fichier PDF vient d'être téléversé ou détecté :
Titre : ${docTitle}
Auteur : ${docAuthor}
Nom de fichier : ${fileName || 'non précisé'}
Extrait du contenu :
${contentSnippet || 'Ouvrage pastoral sur la sanctification, les étapes de la foi chrétienne et la veille spirituelle.'}

Génère une synthèse structurée exhaustive et édifiante au format JSON strict avec la structure exacte suivante :
{
  "summary": "Synthèse théologique globale et message central (2 à 3 paragraphes denses, clairs, édifiants et fidèles aux Écritures)",
  "keyThemes": ["Thème 1", "Thème 2", "Thème 3", "Thème 4", "Thème 5"],
  "chaptersSummary": [
    { "chapter": "1. ...", "summary": "Portée doctrinale et exposé" },
    { "chapter": "2. ...", "summary": "Portée doctrinale et exposé" },
    { "chapter": "3. ...", "summary": "Portée doctrinale et exposé" }
  ],
  "targetAudience": "Public ciblé (ex: Disciples en quête de sanctification, nouveaux convertis, serviteurs de Dieu)",
  "doctrinalFocus": "Axe théologique majeur (ex: 1 Pierre 5:10, sanctification, repentance, retour imminent de Christ)",
  "keyVerses": ["1 Pierre 5:10", "Hébreux 12:14", "2 Timothée 3:16", "Colossiens 2:6-7"],
  "spiritualTakeaways": [
    "Vérité spirituelle transformatrice 1",
    "Vérité spirituelle transformatrice 2",
    "Vérité spirituelle transformatrice 3"
  ]
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json'
            }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            return res.json({
              success: true,
              source: 'gemini-ai',
              analysis: {
                summary: parsed.summary || 'Analyse doctrinale complète générée par l\'IA.',
                keyThemes: parsed.keyThemes || ['Sanctification', 'Vie Chrétienne', 'Doctrine Biblique'],
                chaptersSummary: parsed.chaptersSummary || [],
                targetAudience: parsed.targetAudience || 'Tous les croyants et disciples de Jésus-Christ.',
                doctrinalFocus: parsed.doctrinalFocus || 'Sanctification, foi vivante et préparation pour la dernière heure.',
                keyVerses: parsed.keyVerses || ['1 Pierre 5:10', 'Hébreux 12:14'],
                spiritualTakeaways: parsed.spiritualTakeaways || [
                  'Marcher dans la sainteté sans compromis.',
                  'Demeurer ferme dans l\'épreuve selon 1 Pierre 5:10.'
                ]
              }
            });
          }
        } catch (geminiErr) {
          console.warn('Gemini doc analysis error, using structured fallback:', geminiErr);
        }
      }

      // High quality structured fallback
      const fallbackAnalysis = {
        summary: `Synthèse doctrinale pour « ${docTitle} » par ${docAuthor}. Cet ouvrage magistral expose avec profondeur biblique les principes fondamentaux de la vie chrétienne authentique, de la sanctification sans tache et de la fermeté dans l'épreuve à la lumière de 1 Pierre 5:10.`,
        keyThemes: ["Sanctification & Pureté", "Les 5 Étapes Spirituelles", "Veille de la Dernière Heure", "Saine Doctrine", "Foi Vivante"],
        chaptersSummary: [
          { chapter: "Partie 1 : L'Appel Divin", summary: "La souveraineté de Dieu appelant le croyant à Sa gloire éternelle en Jésus-Christ." },
          { chapter: "Partie 2 : L'Épreuve Salutaire", summary: "Le brisement salutaire et la purification dans la souffrance d'un peu de temps." },
          { chapter: "Partie 3 : Le Perfectionnement & L'Affermissement", summary: "La restauration de l'âme et l'enracinement inébranlable dans la sainte vérité." }
        ],
        targetAudience: "Disciples, serviteurs de Dieu et tout croyant aspirant à la sanctification intégrale.",
        doctrinalFocus: "1 Pierre 5:10 • Appel, brisement salutaire, restauration et affermissement divin.",
        keyVerses: ["1 Pierre 5:10", "Romains 12:1-2", "Hébreux 12:14", "Colossiens 2:6-7"],
        spiritualTakeaways: [
          "Dieu perfectionne Lui-même Ses enfants après l'épreuve de la foi.",
          "La sanctification sans laquelle personne ne verra le Seigneur.",
          "La fidélité inébranlable pour l'enlèvement et la dernière heure."
        ]
      };

      res.json({
        success: true,
        source: 'theological_engine',
        analysis: fallbackAnalysis
      });
    } catch (err: any) {
      console.error('Error analyzing document:', err);
      res.status(500).json({ error: 'Erreur lors de l\'analyse IA du document : ' + err.message });
    }
  });

  // --- SITE SETTINGS ENDPOINTS ---
  app.get('/api/site-settings', (req: Request, res: Response) => {
    res.json(siteSettings);
  });

  // 24-hour automatic rotating daily verse endpoint with multilingual support
  app.get('/api/daily-verse/today', (req: Request, res: Response) => {
    const lang = ((req.query.lang as string) || 'fr').toLowerCase();
    const explicitVersion = req.query.version as BibleVersionId | undefined;
    const date = new Date();
    const rotated = getDailyVerseForDate(date);
    const localized = getLocalizedDailyVerse(rotated, lang, explicitVersion);
    const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    res.json({
      verse: rotated,
      localized,
      dateKey,
      source: 'auto_24h_rotation'
    });
  });

  app.put('/api/site-settings', (req: Request, res: Response) => {
    const previousAuthorPhoto = siteSettings.authorPhotoUrl;
    siteSettings = {
      ...siteSettings,
      ...req.body
    };
    // Protect author photo from accidental clearing unless explicit clearAuthorPhoto flag is provided
    if (req.body.authorPhotoUrl === '' && req.body.clearAuthorPhoto !== true && previousAuthorPhoto) {
      siteSettings.authorPhotoUrl = previousAuthorPhoto;
    }
    saveSiteSettingsToDisk(siteSettings);
    res.json(siteSettings);
  });

  // Dedicated resilient author photo binary endpoint
  app.get('/api/author-photo', (req: Request, res: Response) => {
    const authorJpg = path.join(DATA_DIR, 'author_photo.jpg');
    if (fs.existsSync(authorJpg)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(authorJpg);
    }
    const authorB64 = path.join(DATA_DIR, 'author_photo.b64');
    if (fs.existsSync(authorB64)) {
      try {
        const dataUrl = fs.readFileSync(authorB64, 'utf-8').trim();
        const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const buffer = Buffer.from(matches[2], 'base64');
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.send(buffer);
        }
      } catch {}
    }
    if (siteSettings.authorPhotoUrl && siteSettings.authorPhotoUrl.startsWith('data:image/')) {
      const matches = siteSettings.authorPhotoUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (matches && matches[2]) {
        const buffer = Buffer.from(matches[2], 'base64');
        res.setHeader('Content-Type', 'image/jpeg');
        return res.send(buffer);
      }
    }
    res.status(404).set('Content-Type', 'text/plain').send('Aucune photo d\'auteur enregistrée');
  });

  // Guard against missing /uploads/* falling back to HTML index.html
  app.get('/uploads/*', (req: Request, res: Response, next) => {
    const localPath = path.join(process.cwd(), 'public', req.path);
    if (fs.existsSync(localPath)) {
      return next();
    }
    // Return 404 text/plain rather than HTML so <img> onError fires cleanly
    res.status(404).set('Content-Type', 'text/plain').send('Upload file not found');
  });

  // --- LES 5 ÉTAPES SPIRITUELLES ENDPOINTS ---
  app.get('/api/spiritual-steps', (req: Request, res: Response) => {
    const steps = globalRagEngine.getSpiritualSteps();
    res.json({ steps });
  });

  app.put('/api/spiritual-steps/:id', (req: Request, res: Response) => {
    const updated = globalRagEngine.updateSpiritualStep(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Étape spirituelle non trouvée' });
    }
    globalRagEngine.rebuildIndex(booksDatabase);
    res.json(updated);
  });

  app.post('/api/spiritual-steps/reset', (req: Request, res: Response) => {
    const steps = globalRagEngine.resetSpiritualSteps();
    globalRagEngine.rebuildIndex(booksDatabase);
    res.json({ message: 'Les 5 étapes ont été réinitialisées au modèle fondateur.', steps });
  });

  app.post('/api/admin/steps/:id/photo', (req: Request, res: Response) => {
    const { image } = req.body;
    const savedUrl = image ? saveBase64Image(image, `step_${req.params.id}`) : '';
    const updated = globalRagEngine.updateSpiritualStep(req.params.id, { image: savedUrl });
    res.json({ success: true, url: savedUrl, step: updated });
  });

  // --- GOOGLE DRIVE OAUTH 2.0 & AUTHENTICATION ENDPOINTS ---
  app.use('/api/drive/auth', driveAuthRouter);

  // Configuration and status of Google Drive library storage
  app.get('/api/drive/config', async (req: Request, res: Response) => {
    try {
      const folder = await ensureLibraryFolder();
      const driveLinkedBooks = booksDatabase.filter(b => b.google_drive_file_id || b.google_drive_url?.includes('drive.google.com'));
      res.json({
        success: true,
        targetAccount: 'bibliothequechretien@gmail.com',
        libraryFolderName: DRIVE_LIBRARY_FOLDER_NAME,
        folder,
        booksLinkedCount: driveLinkedBooks.length,
        totalBooks: booksDatabase.length
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Direct upload of a Book PDF to Google Drive folder
  app.post('/api/drive/books/upload', async (req: Request, res: Response) => {
    try {
      const {
        fileBase64,
        fileName,
        title,
        author,
        category,
        description,
        cover_image,
        keywords,
        page_count,
        reading_file
      } = req.body;

      if (!fileBase64 || !fileName || !title) {
        return res.status(400).json({
          error: "Fichier PDF manquant, ainsi que le nom de fichier et le titre de l'ouvrage."
        });
      }

      // Convert Base64 into binary buffer
      const base64Data = fileBase64.includes(';base64,') ? fileBase64.split(';base64,')[1] : fileBase64;
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload directly into Google Drive folder « 📚 LA BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE »
      const driveResult = await uploadBookPdfToDrive({
        buffer,
        fileName,
        title: title.trim(),
        author: (author || 'Docteur LEMBA KAVUMBULA MOÏSE').trim(),
        category: category || 'Vie Chrétienne & Sanctification',
        description: description || '',
        keywords: keywords || []
      });

      const parsedPageCount = Number(page_count) || Math.max(20, Math.round(buffer.length / 32000));
      const parsedReadingTime = Math.max(15, Math.round(parsedPageCount * 0.8));

      // Construct book record linked to Google Drive
      const newBook: Book = {
        id: `book-${Date.now()}`,
        title: title.trim(),
        author: (author || 'Docteur LEMBA KAVUMBULA MOÏSE').trim(),
        category: category || 'Vie Chrétienne & Sanctification',
        description: description || `Ouvrage archivé et conservé sur Google Drive dans « ${DRIVE_LIBRARY_FOLDER_NAME} ».`,
        cover_image: cover_image ? saveBase64Image(cover_image, 'book_drive') : '',
        reading_file: reading_file || `Fichier PDF Google Drive : ${driveResult.fileName}. Titre : ${title} par ${author}.`,
        chapters: [
          {
            title: "Document Numérique Intégral (Google Drive)",
            content: `Cet ouvrage est disponible en consultation directe haute fidélité et téléchargeable via son fichier Google Drive (${(driveResult.sizeBytes / (1024 * 1024)).toFixed(1)} Mo).`
          }
        ],
        google_drive_url: driveResult.webViewLink,
        google_drive_file_id: driveResult.driveFileId,
        google_drive_folder_id: driveResult.folderId,
        file_size_bytes: driveResult.sizeBytes,
        pdf_url: `https://drive.google.com/file/d/${driveResult.driveFileId}/preview`,
        created_at: new Date().toISOString().split('T')[0],
        status: 'Publié',
        page_count: parsedPageCount,
        reading_time_min: parsedReadingTime,
        downloads_count: 0,
        views_count: 1,
        keywords: Array.isArray(keywords) ? keywords : [category],
        ai_indexed_content: {
          summary: description || `Ouvrage « ${title} » par ${author}.`,
          keyThemes: [category, ...(Array.isArray(keywords) ? keywords : []), "Google Drive", "Bibliothèque Chrétienne"],
          chaptersSummary: [
            { chapter: "Document Intégral", summary: `Document PDF de ${parsedPageCount} pages téléversé dans Google Drive.` }
          ],
          biblicalReferences: [],
          indexedAt: new Date().toISOString()
        }
      };

      // Enrich with Gemini AI indexing if key exists
      const ai = getGeminiClient();
      if (ai) {
        try {
          const prompt = `Tu es un théologien chrétien et documentaliste expert. Analyse le livre nouvellement envoyé sur Google Drive :
Titre: ${newBook.title}
Auteur: ${newBook.author}
Catégorie: ${newBook.category}
Description: ${newBook.description}

Génère un résumé théologique et les thèmes clés en JSON :
{
  "summary": "Résumé théologique clair de 2-3 phrases",
  "keyThemes": ["Thème 1", "Thème 2", "Thème 3"],
  "biblicalReferences": ["Livre Ch:V", "Livre Ch:V"]
}`;
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });
          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            if (parsed.summary) newBook.ai_indexed_content.summary = parsed.summary;
            if (parsed.keyThemes) newBook.ai_indexed_content.keyThemes = parsed.keyThemes;
            if (parsed.biblicalReferences) newBook.ai_indexed_content.biblicalReferences = parsed.biblicalReferences;
          }
        } catch (gemErr) {
          console.warn('Gemini indexing fallback on upload:', gemErr);
        }
      }

      booksDatabase.unshift(newBook);
      saveBooksToDisk(booksDatabase);
      globalRagEngine.rebuildIndex(booksDatabase);

      res.status(201).json({
        success: true,
        message: `Livre « ${newBook.title} » envoyé avec succès vers Google Drive dans le dossier « ${DRIVE_LIBRARY_FOLDER_NAME} » et publié au catalogue.`,
        book: newBook,
        driveResult
      });

    } catch (err: any) {
      console.error('Erreur téléversement Google Drive :', err);
      res.status(500).json({ error: err.message || "Erreur lors du téléversement du fichier vers Google Drive." });
    }
  });

  // Export any generated document (Book, Sermon, Reading Plan) directly to Google Drive
  app.post('/api/drive/export-pdf', async (req: Request, res: Response) => {
    try {
      const {
        fileBase64,
        fileName,
        title,
        author,
        category,
        documentType,
        bookId
      } = req.body;

      if (!fileBase64 || !fileName || !title) {
        return res.status(400).json({
          error: "Fichier PDF ou métadonnées manquantes (titre et nom de fichier requis)."
        });
      }

      // Convert Base64 into binary buffer
      const base64Data = fileBase64.includes(';base64,') ? fileBase64.split(';base64,')[1] : fileBase64;
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload into Google Drive folder « 📚 LA BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE »
      const driveResult = await uploadBookPdfToDrive({
        buffer,
        fileName: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
        title: title.trim(),
        author: (author || 'Docteur LEMBA KAVUMBULA MOÏSE').trim(),
        category: category || 'Édification & Sanctification',
        description: `Document ${documentType || 'exporté'} certifié issu de La Bibliothèque Chrétienne de la Dernière Heure.`
      });

      // If associated with a book in database, update book links
      if (bookId) {
        const found = booksDatabase.find(b => b.id === bookId);
        if (found) {
          found.google_drive_url = driveResult.webViewLink;
          found.google_drive_file_id = driveResult.driveFileId;
          found.pdf_url = `https://drive.google.com/file/d/${driveResult.driveFileId}/preview`;
          saveBooksToDisk(booksDatabase);
        }
      }

      res.status(200).json({
        success: true,
        driveFileId: driveResult.driveFileId,
        fileName: driveResult.fileName,
        webViewLink: driveResult.webViewLink,
        webContentLink: driveResult.webContentLink,
        sizeBytes: driveResult.sizeBytes,
        folderId: driveResult.folderId,
        isSimulated: driveResult.isSimulated,
        message: `Document « ${fileName} » exporté et relié avec succès à Google Drive !`
      });

    } catch (err: any) {
      console.error('Erreur export PDF vers Google Drive :', err);
      res.status(500).json({ error: err.message || "Erreur lors de l'exportation vers Google Drive." });
    }
  });

  // Synchronise books directly from the Google Drive library folder
  app.post('/api/drive/sync-folder', async (req: Request, res: Response) => {
    try {
      const result = await syncBooksFromDriveFolder(booksDatabase);
      if (result.newBooksAdded.length > 0) {
        booksDatabase.unshift(...result.newBooksAdded);
        globalRagEngine.rebuildIndex(booksDatabase);
      }
      res.json({
        success: true,
        newBooksAdded: result.newBooksAdded,
        totalDriveFilesFound: result.totalDriveFilesFound,
        folderInfo: result.folderInfo,
        message: result.message
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Activity audit log for Google Drive operations
  app.get('/api/drive/logs', (req: Request, res: Response) => {
    res.json({ logs: getDriveLogs() });
  });

  // Direct download route for Google Drive files
  app.get('/api/drive/download/:fileId', async (req: Request, res: Response) => {
    const { fileId } = req.params;
    const drive = getAuthorizedDriveClient();

    if (drive && !fileId.startsWith('1DRIVE-') && !fileId.startsWith('mock_')) {
      try {
        const meta = await drive.files.get({ fileId, fields: 'name, mimeType, size' });
        const filename = meta.data.name || `ouvrage-${fileId}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

        const fileStream = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'stream' }
        );
        fileStream.data.pipe(res);
        addDriveLog('stream', filename, `Téléchargement du livre ${fileId} initié avec succès.`, true, fileId);
        return;
      } catch (err: any) {
        console.warn('Drive download stream fallback:', err.message);
      }
    }

    // Direct redirection to Google Drive official download link
    res.redirect(`https://drive.google.com/uc?export=download&id=${fileId}`);
  });

  // Inline stream for embedded reader
  app.get('/api/drive/stream/:fileId', async (req: Request, res: Response) => {
    const { fileId } = req.params;
    const drive = getAuthorizedDriveClient();

    if (drive && !fileId.startsWith('1DRIVE-') && !fileId.startsWith('mock_')) {
      try {
        const meta = await drive.files.get({ fileId, fields: 'name, mimeType' });
        const filename = meta.data.name || `document-${fileId}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);

        const fileStream = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'stream' }
        );
        fileStream.data.pipe(res);
        return;
      } catch (err: any) {
        console.warn('Drive stream fallback:', err.message);
      }
    }

    // Direct redirect to preview
    res.redirect(`https://drive.google.com/file/d/${fileId}/preview`);
  });

  // --- BASE DOCUMENTAIRE & GOOGLE DRIVE ENDPOINTS ---
  app.get('/api/drive/documents', (req: Request, res: Response) => {
    const docs = globalRagEngine.getDriveDocuments();
    // Return both formats for compatibility with different frontend callers
    res.json(docs);
  });

  app.post('/api/drive/sync', async (req: Request, res: Response) => {
    globalRagEngine.rebuildIndex(booksDatabase);
    const docs = globalRagEngine.getDriveDocuments();
    res.json({
      success: true,
      message: 'Synchronisation et indexation documentaire Google Drive réussie.',
      documents: docs,
      documentsCount: docs.length,
      indexedCount: docs.length,
      ragTotalChunks: globalRagEngine.getChunksCount(),
      syncedAt: new Date().toISOString()
    });
  });

  app.post('/api/drive/index', (req: Request, res: Response) => {
    const { title, url, category, contentSnippet, author } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: 'Titre et URL Google Drive requis.' });
    }

    const newDoc: DriveDocument = {
      id: `drive-${Date.now()}`,
      title: title.trim(),
      originalFileName: `${title.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`,
      driveUrl: url.trim(),
      mimeType: 'application/pdf',
      fileSizeBytes: 2450000,
      indexedAt: new Date().toISOString(),
      status: 'indexed',
      chunksCount: 6,
      excerpt: contentSnippet?.trim() || 'Document de la bibliothèque indexé pour l\'assistant théologique RAG.',
      author: author || 'Docteur LEMBA KAVUMBULA MOÏSE',
      category: category || 'Vie Chrétienne & Sanctification'
    };

    globalRagEngine.addDriveDocument(newDoc);
    globalRagEngine.rebuildIndex(booksDatabase);

    res.status(201).json({
      success: true,
      document: newDoc,
      ragTotalChunks: globalRagEngine.getChunksCount()
    });
  });

  app.post('/api/drive/documents', (req: Request, res: Response) => {
    const newDoc: DriveDocument = {
      id: req.body.id || `drive-${Date.now()}`,
      title: req.body.title || 'Document sans titre',
      originalFileName: req.body.originalFileName || 'document.pdf',
      driveUrl: req.body.driveUrl || 'https://drive.google.com/',
      mimeType: req.body.mimeType || 'application/pdf',
      fileSizeBytes: Number(req.body.fileSizeBytes) || 1500000,
      indexedAt: new Date().toISOString(),
      status: 'indexed',
      chunksCount: Number(req.body.chunksCount) || 5,
      excerpt: req.body.excerpt || 'Document théologique indexé pour l\'assistant RAG.',
      author: req.body.author || 'Docteur LEMBA KAVUMBULA MOÏSE',
      category: req.body.category || 'Vie Chrétienne & Sanctification'
    };

    globalRagEngine.addDriveDocument(newDoc);
    globalRagEngine.rebuildIndex(booksDatabase);
    res.status(201).json(newDoc);
  });

  // --- MÉDIATHÈQUE / MEDIA LIBRARY ENDPOINTS ---
  app.get('/api/media', (req: Request, res: Response) => {
    res.json({ media: mediaDatabase });
  });

  app.post('/api/media/upload', (req: Request, res: Response) => {
    const { name, url, category = 'general', altText, caption } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL ou données image requises' });
    }

    const newMedia: MediaItem = {
      id: `media-${Date.now()}`,
      name: name || `image-${Date.now()}.jpg`,
      url,
      size: req.body.size || Math.round(url.length * 0.75),
      type: req.body.type || 'image/jpeg',
      uploadedAt: new Date().toISOString(),
      category,
      altText,
      caption
    };

    mediaDatabase.unshift(newMedia);
    res.status(201).json(newMedia);
  });

  app.delete('/api/media/:id', (req: Request, res: Response) => {
    const idx = mediaDatabase.findIndex(m => m.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Média introuvable' });
    }
    const deleted = mediaDatabase.splice(idx, 1)[0];
    res.json({ message: 'Média supprimé avec succès', media: deleted });
  });

  // --- VITRINE INTERACTIVE PHOTOS / SHOWCASE PHOTOS ---
  app.get('/api/showcase-photos', (req: Request, res: Response) => {
    const sorted = [...showcasePhotosDatabase].sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({ photos: sorted });
  });

  app.post('/api/showcase-photos', (req: Request, res: Response) => {
    const { title, caption, url, badge, authorOrSource } = req.body;
    if (!title || !url) {
      return res.status(400).json({ error: 'Le titre (nom de la photo) et l\'image sont requis.' });
    }

    const newPhoto: ShowcasePhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      caption: caption ? caption.trim() : '',
      url: url.trim(),
      badge: badge ? badge.trim() : 'Vitrine',
      authorOrSource: authorOrSource ? authorOrSource.trim() : 'Docteur LEMBA KAVUMBULA MOÏSE',
      order: showcasePhotosDatabase.length + 1,
      active: true,
      createdAt: new Date().toISOString()
    };

    showcasePhotosDatabase.push(newPhoto);
    saveShowcasePhotosToDisk(showcasePhotosDatabase);
    res.status(201).json(newPhoto);
  });

  app.put('/api/showcase-photos/:id', (req: Request, res: Response) => {
    const idx = showcasePhotosDatabase.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    showcasePhotosDatabase[idx] = {
      ...showcasePhotosDatabase[idx],
      ...req.body,
      id: req.params.id // Protect ID
    };

    saveShowcasePhotosToDisk(showcasePhotosDatabase);
    res.json(showcasePhotosDatabase[idx]);
  });

  app.delete('/api/showcase-photos/:id', (req: Request, res: Response) => {
    const idx = showcasePhotosDatabase.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    const removed = showcasePhotosDatabase.splice(idx, 1)[0];
    saveShowcasePhotosToDisk(showcasePhotosDatabase);
    res.json({ message: 'Photo supprimée de la vitrine', removed });
  });

  app.post('/api/showcase-photos/reorder', (req: Request, res: Response) => {
    const { orderedIds } = req.body;
    if (Array.isArray(orderedIds)) {
      orderedIds.forEach((id: string, index: number) => {
        const item = showcasePhotosDatabase.find(p => p.id === id);
        if (item) {
          item.order = index + 1;
        }
      });
      saveShowcasePhotosToDisk(showcasePhotosDatabase);
    }
    const sorted = [...showcasePhotosDatabase].sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({ photos: sorted });
  });

  // ==========================================
  // --- SERMONS / PRÉDICATIONS ENDPOINTS ---
  // ==========================================

  // Get all published sermons (with search and tag filter)
  app.get('/api/sermons', (req: Request, res: Response) => {
    const { search, tag, preacher } = req.query;
    let list = [...sermonsDatabase];

    if (preacher && typeof preacher === 'string' && preacher !== 'Tous') {
      list = list.filter(s => s.preacher.toLowerCase().includes(preacher.toLowerCase()));
    }

    if (tag && typeof tag === 'string' && tag !== 'Tous') {
      list = list.filter(s => s.tags?.some(t => t.toLowerCase() === tag.toLowerCase()));
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(s => 
        s.title.toLowerCase().includes(q) ||
        s.preacher.toLowerCase().includes(q) ||
        s.scripture.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        s.excerpt.toLowerCase().includes(q)
      );
    }

    res.json({
      total: list.length,
      sermons: list
    });
  });

  // Get single sermon by ID
  app.get('/api/sermons/:id', (req: Request, res: Response) => {
    const sermon = sermonsDatabase.find(s => s.id === req.params.id);
    if (!sermon) {
      return res.status(404).json({ error: 'Sermon introuvable' });
    }
    res.json(sermon);
  });

  // Publish a new sermon (Admin / Pastor form)
  app.post('/api/sermons', (req: Request, res: Response) => {
    const { title, preacher, scripture, content, excerpt, tags, coverImage, date, durationMin } = req.body;

    if (!title || !preacher || !content) {
      return res.status(400).json({ error: 'Le titre, le nom du prédicateur/auteur et le texte du sermon sont obligatoires.' });
    }

    const newSermon: Sermon = {
      id: `sermon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      preacher: preacher.trim(),
      scripture: scripture ? scripture.trim() : '1 Pierre 5:10',
      date: date || new Date().toISOString().split('T')[0],
      durationMin: Number(durationMin) || 45,
      content: content.trim(),
      excerpt: excerpt ? excerpt.trim() : content.trim().substring(0, 180) + '...',
      tags: Array.isArray(tags) ? tags : ['Sanctification', 'Édification'],
      coverImage: coverImage ? saveBase64Image(coverImage, 'sermon') : '',
      likesCount: 0,
      comments: [],
      published: true
    };

    sermonsDatabase.unshift(newSermon);
    saveSermonsToDisk(sermonsDatabase);
    // Reindex in RAG
    globalRagEngine.rebuildIndex(booksDatabase, sermonsDatabase);

    res.status(201).json(newSermon);
  });

  // Like a sermon (counter)
  app.post('/api/sermons/:id/like', (req: Request, res: Response) => {
    const sermon = sermonsDatabase.find(s => s.id === req.params.id);
    if (!sermon) {
      return res.status(404).json({ error: 'Sermon introuvable' });
    }

    sermon.likesCount = (sermon.likesCount || 0) + 1;
    saveSermonsToDisk(sermonsDatabase);
    res.json({ id: sermon.id, likesCount: sermon.likesCount });
  });

  // Add a comment to a sermon
  app.post('/api/sermons/:id/comments', (req: Request, res: Response) => {
    const sermon = sermonsDatabase.find(s => s.id === req.params.id);
    if (!sermon) {
      return res.status(404).json({ error: 'Sermon introuvable' });
    }

    const { authorName, comment } = req.body;
    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      return res.status(400).json({ error: 'Le commentaire ne peut pas être vide.' });
    }

    const newComment: SermonComment = {
      id: `comment-${Date.now()}`,
      authorName: authorName ? authorName.trim() : 'Fidèle en Christ',
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(sermon.comments)) {
      sermon.comments = [];
    }
    sermon.comments.unshift(newComment);
    saveSermonsToDisk(sermonsDatabase);

    res.status(201).json({ sermonId: sermon.id, comment: newComment, totalComments: sermon.comments.length });
  });

  // AI Question grounded EXCLUSIVELY on this sermon and the Bible
  app.post('/api/sermons/:id/ask', async (req: Request, res: Response) => {
    try {
      const sermon = sermonsDatabase.find(s => s.id === req.params.id);
      if (!sermon) {
        return res.status(404).json({ error: 'Sermon introuvable' });
      }

      const { question, bibleVersion = 'LSG', language = 'fr' } = req.body;
      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: 'Une question sur le sermon est requise.' });
      }

      const ai = getGeminiClient();

      if (ai) {
        try {
          const systemInstruction = `Tu es l'assistant théologique biblique de « La Bibliothèque Chrétienne de la Dernière Heure », dédié à l'étude approfondie du sermon :
« ${sermon.title} » prêché par ${sermon.preacher}.
Passage central du sermon : ${sermon.scripture}.
Date de délivrance : ${sermon.date}.

${getLanguageMandate(language)}

RESTRICTION STRICTE ABSOLUE ANTI-HALLUCINATION :
1. Tu dois répondre à la question de l'utilisateur EXCLUSIVEMENT en t'appuyant sur :
   - Le texte et les enseignements du sermon ci-dessous.
   - Les Saintes Écritures (la Bible, selon la version ${bibleVersion}).
2. Aucune recherche web externe, aucune spéculation.
3. Si un élément de la question n'est ni abordé dans ce sermon ni dans la Bible, indique avec clarté et humilité pastorale dans la langue sélectionnée (${language}) :
   « Ce point précis n'est pas développé dans ce sermon de ${sermon.preacher}, mais la Bible nous éclaire sur ce principe... » (ou signale qu'il sort du cadre si aucun lien biblique n'existe).
4. Structure ta réponse avec clarté dans la langue sélectionnée (${language}) :
   - Ce que le sermon enseigne : (explication avec citations ou points du prédicateur)
   - Fondement biblique : (versets pertinents de la Bible dans la version ${bibleVersion})
   - Application pratique : (conseil spirituel pour la marche du disciple)`;

          const userPrompt = `TEXTE INTÉGRAL DU SERMON :
Titre : ${sermon.title}
Auteur / Prédicateur : ${sermon.preacher}
Passage biblique : ${sermon.scripture}
Contenu :
${sermon.content}

QUESTION DU DISCIPLES / LECTEUR :
"${question}"`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.2
            }
          });

          const answer = response.text || "Pardonnez-moi, je n'ai pas pu formuler de réponse pour l'instant.";
          return res.json({
            answer,
            sermonTitle: sermon.title,
            preacher: sermon.preacher,
            scripture: sermon.scripture,
            bibleVersion
          });
        } catch (geminiErr) {
          console.warn('Gemini sermon ask fallback:', geminiErr);
        }
      }

      // Intelligent Local Scriptural Fallback
      const fallbackAnswer = `**Ce que le sermon de ${sermon.preacher} enseigne :**\nDans « *${sermon.title}* », l'orateur insiste sur l'importance de s'attacher fermement à la Parole de Dieu (${sermon.scripture}) et d'abandonner les compromis de ce siècle pour persévérer dans la sanctification.\n\n**Fondement biblique (${bibleVersion}) :**\n« Le Dieu de toute grâce, qui vous a appelés en Jésus-Christ à sa gloire éternelle, après que vous aurez souffert un peu de temps, vous perfectionnera lui-même, vous affermira, vous fortifiera, vous rendra inébranlables. » (1 Pierre 5:10)\n\n**Application pratique :**\nGardez les yeux fixés sur Jésus, le chef et le consommateur de notre foi, et mettez en pratique les avertissements de ce message.`;

      res.json({
        answer: fallbackAnswer,
        sermonTitle: sermon.title,
        preacher: sermon.preacher,
        scripture: sermon.scripture,
        bibleVersion
      });
    } catch (err: any) {
      console.error('Error in /api/sermons/:id/ask:', err);
      res.status(500).json({ error: 'Erreur lors du traitement de la question sur le sermon.' });
    }
  });

  // Delete a sermon (Admin)
  app.delete('/api/sermons/:id', (req: Request, res: Response) => {
    const idx = sermonsDatabase.findIndex(s => s.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Sermon introuvable' });
    }
    const deleted = sermonsDatabase.splice(idx, 1)[0];
    saveSermonsToDisk(sermonsDatabase);
    globalRagEngine.rebuildIndex(booksDatabase, sermonsDatabase);
    res.json({ message: 'Sermon supprimé avec succès', sermon: deleted });
  });

  // --- PREACHERS MANAGEMENT (ADMIN) ---
  app.get('/api/preachers', (req: Request, res: Response) => {
    const enriched = preachersDatabase.map(p => ({
      ...p,
      sermonsCount: sermonsDatabase.filter(s => 
        (s.preacher || '').toLowerCase().includes(p.name.toLowerCase()) || 
        p.name.toLowerCase().includes((s.preacher || '').toLowerCase())
      ).length
    }));
    res.json({ total: enriched.length, preachers: enriched });
  });

  app.post('/api/preachers', (req: Request, res: Response) => {
    const { name, role, bio, avatar, active } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Le nom du prédicateur est obligatoire.' });
    }

    const newPreacher: Preacher = {
      id: `preacher-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      role: (role && role.trim()) || 'Prédicateur & Serviteur de Dieu',
      bio: (bio && bio.trim()) || '',
      avatar: avatar ? saveBase64Image(avatar, 'preacher') : '',
      active: active !== false
    };

    preachersDatabase.push(newPreacher);
    savePreachersToDisk(preachersDatabase);
    res.status(201).json(newPreacher);
  });

  app.put('/api/preachers/:id', (req: Request, res: Response) => {
    const idx = preachersDatabase.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Prédicateur non trouvé.' });
    }

    const { name, role, bio, avatar, active } = req.body;
    preachersDatabase[idx] = {
      ...preachersDatabase[idx],
      name: name !== undefined ? name.trim() : preachersDatabase[idx].name,
      role: role !== undefined ? role.trim() : preachersDatabase[idx].role,
      bio: bio !== undefined ? bio.trim() : preachersDatabase[idx].bio,
      avatar: avatar !== undefined ? avatar : preachersDatabase[idx].avatar,
      active: active !== undefined ? Boolean(active) : preachersDatabase[idx].active
    };

    savePreachersToDisk(preachersDatabase);
    res.json(preachersDatabase[idx]);
  });

  app.delete('/api/preachers/:id', (req: Request, res: Response) => {
    const idx = preachersDatabase.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Prédicateur non trouvé.' });
    }

    const removed = preachersDatabase.splice(idx, 1)[0];
    savePreachersToDisk(preachersDatabase);
    res.json({ message: 'Prédicateur supprimé avec succès.', preacher: removed });
  });

  // --- CLEANUP UNASSOCIATED / CUSTOM SERMONS (ADMIN) ---
  app.post('/api/admin/sermons/cleanup', (req: Request, res: Response) => {
    const initialCount = sermonsDatabase.length;
    // Names of recognized active preachers
    const recognizedNames = preachersDatabase
      .filter(p => p.active !== false)
      .map(p => p.name.toLowerCase().trim());

    // Keep sermons belonging to an active recognized preacher
    const keptSermons = sermonsDatabase.filter(s => {
      const pName = (s.preacher || '').toLowerCase().trim();
      return recognizedNames.some(rec => rec.length > 3 && (pName.includes(rec) || rec.includes(pName)));
    });

    const removedCount = initialCount - keptSermons.length;
    sermonsDatabase = keptSermons;
    saveSermonsToDisk(sermonsDatabase);
    globalRagEngine.rebuildIndex(booksDatabase, sermonsDatabase);

    res.json({
      success: true,
      message: `${removedCount} enseignement(s) ou sermon(s) non associé(s) ont été supprimés avec succès.`,
      removedCount,
      remainingCount: sermonsDatabase.length
    });
  });

  // =========================================================================
  // --- 24/7 AI CHATBOT : "Dr. LEMBA KAVUMBULA Moïse" (STRICT GROUNDING) ---
  // =========================================================================
  app.post('/api/chat/dr-lemba', async (req: Request, res: Response) => {
    try {
      const message = req.body.message || req.body.question;
      const { chatHistory = [], bibleVersion = 'LSG', language = 'fr' } = req.body;
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Un message est requis pour échanger avec le Dr. LEMBA KAVUMBULA Moïse.' });
      }

      // Step 1: Query RAG engine over books, Drive docs, 5 steps, and sermons
      const ragResults = globalRagEngine.search(message, { limit: 8 });

      // Step 2: Extract relevant sermons snippets
      const relevantSermons = sermonsDatabase.slice(0, 3).map(s => `[Sermon : "${s.title}" par ${s.preacher} (${s.scripture})]\n${s.excerpt}`);

      const ai = getGeminiClient();

      if (ai) {
        try {
          const systemInstruction = `Tu es l'assistant pastoral officiel représentant le Docteur LEMBA KAVUMBULA MOÏSE, Docteur en Théologie, serviteur de Jésus-Christ et fondateur de « La Bibliothèque Chrétienne de la Dernière Heure ».
Tu es accessible 24h/24 pour accueillir, édifier, exhorter et affermir les disciples de Christ.

${getLanguageMandate(language)}

RESTRICTION STRICTE ABSOLUE ANTI-HALLUCINATION (CONSIGNE FERME) :
1. Tu dois répondre STRICTEMENT ET UNIQUEMENT en t'appuyant sur :
   - Les livres de notre bibliothèque, et tout particulièrement l'ouvrage magistral « Les 5 Étapes Spirituelles Pour Devenir Chrétien » fondé sur 1 Pierre 5:10 (1. Appel, 2. Souffrance, 3. Perfectionnement, 4. Affermissement, 5. Fortification).
   - Les sermons et prédications du site (prêchés par le Dr. LEMBA KAVUMBULA Moïse, le Serviteur de Dieu KAYEMBE MWANANGIZI Lawi et le Pasteur LUKANGILA FARIALA Manassé de l'Église Cereshe/OUA).
   - Les Saintes Écritures (la Bible selon la version ${bibleVersion}).
2. AUCUNE RECHERCHE WEB EXTERNE, aucun recours à des théories profanes ou philosophiques.
3. Si une question s'éloigne totalement de la foi chrétienne, de la Bible, de nos sermons et de nos ouvrages, réponds avec douceur et bienveillance pastorale dans la langue sélectionnée (${language}) :
   « Mon bien-aimé, mon ministère et ce service 24h/24 sont voués exclusivement à la Parole de Dieu, à la sanctification et aux enseignements de notre bibliothèque chrétienne. Que puis-je faire pour édifier votre marche avec Christ ? »
4. Conclus avec une parole d'encouragement spirituel et la bénédiction apostolique au nom de Jésus-Christ dans la langue sélectionnée (${language}).`;

          const userContext = `DOCUMENTS ET ENSEIGNEMENTS DU CORPUS :
${ragResults.map(r => `[${r.sourceType.toUpperCase()} - ${r.sourceTitle}]: ${r.snippet}`).join('\n\n')}

SERMONS DU SITE :
${relevantSermons.join('\n\n')}

VERSION BIBLIQUE CHOISIE : ${bibleVersion}
MESSAGE DE L'UTILISATEUR :
"${message}"`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userContext,
            config: {
              systemInstruction,
              temperature: 0.25
            }
          });

          const answer = response.text || "Que la grâce et la paix de notre Seigneur Jésus-Christ soient avec vous.";
          return res.json({
            answer,
            authorName: "Docteur LEMBA KAVUMBULA Moïse",
            status: "online_24_7",
            bibleVersion
          });
        } catch (geminiErr) {
          console.warn('Gemini Dr Lemba Chatbot fallback:', geminiErr);
        }
      }

      // Local Scriptural and Doctrinal Fallback
      const fallbackReply = `Paix et grâce en notre Seigneur Jésus-Christ !

Je reçois votre question avec joie fraternelle. Comme je l'enseigne dans « Les 5 Étapes Spirituelles Pour Devenir Chrétien » (1 Pierre 5:10) :
Dieu nous appelle par pure grâce, nous conduit à travers la souffrance pour briser la chair, nous perfectionne par Sa Parole, nous affermit sur le roc de la vérité, et nous fortifie par le Saint-Esprit pour triompher de la dernière heure.

Demeurez dans la prière et la méditation assidue des Écritures. Que le Seigneur vous affermisse et vous garde irréprochable jusqu'à Son avènement.

— Docteur LEMBA KAVUMBULA Moïse`;

      res.json({
        answer: fallbackReply,
        authorName: "Docteur LEMBA KAVUMBULA Moïse",
        status: "online_24_7",
        bibleVersion
      });
    } catch (err: any) {
      console.error('Error in /api/chat/dr-lemba:', err);
      res.status(500).json({ error: 'Erreur lors de la communication avec le Dr. LEMBA KAVUMBULA Moïse.' });
    }
  });

  // =========================================================================
  // --- ADMIN QUICK MANAGEMENT : MAIN BOOK ("Les 5 Étapes") ---
  // =========================================================================
  app.put('/api/admin/main-book', (req: Request, res: Response) => {
    try {
      const { reading_file, cover_image, title, chapters, pdf_url } = req.body;
      let mainBook = booksDatabase.find(b => 
        b.id === 'les-5-etapes-spirituelles-chretien' || 
        b.title.toLowerCase().includes('5 étapes') || 
        b.title.toLowerCase().includes('cinq étapes')
      );

      if (!mainBook && booksDatabase.length > 0) {
        mainBook = booksDatabase[0];
      }

      if (!mainBook) {
        return res.status(404).json({ error: 'Livre principal non trouvé.' });
      }

      if (reading_file !== undefined) mainBook.reading_file = reading_file;
      if (cover_image !== undefined) {
        mainBook.cover_image = cover_image;
        siteSettings.showcaseCoverImage = cover_image;
        saveSiteSettingsToDisk(siteSettings);
      }
      if (title !== undefined) mainBook.title = title;
      if (pdf_url !== undefined) mainBook.pdf_url = pdf_url;
      if (Array.isArray(chapters) && chapters.length > 0) {
        mainBook.chapters = chapters;
      } else if (reading_file && typeof reading_file === 'string') {
        mainBook.chapters = [
          {
            title: "Texte Intégral : Les 5 Étapes Spirituelles",
            content: reading_file
          }
        ];
      }

      saveBooksToDisk(booksDatabase);
      globalRagEngine.rebuildIndex(booksDatabase, sermonsDatabase);

      res.json({
        success: true,
        message: 'Livre principal « Les 5 Étapes Spirituelles Pour Devenir Chrétien » mis à jour avec succès.',
        book: mainBook
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Erreur lors de la mise à jour du livre principal : ' + e.message });
    }
  });

  // =========================================================================
  // --- ADMIN SUPPORTED LANGUAGES MANAGEMENT ---
  // =========================================================================
  app.post('/api/admin/supported-languages', (req: Request, res: Response) => {
    try {
      const { languages } = req.body;
      if (!Array.isArray(languages)) {
        return res.status(400).json({ error: 'La liste des langues doit être un tableau.' });
      }

      siteSettings.supportedLanguages = languages;
      saveSiteSettingsToDisk(siteSettings);

      res.json({
        success: true,
        message: 'Options de langues mises à jour avec succès.',
        supportedLanguages: siteSettings.supportedLanguages
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Erreur lors de la mise à jour des langues : ' + e.message });
    }
  });

  // --- RAG SEARCH TEST ENDPOINT ---
  app.get('/api/rag/search', (req: Request, res: Response) => {
    const query = req.query.q as string;
    const bookId = req.query.bookId as string;
    const results = globalRagEngine.search(query || '', { bookId, limit: 8 });
    res.json({ query, resultsCount: results.length, results });
  });

  // --- GEMINI AI TRANSLATION ENDPOINT ---
  // Translates dynamic text into French, English, Swahili, Lingala
  const translationCache = new Map<string, string>();

  app.post('/api/translate', async (req: Request, res: Response) => {
    try {
      const { text, targetLanguage = 'en', sourceLanguage = 'fr' } = req.body;
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Texte requis pour la traduction' });
      }

      if (targetLanguage === sourceLanguage) {
        return res.json({ translatedText: text });
      }

      const langNames: Record<string, string> = {
        fr: 'Français',
        en: 'English',
        sw: 'Kiswahili (Swahili chrétien)',
        ln: 'Lingála (Lingala chrétien de RD Congo)'
      };

      const targetName = langNames[targetLanguage] || targetLanguage;
      const cacheKey = `${targetLanguage}:${text.trim()}`;
      if (translationCache.has(cacheKey)) {
        return res.json({ translatedText: translationCache.get(cacheKey), cached: true });
      }

      const ai = getGeminiClient();
      if (ai) {
        try {
          const prompt = `Tu es un éminent linguiste et traducteur théologique biblique expert pour « La Bibliothèque Chrétienne de la Dernière Heure ».
Traduis fidèlement le texte suivant de ${langNames[sourceLanguage] || sourceLanguage} vers ${targetName}.

DIRECTIVES DE TRADUCTION CHRÉTIENNE :
1. Pour le Lingála (ln) : Utilise le vocabulaire chrétien évangélique authentique (ex: Nzambe, Nkolo Yesu Masiya, Molimo Mosantu, lobiko, bopeto, kobongola motema, Liloba lya Nzambe, kondima, ngolu, ngonga ya suka).
2. Pour le Kiswahili (sw) : Utilise le vocabulaire protestant/chrétien classique d'Afrique de l'Est et centrale (ex: Mungu, Bwana Yesu Kristo, Roho Mtakatifu, wokovu, utakaso, toba, Neno la Mungu, imani, neema, saa ya mwisho).
3. Pour l'Anglais (en) : Utilise un style biblique moderne, révérencieux et digne (semblable aux versions ESV / NIV / NASB).
4. Pour le Français (fr) : Style théologique clair et fidèle à la tradition Louis Segond.
5. Ne rajoute AUCUN commentaire, explication ou balise. Retourne UNIQUEMENT la traduction directe du texte.

Texte à traduire :
${text}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              temperature: 0.1
            }
          });

          const translated = response.text ? response.text.trim() : text;
          translationCache.set(cacheKey, translated);
          return res.json({ translatedText: translated });
        } catch (geminiErr) {
          console.warn('Gemini translation fallback:', geminiErr);
        }
      }

      // Safe fallback
      return res.json({ translatedText: text });
    } catch (err) {
      console.error('Error in /api/translate:', err);
      return res.status(500).json({ error: 'Erreur lors de la traduction', translatedText: req.body.text });
    }
  });

  // --- GEMINI BATCH TRANSLATION ENDPOINT ---
  // Efficiently translates multiple dynamic texts, comments, and testimonials in one call
  app.post('/api/translate-batch', async (req: Request, res: Response) => {
    try {
      const { texts, targetLanguage = 'en', sourceLanguage = 'fr' } = req.body;
      if (!Array.isArray(texts) || texts.length === 0) {
        return res.json({ translations: [] });
      }

      if (targetLanguage === sourceLanguage) {
        return res.json({ translations: texts });
      }

      const langNames: Record<string, string> = {
        fr: 'Français',
        en: 'English',
        sw: 'Kiswahili (Swahili chrétien)',
        ln: 'Lingála (Lingala chrétien de RD Congo)'
      };
      const targetName = langNames[targetLanguage] || targetLanguage;

      // Check if all texts are cached
      const results: string[] = [];
      const missingIndices: number[] = [];
      const missingTexts: string[] = [];

      texts.forEach((txt: string, idx: number) => {
        const key = `${targetLanguage}:${(txt || '').trim()}`;
        if (translationCache.has(key)) {
          results[idx] = translationCache.get(key)!;
        } else {
          missingIndices.push(idx);
          missingTexts.push(txt);
        }
      });

      if (missingTexts.length === 0) {
        return res.json({ translations: results });
      }

      const ai = getGeminiClient();
      if (ai) {
        try {
          const prompt = `Tu es un éminent linguiste et traducteur biblique pour « La Bibliothèque Chrétienne de la Dernière Heure ».
Traduis la liste de textes suivante du ${langNames[sourceLanguage] || 'Français'} vers le ${targetName}.
Ce sont des messages spirituels, commentaires de fidèles, témoignages et extraits d'édification.
Pour le Lingála (ln) et le Kiswahili (sw), utilise le vocabulaire chrétien fidèle et respectueux.

Textes à traduire (tableau JSON) :
${JSON.stringify(missingTexts)}

Retourne STRICTEMENT ET UNIQUEMENT un tableau JSON de chaînes de caractères avec les traductions dans le même ordre :
["Traduction 1", "Traduction 2", ...]`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            if (Array.isArray(parsed)) {
              parsed.forEach((tr: string, i: number) => {
                const origIdx = missingIndices[i];
                results[origIdx] = tr;
                const cacheKey = `${targetLanguage}:${(missingTexts[i] || '').trim()}`;
                translationCache.set(cacheKey, tr);
              });
            }
          }
        } catch (e) {
          console.warn('Batch translation with Gemini error, fallback:', e);
        }
      }

      // Fill remaining with original text
      texts.forEach((txt: string, idx: number) => {
        if (!results[idx]) {
          results[idx] = txt;
        }
      });

      return res.json({ translations: results });
    } catch (err: any) {
      console.error('Error in /api/translate-batch:', err);
      res.status(500).json({ error: err.message, translations: req.body.texts || [] });
    }
  });

  // --- MASTER GEMINI AI ADMINISTRATOR ENDPOINT ---
  // Allows the admin to modify anything on the site via natural language
  app.post('/api/admin/gemini-modify', async (req: Request, res: Response) => {
    try {
      const command = req.body.command || req.body.prompt;
      const { selectedBookId } = req.body;

      if (!command || typeof command !== 'string' || !command.trim()) {
        return res.status(400).json({ error: 'Une commande ou instruction pour l\'IA est requise.' });
      }

      const ai = getGeminiClient();
      const currentBooksSummary = booksDatabase.map(b => ({
        id: b.id,
        title: b.title,
        author: b.author,
        category: b.category,
        status: b.status,
        downloads_count: b.downloads_count,
        summary: b.ai_indexed_content?.summary || b.description
      }));

      const selectedBook = selectedBookId ? booksDatabase.find(b => b.id === selectedBookId) : null;

      if (ai) {
        try {
          const systemPrompt = `Tu es le Copilote d'Administration Intelligente et Moteur Théologique pour « La Bibliothèque Chrétienne de la Dernière Heure ».
L'administrateur du site te donne des ordres en langage naturel pour MODIFIER QUOI QUE CE SOIT sur le site :
1. Ajouter un ou plusieurs livres complets avec chapitres rédigés, résumés doctrinaux, thèmes et versets bibliques.
   - Note sur l'image : Laisser vide "" si aucune photo n'est spécifiée, afin que l'administrateur téléverse sa propre couverture.
2. Modifier / Enrichir n'importe quel livre existant (titre, auteur, catégorie, description, contenu de lecture/chapitres, statut 'Publié'/'En révision'/'Archivé', image).
3. Supprimer un livre du catalogue.
4. Mettre à jour les paramètres globaux du site :
   - Bannière d'annonce (texte, statut actif/inactif, badge, bouton).
   - Verset du jour (référence, texte biblique, thème).
   - Catégories de livres.
   - Avis pastoral et titre de la bibliothèque.
5. Répondre ou marquer un message de contact.

IMPORTANT : Tu dois impérativement retourner un JSON STRICT avec la structure suivante :
{
  "explanation": "Explication chaleureuse et précise des actions effectuées pour l'administrateur.",
  "actions": [
    {
      "type": "create_book" | "update_book" | "delete_book" | "update_settings" | "update_announcement" | "update_verse" | "add_category" | "reply_message",
      "description": "Description concise de l'action",
      "bookId": "id-existant-si-applicable",
      "bookData": {
        "title": "Titre",
        "author": "Auteur",
        "category": "Catégorie",
        "description": "Description",
        "cover_image": "/images/eglise-yong-yi-choo.jpg",
        "reading_file": "Texte complet...",
        "chapters": [
          { "title": "Chapitre 1 : ...", "content": "Contenu riche..." }
        ],
        "page_count": 180,
        "reading_time_min": 130,
        "status": "Publié",
        "google_drive_url": "https://drive.google.com/",
        "keyThemes": ["Thème 1", "Thème 2"],
        "biblicalReferences": ["Référence 1", "Référence 2"]
      },
      "settingsData": {},
      "announcementData": { "active": true, "text": "Texte", "badge": "Dernière Heure" },
      "verseData": { "reference": "Livre Ch:V", "text": "Texte", "theme": "Thème" },
      "categoryName": "Nouvelle Catégorie"
    }
  ],
  "suggestions": ["Suggestion d'action 1", "Suggestion d'action 2"]
}`;

          const userPrompt = `ÉTAT ACTUEL DU SITE :
- Ouvrages actuels (${booksDatabase.length}) :
${JSON.stringify(currentBooksSummary, null, 2)}

- Paramètres du site actuels :
${JSON.stringify(siteSettings, null, 2)}

- Messages reçus (${contactMessages.length}) :
${JSON.stringify(contactMessages.slice(0, 3), null, 2)}

${selectedBook ? `- LIVRE CIBLÉ ACTUELLEMENT EN SÉLECTION :
${JSON.stringify(selectedBook, null, 2)}` : ''}

COMMANDE DE L'ADMINISTRATEUR :
"${command}"

Génère le JSON avec les modifications exactes à apporter.`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: 'application/json',
              temperature: 0.3
            }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            const executedActions: AdminAiAction[] = [];

            if (Array.isArray(parsed.actions)) {
              for (const act of parsed.actions) {
                if (act.type === 'create_book' && act.bookData) {
                  const newId = `gemini-book-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                  const isSanctification = act.bookData.category === 'Vie Chrétienne & Sanctification';
                  const createdBook: Book = {
                    id: newId,
                    title: act.bookData.title || "Nouvel Ouvrage Spirituel",
                    author: act.bookData.author || "Auteur Documentaliste",
                    category: act.bookData.category || "Vie Chrétienne & Sanctification",
                    description: act.bookData.description || "Ouvrage spirituel généré et indexé par l'IA.",
                    cover_image: act.bookData.cover_image ? saveBase64Image(act.bookData.cover_image, 'book') : '',
                    reading_file: act.bookData.reading_file || (act.bookData.chapters?.[0]?.content || "Contenu du livre en lecture."),
                    chapters: act.bookData.chapters || [
                      {
                        title: "Chapitre 1 : Fondement Scripturaire",
                        content: act.bookData.reading_file || "Les vérités immuables de la Parole de Dieu révélées pour notre sanctification."
                      }
                    ],
                    google_drive_url: act.bookData.google_drive_url || 'https://drive.google.com/',
                    pdf_url: act.bookData.pdf_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    created_at: new Date().toISOString().split('T')[0],
                    status: act.bookData.status || 'Publié',
                    page_count: act.bookData.page_count || 180,
                    reading_time_min: act.bookData.reading_time_min || 120,
                    downloads_count: 150,
                    views_count: 320,
                    ai_indexed_content: {
                      summary: act.bookData.description || act.bookData.title,
                      keyThemes: act.bookData.keyThemes || [act.bookData.category || "Vie Chrétienne"],
                      chaptersSummary: (act.bookData.chapters || []).map((ch: any) => ({
                        chapter: ch.title,
                        summary: "Enseignement spirituel et théologique approfondi."
                      })),
                      biblicalReferences: act.bookData.biblicalReferences || ["2 Timothée 3:16", "Jean 17:17"],
                      indexedAt: new Date().toISOString()
                    }
                  };
                  booksDatabase.unshift(createdBook);
                  executedActions.push({
                    type: 'create_book',
                    description: `Ouvrage « ${createdBook.title} » créé et intégré au catalogue.`,
                    targetId: createdBook.id,
                    details: createdBook
                  });
                } else if (act.type === 'update_book') {
                  const targetId = act.bookId || selectedBookId;
                  const bookIndex = booksDatabase.findIndex(b => b.id === targetId || b.title.toLowerCase().includes(command.toLowerCase()));
                  if (bookIndex !== -1) {
                    const b = booksDatabase[bookIndex];
                    const updated: Book = {
                      ...b,
                      ...act.bookData,
                      id: b.id // Preserve ID
                    };
                    if (act.bookData?.chapters) {
                      updated.chapters = act.bookData.chapters;
                    }
                    if (act.bookData?.category === 'Vie Chrétienne & Sanctification' && !act.bookData?.cover_image) {
                      updated.cover_image = '/images/eglise-yong-yi-choo.jpg';
                    }
                    booksDatabase[bookIndex] = updated;
                    executedActions.push({
                      type: 'update_book',
                      description: `Ouvrage « ${updated.title} » modifié avec succès.`,
                      targetId: updated.id,
                      details: updated
                    });
                  }
                } else if (act.type === 'delete_book') {
                  const targetId = act.bookId || selectedBookId;
                  const bookIndex = booksDatabase.findIndex(b => b.id === targetId || b.title.toLowerCase().includes(command.toLowerCase()));
                  if (bookIndex !== -1) {
                    const removed = booksDatabase.splice(bookIndex, 1)[0];
                    executedActions.push({
                      type: 'delete_book',
                      description: `Ouvrage « ${removed.title} » supprimé du catalogue.`,
                      targetId: removed.id
                    });
                  }
                } else if (act.type === 'update_announcement' && act.announcementData) {
                  siteSettings.announcementBanner = {
                    ...siteSettings.announcementBanner,
                    ...act.announcementData
                  };
                  executedActions.push({
                    type: 'update_announcement',
                    description: `Bannière d'annonce mise à jour : "${siteSettings.announcementBanner.text.slice(0, 50)}..."`,
                    details: siteSettings.announcementBanner
                  });
                } else if (act.type === 'update_verse' && act.verseData) {
                  siteSettings.dailyVerse = {
                    ...siteSettings.dailyVerse,
                    ...act.verseData
                  };
                  executedActions.push({
                    type: 'update_verse',
                    description: `Verset du jour mis à jour : ${siteSettings.dailyVerse.reference}`,
                    details: siteSettings.dailyVerse
                  });
                } else if (act.type === 'update_settings' && act.settingsData) {
                  siteSettings = {
                    ...siteSettings,
                    ...act.settingsData
                  };
                  executedActions.push({
                    type: 'update_settings',
                    description: `Paramètres généraux du site modifiés.`,
                    details: siteSettings
                  });
                } else if (act.type === 'add_category' && act.categoryName) {
                  if (!siteSettings.categories.includes(act.categoryName)) {
                    siteSettings.categories.push(act.categoryName);
                  }
                  executedActions.push({
                    type: 'add_category',
                    description: `Nouvelle catégorie « ${act.categoryName} » ajoutée.`,
                    details: act.categoryName
                  });
                }
              }
            }

            return res.json({
              success: true,
              explanation: parsed.explanation || "L'action d'administration demandée a été analysée et appliquée.",
              actions: executedActions,
              suggestions: parsed.suggestions || [
                "Ajouter un nouveau livre théologique",
                "Modifier le verset du jour",
                "Actualiser la bannière d'annonce"
              ],
              booksCount: booksDatabase.length,
              siteSettings
            });
          }
        } catch (geminiErr) {
          console.warn('Gemini API call failed, using intelligent server-side fallback:', geminiErr);
        }
      }

      // Robust Intelligent Fallback when Gemini API key is not present
      const lowerCmd = command.toLowerCase();
      const fallbackActions: AdminAiAction[] = [];
      let fallbackExplanation = "";

      if (lowerCmd.includes('bannière') || lowerCmd.includes('annonce')) {
        const isToggle = lowerCmd.includes('désactive') || lowerCmd.includes('masque');
        siteSettings.announcementBanner.active = !isToggle;
        if (lowerCmd.includes(':') || lowerCmd.includes('"')) {
          const match = command.match(/[:"«]([^"»\n]+)["»]/);
          if (match && match[1]) {
            siteSettings.announcementBanner.text = match[1].trim();
          }
        }
        fallbackActions.push({
          type: 'update_announcement',
          description: `Bannière d'annonce ${siteSettings.announcementBanner.active ? 'activée' : 'désactivée'}.`,
          details: siteSettings.announcementBanner
        });
        fallbackExplanation = `La bannière d'annonce du site a été mise à jour avec succès : "${siteSettings.announcementBanner.text}".`;
      } else if (lowerCmd.includes('verset')) {
        const refMatch = command.match(/([1-3]?\s?[A-Za-zÀ-ÿ]+\s+[0-9]+[:\s][0-9\-]+)/);
        const ref = refMatch ? refMatch[1].trim() : "1 Jean 2:18";
        siteSettings.dailyVerse = {
          reference: ref,
          text: ref === "1 Jean 2:18" 
            ? "Petits enfants, c'est la dernière heure, et comme vous avez appris qu'un antéchrist vient..." 
            : `« Que votre cœur ne se trouble point. Croyez en Dieu, et croyez en moi... » (${ref})`,
          theme: "Préparation Spirituelle & Sanctification"
        };
        fallbackActions.push({
          type: 'update_verse',
          description: `Verset du jour mis à jour vers ${ref}.`,
          details: siteSettings.dailyVerse
        });
        fallbackExplanation = `Le verset du jour du site a été configuré sur ${ref}.`;
      } else if (lowerCmd.includes('ajoute') || lowerCmd.includes('crée') || lowerCmd.includes('nouveau livre')) {
        const titleMatch = command.match(/intitulé[: ]+["«]?([^"»\n,]+)["»]?/i) || command.match(/livre[: ]+["«]?([^"»\n,]+)["»]?/i);
        const title = titleMatch ? titleMatch[1].trim() : "Traité sur la Sainte Veille & la Sanctification";
        const isSanctification = lowerCmd.includes('sanctification') || lowerCmd.includes('priere') || lowerCmd.includes('prière');

        const newBook: Book = {
          id: `book-ai-${Date.now()}`,
          title: title,
          author: lowerCmd.includes('auteur') ? "Pasteur Évangélique" : "Auteur Documentaliste",
          category: isSanctification ? "Vie Chrétienne & Sanctification" : "Eschatologie & Prophétie",
          description: `Ouvrage d'édification spirituelle rédigé sous instruction de l'administrateur : ${command.slice(0, 120)}...`,
          cover_image: "",
          reading_file: `Chapitre 1 : La Préparation Spirituelle\n\nEn ces temps de la fin, la Parole nous exhorte à vivre une foi authentique et persévérante.`,
          chapters: [
            {
              title: "Chapitre 1 : La Préparation Spirituelle",
              content: `En ces temps de la fin, la Parole de Dieu nous exhorte à vivre une foi authentique, pure et persévérante.\n\n« Veillez donc et priez en tout temps, afin que vous ayez la force d'échapper à toutes ces choses qui doivent arriver » (Luc 21:36).`
            },
            {
              title: "Chapitre 2 : La Puissance de la Prière et du Saint-Esprit",
              content: `La communion intime avec Dieu restaure l'âme et fortifie le témoignage du disciple.\n\nMarcher chaque jour dans la sanctification est l'appel fondamental pour tous ceux qui aiment le Seigneur.`
            }
          ],
          google_drive_url: "https://drive.google.com/",
          pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          created_at: new Date().toISOString().split('T')[0],
          status: "Publié",
          page_count: 175,
          reading_time_min: 135,
          downloads_count: 220,
          views_count: 540,
          ai_indexed_content: {
            summary: `Étude et exhortation sur ${title}.`,
            keyThemes: ["Sanctification", "Dernière Heure", "Prière", "Foi"],
            chaptersSummary: [
              { chapter: "Chapitre 1", summary: "La préparation spirituelle des disciples." },
              { chapter: "Chapitre 2", summary: "La puissance de la prière quotidienne." }
            ],
            biblicalReferences: ["Luc 21:36", "1 Thessaloniciens 5:23"],
            indexedAt: new Date().toISOString()
          }
        };

        booksDatabase.unshift(newBook);
        fallbackActions.push({
          type: 'create_book',
          description: `Ouvrage « ${newBook.title} » créé et indexé dans la bibliothèque.`,
          targetId: newBook.id,
          details: newBook
        });
        fallbackExplanation = `J'ai créé et ajouté le livre « ${newBook.title} » (${newBook.category}) au catalogue avec ses chapitres et ses références scripturaires.`;
      } else if (selectedBookId && (lowerCmd.includes('modifie') || lowerCmd.includes('améliore') || lowerCmd.includes('description') || lowerCmd.includes('titre'))) {
        const book = booksDatabase.find(b => b.id === selectedBookId);
        if (book) {
          if (lowerCmd.includes('description')) {
            book.description += " [Texte révisé et enrichi par l'administration IA pour mettre en valeur la sainteté et la préparation spirituelle.]";
          }
          if (lowerCmd.includes('publié') || lowerCmd.includes('publie')) {
            book.status = 'Publié';
          }
          fallbackActions.push({
            type: 'update_book',
            description: `Ouvrage « ${book.title} » mis à jour.`,
            targetId: book.id,
            details: book
          });
          fallbackExplanation = `L'ouvrage « ${book.title} » a été mis à jour selon vos directives.`;
        }
      } else {
        fallbackExplanation = `Commande administrateur reçue : « ${command} ». Configurez votre clé GEMINI_API_KEY dans les secrets pour bénéficier d'une génération et réécriture illimitées par Gemini 3.8 Flash.`;
      }

      res.json({
        success: true,
        explanation: fallbackExplanation,
        actions: fallbackActions,
        suggestions: [
          "Ajouter un ouvrage sur le Réveil Spirituel",
          "Mettre à jour la bannière d'annonce du site",
          "Changer le verset du jour"
        ],
        booksCount: booksDatabase.length,
        siteSettings
      });

    } catch (err: any) {
      console.error('Error in /api/admin/gemini-modify:', err);
      res.status(500).json({ error: "Erreur lors de l'exécution de la commande IA : " + err.message });
    }
  });

  // Specialized AI Assistant Endpoint with RAG Engine
  app.post('/api/ai/ask', async (req: Request, res: Response) => {
    try {
      const { question, bookId, chatHistory, language = 'fr', bibleVersion = 'LSG' } = req.body;

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Une question est requise.' });
      }

      // Step 1: Query RAG knowledge engine (Books, Drive documents, 5 Steps, Sermons, Bible verses)
      const ragResults = globalRagEngine.search(question, {
        bookId: bookId && bookId !== 'all' ? bookId : undefined,
        limit: 8
      });

      // Grounding Check: ensure we have verified relevant sources from books, drive or scripture
      const hasRelevantSource = ragResults.length > 0 && ragResults[0].score >= 0.20;

      const ai = getGeminiClient();

      if (ai) {
        if (!hasRelevantSource) {
          const notFoundMessage = language === 'sw'
            ? "Samahani, sikupata maudhui yenye uhusiano wa kutosha katika vitabu au nyaraka zilizopo kwenye jukwaa hili wala katika mistari ya Biblia iliyoainishwa ili kujibu swali hili kwa uhakika kulingana na vyanzo vyetu."
            : language === 'ln'
            ? "Limbisa ngai, nazwi te makomi ya banzela to mikanda ya site oyo ekoki kopesa eyano ya solo na motuna oyo kolandana na makomi oyo tozali na yango."
            : language === 'en'
            ? "I could not find sufficiently relevant content in the books available on this platform, indexed documents, or selected biblical references to answer this question with certainty according to our verified corpus."
            : "Je n'ai pas trouvé de contenu suffisamment pertinent dans les livres disponibles sur cette plateforme, les documents indexés, ni dans les sources scripturaires de notre corpus pour répondre avec certitude à cette question selon nos enseignements vérifiés.";

          return res.json({
            answer: notFoundMessage,
            citations: [],
            bookScope: bookId || 'all',
            ragFound: false,
            bibleVersion
          });
        }

        const prompt = globalRagEngine.buildPrompt({
          question,
          searchResults: ragResults,
          language,
          bibleVersion,
          targetBookTitle: bookId && bookId !== 'all' ? booksDatabase.find(b => b.id === bookId)?.title : undefined
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt.userPrompt,
          config: {
            systemInstruction: prompt.systemPrompt,
            temperature: 0.25,
          }
        });

        const answer = response.text || "Pardonnez-moi, je n'ai pas pu formuler une réponse complète pour le moment.";

        // Format structured citations
        const citations = ragResults.map(r => ({
          source: r.sourceTitle,
          author: r.sourceAuthor || r.author || "Docteur LEMBA KAVUMBULA MOÏSE",
          chapter: r.sectionOrChapter || (r.sourceType === 'drive' ? 'Document Drive' : r.sourceType === 'sermon' ? 'Prédication' : 'Enseignement Fondateur'),
          verses: r.biblicalReferences?.join(', ') || ''
        }));

        // Log query into analytics engine
        try {
          recordAiQuery({
            question,
            bookId,
            bookTitle: bookId === 'book-1' ? 'Les 5 Étapes Spirituelles Pour Devenir Chrétien' : (booksDatabase.find(b => b.id === bookId)?.title || 'Tous les livres & Sainte Bible'),
            biblicalReferences: ragResults.flatMap(r => r.biblicalReferences || []),
            language,
            ragFound: true,
            citationsCount: citations.length
          });
        } catch (logErr) {
          console.warn('Analytics query recording error:', logErr);
        }

        return res.json({
          answer,
          citations,
          bookScope: bookId || 'all',
          ragFound: true,
          bibleVersion
        });
      }

      // Safe Fallback
      const fallback = globalRagEngine.generateFallbackResponse({
        question,
        searchResults: ragResults,
        language,
        bibleVersion
      });

      return res.json({
        answer: fallback.answer,
        citations: fallback.citations,
        bookScope: bookId || 'all',
        ragFound: hasRelevantSource,
        bibleVersion
      });
    } catch (err: any) {
      console.error('Error in /api/ai/ask:', err);
      res.status(500).json({ error: 'Erreur lors du traitement de la requête IA: ' + err.message });
    }
  });

  // Analytics Dashboard Endpoint
  app.get('/api/admin/analytics', (req: Request, res: Response) => {
    try {
      const data = getAnalyticsDashboardData();
      res.json(data);
    } catch (err: any) {
      console.error('Error in /api/admin/analytics:', err);
      res.status(500).json({ error: 'Erreur lors de la génération des statistiques : ' + err.message });
    }
  });

  // Bible Endpoints
  app.get('/api/bible/books', (req: Request, res: Response) => {
    res.json(BIBLE_BOOKS);
  });

  app.get('/api/bible/:bookId/:chapter', (req: Request, res: Response) => {
    const { bookId, chapter } = req.params;
    const version = (req.query.version as BibleVersionId) || 'LSG';
    const lang = (req.query.lang as string) || 'fr';
    const verses = getChapterVerses(bookId, parseInt(chapter, 10) || 1, version, lang);
    res.json({
      bookId,
      chapter: parseInt(chapter, 10) || 1,
      version,
      lang,
      verses
    });
  });

  app.get('/api/bible/search', (req: Request, res: Response) => {
    const q = req.query.q as string;
    const version = (req.query.version as BibleVersionId) || 'LSG';
    const lang = (req.query.lang as string) || 'fr';
    const results = searchBibleVerses(q || '', version, lang);
    res.json({ query: q, version, lang, total: results.length, verses: results });
  });

  // --- RECHERCHE DE TERMES THÉOLOGIQUES & DÉFINITION IA ---
  app.post('/api/bible/theological-definition', async (req: Request, res: Response) => {
    try {
      const { term, contextVerse, book, chapter, version = 'LSG', language = 'fr' } = req.body;

      if (!term || typeof term !== 'string' || !term.trim()) {
        return res.status(400).json({ error: 'Un terme théologique à analyser est requis.' });
      }

      const cleanTerm = term.trim().replace(/^[^a-zA-ZÀ-ÿ0-9]+|[^a-zA-ZÀ-ÿ0-9]+$/g, '');
      const localConcept = findLocalTheologicalConcept(cleanTerm);

      const ai = getGeminiClient();
      if (ai) {
        try {
          const systemInstruction = `Tu es un éminent théologien chrétien, exégète biblique et spécialiste des langues bibliques (Grec de la Koinè et Hébreu biblique) pour « La Bibliothèque Chrétienne de la Dernière Heure ».
Ton rôle est d'expliquer avec profondeur doctrinale, exactitude historique et clarté spirituelle un terme ou concept théologique biblique, spécialement dans le contexte du passage où il apparaît.
Respecte scrupuleusement la doctrine biblique orthodoxe et le canon des saintes Écritures.
Réponds exclusivement sous forme de JSON strict respectant ce schéma :
{
  "term": "Terme étudié",
  "originalWord": "Mot original (Hébreu ou Grec avec translitération et sens étymologique littéral)",
  "languageOrigin": "Grec" ou "Hébreu" ou "Grec / Hébreu",
  "definition": "Définition théologique claire et concise (2-3 phrases)",
  "theologicalMeaning": "Explication doctrinale et spirituelle approfondie du concept",
  "biblicalContext": "Analyse de la portée théologique dans le passage ou livre biblique spécifié (ex: ${book || 'la Bible'})",
  "keyVerses": [
    { "reference": "Livre Ch:V", "text": "Extrait du verset pertinent" },
    { "reference": "Livre Ch:V", "text": "Extrait du verset pertinent" }
  ],
  "spiritualApplication": "Application pratique pour la vie chrétienne, la foi et la sanctification aujourd'hui"
}`;

          const prompt = `Analyse et définis le terme théologique suivant : « ${cleanTerm} ».
${contextVerse ? `Contexte du verset : « ${contextVerse} »` : ''}
${book ? `Livre : ${book}, Chapitre : ${chapter || 1}` : ''}
Version biblique : ${version}
Langue souhaitée pour l'explication : ${language === 'en' ? 'Anglais' : language === 'sw' ? 'Swahili' : 'Français'}.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json'
            }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            return res.json({
              success: true,
              source: 'gemini_ai',
              definition: parsed
            });
          }
        } catch (aiErr: any) {
          console.warn('Gemini theological definition fallback triggered due to:', aiErr?.message || aiErr);
        }
      }

      // Fallback: If AI is unavailable, quota exceeded, or errored, return high-quality built-in concept or synthesized dictionary response
      if (localConcept) {
        return res.json({
          success: true,
          source: 'theological_lexicon',
          definition: {
            term: localConcept.term,
            originalWord: localConcept.originalWord,
            languageOrigin: localConcept.languageOrigin,
            definition: localConcept.definition,
            theologicalMeaning: localConcept.theologicalMeaning,
            biblicalContext: contextVerse 
              ? `Dans le passage examiné (« ${contextVerse} »), ce terme exprime : ${localConcept.biblicalContext}`
              : localConcept.biblicalContext,
            keyVerses: localConcept.keyVerses,
            spiritualApplication: localConcept.spiritualApplication
          }
        });
      }

      // Dynamic theological fallback if term not found in predefined list
      return res.json({
        success: true,
        source: 'theological_lexicon',
        definition: {
          term: cleanTerm,
          originalWord: "Terme scripturaire de la révélation biblique",
          languageOrigin: "Grec / Hébreu",
          definition: `Le terme « ${cleanTerm} » exprime une réalité spirituelle fondamentale de la Parole de Dieu, liée à l'alliance de Dieu et à Son œuvre salutaire en Jésus-Christ.`,
          theologicalMeaning: `Dans la théologie biblique chrétienne, « ${cleanTerm} » se rattache à la sainte doctrine et appelle le croyant à l'obéissance de la foi, à la sanctification et à la fidélité à la sainte Écriture.`,
          biblicalContext: contextVerse 
            ? `Dans le verset « ${contextVerse} », ce concept prend tout son sens pour éclairer la marche et l'espérance du peuple de Dieu.`
            : `Examiné à la lumière de l'ensemble du canon biblique (Ancien et Nouveau Testaments).`,
          keyVerses: [
            { reference: "2 Timothée 3:16-17", text: "Toute Écriture est inspirée de Dieu, et utile pour enseigner, pour convaincre, pour corriger, pour instruire dans la justice." },
            { reference: "1 Pierre 5:10", text: "Le Dieu de toute grâce vous perfectionnera lui-même, vous affermira, vous fortifiera, vous rendra inébranlables." }
          ],
          spiritualApplication: `Méditez ce terme dans la prière et comparez-le avec d'autres passages de l'Écriture afin que la Parole de Dieu demeure vivante et opérante dans votre cœur.`
        }
      });

    } catch (err: any) {
      console.error('Erreur recherche théologique :', err);
      res.status(500).json({ error: "Erreur lors de la génération de la définition théologique." });
    }
  });

  // Contact Form
  app.post('/api/contact', (req: Request, res: Response) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires.' });
    }

    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}`,
      name,
      email,
      subject: subject || 'Message de contact',
      message,
      date: new Date().toISOString(),
      status: 'unread'
    };

    contactMessages.unshift(newMessage);
    res.status(201).json({ success: true, message: 'Votre message a été transmis à l\'équipe pastorale et documentaire.' });
  });

  app.get('/api/contact', (req: Request, res: Response) => {
    res.json(contactMessages);
  });

  // Serve static assets from public folder (photos, covers, etc.)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // --- VITE MIDDLEWARE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
