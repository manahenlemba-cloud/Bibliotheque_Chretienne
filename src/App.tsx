import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { Book, SiteSettings } from './types';
import { INITIAL_BOOKS } from './data/initialBooks';
import { getFavorites, toggleFavoriteInStorage, addRecentReading } from './utils/storage';
import { useOffline } from './context/OfflineContext';
import { getAllCachedBooks, clearAllOfflineCache } from './utils/indexedDb';
import { Sparkles, X, ArrowRight, WifiOff, HardDrive } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DrLembaChatbotModal } from './components/DrLembaChatbotModal';
import { MainBookDetailModal } from './components/MainBookDetailModal';
import { AuthModal } from './components/AuthModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';

import { LibraryView } from './components/LibraryView';
import { BookReaderView } from './components/BookReaderView';
import { BibleView } from './components/BibleView';
import { AiAssistantView } from './components/AiAssistantView';
import { ContactView } from './components/ContactView';
import { AdminView } from './components/AdminView';
import { AskAdminView } from './components/AskAdminView';
import { MyQuestionsView } from './components/MyQuestionsView';
import { SpiritualJourneyView } from './components/SpiritualJourneyView';
import { SermonsView } from './components/SermonsView';
import { ReadingPlanView } from './components/ReadingPlanView';
import { HistoryView } from './components/HistoryView';

const handlePreloadView = (_view: string) => {
  // Views are bundled statically for instantaneous, reliable loading without module fetch failures
};

const INITIAL_SITE_SETTINGS: SiteSettings = {
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
  authorPhotoUrl: typeof window !== 'undefined' ? (localStorage.getItem('bdh_author_photo_url') || '') : '',
  showcaseCoverImage: "",
  heroBackgroundImage: "",
  logoUrl: "",
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
  googleDriveUrl: "https://drive.google.com/drive/folders/bibliothequechretien",
  categories: [
    "Vie Chrétienne & Sanctification",
    "Prière & Intercession",
    "Foi & Encouragement",
    "Ministère & Réveil",
    "Édification Spirituelle"
  ]
};

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [selectedBook, setSelectedBook] = useState<Book | null>(INITIAL_BOOKS[0] || null);
  const [aiBookScope, setAiBookScope] = useState<string | undefined>(undefined);
  const [aiInitialQuestion, setAiInitialQuestion] = useState<string | undefined>(undefined);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(INITIAL_SITE_SETTINGS);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMainBookModalOpen, setIsMainBookModalOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  // Offline context
  const { isOnline, cachedBooks, saveBookOffline } = useOffline();

  // Check URL params on initial load and handle browser back/forward
  useEffect(() => {
    const handleUrlNavigation = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        const bookParam = params.get('book');
        
        if (viewParam && ['home', 'sermons', 'reading-plan', 'spiritual-steps', 'library', 'bible', 'ai', 'contact', 'admin', 'ask-admin', 'my-questions', 'book', 'history'].includes(viewParam)) {
          setCurrentView(viewParam);
        }
        if (bookParam && books.length > 0) {
          const found = books.find(b => b.id === bookParam);
          if (found) setSelectedBook(found);
        }
      } catch (e) {
        console.warn('Navigation URL parsing error:', e);
      }
    };

    handleUrlNavigation();
    window.addEventListener('popstate', handleUrlNavigation);
    return () => window.removeEventListener('popstate', handleUrlNavigation);
  }, [books]);

  // Load favorites, books & site settings
  useEffect(() => {
    setFavorites(getFavorites());
    fetchBooks();
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const res = await fetch('/api/site-settings');
      if (res.ok) {
        const data = await res.json();
        setSiteSettings(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.warn("Paramètres locaux de réserve", e);
    }
  };

  const fetchBooks = async () => {
    try {
      setIsLoadingBooks(true);
      const res = await fetch('/api/books');
      if (res.ok) {
        const data = await res.json();
        const list: Book[] = Array.isArray(data) ? data : (data.books || []);
        setBooks(list);
        if (list.length === 0) {
          clearAllOfflineCache().catch(() => {});
        }
        if (selectedBook) {
          const updated = list.find((b: Book) => b.id === selectedBook.id);
          setSelectedBook(updated || (list.length > 0 ? list[0] : null));
        } else if (list.length > 0) {
          setSelectedBook(list[0]);
        } else {
          setSelectedBook(null);
        }
      } else {
        throw new Error(`Réseau indisponible: ${res.status}`);
      }
    } catch (err) {
      console.warn("Utilisation du stockage hors-ligne IndexedDB et du corpus local :", err);
      try {
        const cached = await getAllCachedBooks();
        if (cached && cached.length > 0) {
          const cachedBooksList = cached.map((c) => c.book);
          setBooks((prev) => {
            const map = new Map(prev.map((b) => [b.id, b]));
            for (const b of cachedBooksList) {
              map.set(b.id, b);
            }
            return Array.from(map.values());
          });
        }
      } catch (dbErr) {
        console.warn("Échec de chargement depuis IndexedDB:", dbErr);
      }
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const handleToggleFavorite = (bookId: string) => {
    const updated = toggleFavoriteInStorage(bookId);
    setFavorites(updated);
  };

  const handleOpenBook = (book: Book) => {
    setSelectedBook(book);
    addRecentReading(book.id);
    // Persistent caching of consulted book in IndexedDB for offline reading
    saveBookOffline(book, favorites.includes(book.id)).catch(() => {});
    setCurrentView('book');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskAiAboutBook = (bookId: string) => {
    setAiBookScope(bookId);
    setAiInitialQuestion(undefined);
    setCurrentView('ai');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskAiWithVerse = (verseOrQuery: string) => {
    setAiBookScope('all');
    setAiInitialQuestion(verseOrQuery);
    setCurrentView('ai');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: string, bookId?: string) => {
    if (bookId) {
      const b = books.find(item => item.id === bookId);
      if (b) setSelectedBook(b);
      setAiBookScope(bookId);
    } else {
      setAiBookScope(undefined);
      setAiInitialQuestion(undefined);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Dynamic Announcement Banner managed by Gemini AI & Admin */}
      {siteSettings?.announcementBanner?.active && !bannerDismissed && (
        <div className="bg-gradient-to-r from-sky-50 via-sky-100 to-amber-50 border-b border-sky-200/80 px-4 py-2.5 text-xs shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-bold uppercase tracking-wider flex-shrink-0 flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3" />
                {siteSettings.announcementBanner.badge || "Dernière Heure"}
              </span>
              <p className="text-sky-950 truncate text-xs sm:text-sm font-semibold">
                {siteSettings.announcementBanner.text}
              </p>
              {siteSettings.announcementBanner.linkText && (
                <button
                  onClick={() => handleNavigate('library')}
                  className="hidden md:inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 font-bold text-xs ml-2 cursor-pointer"
                >
                  <span>{siteSettings.announcementBanner.linkText}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0 cursor-pointer"
              title="Fermer la bannière"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Main Navigation */}
      <Navbar 
        currentView={currentView} 
        onNavigate={(view) => handleNavigate(view)} 
        favoritesCount={favorites.length}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onPreloadView={handlePreloadView}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
      />

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-black shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
              <span className="text-black">
                <strong className="text-black">Mode Hors-Connexion Actif :</strong> Vous pouvez continuer à lire vos ouvrages favoris et consultés stockés dans IndexedDB ({cachedBooks.length} ouvrage(s) disponible(s)).
              </span>
            </div>
            <button
              onClick={() => handleNavigate('library')}
              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-black border border-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <HardDrive className="w-3.5 h-3.5 text-slate-800" />
              <span className="text-black">Consulter mes livres hors-ligne</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content View Container */}
      <main className="flex-1">
        {/* Instant Home View (rendered synchronously without code-splitting delay) */}
        {currentView === 'home' && (
          <HomeView
            books={books}
            onNavigate={handleNavigate}
            onOpenBook={handleOpenBook}
            siteSettings={siteSettings}
            isAdmin={localStorage.getItem('bdh_admin_auth') === 'true'}
            onRefreshBooks={fetchBooks}
            onRefreshSettings={fetchSiteSettings}
          />
        )}

        {/* Secondary and deep-dive views */}
        {currentView === 'spiritual-steps' && (
            <SpiritualJourneyView
              onNavigate={handleNavigate}
              onOpenBook={handleOpenBook}
              books={books}
              isAdmin={localStorage.getItem('bdh_admin_auth') === 'true'}
              onBooksChange={fetchBooks}
            />
          )}

          {currentView === 'ask-admin' && (
            <AskAdminView
              onNavigate={handleNavigate}
              books={books}
              initialBookId={selectedBook?.id}
            />
          )}

          {currentView === 'my-questions' && (
            <MyQuestionsView
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'library' && (
            <LibraryView
              books={books}
              onOpenBook={handleOpenBook}
              onAskAiAboutBook={handleAskAiAboutBook}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onRefreshBooks={fetchBooks}
              onNavigate={handleNavigate}
              siteSettings={siteSettings}
            />
          )}

          {currentView === 'history' && (
            <HistoryView
              books={books}
              onNavigate={handleNavigate}
              onOpenBook={handleOpenBook}
              onAskAiAboutBook={handleAskAiAboutBook}
              siteSettings={siteSettings}
            />
          )}

          {currentView === 'book' && (
            selectedBook ? (
              <BookReaderView
                book={selectedBook}
                onBack={() => handleNavigate('library')}
                onAskAi={handleAskAiAboutBook}
                isFavorite={favorites.includes(selectedBook.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : (
              <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
                <p className="text-slate-400">Aucun livre sélectionné ou l'ouvrage est en cours de chargement.</p>
                <button
                  onClick={() => handleNavigate('library')}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm cursor-pointer shadow-md"
                >
                  Explorer la Bibliothèque
                </button>
              </div>
            )
          )}

          {currentView === 'bible' && (
            <BibleView 
              onAskAiWithVerse={handleAskAiWithVerse}
            />
          )}

          {currentView === 'ai' && (
            <AiAssistantView
              books={books}
              initialBookId={aiBookScope}
              initialQuestion={aiInitialQuestion}
            />
          )}

          {currentView === 'sermons' && (
            <SermonsView
              isAdmin={localStorage.getItem('bdh_admin_auth') === 'true'}
              onNavigateToAdmin={() => handleNavigate('admin')}
            />
          )}

          {currentView === 'reading-plan' && (
            <ReadingPlanView
              onNavigateToBible={(book, ch) => {
                handleNavigate('bible');
              }}
            />
          )}

          {currentView === 'contact' && (
            <ContactView />
          )}

          {currentView === 'admin' && (
            <AdminView
              books={books}
              onRefreshBooks={fetchBooks}
              siteSettings={siteSettings}
              onRefreshSettings={fetchSiteSettings}
            />
          )}

        {/* Safe fallback if view is unrecognized or book view without valid selected book */}
        {(!['home', 'sermons', 'reading-plan', 'spiritual-steps', 'ask-admin', 'my-questions', 'library', 'bible', 'ai', 'contact', 'admin'].includes(currentView) && (currentView !== 'book' || !selectedBook)) && (
          <HomeView
            books={books}
            onNavigate={handleNavigate}
            onOpenBook={handleOpenBook}
            siteSettings={siteSettings}
            isAdmin={localStorage.getItem('bdh_admin_auth') === 'true'}
            onRefreshBooks={fetchBooks}
            onRefreshSettings={fetchSiteSettings}
          />
        )}
      </main>

      {/* Spiritual Premium Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Floating 24/7 AI Chatbot: Dr. LEMBA KAVUMBULA Moïse */}
      <ErrorBoundary fallback={null}>
        <DrLembaChatbotModal 
          onNavigateToBook={(bId) => {
            const b = books.find(item => item.id === bId);
            if (b) handleOpenBook(b);
          }}
          onNavigateToSermon={() => handleNavigate('sermons')}
        />
      </ErrorBoundary>

      {/* Main Book Detail Modal */}
      {isMainBookModalOpen && selectedBook && (
        <ErrorBoundary fallback={null}>
          <MainBookDetailModal
            book={selectedBook}
            isOpen={isMainBookModalOpen}
            onClose={() => setIsMainBookModalOpen(false)}
            onReadOnline={(b) => {
              setIsMainBookModalOpen(false);
              handleOpenBook(b);
            }}
            onAskAi={(bId) => {
              setIsMainBookModalOpen(false);
              handleAskAiAboutBook(bId);
            }}
            isAdmin={localStorage.getItem('bdh_admin_auth') === 'true'}
            onBookUpdated={fetchBooks}
          />
        </ErrorBoundary>
      )}

      {/* Global Authentication Modal */}
      <ErrorBoundary fallback={null}>
        <AuthModal />
      </ErrorBoundary>

      {/* Global Spotlight Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        books={books}
        onNavigate={handleNavigate}
        onOpenBook={handleOpenBook}
        onAskAi={handleAskAiWithVerse}
      />

    </div>
  );
}
