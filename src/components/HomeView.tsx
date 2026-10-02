import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  ScrollText, 
  DownloadCloud, 
  Flame, 
  ArrowRight, 
  CheckCircle2, 
  Copy, 
  ShieldCheck, 
  Star, 
  Layers, 
  MessageSquare,
  Images,
  ExternalLink,
  FileText,
  Camera,
  Plus,
  User,
  Image as ImageIcon,
  UploadCloud,
  X,
  AlertCircle,
  Loader2,
  Languages
} from 'lucide-react';
import { Book, SiteSettings, ShowcasePhoto, BibleVersionId } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { InteractivePhotoShowcase } from './InteractivePhotoShowcase';
import { INITIAL_SHOWCASE_PHOTOS } from '../data/initialShowcasePhotos';
import { MainBookDetailModal } from './MainBookDetailModal';
import { BookCoverDisplay } from './BookCoverDisplay';
import { SitePhotoUploadModal, SitePhotoSlot } from './SitePhotoUploadModal';
import { 
  getAutoRotatedDailyVerse, 
  getLocalizedDailyVerse,
  ROTATING_DAILY_VERSES,
  BIBLE_VERSION_LABELS, 
  LANGUAGE_TO_DEFAULT_BIBLE_VERSION 
} from '../data/dailyVerses';

interface HomeViewProps {
  books: Book[];
  onNavigate: (view: string, bookId?: string) => void;
  onOpenBook: (book: Book) => void;
  siteSettings?: SiteSettings | null;
  isAdmin?: boolean;
  onRefreshBooks?: () => void;
  onRefreshSettings?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  books, 
  onNavigate, 
  onOpenBook, 
  siteSettings, 
  isAdmin = false,
  onRefreshBooks,
  onRefreshSettings
}) => {
  const { t, language, translateDynamicText } = useLanguage();
  const [copiedVerse, setCopiedVerse] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState(0);
  const [showcasePhotos, setShowcasePhotos] = useState<ShowcasePhoto[]>(INITIAL_SHOWCASE_PHOTOS);
  const [isMainBookModalOpen, setIsMainBookModalOpen] = useState(false);

  // Photo modal states for admin
  const [sitePhotoModalSlot, setSitePhotoModalSlot] = useState<SitePhotoSlot | null>(null);
  const [sitePhotoModalTitle, setSitePhotoModalTitle] = useState('');
  const [sitePhotoModalCurrentUrl, setSitePhotoModalCurrentUrl] = useState('');
  const [showcaseImgError, setShowcaseImgError] = useState(false);
  const [authorImgError, setAuthorImgError] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch interactive showcase photos from API
  useEffect(() => {
    let isMounted = true;
    fetch('/api/showcase-photos')
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.photos) {
          setShowcasePhotos(data.photos);
        }
      })
      .catch(err => {
        console.warn('Could not fetch showcase photos from server, using initial dataset:', err);
      });
    return () => { isMounted = false; };
  }, []);

  // Selected Bible Version override for the Daily Verse (defaults to language's Bible version)
  const defaultVersionForLanguage = LANGUAGE_TO_DEFAULT_BIBLE_VERSION[language] || 'LSG';
  const [explicitVerseVersion, setExplicitVerseVersion] = useState<BibleVersionId | null>(null);

  // When language changes in the language bar, reset explicit version so verse automatically follows the language
  useEffect(() => {
    setExplicitVerseVersion(null);
  }, [language]);

  const activeVerseVersion = explicitVerseVersion || defaultVersionForLanguage;

  // 24h Automatic rotating verse of the day based on date & localStorage
  const autoDailyVerse = React.useMemo(() => getAutoRotatedDailyVerse(language, activeVerseVersion), [language, activeVerseVersion]);

  // Check if siteSettings specifies a daily verse matching any in ROTATING_DAILY_VERSES
  const matchedSettingVerse = React.useMemo(() => {
    if (!siteSettings?.dailyVerse?.reference) return null;
    const refClean = siteSettings.dailyVerse.reference.toLowerCase().trim();
    return ROTATING_DAILY_VERSES.find(v => 
      v.reference.toLowerCase().trim() === refClean ||
      (v.referenceByLang && Object.values(v.referenceByLang).some((r: any) => typeof r === 'string' && r.toLowerCase().trim() === refClean))
    ) || null;
  }, [siteSettings?.dailyVerse?.reference]);

  const resolvedVerseData = React.useMemo(() => {
    if (matchedSettingVerse) {
      return getLocalizedDailyVerse(matchedSettingVerse, language, activeVerseVersion);
    }
    return autoDailyVerse.localized;
  }, [matchedSettingVerse, autoDailyVerse.localized, language, activeVerseVersion]);

  // Fallback for custom verses not in rotating list
  const isRawCustomVerse = Boolean(
    siteSettings?.dailyVerse?.reference && 
    !matchedSettingVerse
  );

  const [customVerseText, setCustomVerseText] = useState(siteSettings?.dailyVerse?.text || '');
  const [customVerseTheme, setCustomVerseTheme] = useState(siteSettings?.dailyVerse?.theme || '');
  const [customVerseRef, setCustomVerseRef] = useState(siteSettings?.dailyVerse?.reference || '');

  useEffect(() => {
    let isMounted = true;
    if (!isRawCustomVerse) return;

    if (language === 'fr') {
      setCustomVerseText(siteSettings?.dailyVerse?.text || '');
      setCustomVerseTheme(siteSettings?.dailyVerse?.theme || '');
      setCustomVerseRef(siteSettings?.dailyVerse?.reference || '');
      return;
    }

    if (siteSettings?.dailyVerse?.text) {
      translateDynamicText(siteSettings.dailyVerse.text).then(res => {
        if (isMounted && res) setCustomVerseText(res);
      });
    }
    if (siteSettings?.dailyVerse?.theme) {
      translateDynamicText(siteSettings.dailyVerse.theme).then(res => {
        if (isMounted && res) setCustomVerseTheme(res);
      });
    }
    if (siteSettings?.dailyVerse?.reference) {
      translateDynamicText(siteSettings.dailyVerse.reference).then(res => {
        if (isMounted && res) setCustomVerseRef(res);
      });
    }

    return () => { isMounted = false; };
  }, [language, isRawCustomVerse, siteSettings?.dailyVerse, translateDynamicText]);

  const verseDisplayRef = isRawCustomVerse
    ? (customVerseRef || siteSettings?.dailyVerse?.reference || '1 Pierre 5:10')
    : resolvedVerseData.reference;

  const verseDisplayText = isRawCustomVerse
    ? (customVerseText || siteSettings?.dailyVerse?.text || '')
    : resolvedVerseData.text;

  const verseDisplayTheme = isRawCustomVerse
    ? (customVerseTheme || siteSettings?.dailyVerse?.theme || '')
    : resolvedVerseData.theme;

  const verseVersionBadge = isRawCustomVerse
    ? activeVerseVersion
    : resolvedVerseData.versionId;

  const verseVersionName = resolvedVerseData.versionName || (BIBLE_VERSION_LABELS[verseVersionBadge] || verseVersionBadge);

  // Multilingual Author Biography & Overseer Notice (Dr LEMBA KAVUMBULA MOÏSE & KAYEMBE MWANANGIZI Lawi)
  const isDefaultAuthorName = !siteSettings?.authorName || 
    siteSettings.authorName.trim() === "Docteur LEMBA KAVUMBULA MOÏSE" ||
    siteSettings.authorName.trim() === "Dr. LEMBA KAVUMBULA MOÏSE" ||
    siteSettings.authorName.trim() === "Dr LEMBA KAVUMBULA MOÏSE";

  const isDefaultAuthorTitle = !siteSettings?.authorTitle || 
    siteSettings.authorTitle.trim() === "Docteur en Théologie, Serviteur de Jésus-Christ";

  const isDefaultAuthorBio = !siteSettings?.authorBio || 
    siteSettings.authorBio.includes("Auteur et enseignant de la saine doctrine biblique") ||
    siteSettings.authorBio.includes("Docteur LEMBA KAVUMBULA MOÏSE consacre son ministère");

  const isDefaultOverseerNotice = !siteSettings?.overseerNotice || 
    siteSettings.overseerNotice.includes("Toute cette œuvre est chapeautée par le Serviteur de Dieu KAYEMBE MWANANGIZI Lawi");

  const [customAuthorName, setCustomAuthorName] = useState(siteSettings?.authorName || '');
  const [customAuthorTitle, setCustomAuthorTitle] = useState(siteSettings?.authorTitle || '');
  const [customAuthorBio, setCustomAuthorBio] = useState(siteSettings?.authorBio || '');
  const [customOverseerNotice, setCustomOverseerNotice] = useState(siteSettings?.overseerNotice || '');

  useEffect(() => {
    let isMounted = true;
    if (language === 'fr') {
      setCustomAuthorName(siteSettings?.authorName || '');
      setCustomAuthorTitle(siteSettings?.authorTitle || '');
      setCustomAuthorBio(siteSettings?.authorBio || '');
      setCustomOverseerNotice(siteSettings?.overseerNotice || '');
      return;
    }

    if (!isDefaultAuthorName && siteSettings?.authorName) {
      translateDynamicText(siteSettings.authorName).then(t => { if (isMounted && t) setCustomAuthorName(t); });
    }
    if (!isDefaultAuthorTitle && siteSettings?.authorTitle) {
      translateDynamicText(siteSettings.authorTitle).then(t => { if (isMounted && t) setCustomAuthorTitle(t); });
    }
    if (!isDefaultAuthorBio && siteSettings?.authorBio) {
      translateDynamicText(siteSettings.authorBio).then(t => { if (isMounted && t) setCustomAuthorBio(t); });
    }
    if (!isDefaultOverseerNotice && siteSettings?.overseerNotice) {
      translateDynamicText(siteSettings.overseerNotice).then(t => { if (isMounted && t) setCustomOverseerNotice(t); });
    }

    return () => { isMounted = false; };
  }, [language, siteSettings, isDefaultAuthorName, isDefaultAuthorTitle, isDefaultAuthorBio, isDefaultOverseerNotice, translateDynamicText]);

  const authorNameDisplay = isDefaultAuthorName ? t('authorOfficialName') : (customAuthorName || siteSettings?.authorName);
  const authorTitleDisplay = isDefaultAuthorTitle ? t('authorOfficialTitle') : (customAuthorTitle || siteSettings?.authorTitle);
  const authorBioDisplay = isDefaultAuthorBio ? t('authorOfficialBio') : (customAuthorBio || siteSettings?.authorBio);
  const overseerNoticeDisplay = isDefaultOverseerNotice ? t('overseerNoticeText') : (customOverseerNotice || siteSettings?.overseerNotice);

  // First / Flagship Book for the Vitrine
  const defaultFlagshipBook: Book = React.useMemo(() => ({
    id: 'les-5-etapes-spirituelles-chretien',
    title: 'Les 5 Étapes Spirituelles Pour Devenir Chrétien',
    author: 'Docteur LEMBA KAVUMBULA MOÏSE',
    category: 'Vie Chrétienne & Sanctification',
    description: "Ouvrage magistral et étude biblique approfondie fondée sur 1 Pierre 5:10 : L'Appel Divin, La Souffrance d'un peu de temps, Le Perfectionnement, L'Affermissement et La Fortification divine.",
    cover_image: siteSettings?.showcaseCoverImage || siteSettings?.authorPhotoUrl || '',
    reading_file: "Les 5 Étapes Spirituelles Pour Devenir Chrétien selon 1 Pierre 5:10 par le Docteur LEMBA KAVUMBULA MOÏSE.",
    google_drive_url: siteSettings?.googleDriveUrl || 'https://drive.google.com/drive/folders/bibliothequechretien',
    created_at: '2025-01-01T00:00:00.000Z',
    status: 'Publié',
    ai_indexed_content: {
      summary: "Étude doctrinale sur les 5 étapes de la croissance spirituelle selon 1 Pierre 5:10.",
      keyThemes: ['Appel', 'Souffrance', 'Perfectionnement', 'Affermissement', 'Fortification'],
      chaptersSummary: [],
      biblicalReferences: ['1 Pierre 5:10'],
      indexedAt: '2025-01-01T00:00:00.000Z'
    },
    page_count: 220,
    reading_time_min: 180,
    featured: true,
    views_count: 1250,
    downloads_count: 850
  }), [siteSettings?.showcaseCoverImage, siteSettings?.authorPhotoUrl, siteSettings?.googleDriveUrl]);

  const flagshipBook = books.find(b => b.id === 'les-5-etapes-spirituelles-chretien') || books[0] || defaultFlagshipBook;
  const featuredBooks = books.slice(0, 8);

  const showcaseImage = siteSettings?.showcaseCoverImage || flagshipBook?.cover_image || '';

  // Durable client-side cache for author photo so it never flickers or disappears
  const [localAuthorPhoto, setLocalAuthorPhoto] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bdh_author_photo_url') || '';
    }
    return '';
  });

  useEffect(() => {
    if (siteSettings?.authorPhotoUrl) {
      if (siteSettings.authorPhotoUrl.startsWith('data:image/') || siteSettings.authorPhotoUrl.startsWith('http')) {
        try {
          localStorage.setItem('bdh_author_photo_url', siteSettings.authorPhotoUrl);
        } catch {}
        setLocalAuthorPhoto(siteSettings.authorPhotoUrl);
      }
    }
  }, [siteSettings?.authorPhotoUrl]);

  const authorPhoto = (siteSettings?.authorPhotoUrl && !siteSettings.authorPhotoUrl.includes('k9q4bl'))
    ? siteSettings.authorPhotoUrl
    : (localAuthorPhoto || '');

  // Add Book modal state for Home
  const [isHomeAddBookModalOpen, setIsHomeAddBookModalOpen] = useState(false);
  const [homeNewBook, setHomeNewBook] = useState({
    title: '',
    author: 'Docteur LEMBA KAVUMBULA MOÏSE',
    category: 'Vie Chrétienne & Sanctification',
    description: '',
    cover_image: '',
    google_drive_url: 'https://drive.google.com/',
    reading_content: '',
    page_count: 140
  });
  const [isSavingHomeBook, setIsSavingHomeBook] = useState(false);
  const [homeBookFormError, setHomeBookFormError] = useState('');

  const handleCreateHomeBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeNewBook.title.trim()) {
      setHomeBookFormError('Le titre du livre est obligatoire.');
      return;
    }
    if (!homeNewBook.author.trim()) {
      setHomeBookFormError("L'auteur est obligatoire.");
      return;
    }
    if (!homeNewBook.google_drive_url.trim()) {
      setHomeBookFormError('Le lien de téléchargement Google Drive est obligatoire.');
      return;
    }

    try {
      setIsSavingHomeBook(true);
      setHomeBookFormError('');

      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...homeNewBook,
          reading_file: homeNewBook.reading_content || `${homeNewBook.title} par ${homeNewBook.author}`
        })
      });

      if (res.ok) {
        showNotification('success', `Livre « ${homeNewBook.title} » ajouté avec succès avec sa photo d'aperçu !`);
        setIsHomeAddBookModalOpen(false);
        setHomeNewBook({
          title: '',
          author: 'Docteur LEMBA KAVUMBULA MOÏSE',
          category: 'Vie Chrétienne & Sanctification',
          description: '',
          cover_image: '',
          google_drive_url: 'https://drive.google.com/',
          reading_content: '',
          page_count: 140
        });
        if (onRefreshBooks) onRefreshBooks();
      } else {
        const data = await res.json();
        setHomeBookFormError(data.error || "Erreur lors de l'enregistrement du livre.");
      }
    } catch (err) {
      setHomeBookFormError("Impossible de joindre le serveur pour enregistrer le livre.");
    } finally {
      setIsSavingHomeBook(false);
    }
  };

  const copyVerse = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(`« ${verseDisplayText} » — ${verseDisplayRef} (${verseVersionBadge})`);
        setCopiedVerse(true);
        setTimeout(() => setCopiedVerse(false), 2500);
      }
    } catch (e) {
      console.warn('Clipboard write error', e);
    }
  };

  const stepsData = [
    {
      step: 1,
      name: t('showcaseStep1'),
      scripture: "1 Pi 5:10a",
      desc: language === 'en' ? "The divine call: waking up and turning away from worldly sleep." : language === 'sw' ? "Wito wa kimungu: kuamka na kugeuka kutoka usingizi wa kidunia." : language === 'ln' ? "Kobengama ya Nzambe: kolamuka mpe kotika pongi ya mokili." : "L'appel divin : le réveil intérieur et le renoncement aux vanités du siècle."
    },
    {
      step: 2,
      name: t('showcaseStep2'),
      scripture: "1 Pi 5:10b",
      desc: language === 'en' ? "The crucible of suffering: purifying faith through trials." : language === 'sw' ? "Tanuru la mateso: kutakasa imani kupitia majaribu." : language === 'ln' ? "Minyoko mpe komekama: bopeto ya kondima na kati ya moto." : "Le creuset de la souffrance : l'épreuve salutaire qui purifie la foi comme de l'or au feu."
    },
    {
      step: 3,
      name: t('showcaseStep3'),
      scripture: "1 Pi 5:10c",
      desc: language === 'en' ? "Divine perfecting: God Himself mends broken spiritual members." : language === 'sw' ? "Ukamilifu wa kiungu: Mungu mwenyewe hutengeneza sehemu zilizovunjika." : language === 'ln' ? "Kokomisa moto ya kokoka: Nzambe ye moko abongisaka bisika bipasuka." : "Le perfectionnement divin : Christ répare nos brèches et ajuste l'homme intérieur."
    },
    {
      step: 4,
      name: t('showcaseStep4'),
      scripture: "1 Pi 5:10d",
      desc: language === 'en' ? "Firm establishment: unshakable grounding on sound biblical doctrine." : language === 'sw' ? "Kuthubutu: mizizi thabiti katika mafundisho ya kweli ya Biblia." : language === 'ln' ? "Kotelema ngwi: kotiyama makasi na mateya ya solo ya Liloba." : "L'affermissement : des racines profondes pour ne point vaciller à tout vent de doctrine."
    },
    {
      step: 5,
      name: t('showcaseStep5'),
      scripture: "1 Pi 5:10e",
      desc: language === 'en' ? "Heavenly fortification: victorious power of the Spirit for the last hour." : language === 'sw' ? "Kutiwa nguvu: uwezo wa Roho kwa ushindi wa saa ya mwisho." : language === 'ln' ? "Kopesama nguya: bokasi ya Molimo Mosantu mpo na bolongi ya ngonga ya suka." : "La fortification : le revêtement de puissance victorieuse pour attendre le retour de Christ."
    }
  ];

  const advantages = [
    {
      title: t('adv1Title'),
      desc: t('adv1Desc'),
      icon: BookOpen
    },
    {
      title: t('adv2Title'),
      desc: t('adv2Desc'),
      icon: Layers
    },
    {
      title: t('adv3Title'),
      desc: t('adv3Desc'),
      icon: Flame
    },
    {
      title: t('adv4Title'),
      desc: t('adv4Desc'),
      icon: Sparkles
    }
  ];

  const handleOpenPhotoModal = (slot: SitePhotoSlot, title: string, currentUrl: string) => {
    setSitePhotoModalSlot(slot);
    setSitePhotoModalTitle(title);
    setSitePhotoModalCurrentUrl(currentUrl);
  };

  const handlePhotoSaved = (slot: SitePhotoSlot, url: string) => {
    if (slot === 'showcaseCoverImage') {
      setShowcaseImgError(false);
    } else if (slot === 'authorPhotoUrl') {
      setAuthorImgError(false);
      setLocalAuthorPhoto(url);
      if (typeof window !== 'undefined' && url) {
        try {
          localStorage.setItem('bdh_author_photo_url', url);
        } catch {}
      }
    }
    if (onRefreshSettings) onRefreshSettings();
    if (onRefreshBooks) onRefreshBooks();
    showNotification('success', 'Photo mise à jour avec succès !');
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-950 text-white border border-sky-500/40 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* HERO SECTION - Dignified, Sacred & Focused               */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-20 border-b border-slate-200/80 bg-gradient-to-b from-white via-sky-50/20 to-white">
        
        {/* Optional Admin Hero Background */}
        {siteSettings?.heroBackgroundImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
            style={{ backgroundImage: `url(${siteSettings.heroBackgroundImage})` }}
          />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Admin quick button to modify hero banner background */}
          {isAdmin && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => handleOpenPhotoModal('heroBackgroundImage', 'Arrière-plan de la Bannière d\'Accueil', siteSettings?.heroBackgroundImage || '')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
                title="Ajouter ou modifier l'arrière-plan de la bannière"
              >
                <Camera className="w-3.5 h-3.5 text-sky-600" />
                <span>Photo de Bannière</span>
              </button>
            </div>
          )}

          {/* Subtitle / Calling Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-900 text-xs font-bold tracking-wide uppercase mb-6 shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-sky-700 animate-pulse" />
            <span>{language === 'fr' ? (siteSettings?.heroBadge || t('heroBadge')) : t('heroBadge')}</span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto mb-6">
            {language === 'fr' && siteSettings?.heroTitle ? (
              siteSettings.heroTitle
            ) : (
              <>
                {t('heroTitle1')} <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-sky-700 via-sky-600 to-sky-800 bg-clip-text text-transparent">
                  {t('heroTitle2')}
                </span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-normal leading-relaxed mb-10">
            {language === 'fr' ? (siteSettings?.heroDescription || t('heroSubtitle')) : t('heroSubtitle')}
          </p>

          {/* Call to action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('library')}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm sm:text-base shadow-md shadow-sky-600/20 hover:shadow-sky-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <BookOpen className="w-5 h-5 text-white" />
              <span>{t('heroExploreBtn')}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            <button
              onClick={() => onNavigate('ai')}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white hover:bg-sky-50 text-sky-800 hover:text-sky-900 font-bold text-sm sm:text-base border border-sky-200 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>{t('heroAskAiBtn')}</span>
            </button>

            <button
              onClick={() => onNavigate('bible')}
              className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-semibold text-sm sm:text-base border border-slate-200 transition-all cursor-pointer shadow-xs"
            >
              <ScrollText className="w-5 h-5 text-sky-600" />
              <span>{t('heroBibleBtn')}</span>
            </button>
          </div>

          {/* Quick trust metrics */}
          <div className="mt-14 pt-8 border-t border-slate-200 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-2xs">
              <span className="block font-display text-2xl sm:text-3xl font-extrabold text-sky-700">{books.length}</span>
              <span className="text-xs sm:text-sm text-slate-600 font-medium">{t('statBooks')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-2xs">
              <span className="block font-display text-2xl sm:text-3xl font-extrabold text-slate-800">66</span>
              <span className="text-xs sm:text-sm text-slate-600 font-medium">{t('statBible')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-2xs">
              <span className="block font-display text-2xl sm:text-3xl font-extrabold text-sky-700">100%</span>
              <span className="text-xs sm:text-sm text-slate-600 font-medium">{t('statFree')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/70 border border-slate-200 shadow-2xs">
              <span className="block font-display text-2xl sm:text-3xl font-extrabold text-slate-800">Gemini IA</span>
              <span className="text-xs sm:text-sm text-slate-600 font-medium">{t('statAi')}</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* VITRINE INTERACTIVE DE PHOTOS                             */}
      {/* Défilement avec noms, légendes, zoom et gestion admin     */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InteractivePhotoShowcase 
          photos={showcasePhotos} 
          onNavigate={(target) => onNavigate(target)} 
          onNavigateToAdmin={() => onNavigate('admin')}
          isAdmin={isAdmin}
        />
      </section>

      {/* ========================================================= */}
      {/* SECTION VEDETTE : LIVRE OU DOCTRINE DES 5 ÉTAPES           */}
      {/* Si des livres existent : affiche l'ouvrage en vedette       */}
      {/* Si aucun livre n'existe : affiche l'étude doctrinale pure */}
      {/* ========================================================= */}
      {flagshipBook ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 lg:p-12 shadow-xl shadow-slate-200/50 overflow-hidden">
            
            {/* Subtle heavenly glow accents */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-100/50 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-50/70 blur-[90px] rounded-full pointer-events-none" />

            {/* Top header badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-8 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-2.5">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-600 text-white shadow-xs flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{t('showcaseBadge')}</span>
                </span>
                <span className="text-xs sm:text-sm text-sky-800 font-bold">
                  {language === 'en' ? 'N° 1 in Catalog' : language === 'sw' ? 'Nambari 1 kwenye Orodha' : language === 'ln' ? 'Buku ya Yambo na Orodha' : language === 'es' ? 'N° 1 en el Catálogo' : 'N° 1 au Catalogue'}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>{language === 'en' ? 'Pastoral Certified Work' : language === 'sw' ? 'Kitabu Kilichothibitishwa' : language === 'ln' ? 'Buku ya Sembo ya Mateya' : language === 'es' ? 'Obra Pastoral Certificada' : 'Ouvrage Pastoral Certifié'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Col: Photo of the Flagship Book with In-Place Admin Photo Control */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative group w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border-2 border-sky-100 bg-white">
                  
                  {showcaseImage && !showcaseImgError ? (
                    <img
                      src={showcaseImage}
                      alt={flagshipBook?.title || "Les 5 Étapes Spirituelles Pour Devenir Chrétien"}
                      className="w-full h-auto object-cover object-center group-hover:scale-102 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={() => setShowcaseImgError(true)}
                    />
                  ) : (
                    /* Stylized Christian Book Cover Placeholder */
                    <div className="w-full aspect-[3/4] bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900 text-white p-6 flex flex-col justify-between border border-sky-900/40 relative">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                          Ouvrage Magistral
                        </span>
                        <BookOpen className="w-5 h-5 text-sky-400" />
                      </div>

                      <div className="my-auto text-center space-y-2 py-4">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/10 border border-sky-400/40 flex items-center justify-center mb-2">
                          <Sparkles className="w-6 h-6 text-sky-400" />
                        </div>
                        <h3 className="font-display font-extrabold text-lg sm:text-xl text-white leading-tight">
                          {flagshipBook?.title || "Les 5 Étapes Spirituelles Pour Devenir Chrétien"}
                        </h3>
                        <p className="text-xs text-sky-300 font-semibold uppercase tracking-wider">
                          {flagshipBook?.author || "Docteur LEMBA KAVUMBULA MOÏSE"}
                        </p>
                        <p className="text-[11px] text-slate-300 italic pt-1">
                          Fondé sur 1 Pierre 5:10
                        </p>
                      </div>

                      <div className="border-t border-slate-800 pt-3 text-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">
                          Bibliothèque Chrétienne de la Dernière Heure
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Visual badge overlay */}
                  {showcaseImage && !showcaseImgError && (
                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">
                        {flagshipBook?.author || "Docteur LEMBA KAVUMBULA MOÏSE"}
                      </span>
                      <span className="text-[11px] text-slate-200 font-medium">
                        {language === 'en' ? 'Illustrated Sanctification Edition' : language === 'sw' ? 'Toleo la Kipekee la Utakaso' : language === 'ln' ? 'Kobimisa ya Bopeto ya Nzambe' : language === 'es' ? 'Edición Ilustrada de Santificación' : 'Grand format illustré • Édition de Sanctification'}
                      </span>
                    </div>
                  )}

                  {/* Admin in-place button to add or change the showcase cover photo */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenPhotoModal('showcaseCoverImage', 'Photo de Couverture « Les 5 Étapes »', showcaseImage)}
                      className="absolute top-3 right-3 z-30 px-3 py-2 rounded-xl bg-slate-950/85 hover:bg-sky-600 text-white text-xs font-bold border border-white/20 shadow-xl backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                      title="Ajouter ou modifier la photo de l'ouvrage phare"
                    >
                      <Camera className="w-4 h-4 text-sky-300" />
                      <span>{showcaseImage && !showcaseImgError ? 'Modifier photo' : '+ Ajouter photo'}</span>
                    </button>
                  )}
                </div>

                {/* Quick metrics under photo */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-sm mt-4 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
                    <span className="block text-sm font-extrabold text-sky-700">5 Étapes</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{language === 'en' ? 'Faith Keys' : language === 'sw' ? 'Misingi ya Imani' : language === 'ln' ? 'Mabaku ma kondima' : language === 'es' ? 'Claves de la Fe' : 'Clés de la foi'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
                    <span className="block text-sm font-extrabold text-slate-800">{flagshipBook?.page_count || 220} Pages</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{language === 'en' ? 'Doctrine' : language === 'sw' ? 'Mafundisho' : language === 'ln' ? 'Mateya' : language === 'es' ? 'Doctrina' : 'Enseignement'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
                    <span className="block text-sm font-extrabold text-emerald-700">{language === 'en' ? 'Free' : language === 'sw' ? 'Bure' : language === 'ln' ? 'Ofele' : language === 'es' ? 'Gratis' : 'Gratuit'}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">Google Drive</span>
                  </div>
                </div>
              </div>

              {/* Right Col: Title, Description, 5 Steps Journey, and Actions */}
              <div className="lg:col-span-7 space-y-6">
                
                <div>
                  <span className="inline-block text-xs font-bold uppercase tracking-widest text-sky-700 mb-2">
                    {t('showcaseAuthorRole')}
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                    {flagshipBook?.title || t('showcaseHeading')}
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-sky-800 font-semibold">
                    {flagshipBook?.description || t('showcaseSubheading')}
                  </p>
                </div>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  {t('showcaseDescription')}
                </p>

                {/* Interactive Visual Display of the 5 Spiritual Steps */}
                <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-700" />
                      <span>{t('showcase5StepsLabel')}</span>
                    </span>
                    <button
                      onClick={() => onNavigate('spiritual-steps')}
                      className="text-[11px] text-sky-700 hover:text-sky-900 font-bold underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t('homeExploreStepsFull')}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Step Selector Tabs */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {stepsData.map((s, idx) => (
                      <button
                        key={s.step}
                        onClick={() => setActiveStepTab(idx)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                          activeStepTab === idx
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:text-sky-800 hover:bg-sky-50 border border-slate-200'
                        }`}
                      >
                        {language === 'en' ? `Step ${s.step}` : language === 'sw' ? `Hatua ${s.step}` : language === 'ln' ? `Etando ${s.step}` : language === 'es' ? `Etapa ${s.step}` : `Étape ${s.step}`}
                      </button>
                    ))}
                  </div>

                  {/* Active Step Content */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900">
                        {stepsData[activeStepTab].name}
                      </h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-mono font-semibold border border-sky-200">
                        {stepsData[activeStepTab].scripture}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {stepsData[activeStepTab].desc}
                    </p>
                  </div>
                </div>

                {/* Action Buttons: Read Online, Download Google Drive, AI Questions */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onOpenBook(flagshipBook)}
                    className="flex-1 min-w-[200px] py-3.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-white" />
                    <span>{t('showcaseReadBtn')}</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>

                  <button
                    onClick={() => setIsMainBookModalOpen(true)}
                    className="py-3.5 px-5 rounded-xl bg-amber-50 hover:bg-amber-100 text-black border border-amber-200 font-bold text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                    title="Voir la table des matières, résumé et options de téléchargement"
                  >
                    <FileText className="w-4 h-4 text-slate-800" />
                    <span className="text-black">{t('homeSummarySheetBtn')}</span>
                  </button>

                  <a
                    href={flagshipBook?.google_drive_url || "https://drive.google.com/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3.5 px-5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-sky-800 border border-slate-200 font-semibold text-sm flex items-center justify-center gap-2 shadow-2xs transition-all"
                  >
                    <DownloadCloud className="w-4 h-4 text-sky-600" />
                    <span>{t('showcaseDownloadBtn')}</span>
                  </a>

                  <button
                    onClick={() => onNavigate('spiritual-steps')}
                    className="py-3.5 px-5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-sky-600" />
                    <span>{t('homeJourneyStepsBtn')}</span>
                  </button>

                  <button
                    onClick={() => onNavigate('ai', flagshipBook?.id)}
                    className="py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-black border border-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Interroger l'IA sur ce livre"
                  >
                    <Sparkles className="w-4 h-4 text-slate-700" />
                    <span className="text-black">{t('showcaseAiAnalysisBtn')}</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        </section>
      ) : (
        /* Section doctrinale pure : affichée lorsqu'aucun livre n'a encore été ajouté */
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 lg:p-12 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-100/50 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-50/70 blur-[90px] rounded-full pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-8 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-2.5">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-600 text-white shadow-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 fill-current" />
                  <span>{t('spiritualStepsBadge')}</span>
                </span>
                <span className="text-xs sm:text-sm text-sky-800 font-bold">
                  1 Pierre 5:10
                </span>
              </div>
              <button
                onClick={() => onNavigate('spiritual-steps')}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs text-sky-800 font-semibold cursor-pointer transition-colors"
              >
                <span>{t('spiritualStepsExegesisBtn')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-sky-700 mb-2">
                  {t('heroInitiator')}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                  {t('spiritualStepsTitle')}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-sky-800 font-semibold">
                  {t('spiritualStepsSubtitle')}
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {t('showcaseDescription')}
              </p>

              {/* Interactive Visual Display of the 5 Spiritual Steps */}
              <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-700" />
                    <span>{t('showcase5StepsLabel')}</span>
                  </span>
                  <button
                    onClick={() => onNavigate('spiritual-steps')}
                    className="text-[11px] text-sky-700 hover:text-sky-900 font-bold underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t('spiritualStepsExegesisBtn')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {stepsData.map((s, idx) => (
                    <button
                      key={s.step}
                      onClick={() => setActiveStepTab(idx)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                        activeStepTab === idx
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:text-sky-800 hover:bg-sky-50 border border-slate-200'
                      }`}
                    >
                      {language === 'en' ? `Step ${s.step}` : language === 'sw' ? `Hatua ${s.step}` : language === 'ln' ? `Etando ${s.step}` : language === 'es' ? `Paso ${s.step}` : `Étape ${s.step}`}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <h4 className="font-bold text-sm text-slate-900">
                      {stepsData[activeStepTab].name}
                    </h4>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-mono font-semibold border border-sky-200">
                      {stepsData[activeStepTab].scripture}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {stepsData[activeStepTab].desc}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigate('spiritual-steps')}
                  className="py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-white" />
                  <span>{t('spiritualStepsExegesisBtn')}</span>
                </button>
                <button
                  onClick={() => setIsHomeAddBookModalOpen(true)}
                  className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-sky-300" />
                  <span>{t('addFirstBookBtn')}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Book Detailed Modal with Table of Contents & Admin Editing */}
      {isMainBookModalOpen && flagshipBook && (
        <MainBookDetailModal
          book={flagshipBook}
          isOpen={isMainBookModalOpen}
          onClose={() => setIsMainBookModalOpen(false)}
          onReadOnline={(b) => {
            setIsMainBookModalOpen(false);
            onOpenBook(b);
          }}
          onAskAi={(bId) => {
            setIsMainBookModalOpen(false);
            onNavigate('ai', bId);
          }}
          isAdmin={isAdmin}
          onBookUpdated={() => {
            if (onRefreshBooks) onRefreshBooks();
          }}
        />
      )}

      {/* ========================================================= */}
      {/* SECTION : PRÉSENTATION OFFICIELLE DE L'AUTEUR              */}
      {/* Docteur LEMBA KAVUMBULA MOÏSE                             */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 text-white p-8 sm:p-12 border border-slate-800 shadow-2xl overflow-hidden">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Author Portrait with Admin In-Place Photo Control */}
            <div className="md:col-span-4 flex flex-col items-center">
              <div className="relative group w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden border-2 border-sky-500/40 bg-slate-950 shadow-2xl flex items-center justify-center">
                {authorPhoto && !authorImgError ? (
                  <img
                    src={authorPhoto}
                    alt={siteSettings?.authorName || "Docteur LEMBA KAVUMBULA MOÏSE"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={() => {
                      const backup = typeof window !== 'undefined' ? localStorage.getItem('bdh_author_photo_url') : null;
                      if (backup && backup !== authorPhoto && backup.startsWith('data:image/')) {
                        setLocalAuthorPhoto(backup);
                      } else {
                        setAuthorImgError(true);
                      }
                    }}
                  />
                ) : (
                  <div className="text-center p-4">
                    <User className="w-16 h-16 text-sky-400/80 mx-auto mb-2" />
                    <span className="text-xs text-sky-200 font-bold block">
                      Portrait Officiel
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Docteur LEMBA
                    </span>
                  </div>
                )}

                {/* Admin button to add or change author photo */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleOpenPhotoModal('authorPhotoUrl', 'Photo Officielle du Docteur LEMBA KAVUMBULA MOÏSE', authorPhoto)}
                    className="absolute bottom-2 inset-x-2 py-1.5 px-2 rounded-xl bg-slate-950/90 hover:bg-sky-600 text-white text-[11px] font-bold border border-white/20 shadow-md backdrop-blur-md flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    title="Ajouter ou modifier la photo officielle de l'auteur"
                  >
                    <Camera className="w-3.5 h-3.5 text-sky-300" />
                    <span>{authorPhoto && !authorImgError ? 'Modifier photo' : '+ Photo de l\'Auteur'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Author Biography & Pastoral Leadership */}
            <div className="md:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>{t('authorSectionBadge')}</span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {authorNameDisplay}
              </h3>

              <p className="text-xs sm:text-sm text-sky-300 font-semibold">
                {authorTitleDisplay}
              </p>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {authorBioDisplay}
              </p>

              <div className="pt-2 border-t border-slate-800/80">
                <p className="text-xs text-amber-200/90 italic font-medium leading-relaxed">
                  « {overseerNoticeDisplay} »
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* VERSE OF THE DAY SECTION - Pure & Luminous                */}
      {/* ========================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-amber-50/50 via-white to-sky-50/50 border border-slate-200 p-6 sm:p-10 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-black border border-amber-200 shadow-2xs">
                <ScrollText className="w-5 h-5 text-slate-800" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs uppercase tracking-widest text-black font-bold block">
                    {t('verseOfTheDayBadge')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-950 border border-amber-300 shadow-2xs">
                    {verseVersionBadge}
                  </span>
                </div>
                <span className="font-display font-bold text-lg text-slate-900">
                  {verseDisplayRef}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Multi-version Bible translation toggle buttons */}
              {!isRawCustomVerse && resolvedVerseData.availableVersions.length > 1 && (
                <div className="flex items-center gap-1 bg-white/90 p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider hidden sm:inline">
                    Version:
                  </span>
                  {resolvedVerseData.availableVersions.map((v) => {
                    const isSelected = activeVerseVersion === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setExplicitVerseVersion(v.id as BibleVersionId)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-700 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title={v.label}
                      >
                        {v.id}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={copyVerse}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                title={t('shareVerse')}
              >
                {copiedVerse ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedVerse ? t('homeCopiedText') : t('shareVerse')}</span>
              </button>

              <button
                onClick={() => onNavigate('bible')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold border border-sky-200 transition-colors cursor-pointer"
              >
                <span>{t('studyBibleLink')}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <p className="font-reading text-lg sm:text-xl text-slate-800 italic leading-relaxed mb-4">
            « {verseDisplayText} »
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-slate-600 pt-2 border-t border-slate-100">
            <p className="font-normal leading-relaxed">
              <strong className="text-slate-800 font-bold">{t('verseThemeLabel')} :</strong> {verseDisplayTheme}
            </p>
            <span className="text-[11px] text-slate-500 font-medium">
              {verseVersionName}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CORE ADVANTAGES & SPIRITUAL PILLARS                       */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-700 mb-2 block">
            {t('advSubtitle')}
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900">
            {t('advTitle')}
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-sky-600 to-amber-500 mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {advantages.map((adv, idx) => {
            const Icon = adv.icon;
            return (
              <div 
                key={idx}
                className="group relative p-6 sm:p-7 rounded-2xl bg-white hover:bg-sky-50/30 border border-slate-200 hover:border-sky-300 transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-100 transition-all duration-300">
                    <Icon className="w-6 h-6 text-sky-600" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-sky-800 transition-colors">
                    {adv.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {adv.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs text-sky-700 font-semibold">
                  <span className="group-hover:translate-x-1 transition-transform">{t('homeInstantAccess')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* FEATURED BOOKS SECTION (SEULEMENT CEUX AJOUTÉS PAR L'ADMIN)*/}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-sky-700 mb-1 block">
              {t('featuredBadge')}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t('featuredTitle')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsHomeAddBookModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('homeAddBookBtn')}</span>
            </button>
            {books.length > 0 && (
              <button
                onClick={() => onNavigate('library')}
                className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-900 transition-colors cursor-pointer group"
              >
                <span>{t('viewAllBooks')} ({books.length})</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {books.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 text-center max-w-xl mx-auto space-y-4 shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900">
              {t('homeEmptyBooksTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              {t('homeEmptyBooksDesc')}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsHomeAddBookModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 cursor-pointer shadow-md shadow-sky-600/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t('homeAddBookBtn')}</span>
              </button>
              <button
                onClick={() => onNavigate('library')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                {t('heroExploreBtn')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book) => (
              <div
                key={book.id}
                className="group relative rounded-2xl bg-white border border-slate-200 hover:border-sky-400/60 overflow-hidden flex flex-col justify-between transition-all duration-300 ease-out transform hover:-translate-y-2.5 hover:scale-[1.015] hover:shadow-[0_22px_40px_-12px_rgba(14,165,233,0.22),0_10px_20px_-8px_rgba(0,0,0,0.06)] shadow-xs will-change-transform"
              >
                {/* Gentle floating ambient glow on hover */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-sky-400/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                {/* Book Cover with in-place admin photo management */}
                <div className="relative">
                  <BookCoverDisplay
                    book={book}
                    isAdmin={isAdmin}
                    onPhotoUpdated={() => {
                      if (onRefreshBooks) onRefreshBooks();
                      showNotification('success', `Photo de couverture mise à jour pour « ${book.title} » !`);
                    }}
                    onNotify={showNotification}
                  />

                  {/* Category chip */}
                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200 shadow-sm">
                      {book.category}
                    </span>
                  </div>
                </div>

                {/* Book Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-base text-slate-900 line-clamp-1 group-hover:text-sky-700 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-sky-700 font-semibold">
                      {book.author}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      {book.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{book.reading_time_min || 120} {t('readingTime')}</span>
                      <span>{book.page_count || 180} {t('pagesCount')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenBook(book)}
                        className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{t('readOnlineBtn')}</span>
                      </button>

                      <a
                        href={book.google_drive_url || 'https://drive.google.com/'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-sky-700 border border-slate-200 shadow-xs transition-colors"
                        title="Télécharger sur Google Drive"
                      >
                        <DownloadCloud className="w-3.5 h-3.5 text-sky-600" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* SECTION : POSER UNE QUESTION À L'ADMINISTRATEUR          */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative rounded-3xl bg-gradient-to-br from-sky-50 via-white to-amber-50/50 border border-sky-200/80 p-8 sm:p-12 overflow-hidden shadow-lg shadow-sky-100/50">
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-sky-200 text-sky-800 text-xs font-bold shadow-2xs">
                <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('homeQuestionsTeaserBadge')}</span>
              </div>
              
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                {t('homeQuestionsTeaserTitle')}
              </h2>
              
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {t('homeQuestionsTeaserDesc')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0 w-full md:w-auto">
              <button
                onClick={() => onNavigate('ask-admin')}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-sky-600/25 hover:scale-102 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('homeAskAdminBtn')}</span>
              </button>

              <button
                onClick={() => onNavigate('my-questions')}
                className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <span>{t('homeMyQuestionsBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Site Photo Upload Modal for Administrator */}
      {sitePhotoModalSlot && (
        <SitePhotoUploadModal
          isOpen={Boolean(sitePhotoModalSlot)}
          onClose={() => setSitePhotoModalSlot(null)}
          slot={sitePhotoModalSlot}
          slotTitle={sitePhotoModalTitle}
          currentPhotoUrl={sitePhotoModalCurrentUrl}
          onPhotoSaved={handlePhotoSaved}
          onNotify={showNotification}
        />
      )}

      {/* Modal: Ajouter un Livre directement depuis l'Accueil */}
      {isHomeAddBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-sky-900 via-slate-900 to-sky-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    Ajouter un Livre dans la Bibliothèque
                  </h3>
                  <p className="text-xs text-sky-200">
                    Avec photo d'aperçu et lien Google Drive
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHomeAddBookModalOpen(false)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateHomeBook} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {homeBookFormError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{homeBookFormError}</span>
                </div>
              )}

              {/* Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Titre de l'ouvrage <span className="text-sky-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={homeNewBook.title}
                    onChange={(e) => setHomeNewBook({ ...homeNewBook, title: e.target.value })}
                    placeholder="Ex: Les 5 Étapes Spirituelles"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Auteur <span className="text-sky-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={homeNewBook.author}
                    onChange={(e) => setHomeNewBook({ ...homeNewBook, author: e.target.value })}
                    placeholder="Docteur LEMBA KAVUMBULA MOÏSE"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Category & Pages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Catégorie</label>
                  <select
                    value={homeNewBook.category}
                    onChange={(e) => setHomeNewBook({ ...homeNewBook, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none cursor-pointer focus:border-sky-500 focus:bg-white"
                  >
                    <option value="Vie Chrétienne & Sanctification">Vie Chrétienne & Sanctification</option>
                    <option value="Prière & Intercession">Prière & Intercession</option>
                    <option value="Foi & Encouragement">Foi & Encouragement</option>
                    <option value="Ministère & Réveil">Ministère & Réveil</option>
                    <option value="Édification Spirituelle">Édification Spirituelle</option>
                    <option value="Eschatologie & Prophétie">Eschatologie & Prophétie</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nombre de pages</label>
                  <input
                    type="number"
                    value={homeNewBook.page_count}
                    onChange={(e) => setHomeNewBook({ ...homeNewBook, page_count: Number(e.target.value) || 120 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Photo de Couverture (Aperçu) */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-sky-600" />
                    <span>Photo de Couverture (Aperçu du livre)</span>
                  </label>
                  {homeNewBook.cover_image && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Photo prête
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
                    <UploadCloud className="w-4 h-4" />
                    <span>Importer une photo depuis l'appareil</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) {
                          setHomeBookFormError("La photo ne doit pas dépasser 10 Mo.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setHomeNewBook(prev => ({ ...prev, cover_image: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400 font-semibold">ou URL :</span>
                  <input
                    type="text"
                    value={homeNewBook.cover_image.startsWith('data:') ? '' : homeNewBook.cover_image}
                    onChange={(e) => setHomeNewBook({ ...homeNewBook, cover_image: e.target.value })}
                    placeholder="https://... (URL d'image)"
                    className="flex-1 w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-sky-500"
                  />
                </div>

                {homeNewBook.cover_image && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200">
                    <img
                      src={homeNewBook.cover_image}
                      alt="Aperçu sélectionné"
                      className="w-12 h-16 object-cover rounded-lg shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-800 block">
                        Aperçu de la couverture
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Cette photo s'affichera comme couverture sur la page d'accueil et dans la bibliothèque.
                      </p>
                      <button
                        type="button"
                        onClick={() => setHomeNewBook({ ...homeNewBook, cover_image: '' })}
                        className="text-[11px] text-rose-600 hover:text-rose-700 underline font-semibold mt-1 cursor-pointer"
                      >
                        Retirer la photo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Google Drive URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Lien de Téléchargement Google Drive <span className="text-sky-600">*</span></span>
                  <span className="text-[11px] text-slate-500 font-normal">Pour le bouton « Télécharger »</span>
                </label>
                <input
                  type="url"
                  required
                  value={homeNewBook.google_drive_url}
                  onChange={(e) => setHomeNewBook({ ...homeNewBook, google_drive_url: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:border-sky-500 focus:bg-white font-mono"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description / Résumé</label>
                <textarea
                  rows={2}
                  value={homeNewBook.description}
                  onChange={(e) => setHomeNewBook({ ...homeNewBook, description: e.target.value })}
                  placeholder="Présentation concise de l'œuvre spirituelle..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none resize-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsHomeAddBookModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingHomeBook}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingHomeBook ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publication en cours...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Publier le livre avec sa photo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
