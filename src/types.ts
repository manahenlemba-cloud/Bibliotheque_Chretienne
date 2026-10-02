export type Language = 'fr' | 'en' | 'sw' | 'ln' | string;

export type BibleVersionId = 
  | 'LSG'       // Louis Segond 1910
  | 'MARTIN'    // Bible Martin 1744
  | 'DARBY'     // John Nelson Darby
  | 'OSTERVALD' // Jean-Frédéric Ostervald 1996
  | 'BFC'       // Français Courant
  | 'BDS'       // Bible du Semeur
  | 'KJV'       // King James Version
  | 'AMP'       // Amplified Bible
  | 'SW-ZAN'    // Kiswahili
  | 'SW-KEN'    // Kiswahili Union
  | 'LN-BIB'    // Lingala
  | 'RVR';      // Reina-Valera 1960

export interface BibleVersionInfo {
  id: BibleVersionId;
  code: string;
  name: string;
  language: string;
  fullName: string;
  badge: string;
  description: string;
}

export interface BookChapter {
  title: string;
  content: string;
  excerpt?: string;
}

export interface AiIndexedContent {
  summary: string;
  keyThemes: string[];
  chaptersSummary: {
    chapter: string;
    summary: string;
    excerpt?: string;
  }[];
  biblicalReferences: string[];
  indexedAt: string;
}

export interface BookDownloadLink {
  id: string;
  label: string;
  url: string;
  format?: 'drive' | 'pdf' | 'epub' | 'audio' | 'mirror' | 'other';
  note?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  cover_image: string;
  reading_file: string; // Plain text or JSON structure
  chapters?: BookChapter[];
  google_drive_url: string;
  google_drive_file_id?: string;
  google_drive_folder_id?: string;
  file_size_bytes?: number;
  keywords?: string[];
  pdf_url?: string;
  download_links?: BookDownloadLink[];
  created_at: string;
  status: 'Publié' | 'En révision' | 'Archivé';
  ai_indexed_content: AiIndexedContent;
  page_count?: number;
  reading_time_min?: number;
  featured?: boolean;
  downloads_count?: number;
  views_count?: number;
}

export interface BibleBookInfo {
  id: string;
  name: string;
  frenchName: string;
  testament: 'Ancien Testament' | 'Nouveau Testament';
  chaptersCount: number;
  category: string;
}

export interface BibleVerse {
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  version?: BibleVersionId;
}

export interface Citation {
  source: string;
  author?: string;
  chapter?: string;
  verses?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: string;
  bookScope?: string;
  ragFound?: boolean;
  bibleVersion?: BibleVersionId;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'unread' | 'read';
}

export interface ShowcasePhoto {
  id: string;
  title: string;
  caption?: string;
  url: string;
  badge?: string;
  authorOrSource?: string;
  order: number;
  active: boolean;
  createdAt: string;
}

export interface CustomLanguage {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
  active: boolean;
  bibleVersionId: BibleVersionId;
}

export interface SiteSettings {
  siteName: string;
  siteSubtitle: string;
  siteNotice: string;
  libraryTitle: string;
  heroTitle?: string;
  heroDescription?: string;
  heroBadge?: string;
  authorName?: string;
  authorTitle?: string;
  authorBio?: string;
  authorPhotoUrl?: string;
  showcaseCoverImage?: string;
  heroBackgroundImage?: string;
  logoUrl?: string;
  
  // Leadership & Church Overseeing
  overseerNotice: string;
  seniorPastorName: string;
  seniorPastorPhone: string;
  assistantPastorName: string;
  assistantPastorPhone: string;
  churchName: string;

  announcementBanner: {
    active: boolean;
    text: string;
    linkText?: string;
    badge?: string;
    linkView?: string;
  };
  dailyVerse: {
    reference: string;
    text: string;
    theme: string;
  };
  contactEmail: string;
  contactPhone?: string;
  contactAddress?: string;
  adminContact?: {
    name: string;
    phone: string;
    email: string;
  };
  googleDriveUrl?: string;
  officialSocialLink?: string;
  footerText?: string;
  copyrightNotice?: string;
  categories: string[];
  supportedLanguages?: CustomLanguage[];
  customPages?: Array<{
    id: string;
    name: string;
    route: string;
    iconName: string;
    description: string;
    title: string;
    subtitle: string;
    introText: string;
    mainActionText: string;
    mainActionDriveUrl?: string;
    customNotes?: string;
    allowPublicComments?: boolean;
  }>;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  auth_provider: 'google' | 'visitor';
  avatar?: string;
  token: string;
  created_at: string;
}

export interface QuestionMessage {
  id: string;
  question_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  sender_name: string;
  message: string;
  source?: 'whatsapp' | 'platform' | 'email';
  created_at: string;
}

export interface UserQuestion {
  id: string;
  conversation_id?: string;
  user_id: string;
  user_name: string;
  user_contact: string;
  user_email?: string;
  auth_provider: 'google' | 'visitor';
  subject: string;
  question_category_type?: 'book_question' | 'admin_direct';
  book_id?: string;
  book_title?: string;
  book_chapter?: string;
  status: 'pending' | 'answered';
  created_at: string;
  answered_at?: string;
  email_notified?: boolean;
  admin_email_notified?: string;
  admin_email_sent_at?: string;
  whatsapp_notified?: boolean;
  whatsapp_direct_link?: string;
  whatsapp_message_id?: string;
  last_source?: 'whatsapp' | 'platform' | 'email';
  messages: QuestionMessage[];
}

export interface WhatsAppConfig {
  admin_phone: string;
  provider: 'meta' | 'twilio' | 'none';
  phone_number_id?: string;
  access_token?: string;
  verify_token?: string;
  business_account_id?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_from_phone?: string;
  webhook_url?: string;
  last_tested_at?: string;
  last_test_status?: 'success' | 'error' | 'untested';
  last_test_message?: string;
}

export interface AdminAiAction {
  type: 'create_book' | 'update_book' | 'delete_book' | 'update_settings' | 'update_announcement' | 'update_verse' | 'add_category' | 'reply_message';
  description: string;
  targetId?: string;
  details?: any;
}

export interface SpiritualStepData {
  id: string;
  stepNumber: number;
  code: 'APPEL' | 'SOUFFRANCE' | 'PERFECTIONNEMENT' | 'AFFERMISSEMENT' | 'FORTIFICATION';
  name: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  primaryScripture?: string;
  summary?: string;
  fullExplanation?: string;
  practicalPrayer?: string;
  keyThemes?: string[];
  biblicalReferences?: string[];
  biblicalVerses: {
    reference: string;
    textByVersion?: Partial<Record<BibleVersionId, string>>;
    text: string;
    commentary: string;
  }[];
  teachings: {
    title: string;
    content: string;
  }[];
  associatedBooks: {
    id: string;
    title: string;
    author: string;
    relevance: string;
  }[];
  complementaryContent: {
    meditation: string;
    pastoralExhortation: string;
    stepPrayer: string;
  };
  displayOrder: number;
  isActive: boolean;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  altText?: string;
  caption?: string;
  category?: 'cover' | 'step' | 'banner' | 'author' | 'general';
}

export interface DriveDocument {
  id: string;
  title: string;
  originalFileName: string;
  driveUrl: string;
  url?: string;
  mimeType: string;
  fileSizeBytes: number;
  indexedAt: string;
  status: 'indexed' | 'pending' | 'error';
  chunksCount: number;
  excerpt: string;
  contentSnippet?: string;
  author?: string;
  category?: string;
}

export interface RagSearchResult {
  chunkId: string;
  sourceType: 'book' | 'drive' | 'bible' | 'step' | 'sermon';
  sourceTitle: string;
  sourceAuthor?: string;
  author?: string;
  sectionOrChapter?: string;
  chapterOrSection?: string;
  verses?: string;
  snippet: string;
  text?: string;
  biblicalReferences?: string[];
  score: number;
}

// --- SERMONS DATA TYPES ---
export interface Preacher {
  id: string;
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  active: boolean;
  sermonsCount?: number;
}

export interface BookPublicationAnalysis {
  summary: string;
  keyThemes: string[];
  chaptersSummary: Array<{ chapter: string; summary: string }>;
  targetAudience?: string;
  doctrinalFocus?: string;
  keyVerses?: string[];
  spiritualTakeaways?: string[];
}

export interface SermonComment {
  id: string;
  authorName: string;
  authorEmail?: string;
  comment: string;
  createdAt: string;
}

export interface Sermon {
  id: string;
  title: string;
  preacher: string;
  scripture: string;
  date: string;
  durationMin?: number;
  content: string;
  excerpt: string;
  likesCount: number;
  comments: SermonComment[];
  audioUrl?: string;
  videoUrl?: string;
  coverImage?: string;
  tags: string[];
  published: boolean;
}

// --- BIBLE READING PLAN TYPES ---
export interface ReadingPlanPassage {
  category: 'Ancien Testament' | 'Psaumes & Proverbes' | 'Nouveau Testament';
  reference: string;
  preview?: string;
}

export interface ReadingPlanDay {
  dayNumber: number;
  title: string;
  theme: string;
  passages: ReadingPlanPassage[];
  devotionalThought?: string;
  memoryVerse?: {
    reference: string;
    text: string;
  };
}
