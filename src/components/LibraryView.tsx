import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  BookOpen, 
  DownloadCloud, 
  Sparkles, 
  Bookmark, 
  Grid, 
  List, 
  ArrowUpDown, 
  X,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  FileText,
  UserCheck,
  Lock,
  HardDrive,
  WifiOff,
  Check,
  Camera,
  UploadCloud,
  History
} from 'lucide-react';
import { Book, SiteSettings } from '../types';
import { useOffline } from '../context/OfflineContext';
import { useLanguage } from '../context/LanguageContext';
import { OfflineManagerModal } from './OfflineManagerModal';
import { BookCoverDisplay } from './BookCoverDisplay';

interface LibraryViewProps {
  books: Book[];
  onOpenBook: (book: Book) => void;
  onAskAiAboutBook: (bookId: string) => void;
  favorites: string[];
  onToggleFavorite: (bookId: string) => void;
  onRefreshBooks?: () => void;
  onNavigate?: (view: string) => void;
  siteSettings?: SiteSettings | null;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  onOpenBook,
  onAskAiAboutBook,
  favorites,
  onToggleFavorite,
  onRefreshBooks,
  onNavigate,
  siteSettings
}) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [sortBy, setSortBy] = useState<'recent' | 'views' | 'downloads' | 'title'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyOffline, setOnlyOffline] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);

  // Offline caching context
  const { isOnline, cachedBooks, isCached, saveBookOffline, removeBookOffline, stats } = useOffline();

  // Admin Quick Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);
  const [addBookSuccess, setAddBookSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // New book form data
  const [newBook, setNewBook] = useState({
    title: '',
    author: 'Docteur LEMBA KAVUMBULA MOÏSE',
    category: 'Vie Chrétienne & Sanctification',
    description: '',
    cover_image: '',
    google_drive_url: 'https://drive.google.com/',
    reading_content: '',
    page_count: 140
  });

  // Check existing admin authentication in localStorage
  useEffect(() => {
    const auth = localStorage.getItem('bdh_admin_auth');
    if (auth === 'true') {
      setIsAdminAuthenticated(true);
    }
  }, []);

  // Allowed categories without "Eschatologie & Prophétie" or "Théologie & Doctrine"
  const standardCategories = [
    'Vie Chrétienne & Sanctification',
    'Prière & Intercession',
    'Foi & Encouragement',
    'Ministère & Réveil',
    'Édification Spirituelle'
  ];

  // Extract unique categories, strictly excluding "Eschatologie" and "Théologie"
  const categories = useMemo(() => {
    const rawCategories = Array.from(new Set(books.map(b => b.category)));
    const filtered = rawCategories.filter(
      c => !c.toLowerCase().includes('théologie') && 
           !c.toLowerCase().includes('theologie') &&
           !c.toLowerCase().includes('eschatologie')
    );
    // Merge standard categories to always have clean options
    const merged = Array.from(new Set([...filtered, ...standardCategories]));
    return ['Tous', ...merged];
  }, [books]);

  // Filter & sort logic
  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Favorites filter
    if (onlyFavorites) {
      result = result.filter(b => favorites.includes(b.id));
    }

    // Offline cached filter
    if (onlyOffline) {
      const cachedIds = new Set(cachedBooks.map(cb => cb.id));
      result = result.filter(b => cachedIds.has(b.id));
    }

    // Category filter
    if (selectedCategory !== 'Tous') {
      result = result.filter(b => b.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(b => 
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.ai_indexed_content?.keyThemes?.some(theme => theme.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'views') {
        return (b.views_count || 0) - (a.views_count || 0);
      }
      if (sortBy === 'downloads') {
        return (b.downloads_count || 0) - (a.downloads_count || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [books, searchQuery, selectedCategory, sortBy, onlyFavorites, favorites, onlyOffline, cachedBooks]);

  // Handle opening the Admin Add Modal
  const handleOpenAddModal = () => {
    setFormError('');
    setAddBookSuccess(false);
    setIsAddModalOpen(true);
  };

  // Handle Passcode verification for Admin quick access
  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const validCodes = ['admin123', 'derniereheure', 'maranatha'];
    if (validCodes.includes(passcode.toLowerCase().trim())) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('bdh_admin_auth', 'true');
      setPasscodeError('');
    } else {
      setPasscodeError('Code d\'accès incorrect. (Code de test : admin123)');
    }
  };

  // Handle Book Creation
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title.trim()) {
      setFormError('Veuillez indiquer au moins le titre du livre.');
      return;
    }
    if (!newBook.google_drive_url.trim()) {
      setFormError('Veuillez renseigner le lien Google Drive pour le bouton de téléchargement.');
      return;
    }

    setIsSubmittingBook(true);
    setFormError('');

    try {
      const bookPayload = {
        title: newBook.title.trim(),
        author: newBook.author.trim() || 'Docteur LEMBA KAVUMBULA MOÏSE',
        category: newBook.category,
        description: newBook.description.trim() || 'Ouvrage spirituel pour l\'édification des saints et la préparation pour la dernière heure.',
        cover_image: newBook.cover_image.trim(),
        google_drive_url: newBook.google_drive_url.trim(),
        reading_file: newBook.reading_content.trim() || `${newBook.title} - par ${newBook.author}`,
        page_count: Number(newBook.page_count) || 120,
        reading_time_min: Math.max(30, Math.round((newBook.reading_content.split(/\s+/).length || 500) / 180)),
        chapters: [
          {
            title: "Chapitre 1 : Introduction et Fondement",
            content: newBook.reading_content.trim() || `Bienvenue dans la lecture intégrale de "${newBook.title}".\n\nCe livre a été rédigé par ${newBook.author} pour équiper le peuple de Dieu dans la dernière heure.`
          }
        ]
      };

      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookPayload)
      });

      if (res.ok) {
        setAddBookSuccess(true);
        if (onRefreshBooks) {
          onRefreshBooks();
        }
        setTimeout(() => {
          setIsAddModalOpen(false);
          setAddBookSuccess(false);
          setNewBook({
            title: '',
            author: 'Docteur LEMBA KAVUMBULA MOÏSE',
            category: 'Eschatologie & Prophétie',
            description: '',
            cover_image: '',
            google_drive_url: 'https://drive.google.com/',
            reading_content: '',
            page_count: 140
          });
        }, 1800);
      } else {
        const data = await res.json();
        setFormError(data.error || 'Erreur lors de l\'enregistrement du livre.');
      }
    } catch (err) {
      setFormError('Impossible de joindre le serveur pour enregistrer le livre.');
    } finally {
      setIsSubmittingBook(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* PAGE HEADER WITH ADMIN ACTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-sky-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
              {t('libDigitalSpiritualCollection')}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-sky-300/80 font-medium">
              {t('libFullOnlineReading')}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-100">
            {siteSettings?.libraryTitle || t('libPageTitle')}
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl font-light">
            {t('libDirectAccessDesc')}
          </p>
        </div>

        {/* Action Controls & Admin Button */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Admin Add Book Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500 hover:from-sky-400 hover:to-sky-300 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            title="Espace Administrateur : Ajouter un livre lisible en ligne et téléchargeable via Google Drive"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>{t('libQuickAddBook')}</span>
          </button>

          {/* Offline Storage Manager Button */}
          <button
            onClick={() => setIsOfflineModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
            title="Gérer les ouvrages sauvegardés dans IndexedDB pour la lecture hors-ligne"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('libOfflineBadge')} ({stats.totalBooks})</span>
            {stats.totalBooks > 0 && (
              <span className="text-[10px] text-emerald-400/80 font-normal">({stats.totalSizeFormatted})</span>
            )}
          </button>

          {/* Favorites filter toggle */}
          <button
            onClick={() => {
              setOnlyFavorites(!onlyFavorites);
              if (!onlyFavorites) setOnlyOffline(false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              onlyFavorites
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-sky-500/30'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
            <span>{t('libMyFavorites')} ({favorites.length})</span>
          </button>

          {/* Reading History shortcut */}
          {onNavigate && (
            <button
              onClick={() => onNavigate('history')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-slate-900 text-slate-300 border-slate-800 hover:border-sky-500/30 hover:text-white"
              title="Consulter mon historique de lecture"
            >
              <History className="w-3.5 h-3.5 text-sky-400" />
              <span>Mon Historique</span>
            </button>
          )}

          {/* Offline only filter toggle */}
          <button
            onClick={() => {
              setOnlyOffline(!onlyOffline);
              if (!onlyOffline) setOnlyFavorites(false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              onlyOffline
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/30'
            }`}
            title="Afficher uniquement les ouvrages enregistrés dans IndexedDB"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('libCachedBadge')} ({stats.totalBooks})</span>
          </button>

          {/* View mode toggle */}
          <div className="hidden sm:flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={t('libGridViewTitle')}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={t('libListViewTitle')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('libSearchPlaceholder')}
              className="w-full pl-11 pr-10 py-3 bg-slate-900/90 border border-slate-800 focus:border-sky-500/50 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-800">
            <ArrowUpDown className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-slate-400 whitespace-nowrap">{t('libSortByLabel')}</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
            >
              <option value="recent" className="bg-slate-900 text-slate-200">{t('libSortRecent')}</option>
              <option value="views" className="bg-slate-900 text-slate-200">{t('libSortViews')}</option>
              <option value="downloads" className="bg-slate-900 text-slate-200">{t('libSortDownloads')}</option>
              <option value="title" className="bg-slate-900 text-slate-200">{t('libSortTitle')}</option>
            </select>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('libCategoriesLabel')}</span>
          </div>
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const catLabel = cat === 'Tous' ? t('catAll') : cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-sky-200 border border-slate-800'
                }`}
              >
                {catLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* RESULTS BAR */}
      <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/40 px-4 py-2.5 rounded-xl border border-slate-800/80">
        <span>
          {t('libDisplayingBooks')} <strong className="text-sky-400">{filteredBooks.length}</strong> {t('libBooksFound')}
          {selectedCategory !== 'Tous' && ` (${selectedCategory})`}
        </span>
        
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-[11px] text-slate-500">
            {t('libAllBooksDriveNotice')}
          </span>
          {(searchQuery || selectedCategory !== 'Tous' || onlyFavorites) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Tous');
                setOnlyFavorites(false);
              }}
              className="text-sky-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>{t('resetFilters')}</span>
            </button>
          )}
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredBooks.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 max-w-lg mx-auto space-y-4">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-display font-semibold text-lg text-slate-200">
            {books.length === 0 ? "La bibliothèque est actuellement vierge" : "Aucun livre correspondant trouvé"}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {books.length === 0
              ? "Tous les livres ont été effacés de la base de données pour permettre votre configuration initiale propre. Vous pouvez maintenant ajouter vous-même vos propres ouvrages."
              : "Essayez d'ajuster vos termes de recherche ou sélectionnez une autre catégorie."}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            {books.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Tous');
                  setOnlyFavorites(false);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                {t('libSeeFullLibrary')}
              </button>
            )}
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-lg bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t('libQuickAddBook')}</span>
            </button>
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            const isFav = favorites.includes(book.id);
            return (
              <div
                key={book.id}
                className="group relative rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-sky-400/60 overflow-hidden flex flex-col justify-between transition-all duration-300 ease-out transform hover:-translate-y-2.5 hover:scale-[1.015] hover:shadow-[0_22px_40px_-12px_rgba(14,165,233,0.28),0_12px_24px_-8px_rgba(0,0,0,0.6)] will-change-transform"
              >
                {/* Gentle floating ambient glow on hover */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-sky-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Book cover visual with in-place admin photo upload */}
                <div className="relative aspect-[3/4] overflow-hidden bg-slate-950">
                  <BookCoverDisplay
                    book={book}
                    isAdmin={isAdminAuthenticated}
                    onPhotoUpdated={() => {
                      if (onRefreshBooks) onRefreshBooks();
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 pointer-events-none" />

                  {/* Top tags */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-950/80 backdrop-blur-md text-sky-300 border border-sky-500/30">
                      {book.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Offline Cache quick toggle */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (isCached(book.id)) {
                            await removeBookOffline(book.id);
                          } else {
                            await saveBookOffline(book, isFav);
                          }
                        }}
                        className={`p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                          isCached(book.id)
                            ? 'bg-emerald-500 text-slate-950 shadow-md'
                            : 'bg-slate-950/60 text-slate-300 hover:text-emerald-400 border border-slate-700/50'
                        }`}
                        title={isCached(book.id) ? "Disponible hors-ligne dans IndexedDB (Cliquer pour retirer)" : "Télécharger pour lire hors-ligne (IndexedDB)"}
                        aria-label="Hors-ligne"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(book.id);
                        }}
                        className={`p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                          isFav 
                            ? 'bg-sky-500 text-slate-950 shadow-md' 
                            : 'bg-slate-950/60 text-slate-300 hover:text-sky-400 border border-slate-700/50'
                        }`}
                        title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                        aria-label="Favoris"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Themes snippet */}
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
                    {book.ai_indexed_content?.keyThemes?.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-700/50">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 
                      onClick={() => onOpenBook(book)}
                      className="font-display font-bold text-base text-slate-100 group-hover:text-sky-300 transition-colors line-clamp-1 cursor-pointer"
                    >
                      {book.title}
                    </h3>
                    <p className="text-xs text-sky-400/90 font-medium mt-0.5">
                      {book.author}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-3 mt-2 leading-relaxed font-light">
                      {book.description}
                    </p>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{book.page_count} pages</span>
                      <span>~{book.reading_time_min} min</span>
                      <span className="flex items-center gap-1">
                        <DownloadCloud className="w-3 h-3 text-sky-400" />
                        {book.downloads_count || 120}
                      </span>
                    </div>

                    {/* DUAL ACTION BUTTONS CÔTE À CÔTE */}
                    <div className="grid grid-cols-2 gap-2">
                      
                      {/* Bouton 1 : Lire en ligne (lisible par tout le monde) */}
                      <button
                        onClick={() => onOpenBook(book)}
                        className="py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-500/10 group/btn"
                        title="Lire ce livre en ligne"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-950 group-hover/btn:scale-110 transition-transform" />
                        <span>{t('libReadOnline')}</span>
                      </button>

                      {/* Bouton 2 : Télécharger (Lien vers Google Drive) */}
                      <a
                        href={book.google_drive_file_id ? `/api/drive/download/${book.google_drive_file_id}` : book.google_drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-sky-500/25 hover:border-sky-500/50 transition-all shadow-sm"
                        title="Google Drive"
                      >
                        <DownloadCloud className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                        <span>{t('libDownloadDrive')}</span>
                      </a>
                    </div>

                    {/* AI Prompt Button */}
                    <button
                      onClick={() => onAskAiAboutBook(book.id)}
                      className="w-full py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-sky-500/20 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-sky-400" />
                      <span>{t('libAskAi')}</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredBooks.map((book) => {
            const isFav = favorites.includes(book.id);
            return (
              <div
                key={book.id}
                className="group relative p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-sky-400/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all duration-300 ease-out transform hover:-translate-y-1.5 hover:shadow-[0_16px_32px_-10px_rgba(14,165,233,0.22)] will-change-transform"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div 
                    onClick={() => onOpenBook(book)}
                    className="w-16 h-20 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 cursor-pointer shadow-md"
                  >
                    {book.cover_image ? (
                      <img 
                        src={book.cover_image} 
                        alt={book.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center p-2 text-center text-sky-400">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        {book.category}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {book.page_count} pages • ~{book.reading_time_min} min
                      </span>
                    </div>
                    <h3 
                      onClick={() => onOpenBook(book)}
                      className="font-display font-bold text-base text-slate-100 hover:text-sky-300 cursor-pointer"
                    >
                      {book.title}
                    </h3>
                    <p className="text-xs text-sky-400/90 font-medium">
                      {book.author}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-1 font-light max-w-xl">
                      {book.description}
                    </p>
                  </div>
                </div>

                {/* DUAL ACTION BUTTONS CÔTE À CÔTE EN VUE LISTE */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Offline Cache button in list view */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (isCached(book.id)) {
                        await removeBookOffline(book.id);
                      } else {
                        await saveBookOffline(book, isFav);
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isCached(book.id)
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-emerald-400'
                    }`}
                    title={isCached(book.id) ? "Disponible hors-ligne dans IndexedDB (Cliquer pour supprimer)" : "Sauvegarder pour lecture hors-ligne"}
                  >
                    <HardDrive className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onToggleFavorite(book.id)}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isFav ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-sky-400'
                    }`}
                    title="Favoris"
                  >
                    <Bookmark className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => onAskAiAboutBook(book.id)}
                    className="px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-500/30 flex items-center gap-1.5 cursor-pointer"
                    title="Interroger avec l'IA"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden md:inline">IA</span>
                  </button>

                  {/* Bouton 1 : Lire en ligne */}
                  <button
                    onClick={() => onOpenBook(book)}
                    className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                    title="Lire en ligne"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{t('libReadOnline')}</span>
                  </button>

                  {/* Bouton 2 : Télécharger (Lien Google Drive) */}
                  <a
                    href={book.google_drive_file_id ? `/api/drive/download/${book.google_drive_file_id}` : book.google_drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-sky-300 text-xs font-semibold flex items-center gap-1.5 border border-sky-500/30 shadow-sm"
                    title="Google Drive"
                  >
                    <DownloadCloud className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t('libDownloadDrive')}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : AJOUT DE LIVRE PAR L'ADMINISTRATEUR (LECTURE EN LIGNE & DRIVE) */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-sky-500/40 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/30 border-b border-sky-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                      Espace Administrateur
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-100">
                    Ajouter un Livre dans la Bibliothèque
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* If not authenticated yet, prompt for passcode */}
              {!isAdminAuthenticated ? (
                <div className="max-w-md mx-auto py-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="font-display text-base font-bold text-slate-100">
                    Authentification Administrateur Requise
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Veuillez saisir votre code d'accès administrateur pour ajouter un nouveau livre avec son contenu de lecture et son lien Google Drive.
                  </p>

                  <form onSubmit={handleVerifyPasscode} className="space-y-3 pt-2">
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Code d'accès (ex: admin123 ou derniereheure)"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500 text-center font-mono"
                      autoFocus
                    />
                    {passcodeError && (
                      <p className="text-xs text-rose-400 font-medium">{passcodeError}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      Déverrouiller l'accès
                    </button>
                  </form>
                </div>
              ) : (
                /* Authenticated Book Creation Form */
                <form onSubmit={handleCreateBook} className="space-y-6">
                  
                  {addBookSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <strong>Livre publié avec succès !</strong>
                        <p className="text-xs text-emerald-400/90 mt-0.5">
                          L'ouvrage est immédiatement lisible en ligne par tous les visiteurs et téléchargeable via son lien Google Drive.
                        </p>
                      </div>
                    </div>
                  )}

                  {formError && (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Explanation Banner */}
                  <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200/90 space-y-1">
                    <strong className="text-sky-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Configuration des Deux Accès Principaux :
                    </strong>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300 font-light text-[11px] pt-1">
                      <li><span className="font-semibold text-sky-300">Bouton « Lire en ligne » :</span> Alimenté par le contenu textuel/chapitres ci-dessous, consultable sans frais par tous les lecteurs.</li>
                      <li><span className="font-semibold text-sky-300">Bouton « Télécharger » :</span> Redirige directement vers votre dossier ou fichier hébergé sur Google Drive.</li>
                    </ul>
                  </div>

                  {/* Section 1: Informations Générales */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>1. Identification de l'Ouvrage</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Titre du Livre <span className="text-sky-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newBook.title}
                          onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                          placeholder="Ex: Le Réveil Spirituel de la Dernière Heure"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-sky-500/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Auteur <span className="text-sky-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newBook.author}
                          onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                          placeholder="Docteur LEMBA KAVUMBULA MOÏSE"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-sky-500/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Catégorie Doctrinale
                        </label>
                        <select
                          value={newBook.category}
                          onChange={(e) => {
                            const cat = e.target.value;
                            setNewBook(prev => ({
                              ...prev,
                              category: cat
                            }));
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none cursor-pointer focus:border-sky-500/50"
                        >
                          {standardCategories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Nombre approximatif de pages
                        </label>
                        <input
                          type="number"
                          value={newBook.page_count}
                          onChange={(e) => setNewBook({ ...newBook, page_count: Number(e.target.value) || 120 })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 outline-none focus:border-sky-500/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Description / Résumé pour les lecteurs
                      </label>
                      <textarea
                        rows={2}
                        value={newBook.description}
                        onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                        placeholder="Présentation concise de l'œuvre spirituelle et de son impact..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 outline-none resize-none focus:border-sky-500/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Photo de Couverture du Livre
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <label className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-xs font-bold cursor-pointer transition-colors">
                          <UploadCloud className="w-4 h-4 text-sky-400" />
                          <span>Choisir une photo depuis votre appareil</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewBook(prev => ({ ...prev, cover_image: reader.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={newBook.cover_image}
                        onChange={(e) => setNewBook({ ...newBook, cover_image: e.target.value })}
                        placeholder="Ou saisir une URL directe d'image (ex: https://...)"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 outline-none focus:border-sky-500/50"
                      />
                      {newBook.cover_image && (
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <img src={newBook.cover_image} alt="Preview" className="w-10 h-14 object-cover rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-emerald-400 font-semibold block">✓ Photo sélectionnée pour l'aperçu</span>
                            <button
                              type="button"
                              onClick={() => setNewBook({ ...newBook, cover_image: '' })}
                              className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer"
                            >
                              Retirer la photo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Téléchargement Google Drive */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                      <DownloadCloud className="w-3.5 h-3.5 text-sky-400" />
                      <span>2. Bouton de Téléchargement (Lien Google Drive)</span>
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Lien de Téléchargement Google Drive <span className="text-sky-400">*</span></span>
                        <span className="text-[11px] text-sky-400 font-normal">Sera associé au bouton « Télécharger »</span>
                      </label>
                      <input
                        type="url"
                        required
                        value={newBook.google_drive_url}
                        onChange={(e) => setNewBook({ ...newBook, google_drive_url: e.target.value })}
                        placeholder="https://drive.google.com/file/d/... ou dossier Drive"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-sky-500/30 text-xs text-sky-200 placeholder-slate-600 outline-none focus:border-sky-500 font-mono"
                      />
                      <p className="text-[11px] text-slate-400 font-light">
                        Lorsque les visiteurs cliqueront sur le bouton <strong>« Télécharger »</strong> (placé à côté de <strong>« Lire en ligne »</strong>), ils seront redirigés vers ce lien Google Drive pour télécharger le fichier PDF / document.
                      </p>
                    </div>
                  </div>

                  {/* Section 3: Lecture en Ligne pour Tous */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                      <span>3. Contenu pour la Lecture en Ligne (Lisible pour Tous)</span>
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Texte Intégral ou Premiers Chapitres</span>
                        <span className="text-[11px] text-emerald-400 font-normal">Accessible via « Lire en ligne »</span>
                      </label>
                      <textarea
                        rows={7}
                        value={newBook.reading_content}
                        onChange={(e) => setNewBook({ ...newBook, reading_content: e.target.value })}
                        placeholder="Collez ici le texte intégral, l'introduction ou les chapitres du livre. Ce texte sera immédiatement lisible par tout le monde dans le lecteur numérique en plein écran, avec taille de police ajustable et mode nuit/sépia."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-sky-500/50 font-serif leading-relaxed"
                      />
                      <p className="text-[11px] text-slate-400 font-light">
                        Tout visiteur sur le site pourra cliquer sur le bouton <strong>« Lire en ligne »</strong> pour lire ce texte confortablement sans avoir besoin de télécharger de fichier.
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmittingBook}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{isSubmittingBook ? 'Publication en cours...' : 'Publier le livre dans la bibliothèque'}</span>
                    </button>
                  </div>

                </form>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Offline Storage Manager Modal */}
      <OfflineManagerModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        allBooks={books}
        favorites={favorites}
        onOpenBook={onOpenBook}
      />

    </div>
  );
};
