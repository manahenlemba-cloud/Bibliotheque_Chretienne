import React, { useState, useEffect, Suspense } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Plus, 
  Edit3, 
  Trash2, 
  Sparkles, 
  DownloadCloud, 
  Upload, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  BookOpen, 
  FileText, 
  RefreshCw,
  Mail,
  ExternalLink,
  Bot,
  Sliders,
  Send,
  Zap,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Phone,
  UserCheck,
  Image,
  Camera,
  Smartphone,
  Users,
  MessageSquare,
  Cloud,
  BarChart3,
  FolderSync,
  FileCheck,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { Book, ContactMessage, SiteSettings } from '../types';
import { clearAllOfflineCache } from '../utils/indexedDb';
import { ManageFlagshipDownloadsModal } from './ManageFlagshipDownloadsModal';
import { AdminPagesManagerTab } from './AdminPagesManagerTab';
import { AdminQuestionsTab } from './AdminQuestionsTab';
import { AdminEmailLogsTab } from './AdminEmailLogsTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminSpiritualStepsTab } from './AdminSpiritualStepsTab';
import { AdminDriveRagTab } from './AdminDriveRagTab';
import { AdminAnalyticsTab } from './AdminAnalyticsTab';
import { AdminShowcasePhotosManager } from './AdminShowcasePhotosManager';
import { compressImageToDataUrl } from '../utils/imageCompressor';

interface AdminViewProps {
  books: Book[];
  onRefreshBooks: () => void;
  siteSettings?: SiteSettings | null;
  onRefreshSettings?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ 
  books, 
  onRefreshBooks, 
  siteSettings, 
  onRefreshSettings 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('bdh_admin_auth') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Default to 'books' so opening Admin does not trigger heavy charts or SVG renders
  const [activeTab, setActiveTab] = useState<'pages' | 'books' | 'settings' | 'photos' | 'questions' | 'email-logs' | 'users' | '5-etapes' | 'drive-rag' | 'analytics' | 'ai-admin' | 'messages'>('pages');
  const [pendingQuestionsCount, setPendingQuestionsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookForEdit, setSelectedBookForEdit] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIndexingId, setIsIndexingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  // Book edit form state
  const [formData, setFormData] = useState<{
    id: string;
    title: string;
    author: string;
    category: string;
    description: string;
    cover_image: string;
    reading_file: string;
    google_drive_url: string;
    pdf_url: string;
    status: string;
    page_count: number;
    reading_time_min: number;
  }>({
    id: '',
    title: '',
    author: 'Docteur LEMBA KAVUMBULA MOÏSE',
    category: 'Vie Chrétienne & Sanctification',
    description: '',
    cover_image: '',
    reading_file: '',
    google_drive_url: 'https://drive.google.com/',
    pdf_url: '',
    status: 'Publié',
    page_count: 150,
    reading_time_min: 120
  });

  // Google Drive Direct PDF Upload & Sync states
  const [pdfFileForUpload, setPdfFileForUpload] = useState<File | null>(null);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isSyncingDriveFolder, setIsSyncingDriveFolder] = useState(false);

  // Safe delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    book: Book | null;
    deleteFromDrive: boolean;
    isDeleting: boolean;
  }>({
    isOpen: false,
    book: null,
    deleteFromDrive: false,
    isDeleting: false
  });

  // Clear entire library modal state
  const [isClearLibraryModalOpen, setIsClearLibraryModalOpen] = useState(false);
  const [isClearingLibrary, setIsClearingLibrary] = useState(false);
  const [isFlagshipDownloadsModalOpen, setIsFlagshipDownloadsModalOpen] = useState(false);

  // Gemini AI modification state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiExecuting, setIsAiExecuting] = useState(false);
  const [aiResult, setAiResult] = useState<{
    reply: string;
    executedActions: Array<{ type: string; description: string; targetId?: string; details?: any }>;
    timestamp: string;
  } | null>(null);

  // Settings form state - gives admin full power to customize everything on the site
  const [settingsForm, setSettingsForm] = useState<{
    siteName: string;
    siteSubtitle: string;
    libraryTitle: string;
    siteNotice: string;
    heroTitle: string;
    heroDescription: string;
    heroBadge: string;
    authorName: string;
    authorTitle: string;
    authorBio: string;
    authorPhotoUrl: string;
    showcaseCoverImage: string;
    heroBackgroundImage: string;
    logoUrl: string;
    announcementActive: boolean;
    announcementBadge: string;
    announcementText: string;
    announcementLinkText: string;
    dailyVerseRef: string;
    dailyVerseText: string;
    dailyVerseTheme: string;
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
    googleDriveUrl: string;
    officialSocialLink: string;
    footerText: string;
    copyrightNotice: string;
  }>({
    siteName: siteSettings?.siteName || "La Bibliothèque Chrétienne de la Dernière Heure",
    siteSubtitle: siteSettings?.siteSubtitle || "Édification, Réveil Spirituel & Sanctification",
    libraryTitle: siteSettings?.libraryTitle || "Collection Complète des Ouvrages de Sanctification",
    siteNotice: siteSettings?.siteNotice || "Base documentaire consacrée à la sainte veille, la sanctification et la préparation au retour du Seigneur Jésus-Christ.",
    heroTitle: siteSettings?.heroTitle || "Bibliothèque Complète de Réveil et de Sanctification",
    heroDescription: siteSettings?.heroDescription || "Ouvrages magistraux et études théologiques bibliques fondés sur 1 Pierre 5:10, centrés sur la préparation de l'Église pour le retour glorieux de notre Seigneur Jésus-Christ.",
    heroBadge: siteSettings?.heroBadge || "Dernière Heure & Sanctification",
    authorName: siteSettings?.authorName || "Docteur LEMBA KAVUMBULA MOÏSE",
    authorTitle: siteSettings?.authorTitle || "Docteur en Théologie, Serviteur de Jésus-Christ",
    authorBio: siteSettings?.authorBio || "Auteur et enseignant de la saine doctrine biblique, le Docteur LEMBA KAVUMBULA MOÏSE consacre son ministère à l'affermissement des disciples de Christ à travers les cinq étapes cardinales : Appel, Souffrance, Perfectionnement, Affermissement et Fortification.",
    authorPhotoUrl: siteSettings?.authorPhotoUrl || "",
    showcaseCoverImage: siteSettings?.showcaseCoverImage || "",
    heroBackgroundImage: siteSettings?.heroBackgroundImage || "",
    logoUrl: siteSettings?.logoUrl || "",
    announcementActive: siteSettings?.announcementBanner?.active ?? true,
    announcementBadge: siteSettings?.announcementBanner?.badge || "Dernière Heure",
    announcementText: siteSettings?.announcementBanner?.text || "Bibliothèque Chrétienne de Réveil et d'Édification Spirituelle — Découvrez le parcours des 5 Étapes Spirituelles selon 1 Pierre 5:10.",
    announcementLinkText: siteSettings?.announcementBanner?.linkText || "Explorer le Parcours",
    dailyVerseRef: siteSettings?.dailyVerse?.reference || "1 Pierre 5:10",
    dailyVerseText: siteSettings?.dailyVerse?.text || "Le Dieu de toute grâce, qui vous a appelés en Jésus-Christ à sa gloire éternelle, après que vous aurez souffert un peu de temps, vous perfectionnera lui-même, vous affermira, vous fortifiera, vous rendra inébranlables.",
    dailyVerseTheme: siteSettings?.dailyVerse?.theme || "La Grâce Souveraine & Le Perfectionnement Divin",
    contactEmail: siteSettings?.contactEmail || "bibliothequechretien@gmail.com",
    contactPhone: siteSettings?.contactPhone || "+243811733778",
    contactAddress: siteSettings?.contactAddress || "Ministère International de Réveil & Édification",
    googleDriveUrl: siteSettings?.googleDriveUrl || "https://drive.google.com/drive/folders/bibliothequechretien",
    officialSocialLink: siteSettings?.officialSocialLink || "",
    footerText: siteSettings?.footerText || "Dédié à la préparation d'une Épouse sans tache ni ride, sanctifiée par la sainte Parole de Dieu pour le glorieux retour de Jésus-Christ.",
    copyrightNotice: siteSettings?.copyrightNotice || "Tous droits réservés. Gloire à Dieu seul."
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Auto-authenticate and route if admin clicked the notification link in their Gmail
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const authParam = params.get('auth');
      const tabParam = params.get('tab');
      if (authParam === 'admin123') {
        setIsAuthenticated(true);
        try { localStorage.setItem('bdh_admin_auth', 'true'); } catch {}
      }
      if (tabParam && ['analytics', 'books', 'ai-admin', 'settings', 'photos', 'messages', 'questions', 'email-logs', 'users', '5-etapes', 'drive-rag'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    } catch (e) {
      console.warn('Error processing admin URL params:', e);
    }
  }, []);

  // Sync settings when prop updates
  useEffect(() => {
    if (siteSettings) {
      setSettingsForm({
        siteName: siteSettings.siteName || "La Bibliothèque Chrétienne de la Dernière Heure",
        siteSubtitle: siteSettings.siteSubtitle || "Édification, Réveil Spirituel & Sanctification",
        libraryTitle: siteSettings.libraryTitle || "Collection Complète des Ouvrages de Sanctification",
        siteNotice: siteSettings.siteNotice || "Base documentaire consacrée à la sainte veille, la sanctification et la préparation au retour du Seigneur Jésus-Christ.",
        heroTitle: siteSettings.heroTitle || "Bibliothèque Complète de Réveil et de Sanctification",
        heroDescription: siteSettings.heroDescription || "Ouvrages magistraux et études théologiques bibliques fondés sur 1 Pierre 5:10, centrés sur la préparation de l'Église pour le retour glorieux de notre Seigneur Jésus-Christ.",
        heroBadge: siteSettings.heroBadge || "Dernière Heure & Sanctification",
        authorName: siteSettings.authorName || "Docteur LEMBA KAVUMBULA MOÏSE",
        authorTitle: siteSettings.authorTitle || "Docteur en Théologie, Serviteur de Jésus-Christ",
        authorBio: siteSettings.authorBio || "Auteur et enseignant de la saine doctrine biblique, le Docteur LEMBA KAVUMBULA MOÏSE consacre son ministère à l'affermissement des disciples de Christ à travers les cinq étapes cardinales : Appel, Souffrance, Perfectionnement, Affermissement et Fortification.",
        authorPhotoUrl: siteSettings.authorPhotoUrl || "",
        showcaseCoverImage: siteSettings.showcaseCoverImage || "",
        heroBackgroundImage: siteSettings.heroBackgroundImage || "",
        logoUrl: siteSettings.logoUrl || "",
        announcementActive: siteSettings.announcementBanner?.active ?? true,
        announcementBadge: siteSettings.announcementBanner?.badge || "Dernière Heure",
        announcementText: siteSettings.announcementBanner?.text || "Bibliothèque Chrétienne de Réveil et d'Édification Spirituelle — Découvrez le parcours des 5 Étapes Spirituelles selon 1 Pierre 5:10.",
        announcementLinkText: siteSettings.announcementBanner?.linkText || "Explorer le Parcours",
        dailyVerseRef: siteSettings.dailyVerse?.reference || "1 Pierre 5:10",
        dailyVerseText: siteSettings.dailyVerse?.text || "Le Dieu de toute grâce, qui vous a appelés en Jésus-Christ à sa gloire éternelle, après que vous aurez souffert un peu de temps, vous perfectionnera lui-même, vous affermira, vous fortifiera, vous rendra inébranlables.",
        dailyVerseTheme: siteSettings.dailyVerse?.theme || "La Grâce Souveraine & Le Perfectionnement Divin",
        contactEmail: siteSettings.contactEmail || "bibliothequechretien@gmail.com",
        contactPhone: siteSettings.contactPhone || "+243811733778",
        contactAddress: siteSettings.contactAddress || "Ministère International de Réveil & Édification",
        googleDriveUrl: siteSettings.googleDriveUrl || "https://drive.google.com/drive/folders/bibliothequechretien",
        officialSocialLink: siteSettings.officialSocialLink || "",
        footerText: siteSettings.footerText || "Dédié à la préparation d'une Épouse sans tache ni ride, sanctifiée par la sainte Parole de Dieu pour le glorieux retour de Jésus-Christ.",
        copyrightNotice: siteSettings.copyrightNotice || "Tous droits réservés. Gloire à Dieu seul."
      });
    }
  }, [siteSettings]);

  // Handle image upload from computer or phone for any site image target
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'showcase' | 'author' | 'heroBg' | 'logo' | 'book') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showNotification('error', "L'image ne doit pas dépasser 15 Mo.");
      return;
    }

    try {
      const base64String = await compressImageToDataUrl(file, 800, 800, 0.88);
      if (target === 'showcase') {
        setSettingsForm(prev => ({ ...prev, showcaseCoverImage: base64String }));
        showNotification('success', 'Photo de vitrine chargée. Cliquez sur « Enregistrer les modifications du site » pour l\'appliquer.');
      } else if (target === 'author') {
        try {
          localStorage.setItem('bdh_author_photo_url', base64String);
        } catch {}
        setSettingsForm(prev => ({ ...prev, authorPhotoUrl: base64String }));
        // Also persist directly to photo endpoint so it is saved immediately
        fetch('/api/admin/site-settings/photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot: 'authorPhotoUrl', image: base64String })
        }).catch(() => {});
        showNotification('success', 'Photo du Docteur LEMBA chargée et enregistrée durablement.');
      } else if (target === 'heroBg') {
        setSettingsForm(prev => ({ ...prev, heroBackgroundImage: base64String }));
        showNotification('success', 'Arrière-plan chargé. Cliquez sur « Enregistrer les modifications du site ».');
      } else if (target === 'logo') {
        setSettingsForm(prev => ({ ...prev, logoUrl: base64String }));
        showNotification('success', 'Logo chargé. Cliquez sur « Enregistrer les modifications du site ».');
      } else {
        setFormData(prev => ({ ...prev, cover_image: base64String }));
        showNotification('success', 'Photo de couverture chargée pour l\'ouvrage.');
      }
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (target === 'author') {
          try {
            localStorage.setItem('bdh_author_photo_url', base64String);
          } catch {}
          setSettingsForm(prev => ({ ...prev, authorPhotoUrl: base64String }));
        } else if (target === 'showcase') {
          setSettingsForm(prev => ({ ...prev, showcaseCoverImage: base64String }));
        } else if (target === 'heroBg') {
          setSettingsForm(prev => ({ ...prev, heroBackgroundImage: base64String }));
        } else if (target === 'logo') {
          setSettingsForm(prev => ({ ...prev, logoUrl: base64String }));
        } else {
          setFormData(prev => ({ ...prev, cover_image: base64String }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchContactMessages();
      fetchPendingQuestionsCount();
      const interval = setInterval(fetchPendingQuestionsCount, 8000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchPendingQuestionsCount = async () => {
    try {
      const res = await fetch('/api/admin/questions', {
        headers: { 'x-admin-passcode': 'admin123' }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingQuestionsCount(data.pending || 0);
      }
    } catch (e) {
      // Ignore
    }
  };

  const fetchContactMessages = async () => {
    try {
      const res = await fetch('/api/contact');
      if (res.ok) {
        const data = await res.json();
        setContactMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = ['admin123', 'derniereheure', 'maranatha'];
    if (valid.includes(passcode.toLowerCase().trim())) {
      setIsAuthenticated(true);
      localStorage.setItem('bdh_admin_auth', 'true');
      setAuthError('');
      fetchContactMessages();
    } else {
      setAuthError('Code d\'accès administrateur erroné. Essayez « admin123 ».');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('bdh_admin_auth');
    setPasscode('');
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // AI Modification via Gemini
  const handleExecuteAiModify = async (promptToRun?: string) => {
    const text = promptToRun || aiPrompt;
    if (!text.trim()) {
      showNotification('error', 'Veuillez saisir une commande pour l\'assistant IA.');
      return;
    }

    setIsAiExecuting(true);
    try {
      const res = await fetch('/api/admin/gemini-modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text.trim(), command: text.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        const replyText = data.explanation || data.reply || 'Modifications analysées et appliquées par Gemini.';
        const actionsList = data.actions || data.executedActions || [];
        setAiResult({
          reply: replyText,
          executedActions: actionsList,
          timestamp: new Date().toLocaleTimeString('fr-FR')
        });
        showNotification('success', `Commande IA exécutée avec succès ! (${actionsList.length} action(s) appliquée(s))`);
        onRefreshBooks();
        if (onRefreshSettings) onRefreshSettings();
        if (!promptToRun) setAiPrompt('');
      } else {
        showNotification('error', data.error || 'Erreur lors du traitement par Gemini.');
      }
    } catch (err) {
      showNotification('error', 'Impossible de contacter l\'API Gemini.');
    } finally {
      setIsAiExecuting(false);
    }
  };

  // Manual save settings - saves all customizable texts, photos, identity, coordinates and verses
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    try {
      const payload: SiteSettings = {
        siteName: settingsForm.siteName.trim() || "La Bibliothèque Chrétienne de la Dernière Heure",
        siteSubtitle: settingsForm.siteSubtitle.trim() || "Édification, Réveil Spirituel & Sanctification",
        libraryTitle: settingsForm.libraryTitle.trim() || "Corpus des Ouvrages de Sanctification",
        siteNotice: settingsForm.siteNotice.trim(),
        heroTitle: settingsForm.heroTitle.trim(),
        heroDescription: settingsForm.heroDescription.trim(),
        heroBadge: settingsForm.heroBadge.trim(),
        authorName: settingsForm.authorName.trim() || "Docteur LEMBA KAVUMBULA MOÏSE",
        authorTitle: settingsForm.authorTitle.trim() || "Docteur en Théologie, Serviteur de Jésus-Christ",
        authorBio: settingsForm.authorBio.trim(),
        authorPhotoUrl: settingsForm.authorPhotoUrl.trim() || siteSettings?.authorPhotoUrl || (typeof window !== 'undefined' ? localStorage.getItem('bdh_author_photo_url') || '' : ''),
        showcaseCoverImage: settingsForm.showcaseCoverImage.trim(),
        heroBackgroundImage: settingsForm.heroBackgroundImage.trim(),
        logoUrl: settingsForm.logoUrl.trim(),
        announcementBanner: {
          active: settingsForm.announcementActive,
          text: settingsForm.announcementText.trim(),
          badge: settingsForm.announcementBadge.trim(),
          linkText: settingsForm.announcementLinkText.trim()
        },
        dailyVerse: {
          reference: settingsForm.dailyVerseRef.trim() || "1 Pierre 5:10",
          text: settingsForm.dailyVerseText.trim(),
          theme: settingsForm.dailyVerseTheme.trim()
        },
        contactEmail: settingsForm.contactEmail.trim() || "bibliothequechretien@gmail.com",
        contactPhone: settingsForm.contactPhone.trim() || "+243811733778",
        contactAddress: settingsForm.contactAddress.trim(),
        googleDriveUrl: settingsForm.googleDriveUrl.trim(),
        officialSocialLink: settingsForm.officialSocialLink.trim(),
        footerText: settingsForm.footerText.trim(),
        copyrightNotice: settingsForm.copyrightNotice.trim(),
        overseerNotice: siteSettings?.overseerNotice || "Toute cette œuvre est chapeautée par le Serviteur de Dieu KAYEMBE MWANANGIZI Lawi ainsi que les anciens de l'église.",
        seniorPastorName: siteSettings?.seniorPastorName || "Le Serviteur de Dieu KAYEMBE MWANANGIZI Lawi",
        seniorPastorPhone: siteSettings?.seniorPastorPhone || "+243 817 974 033",
        assistantPastorName: siteSettings?.assistantPastorName || "Le Pasteur LUKANGILA FARIALA Manassé",
        assistantPastorPhone: siteSettings?.assistantPastorPhone || "+243 823 844 629",
        churchName: siteSettings?.churchName || "Église Cereshe/OUA",
        categories: siteSettings?.categories || [
          "Vie Chrétienne & Sanctification",
          "Prière & Intercession",
          "Foi & Encouragement",
          "Ministère & Réveil",
          "Édification Spirituelle"
        ]
      };

      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showNotification('success', 'Toutes les modifications du site (photos, textes, coordonnées) ont été enregistrées avec succès !');
        if (onRefreshSettings) onRefreshSettings();
      } else {
        showNotification('error', 'Erreur lors de l\'enregistrement des paramètres.');
      }
    } catch (e) {
      showNotification('error', 'Erreur serveur lors de la sauvegarde.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const openAddModal = () => {
    setSelectedBookForEdit(null);
    setPdfFileForUpload(null);
    setFormData({
      id: `book-${Date.now()}`,
      title: '',
      author: 'Docteur LEMBA KAVUMBULA MOÏSE',
      category: 'Vie Chrétienne & Sanctification',
      description: '',
      cover_image: '',
      reading_file: '',
      google_drive_url: 'https://drive.google.com/',
      pdf_url: '',
      status: 'Publié',
      page_count: 150,
      reading_time_min: 120
    });
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setSelectedBookForEdit(book);
    setPdfFileForUpload(null);
    setFormData({
      id: book.id,
      title: book.title,
      author: book.author,
      category: book.category,
      description: book.description,
      cover_image: book.cover_image,
      reading_file: book.chapters?.[0]?.content || book.reading_file || '',
      google_drive_url: book.google_drive_url,
      pdf_url: book.pdf_url || '',
      status: book.status,
      page_count: book.page_count || 150,
      reading_time_min: book.reading_time_min || 120
    });
    setIsModalOpen(true);
  };

  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showNotification('error', 'Veuillez sélectionner un fichier au format PDF.');
      return;
    }

    if (file.size > 55 * 1024 * 1024) {
      showNotification('error', 'Le fichier PDF ne doit pas dépasser 55 Mo.');
      return;
    }

    setPdfFileForUpload(file);

    // If title is empty, prefill from filename
    if (!formData.title.trim()) {
      const cleanName = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[-_]/g, ' ')
        .trim();
      setFormData(prev => ({
        ...prev,
        title: cleanName
      }));
    }

    // Estimate page count
    const estPages = Math.max(12, Math.round(file.size / 30000));
    setFormData(prev => ({
      ...prev,
      page_count: estPages,
      reading_time_min: Math.max(15, Math.round(estPages * 0.8))
    }));

    showNotification('success', `PDF « ${file.name} » (${(file.size / (1024 * 1024)).toFixed(1)} Mo) prêt pour téléversement Google Drive.`);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author) {
      showNotification('error', 'Le titre et l\'auteur sont obligatoires.');
      return;
    }

    // If uploading a new book with a PDF file directly to Google Drive
    if (pdfFileForUpload && !selectedBookForEdit) {
      setIsUploadingToDrive(true);
      setUploadProgressText('Lecture et préparation du fichier PDF...');

      const reader = new FileReader();
      reader.onerror = () => {
        setIsUploadingToDrive(false);
        showNotification('error', 'Erreur lors de la lecture du fichier sur votre appareil.');
      };

      reader.onload = async () => {
        try {
          const fileBase64 = reader.result as string;
          setUploadProgressText('Téléversement vers Google Drive dans « 📚 LA BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE »...');

          const res = await fetch('/api/drive/books/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64,
              fileName: pdfFileForUpload.name,
              title: formData.title.trim(),
              author: formData.author.trim(),
              category: formData.category,
              description: formData.description,
              cover_image: formData.cover_image,
              page_count: formData.page_count,
              reading_file: formData.reading_file || `${formData.title} par ${formData.author}`
            })
          });

          const data = await res.json();
          if (res.ok) {
            showNotification('success', data.message || `Livre « ${formData.title} » envoyé sur Google Drive et publié !`);
            setIsModalOpen(false);
            setPdfFileForUpload(null);
            onRefreshBooks();
          } else {
            showNotification('error', data.error || 'Erreur lors du téléversement vers Google Drive.');
          }
        } catch (err: any) {
          showNotification('error', 'Erreur serveur lors de l\'envoi vers Google Drive.');
        } finally {
          setIsUploadingToDrive(false);
          setUploadProgressText('');
        }
      };

      reader.readAsDataURL(pdfFileForUpload);
      return;
    }

    // Standard save / edit without new PDF file
    if (!formData.google_drive_url && !selectedBookForEdit) {
      showNotification('error', 'Veuillez téléverser un fichier PDF ou indiquer un lien Google Drive.');
      return;
    }

    try {
      const isEditing = !!selectedBookForEdit;
      const url = isEditing ? `/api/books/${selectedBookForEdit.id}` : '/api/books';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        reading_file: formData.reading_file || `${formData.title} par ${formData.author}`,
        chapters: [
          {
            title: "Chapitre 1 : Introduction et Fondement",
            content: formData.reading_file || `Texte intégral de « ${formData.title} » par ${formData.author}.\n\nCe document est mis à la disposition des fidèles pour la sanctification et la préparation de l'Église dans la dernière heure.`
          }
        ]
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showNotification('success', isEditing ? 'Livre mis à jour avec succès' : 'Nouveau livre ajouté au catalogue');
        setIsModalOpen(false);
        setPdfFileForUpload(null);
        onRefreshBooks();
      } else {
        const err = await res.json();
        showNotification('error', err.error || 'Erreur lors de l\'enregistrement.');
      }
    } catch (err: any) {
      showNotification('error', 'Erreur serveur.');
    }
  };

  const handleSyncDriveFolder = async () => {
    try {
      setIsSyncingDriveFolder(true);
      const res = await fetch('/api/drive/sync-folder', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        const addedCount = data.newBooksAdded?.length || 0;
        if (addedCount > 0) {
          showNotification('success', `Synchronisation réussie : ${addedCount} nouveau(x) livre(s) importé(s) depuis le dossier Drive « 📚 LA BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE » !`);
        } else {
          showNotification('success', `Dossier Google Drive à jour (${data.totalDriveFilesFound || 0} fichier(s) scanné(s)). Tous les livres sont déjà indexés.`);
        }
        onRefreshBooks();
      } else {
        showNotification('error', data.error || 'Erreur lors de la synchronisation avec Google Drive.');
      }
    } catch (e: any) {
      showNotification('error', 'Erreur lors de la synchronisation Google Drive.');
    } finally {
      setIsSyncingDriveFolder(false);
    }
  };

  const requestDeleteBook = (book: Book) => {
    setDeleteModalState({
      isOpen: true,
      book,
      deleteFromDrive: false,
      isDeleting: false
    });
  };

  const handleConfirmDelete = async () => {
    const book = deleteModalState.book;
    if (!book) return;

    setDeleteModalState(prev => ({ ...prev, isDeleting: true }));
    try {
      const url = `/api/books/${book.id}?deleteFromDrive=${deleteModalState.deleteFromDrive}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        showNotification('success', data.message || `Livre « ${book.title} » supprimé.`);
        setDeleteModalState({ isOpen: false, book: null, deleteFromDrive: false, isDeleting: false });
        onRefreshBooks();
      } else {
        showNotification('error', data.error || 'Erreur lors de la suppression.');
        setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
      }
    } catch (err: any) {
      showNotification('error', 'Erreur serveur.');
      setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleClearLibrary = async () => {
    setIsClearingLibrary(true);
    try {
      const res = await fetch('/api/books', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        try {
          await clearAllOfflineCache();
        } catch (e) {}
        showNotification('success', data.message || 'La bibliothèque a été entièrement vidée avec succès. La base de données est désormais vierge pour votre configuration initiale.');
        setIsClearLibraryModalOpen(false);
        if (onRefreshBooks) {
          onRefreshBooks();
        }
      } else {
        showNotification('error', data.error || 'Erreur lors du vidage de la bibliothèque.');
      }
    } catch (err: any) {
      try {
        const res2 = await fetch('/api/books/clear', { method: 'POST' });
        const data2 = await res2.json();
        if (res2.ok) {
          try {
            await clearAllOfflineCache();
          } catch (e) {}
          showNotification('success', data2.message || 'La bibliothèque a été entièrement vidée avec succès.');
          setIsClearLibraryModalOpen(false);
          if (onRefreshBooks) {
            onRefreshBooks();
          }
          return;
        }
      } catch (e) {}
      showNotification('error', 'Erreur de connexion au serveur.');
    } finally {
      setIsClearingLibrary(false);
    }
  };

  const handleReindexAi = async (bookId: string) => {
    setIsIndexingId(bookId);
    try {
      const res = await fetch(`/api/ai/index/${bookId}`, { method: 'POST' });
      if (res.ok) {
        showNotification('success', 'Indexation théologique IA terminée avec succès.');
        onRefreshBooks();
      } else {
        showNotification('error', 'Échec de l\'indexation.');
      }
    } catch (e) {
      showNotification('error', 'Erreur serveur lors de l\'indexation.');
    } finally {
      setIsIndexingId(null);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(books, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `catalogue_bibliotheque_derniere_heure_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('success', 'Export du catalogue complet téléchargé.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            await fetch('/api/books', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item)
            });
          }
          showNotification('success', `${parsed.length} livre(s) importé(s) dans la bibliothèque.`);
          onRefreshBooks();
        } else {
          showNotification('error', 'Format de fichier JSON invalide.');
        }
      } catch (err) {
        showNotification('error', 'Erreur de lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestedPrompts = [
    "Active la bannière d'annonce avec le texte : 'Conférence de Réveil et Sanctification ce samedi à 17h' avec le badge 'Urgent'",
    "Change le verset du jour par Romains 13:11 avec le commentaire : 'Il est l'heure de vous réveiller du sommeil, car le salut est plus près de nous.'",
    "Ajoute un nouveau livre intitulé 'La Sanctification et la Veille Spirituelle' par Dr LEMBA KAVUMBULA MOÏSE dans la catégorie Vie Chrétienne & Sanctification avec lien Google Drive https://drive.google.com/",
    "Désactive la bannière d'annonce",
    "Modifie le lien de téléchargement Google Drive du premier livre",
  ];

  // LOGIN SCREEN IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-sky-500/30 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold text-slate-100">
              Espace Administrateur
            </h2>
            <p className="text-xs text-slate-400">
              Gestion du catalogue, modifications IA avec Gemini et paramètres du site.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Code d'accès sécurisé
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Entrez votre code..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-sky-500/50 rounded-xl text-sm text-slate-100 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold text-sm shadow cursor-pointer transition-all"
            >
              Déverrouiller l'Administration
            </button>
          </form>

          {/* Demonstration Helper */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-500 block">
              Accès administrateur : tapez <code className="text-sky-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">admin123</code> ou <code className="text-sky-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">derniereheure</code>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xl animate-in fade-in ${
          notification.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-sky-500/20 text-sky-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">
              Administration & Pilotage IA Gemini
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100">
            Console Administrateur du Site
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Initiateur du site : <strong className="text-sky-300 font-semibold">Docteur LEMBA KAVUMBULA MOÏSE</strong> (+243811733778)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('ai-admin')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            <Bot className="w-4 h-4 text-slate-950" />
            <span>Assistant IA Gemini</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 text-xs font-semibold border border-sky-500/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Nouveau Livre</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 cursor-pointer"
            title="Exporter tout le catalogue au format JSON"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-sky-400" />
            <span>Exporter</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Importer</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-rose-400 border border-slate-800 cursor-pointer"
            title="Déconnexion"
          >
            <Unlock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Ouvrages</span>
          <span className="block font-display text-2xl font-bold text-sky-400">{books.length}</span>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Indexés par l'IA</span>
          <span className="block font-display text-2xl font-bold text-slate-200">
            {books.filter(b => b.ai_indexed_content?.summary).length}
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Téléchargements Drive</span>
          <span className="block font-display text-2xl font-bold text-sky-400">
            {books.reduce((acc, b) => acc + (b.downloads_count || 100), 0)}
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Bannière d'Annonce</span>
          <span className={`block font-display text-sm font-bold mt-1 ${siteSettings?.announcementBanner?.active ? 'text-emerald-400' : 'text-slate-500'}`}>
            {siteSettings?.announcementBanner?.active ? '● Active' : '○ Masquée'}
          </span>
        </div>
      </div>

      {/* ADMIN TABS NAVIGATION */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === 'analytics' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-900/70 text-slate-300 hover:text-sky-300 border border-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tableau de Bord Analytique</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ml-1 ${
            activeTab === 'analytics' ? 'bg-slate-950/20 text-slate-950' : 'bg-sky-400/20 text-sky-300'
          }`}>
            IA & Questions
          </span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === 'questions' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-900/70 text-slate-300 hover:text-sky-300 border border-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Questions Posées</span>
          {pendingQuestionsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-bold ml-1">
              {pendingQuestionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('email-logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'email-logs' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-900/70 text-slate-300 hover:text-sky-300 border border-slate-800'
          }`}
        >
          <Mail className="w-4 h-4 text-sky-400" />
          <span>Notifications Gmail Admin</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'users' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-900/70 text-slate-300 hover:text-sky-300 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Fidèles Inscrits</span>
        </button>

        <button
          onClick={() => setActiveTab('ai-admin')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ai-admin' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-900/70 text-slate-300 hover:text-sky-300 border border-slate-800'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Modifier le Site avec l'IA Gemini</span>
        </button>

        <button
          onClick={() => setActiveTab('5-etapes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === '5-etapes' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-900/70 text-slate-300 hover:text-sky-300 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-400" />
          <span>5 Étapes Spirituelles</span>
        </button>

        <button
          onClick={() => setActiveTab('drive-rag')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'drive-rag' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-900/70 text-slate-300 hover:text-sky-300 border border-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4 text-sky-400" />
          <span>Google Drive & RAG</span>
        </button>

        <button
          onClick={() => setActiveTab('pages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pages' ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' : 'bg-slate-900/70 text-amber-300 hover:text-amber-200 border border-amber-500/30'
          }`}
        >
          <Globe className="w-4 h-4 text-amber-400" />
          <span>Modifier Pages, Contenus & Liens Drive</span>
        </button>

        <button
          onClick={() => setActiveTab('books')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'books' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-900/70 text-slate-300 hover:text-sky-300 border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Gestion des Livres ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'settings' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-900/70 text-slate-300 hover:text-sky-300 border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Paramètres & Bannières</span>
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'photos' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-900/70 text-slate-300 hover:text-sky-300 border border-slate-800'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Photos & Médias</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'messages' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' : 'bg-slate-900/70 text-slate-300 hover:text-sky-300 border border-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Messages Contact ({contactMessages.length})</span>
        </button>
      </div>

      {/* TAB: ANALYTICAL DASHBOARD */}
      {activeTab === 'analytics' && (
        <Suspense fallback={<div className="p-12 text-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400 mb-2" />Chargement du tableau de bord analytique...</div>}>
          <AdminAnalyticsTab
            onNavigateToQuestions={() => setActiveTab('questions')}
            onNavigateToAiAdmin={() => setActiveTab('ai-admin')}
          />
        </Suspense>
      )}

      {/* TAB: GEMINI AI SITE MODIFIER */}
      {activeTab === 'ai-admin' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* AI Banner Guide */}
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950/40 border border-sky-500/30 p-6 sm:p-8 overflow-hidden shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-100">
                    Assistant IA Gemini pour Administrateur
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-sky-500 text-slate-950">
                    Connecté
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                  En tant qu'administrateur, vous pouvez piloter et modifier l'intégralité du site en <strong className="text-sky-300 font-semibold">langage naturel</strong>. L'intelligence artificielle Gemini analyse votre demande, configure les livres, actualise la bannière d'annonce, met à jour les liens de téléchargement Google Drive ou modifie le verset du jour de façon instantanée.
                </p>
              </div>
            </div>

            {/* AI Command Input Form */}
            <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-400" />
                <span>Donner un ordre de modification à Gemini :</span>
              </label>

              <div className="relative">
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Modifie la bannière pour annoncer une veillée de prière ce vendredi à 21h, ou ajoute un livre sur la foi par Dr LEMBA KAVUMBULA MOÏSE avec lien Google Drive..."
                  className="w-full p-4 pr-32 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none resize-none transition-all shadow-inner font-sans"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleExecuteAiModify();
                    }
                  }}
                />

                <div className="absolute right-3 bottom-3.5 flex items-center gap-2">
                  <button
                    disabled={isAiExecuting || !aiPrompt.trim()}
                    onClick={() => handleExecuteAiModify()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {isAiExecuting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Gemini exécute...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Exécuter</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Suggestions Quick Buttons */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] text-slate-400 block font-medium">
                  Exemples de commandes prêtes à l'emploi (cliquez pour exécuter) :
                </span>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiPrompt(p);
                        handleExecuteAiModify(p);
                      }}
                      className="text-left text-[11px] px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 transition-colors cursor-pointer"
                    >
                      💡 {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Result Card */}
          {aiResult && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-sky-500/40 shadow-xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Rapport de l'IA Gemini • {aiResult.timestamp}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                  Modifications appliquées en direct
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                {aiResult.reply}
              </div>

              {aiResult.executedActions && aiResult.executedActions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider block">
                    Actions techniques exécutées ({aiResult.executedActions.length}) :
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {aiResult.executedActions.map((act, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950/80 border border-sky-500/20 text-xs flex items-start gap-2.5">
                        <span className="p-1 rounded bg-sky-500/15 text-sky-400 text-[10px] font-mono font-bold mt-0.5">
                          {act.type}
                        </span>
                        <div className="flex-1">
                          <span className="text-slate-200 block font-medium">{act.description}</span>
                          {act.targetId && (
                            <span className="text-[10px] text-slate-500 font-mono">ID: {act.targetId}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Preview of Current Live Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs uppercase font-bold text-sky-400 tracking-wider block">
                Bannière d'Annonce en Direct
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${siteSettings?.announcementBanner?.active ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                  {siteSettings?.announcementBanner?.active ? 'Activée' : 'Désactivée'}
                </span>
                <span className="text-xs text-sky-300 font-semibold">
                  [{siteSettings?.announcementBanner?.badge || 'Info'}]
                </span>
              </div>
              <p className="text-xs text-slate-300 font-light">
                {siteSettings?.announcementBanner?.text || 'Aucune annonce configurée.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs uppercase font-bold text-sky-400 tracking-wider block">
                Verset du Jour en Direct
              </span>
              <span className="text-xs text-slate-200 font-semibold block">
                {siteSettings?.dailyVerse?.reference || '1 Jean 2:18'}
              </span>
              <p className="text-xs text-sky-200/90 italic font-light">
                « {siteSettings?.dailyVerse?.text || 'Petits enfants, c\'est la dernière heure...'} »
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB: SITE SETTINGS & ANNOUNCEMENTS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-sky-500/30 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-100">
                  Paramètres Généraux & Bannières du Site
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configurez manuellement ou via Gemini l'en-tête, les avis pastoraux et le verset d'accueil.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('ai-admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-semibold"
              >
                <Bot className="w-3.5 h-3.5 text-sky-400" />
                <span>Modifier avec Gemini</span>
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Site Global Identity & General Titles */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block">
                  Identité Générale & Noms Officiels du Site
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nom Officiel du Site</label>
                    <input
                      type="text"
                      value={settingsForm.siteName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                      placeholder="Nom du site..."
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Sous-Titre / Devise</label>
                    <input
                      type="text"
                      value={settingsForm.siteSubtitle}
                      onChange={(e) => setSettingsForm({ ...settingsForm, siteSubtitle: e.target.value })}
                      placeholder="Édification, Réveil Spirituel & Sanctification"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Grand Titre Page d'Accueil (H1)</label>
                    <input
                      type="text"
                      value={settingsForm.heroTitle}
                      onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                      placeholder="Bibliothèque Complète de Réveil et de Sanctification"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Titre de la Bibliothèque</label>
                    <input
                      type="text"
                      value={settingsForm.libraryTitle}
                      onChange={(e) => setSettingsForm({ ...settingsForm, libraryTitle: e.target.value })}
                      placeholder="Collection Complète des Ouvrages de Sanctification"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Description d'accueil / Explication principale</label>
                  <textarea
                    rows={2}
                    value={settingsForm.heroDescription}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroDescription: e.target.value })}
                    placeholder="Description de la plateforme..."
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none resize-none focus:border-sky-500/50"
                  />
                </div>

                {/* Main Google Drive Link for the entire site */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <label className="text-xs font-bold text-amber-300 block mb-1 flex items-center justify-between">
                    <span>Lien Principal vers le Dossier Google Drive du Site</span>
                    <a
                      href={settingsForm.googleDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-300 hover:underline text-[10px] flex items-center gap-1"
                    >
                      <span>Tester le lien Drive</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </label>
                  <input
                    type="url"
                    value={settingsForm.googleDriveUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, googleDriveUrl: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full px-3.5 py-2 bg-slate-900 border border-amber-500/40 rounded-xl text-xs text-amber-200 outline-none focus:border-amber-400 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Ce lien est utilisé par défaut sur tous les boutons de téléchargement et d'accès cloud général.
                  </p>
                </div>
              </div>

              {/* Announcement Banner Section */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                      Bannière d'Annonce Défilante (En-tête de page)
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.announcementActive}
                      onChange={(e) => setSettingsForm({ ...settingsForm, announcementActive: e.target.checked })}
                      className="w-4 h-4 text-sky-500 rounded border-slate-700 bg-slate-900 focus:ring-sky-400 cursor-pointer"
                    />
                    <span className="text-xs text-slate-200 font-semibold">Afficher sur le site</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Badge (ex: URGENT, INFO, ANNONCE)</label>
                    <input
                      type="text"
                      value={settingsForm.announcementBadge}
                      onChange={(e) => setSettingsForm({ ...settingsForm, announcementBadge: e.target.value })}
                      placeholder="Info Prophétique"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Message d'annonce</label>
                    <input
                      type="text"
                      value={settingsForm.announcementText}
                      onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                      placeholder="Message visible en haut de toutes les pages..."
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Daily Verse Section */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block">
                  Verset du Jour (Page d'Accueil)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Référence Biblique</label>
                    <input
                      type="text"
                      value={settingsForm.dailyVerseRef}
                      onChange={(e) => setSettingsForm({ ...settingsForm, dailyVerseRef: e.target.value })}
                      placeholder="1 Jean 2:18"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Thème / Commentaire</label>
                    <input
                      type="text"
                      value={settingsForm.dailyVerseTheme}
                      onChange={(e) => setSettingsForm({ ...settingsForm, dailyVerseTheme: e.target.value })}
                      placeholder="Discerner la fin des temps..."
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Texte intégral du verset</label>
                  <textarea
                    rows={3}
                    value={settingsForm.dailyVerseText}
                    onChange={(e) => setSettingsForm({ ...settingsForm, dailyVerseText: e.target.value })}
                    placeholder="Petits enfants, c'est la dernière heure..."
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none resize-none focus:border-sky-500/50 font-serif"
                  />
                </div>
              </div>

              {/* 5 Spiritual Steps (1 Pierre 5:10) Overview & Theological Reference */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block">
                    Les 5 Étapes Spirituelles pour Devenir Chrétien (1 Pierre 5:10)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                    Ouvrage Fondateur N°1
                  </span>
                </div>
                <p className="text-xs text-sky-200/90 italic bg-sky-950/30 p-3 rounded-xl border border-sky-500/20 font-serif">
                  « Le Dieu de toute grâce, qui vous a appelés en Jésus-Christ à sa gloire éternelle, après que vous aurez souffert un peu de temps, vous perfectionnera lui-même, vous affermira, vous fortifiera, vous rendra inébranlables. » — 1 Pierre 5:10
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center mx-auto">1</span>
                    <strong className="text-xs text-slate-100 block">Appel</strong>
                    <span className="text-[10px] text-slate-400 block">Jean 16:8 • Romains 8:30</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center mx-auto">2</span>
                    <strong className="text-xs text-slate-100 block">Souffrance</strong>
                    <span className="text-[10px] text-slate-400 block">1 Pierre 4:12 • 2 Tim. 3:12</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center mx-auto">3</span>
                    <strong className="text-xs text-slate-100 block">Perfectionnement</strong>
                    <span className="text-[10px] text-slate-400 block">Éphésiens 4:12</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center mx-auto">4</span>
                    <strong className="text-xs text-slate-100 block">Affermissement</strong>
                    <span className="text-[10px] text-slate-400 block">Colossiens 2:7</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center mx-auto">5</span>
                    <strong className="text-xs text-slate-100 block">Fortification</strong>
                    <span className="text-[10px] text-slate-400 block">Zacharie 4:6 • Éph. 6:10</span>
                  </div>
                </div>
              </div>

              {/* Pastor & Administration Contact Section */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block">
                  Coordonnées de Contact Pastorales & Physiques
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Email Officiel</label>
                    <input
                      type="email"
                      value={settingsForm.contactEmail}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                      placeholder="bibliothequechretien@gmail.com"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Téléphone Principal</label>
                    <input
                      type="text"
                      value={settingsForm.contactPhone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                      placeholder="+243811733778"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Dénomination / Adresse Officielle</label>
                  <input
                    type="text"
                    value={settingsForm.contactAddress}
                    onChange={(e) => setSettingsForm({ ...settingsForm, contactAddress: e.target.value })}
                    placeholder="Centre du Réveil Spirituel de la dernière Heure / Ministère d'Évangélisation Internationale"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              {/* Creator & Pastor Identity Confirmation */}
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
                <strong className="text-amber-300 font-semibold block flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  Administrateur du Site & Coordonnées Officielles
                </strong>
                <p className="text-slate-200">
                  Administrateur : <strong className="text-amber-300">Dr. LEMBA KAVUMBULA Moïse</strong> • Tél : <strong className="text-white font-mono">+243811733778</strong> • Email : <strong className="text-white">bibliothequechretien@gmail.com</strong>
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSavingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Enregistrer les paramètres</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: PHOTOS & MEDIA MANAGEMENT */}
      {activeTab === 'photos' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Interactive Showcase Photos Manager with titles, captions, badges, reordering */}
          <AdminShowcasePhotosManager onNotify={(type, msg) => showNotification(type, msg)} />

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-sky-500/30 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Image className="w-5 h-5 text-sky-400" />
                  <span>Photo Vedette Directe & Couvertures d'Ouvrages</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Modifiez la photo d'affiche principale de la page d'accueil ou changez individuellement les couvertures des ouvrages.
                </p>
              </div>
            </div>

            {/* Showcase Flagship Photo Section */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block">
                    Photo en Vedette de la Vitrine (Page d'Accueil)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Cette photo illustre l'ouvrage « Les 5 Étapes Spirituelles Pour Devenir Chrétien » en tête du site.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Photo Preview */}
                <div className="relative group w-44 h-60 rounded-2xl overflow-hidden border-2 border-sky-500/40 bg-slate-900 shadow-xl flex-shrink-0 flex items-center justify-center">
                  {settingsForm.showcaseCoverImage ? (
                    <img
                      src={settingsForm.showcaseCoverImage}
                      alt="Vitrine Vedette"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setSettingsForm(prev => ({ ...prev, showcaseCoverImage: '' }))}
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Camera className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                      <span className="text-xs text-slate-400 font-semibold block">Aucune photo</span>
                      <span className="text-[10px] text-slate-500">Ajoutez votre couverture</span>
                    </div>
                  )}
                  {settingsForm.showcaseCoverImage && (
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end justify-between p-2.5">
                      <span className="text-[10px] text-sky-300 font-bold bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur">
                        Aperçu
                      </span>
                      <button
                        type="button"
                        onClick={() => setSettingsForm(prev => ({ ...prev, showcaseCoverImage: '' }))}
                        className="text-[10px] text-red-400 hover:text-red-300 bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur cursor-pointer"
                      >
                        Retirer
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload Options */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                      Téléverser une photo depuis votre appareil (ordinateur / téléphone)
                    </label>
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 text-xs font-bold cursor-pointer transition-all">
                      <Camera className="w-4 h-4 text-sky-400" />
                      <span>Choisir une photo (JPG, PNG, WEBP)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoFileUpload(e, 'showcase')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                      3. Ou saisir directement une adresse URL d'image
                    </label>
                    <input
                      type="text"
                      value={settingsForm.showcaseCoverImage}
                      onChange={(e) => setSettingsForm({ ...settingsForm, showcaseCoverImage: e.target.value })}
                      placeholder="https://... ou /images/..."
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isSavingSettings}
                      onClick={handleSaveSettings}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      {isSavingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Enregistrer et Appliquer comme Photo Vedette</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* All Books Cover Photos Quick Editor */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block">
                    Couvertures des Ouvrages du Catalogue ({books.length})
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Aperçu des livres enregistrés dans la base de données.
                  </p>
                </div>
                {books.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('books');
                      setIsClearLibraryModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start transition-colors"
                    title="Vider tous les livres pour une configuration initiale propre"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Vider la bibliothèque</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {books.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                    <img
                      src={b.cover_image}
                      alt={b.title}
                      className="w-12 h-16 rounded object-cover flex-shrink-0 border border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <strong className="text-xs text-slate-100 block truncate">{b.title}</strong>
                      <span className="text-[10px] text-sky-400 block truncate">{b.author}</span>
                      <button
                        type="button"
                        onClick={() => openEditModal(b)}
                        className="mt-1.5 text-[11px] font-semibold text-sky-300 hover:text-sky-200 underline cursor-pointer"
                      >
                        Changer la photo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BOOKS MANAGEMENT */}
      {activeTab === 'books' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer par titre, auteur, catégorie..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500/50"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-400">{filteredBooks.length} ouvrage(s)</span>
              
              <button
                type="button"
                onClick={() => setIsFlagshipDownloadsModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                title="Gérer les liens de téléchargement de l'ouvrage Les 5 Étapes Spirituelles"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Liens « Les 5 Étapes »</span>
              </button>

              <button
                type="button"
                onClick={handleSyncDriveFolder}
                disabled={isSyncingDriveFolder}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                title="Scanner le dossier 📚 LA BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE pour importer automatiquement de nouveaux livres"
              >
                <FolderSync className={`w-3.5 h-3.5 text-sky-400 ${isSyncingDriveFolder ? 'animate-spin' : ''}`} />
                <span>{isSyncingDriveFolder ? 'Synchronisation Drive...' : 'Synchroniser Google Drive'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsClearLibraryModalOpen(true)}
                disabled={books.length === 0}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                title="Supprimer tous les livres enregistrés dans la base de données pour permettre une configuration initiale propre"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Vider la bibliothèque</span>
              </button>

              <button
                onClick={openAddModal}
                className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un livre</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Livre</th>
                  <th className="px-4 py-3.5">Catégorie</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5">Indexation IA</th>
                  <th className="px-4 py-3.5">Google Drive</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-200">
                          {books.length === 0 ? 'La bibliothèque est actuellement vierge' : 'Aucun livre ne correspond à votre recherche'}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {books.length === 0
                            ? 'Tous les anciens livres ont été effacés de la base de données. Vous pouvez maintenant ajouter vous-même vos livres avec leurs couvertures, leurs chapitres et leurs fichiers pour démarrer votre propre configuration.'
                            : 'Essayez d\'ajuster vos critères de recherche.'}
                        </p>
                        {books.length === 0 && (
                          <div className="pt-2 flex items-center justify-center gap-2.5">
                            <button
                              type="button"
                              onClick={openAddModal}
                              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Ajouter mon premier livre</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSyncDriveFolder}
                              disabled={isSyncingDriveFolder}
                              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer border border-slate-700"
                            >
                              <FolderSync className={`w-3.5 h-3.5 ${isSyncingDriveFolder ? 'animate-spin' : ''}`} />
                              <span>Synchroniser Google Drive</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : filteredBooks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={b.cover_image} 
                          alt={b.title} 
                          className="w-9 h-12 rounded object-cover flex-shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-semibold text-slate-100 block">{b.title}</span>
                          <span className="text-[11px] text-sky-400/90">{b.author}</span>
                          {b.file_size_bytes ? (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {(b.file_size_bytes / (1024 * 1024)).toFixed(1)} Mo • Stocké sur Drive
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                        {b.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={isIndexingId === b.id}
                        onClick={() => handleReindexAi(b.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                        title="Analyser et réindexer le contenu pour l'IA"
                      >
                        <Sparkles className={`w-3 h-3 text-sky-400 ${isIndexingId === b.id ? 'animate-spin' : ''}`} />
                        <span>{isIndexingId === b.id ? 'Indexation...' : 'Réindexer'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={b.google_drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300"
                          title="Consulter directement sur Google Drive"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Drive</span>
                        </a>
                        {b.google_drive_file_id && (
                          <a
                            href={`/api/drive/download/${b.google_drive_file_id}`}
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200"
                            title="Téléchargement direct"
                          >
                            <DownloadCloud className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px]">Test</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-sky-300 cursor-pointer"
                          title="Modifier les informations"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => requestDeleteBook(b)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                          title="Supprimer (avec options de sécurité Google Drive)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PAGES CONTENT & GOOGLE DRIVE MANAGER */}
      {activeTab === 'pages' && (
        <Suspense fallback={<div className="p-12 text-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />Chargement de l'éditeur de pages et des liens Drive...</div>}>
          <AdminPagesManagerTab
            siteSettings={siteSettings || null}
            books={books}
            onNotify={showNotification}
            onRefreshSettings={onRefreshSettings || (() => {})}
            onRefreshBooks={onRefreshBooks}
          />
        </Suspense>
      )}

      {/* TAB: CONTACT MESSAGES */}
      {activeTab === 'messages' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {contactMessages.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              Aucun message de contact enregistré pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {contactMessages.map((msg) => (
                <div key={msg.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sky-300">{msg.name} ({msg.email})</span>
                    <span className="text-slate-500">{new Date(msg.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-200 block">{msg.subject}</span>
                  <p className="text-xs text-slate-300 font-light leading-relaxed whitespace-pre-line">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: QUESTIONS POSÉES À L'ADMINISTRATEUR */}
      {activeTab === 'questions' && (
        <Suspense fallback={<div className="p-12 text-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400 mb-2" />Chargement des questions...</div>}>
          <AdminQuestionsTab onNotify={(type, msg) => showNotification(type, msg)} />
        </Suspense>
      )}

      {/* TAB: NOTIFICATIONS GMAIL ADMIN */}
      {activeTab === 'email-logs' && (
        <Suspense fallback={<div className="p-12 text-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400 mb-2" />Chargement du journal des emails...</div>}>
          <AdminEmailLogsTab onNotify={(type, msg) => showNotification(type, msg)} />
        </Suspense>
      )}

      {/* TAB: FIDÈLES & UTILISATEURS INSCRITS */}
      {activeTab === 'users' && (
        <Suspense fallback={<div className="p-12 text-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400 mb-2" />Chargement des fidèles...</div>}>
          <AdminUsersTab />
        </Suspense>
      )}

      {/* TAB: 5 ÉTAPES SPIRITUELLES */}
      {activeTab === '5-etapes' && (
        <Suspense fallback={<div className="p-12 text-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400 mb-2" />Chargement des 5 étapes spirituelles...</div>}>
          <AdminSpiritualStepsTab onNotify={(type, msg) => showNotification(type, msg)} />
        </Suspense>
      )}

      {/* TAB: GOOGLE DRIVE & MOTEUR RAG */}
      {activeTab === 'drive-rag' && (
        <Suspense fallback={<div className="p-12 text-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400 mb-2" />Chargement du module Google Drive & RAG...</div>}>
          <AdminDriveRagTab onNotify={(type, msg) => showNotification(type, msg)} />
        </Suspense>
      )}

      {/* MODAL: ADD / EDIT BOOK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-sky-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-display text-xl font-bold text-slate-100">
                {selectedBookForEdit ? 'Modifier un Ouvrage' : 'Ajouter un Nouvel Ouvrage'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4">

              {/* DIRECT GOOGLE DRIVE PDF UPLOAD ZONE (FOR NEW BOOKS) */}
              {!selectedBookForEdit && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-sky-950/60 border border-sky-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                        <Cloud className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <span>Téléversement Direct vers Google Drive</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Recommandé
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Dossier cible : <strong className="text-sky-300">📚 LA BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {pdfFileForUpload ? (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/40 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-100 truncate">{pdfFileForUpload.name}</p>
                          <p className="text-[10px] text-emerald-400">
                            {(pdfFileForUpload.size / (1024 * 1024)).toFixed(2)} Mo • Prêt à être envoyé sur Google Drive
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPdfFileForUpload(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 text-xs font-medium cursor-pointer"
                        title="Changer de fichier"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-sky-500/30 hover:border-sky-500/60 bg-slate-950/50 hover:bg-slate-950/80 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group">
                      <Upload className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
                      <div className="text-center">
                        <span className="text-xs font-bold text-sky-300 block">
                          Cliquez ou glissez le fichier PDF de l'ouvrage ici
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Format PDF (Max 55 Mo) • Génération automatique du lien Drive & flux de lecture
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handlePdfFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}

              {/* UPLOAD PROGRESS NOTIFICATION */}
              {isUploadingToDrive && (
                <div className="p-4 rounded-xl bg-sky-950/80 border border-sky-500/50 flex items-center gap-3 animate-pulse">
                  <RefreshCw className="w-5 h-5 text-sky-400 animate-spin flex-shrink-0" />
                  <div className="text-xs text-sky-200">
                    <p className="font-bold">Téléversement Google Drive en cours...</p>
                    <p className="text-[11px] text-slate-300">{uploadProgressText}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Titre de l'Ouvrage *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Les Signes de la Fin des Temps"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Auteur *</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Docteur LEMBA KAVUMBULA MOÏSE"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        category: cat
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none cursor-pointer focus:border-sky-500/50"
                  >
                    <option value="Vie Chrétienne & Sanctification">Vie Chrétienne & Sanctification</option>
                    <option value="Prière & Intercession">Prière & Intercession</option>
                    <option value="Foi & Encouragement">Foi & Encouragement</option>
                    <option value="Ministère & Réveil">Ministère & Réveil</option>
                    <option value="Édification Spirituelle">Édification Spirituelle</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none cursor-pointer focus:border-sky-500/50"
                  >
                    <option value="Publié">Publié</option>
                    <option value="En révision">En révision</option>
                    <option value="Archivé">Archivé</option>
                  </select>
                </div>
              </div>

              {/* MANUAL GOOGLE DRIVE URL (FALLBACK OR EDIT MODE) */}
              {(!pdfFileForUpload || selectedBookForEdit) && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Lien Google Drive (Bouton « Télécharger »)</span>
                    <span className="text-[11px] text-sky-400 font-normal">
                      {pdfFileForUpload ? 'Sera généré automatiquement' : 'Lien Drive du fichier PDF'}
                    </span>
                  </label>
                  <input
                    type="url"
                    value={formData.google_drive_url}
                    onChange={(e) => setFormData({ ...formData, google_drive_url: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-sky-500/30 text-xs text-sky-200 outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Photo de Couverture de l'Ouvrage (Aperçu)</label>
                  {formData.cover_image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_image: '' })}
                      className="text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      Effacer la photo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                    placeholder="/images/... ou https://..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold cursor-pointer transition-colors whitespace-nowrap">
                    <Camera className="w-3.5 h-3.5 text-sky-400" />
                    <span>Téléverser photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoFileUpload(e, 'book')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description théologique</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Courte présentation théologique de l'ouvrage..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none resize-none focus:border-sky-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Contenu texte pour « Lire en ligne » & Indexation IA</span>
                  <span className="text-[11px] text-sky-400">Optionnel si un PDF est téléversé</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.reading_file}
                  onChange={(e) => setFormData({ ...formData, reading_file: e.target.value })}
                  placeholder="Collez ici le texte intégral, l'extrait ou les chapitres du livre..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none resize-none font-reading focus:border-sky-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isUploadingToDrive}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUploadingToDrive}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold shadow cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploadingToDrive && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isUploadingToDrive
                      ? 'Téléversement Drive en cours...'
                      : selectedBookForEdit
                      ? 'Sauvegarder les modifications'
                      : pdfFileForUpload
                      ? 'Téléverser vers Google Drive & Publier'
                      : 'Créer et Publier'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAFE DELETE CONFIRMATION MODAL WITH GOOGLE DRIVE OPTIONS */}
      {deleteModalState.isOpen && deleteModalState.book && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-100">
                  Suppression Sécurisée d'un Livre
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Vous êtes sur le point de retirer l'ouvrage :
                </p>
                <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-xs font-bold text-slate-100">{deleteModalState.book.title}</p>
                  <p className="text-[11px] text-sky-400">{deleteModalState.book.author}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Dossier Drive associé : <span className="text-slate-300">📚 LA BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-200 block">
                Que souhaitez-vous faire avec le fichier Google Drive ?
              </label>

              {/* Option 1: Delete from site only */}
              <label
                onClick={() => setDeleteModalState(prev => ({ ...prev, deleteFromDrive: false }))}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  !deleteModalState.deleteFromDrive 
                    ? 'bg-sky-950/40 border-sky-500/60 shadow-sm' 
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="deleteMode"
                  checked={!deleteModalState.deleteFromDrive}
                  onChange={() => setDeleteModalState(prev => ({ ...prev, deleteFromDrive: false }))}
                  className="mt-1"
                />
                <div className="text-xs">
                  <strong className="text-slate-100 block">
                    Option 1 : Supprimer uniquement du site web (Recommandé)
                  </strong>
                  <span className="text-slate-400 text-[11px] block mt-0.5 leading-relaxed">
                    L'ouvrage sera retiré de la bibliothèque publique du site. Le fichier PDF restera conservé en sécurité dans votre dossier Google Drive (<span className="text-sky-400">bibliothequechretien@gmail.com</span>).
                  </span>
                </div>
              </label>

              {/* Option 2: Delete from site AND Google Drive */}
              <label
                onClick={() => setDeleteModalState(prev => ({ ...prev, deleteFromDrive: true }))}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  deleteModalState.deleteFromDrive 
                    ? 'bg-rose-950/40 border-rose-500/60 shadow-sm' 
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="deleteMode"
                  checked={deleteModalState.deleteFromDrive}
                  onChange={() => setDeleteModalState(prev => ({ ...prev, deleteFromDrive: true }))}
                  className="mt-1"
                />
                <div className="text-xs">
                  <strong className="text-rose-300 block">
                    Option 2 : Supprimer du site ET de Google Drive
                  </strong>
                  <span className="text-slate-400 text-[11px] block mt-0.5 leading-relaxed">
                    Le fichier PDF sera définitivement supprimé de votre dossier Google Drive ainsi que de la base de données du site. Cette action est irréversible.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={deleteModalState.isDeleting}
                onClick={() => setDeleteModalState({ isOpen: false, book: null, deleteFromDrive: false, isDeleting: false })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleteModalState.isDeleting}
                onClick={handleConfirmDelete}
                className={`px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  deleteModalState.deleteFromDrive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                    : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                }`}
              >
                {deleteModalState.isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Suppression en cours...</span>
                  </>
                ) : deleteModalState.deleteFromDrive ? (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmer la suppression totale (Site + Drive)</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer du site uniquement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VIDER LA BIBLIOTHÈQUE POUR CONFIGURATION INITIALE PROPRE */}
      {isClearLibraryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-rose-500/50 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex-shrink-0">
                <Trash2 className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>Vider entièrement la bibliothèque</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-bold">
                    {books.length} livre(s)
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Cette action va supprimer l'intégralité des livres enregistrés dans la base de données du site afin de vous offrir une <strong className="text-rose-300">configuration initiale propre</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/25 space-y-2.5 text-xs text-rose-200/90 leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Remise à zéro du catalogue</span>
              </div>
              <p>
                Une fois la bibliothèque vidée, le catalogue sera entièrement vierge. Vous pourrez ensuite ajouter vous-même chaque ouvrage individuellement, avec sa couverture personnalisée, ses chapitres et son fichier Google Drive.
              </p>
              <div className="pt-2 border-t border-rose-500/20 text-[11px] text-slate-400">
                ℹ️ <strong className="text-slate-200">Sécurité Google Drive :</strong> Les fichiers originaux hébergés sur votre compte Google Drive (<span className="text-sky-300">bibliothequechretien@gmail.com</span>) restent préservés. Seuls les enregistrements de la base de données du site sont effacés.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={isClearingLibrary}
                onClick={() => setIsClearLibraryModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isClearingLibrary || books.length === 0}
                onClick={handleClearLibrary}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-all shadow-lg shadow-rose-950/50 flex items-center gap-2 disabled:opacity-50"
              >
                {isClearingLibrary ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Suppression en cours...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmer et vider la bibliothèque</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flagship 5-Steps Book Downloads Modal */}
      {isFlagshipDownloadsModalOpen && (
        <ManageFlagshipDownloadsModal
          isOpen={isFlagshipDownloadsModalOpen}
          onClose={() => setIsFlagshipDownloadsModalOpen(false)}
          currentBook={books.find(b => b.id === 'les-5-etapes-spirituelles-chretien')}
          onSaved={(updatedBook) => {
            showNotification('success', `Liens de téléchargement enregistrés pour « ${updatedBook.title} » !`);
            if (onRefreshBooks) onRefreshBooks();
          }}
          onNotify={(type, msg) => showNotification(type, msg)}
        />
      )}

    </div>
  );
};
