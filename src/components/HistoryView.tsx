import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  BookOpen, 
  Trash2, 
  Clock, 
  Sparkles, 
  Search, 
  Bookmark, 
  ArrowRight, 
  CheckCircle2, 
  Compass, 
  Layers, 
  ChevronRight, 
  AlertCircle,
  X,
  Share2,
  Calendar,
  Filter
} from 'lucide-react';
import { Book, SiteSettings } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getRecentReads, removeRecentReading, clearRecentReadings, toggleFavoriteInStorage, getFavorites } from '../utils/storage';

interface HistoryViewProps {
  books: Book[];
  onNavigate: (view: string, bookId?: string) => void;
  onOpenBook: (book: Book) => void;
  onAskAiAboutBook?: (bookId: string) => void;
  siteSettings?: SiteSettings | null;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  books,
  onNavigate,
  onOpenBook,
  onAskAiAboutBook,
  siteSettings
}) => {
  const { t } = useLanguage();
  const [recentReads, setRecentReads] = useState<{ bookId: string; lastRead: string }[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load and refresh recent reads
  const refreshHistory = () => {
    setRecentReads(getRecentReads());
    setFavorites(getFavorites());
  };

  useEffect(() => {
    refreshHistory();

    const handleStorageUpdate = () => {
      refreshHistory();
    };

    window.addEventListener('bdh_recent_reads_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('bdh_recent_reads_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRemoveItem = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeRecentReading(bookId);
    setRecentReads(updated);
    showToast("Ouvrage retiré de votre historique.");
  };

  const handleClearAll = () => {
    clearRecentReadings();
    setRecentReads([]);
    setIsConfirmClearOpen(false);
    showToast("Votre historique de lecture a été entièrement effacé.");
  };

  const handleToggleFav = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleFavoriteInStorage(bookId);
    setFavorites(updated);
    const isFav = updated.includes(bookId);
    showToast(isFav ? "Ajouté à vos favoris." : "Retiré de vos favoris.");
  };

  // Associate recent records with actual Book objects
  const historyItems = useMemo(() => {
    return recentReads.map(record => {
      const book = books.find(b => b.id === record.bookId);
      return {
        ...record,
        book
      };
    }).filter(item => item.book !== undefined) as { bookId: string; lastRead: string; book: Book }[];
  }, [recentReads, books]);

  // Categories in history
  const categories = useMemo(() => {
    const cats = new Set<string>();
    historyItems.forEach(item => {
      if (item.book.category) cats.add(item.book.category);
    });
    return Array.from(cats);
  }, [historyItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return historyItems.filter(item => {
      const matchesSearch = 
        !searchQuery.trim() ||
        item.book.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.book.author.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.book.category.toLowerCase().includes(searchQuery.toLowerCase().trim());
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        item.book.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [historyItems, searchQuery, selectedCategory]);

  // Format relative timestamp
  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMin < 1) return "À l'instant";
      if (diffMin < 60) return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
      if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      if (diffDays === 1) return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      if (diffDays < 7) return `Il y a ${diffDays} jours`;

      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      });
    } catch {
      return "Récemment";
    }
  };

  const latestItem = historyItems[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Modal to Clear History */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Effacer tout votre historique de lecture ?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Cette action retirera tous les livres récemment consultés de votre historique local. Vos favoris et marque-pages restent quant à eux conservés.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
              >
                Oui, effacer l'historique
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 mb-1.5">
            <button 
              onClick={() => onNavigate('home')}
              className="hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Accueil</span>
            </button>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-600">Mon Activité</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-bold">Mon Historique</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
              <History className="w-6 h-6" />
            </div>
            <span>Mon Historique de Lecture</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl">
            Retrouvez rapidement les ouvrages que vous avez consultés, reprenez vos lectures en cours et poursuivez votre sanctification chrétienne.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => onNavigate('library')}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
          >
            <BookOpen className="w-4 h-4 text-sky-600" />
            <span>Bibliothèque complète</span>
          </button>

          {historyItems.length > 0 && (
            <button
              onClick={() => setIsConfirmClearOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Vider mon historique"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Effacer l'historique</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats & Resume Banner */}
      {historyItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Resume Most Recent Read */}
          {latestItem && (
            <div className="md:col-span-2 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white border border-sky-800/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-64 bg-radial from-sky-500/10 to-transparent pointer-events-none" />
              
              <div className="flex items-start sm:items-center gap-4 z-10">
                <div className="w-14 h-20 rounded-xl overflow-hidden bg-slate-800 shadow-md border border-white/20 flex-shrink-0">
                  {latestItem.book.cover_image ? (
                    <img src={latestItem.book.cover_image} alt={latestItem.book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-sky-200 p-1 text-center">
                      LIVRE
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                      Dernier livre consulté
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-400" />
                      {formatRelativeTime(latestItem.lastRead)}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                    {latestItem.book.title}
                  </h3>
                  <p className="text-xs text-sky-200/80">
                    Par {latestItem.book.author} • {latestItem.book.category}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenBook(latestItem.book)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 z-10 flex-shrink-0"
              >
                <span>Reprendre la lecture</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Card 2: History Metrics */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Statistiques de Lecture
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 font-display">
                  {historyItems.length}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  ouvrage{historyItems.length > 1 ? 's' : ''} consulté{historyItems.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Favoris enregistrés :</span>
              <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                {favorites.length}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Main Content Area */}
      {historyItems.length === 0 ? (
        /* Empty State */
        <div className="py-16 sm:py-24 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm p-8 sm:p-12 space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100 shadow-inner">
            <Clock className="w-8 h-8 text-sky-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Votre historique de lecture est encore vide
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto font-light">
              Dès que vous ouvrirez un livre pour le lire ou l'écouter en ligne, il s'ajoutera automatiquement ici pour vous permettre de reprendre votre étude à tout instant.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('library')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Découvrir la bibliothèque</span>
            </button>

            <button
              onClick={() => onNavigate('spiritual-steps')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Parcours des 5 Étapes</span>
            </button>
          </div>

          {/* Quick Recommendations */}
          {books.length > 0 && (
            <div className="pt-8 border-t border-slate-100 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3 text-center sm:text-left">
                Suggestions pour commencer :
              </span>
              <div className="space-y-2">
                {books.slice(0, 2).map(b => (
                  <div 
                    key={b.id}
                    onClick={() => onOpenBook(b)}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-sky-50/70 border border-slate-200/80 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-11 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                        {b.cover_image && <img src={b.cover_image} alt={b.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-sky-800 block truncate">
                          {b.title}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {b.author}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-sky-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform flex-shrink-0 pl-2">
                      Lire <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* History Items List */
        <div className="space-y-6">
          
          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer dans mon historique (titre, auteur)..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            {categories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Toutes ({historyItems.length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Result Count Notice */}
          {searchQuery && (
            <div className="text-xs text-slate-500 px-1 flex items-center justify-between">
              <span>{filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''} trouvé{filteredItems.length > 1 ? 's' : ''} pour « {searchQuery} »</span>
              <button onClick={() => setSearchQuery('')} className="text-sky-700 hover:underline">
                Réinitialiser le filtre
              </button>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(({ book, lastRead }, index) => {
              const isFav = favorites.includes(book.id);
              const isMostRecent = index === 0 && !searchQuery;

              return (
                <div
                  key={book.id}
                  onClick={() => onOpenBook(book)}
                  className="p-5 rounded-3xl bg-white hover:bg-sky-50/40 border border-slate-200/90 hover:border-sky-300 transition-all cursor-pointer shadow-xs hover:shadow-md group flex flex-col justify-between relative"
                >
                  <div>
                    {/* Top Row: Timestamp & Actions */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {isMostRecent && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                            Plus récent
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-sky-600" />
                          <span>{formatRelativeTime(lastRead)}</span>
                        </span>
                      </div>

                      {/* Favorite and Delete icons */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleFav(book.id, e)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isFav 
                              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                          }`}
                          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleRemoveItem(book.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Retirer de l'historique"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Book Main Info */}
                    <div className="flex items-start gap-4">
                      {/* Cover Thumbnail */}
                      <div className="w-16 h-22 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-2xs border border-slate-200">
                        {book.cover_image ? (
                          <img 
                            src={book.cover_image} 
                            alt={book.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-900 to-sky-950 text-white flex items-center justify-center p-1 text-[9px] font-bold text-center">
                            LIVRE
                          </div>
                        )}
                      </div>

                      {/* Book Metadata */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                          {book.category}
                        </span>
                        
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-800 transition-colors line-clamp-2 mt-1 leading-snug">
                          {book.title}
                        </h3>

                        <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                          {book.author}
                        </p>

                        {book.description && (
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-1.5 font-light leading-relaxed">
                            {book.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Row */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    {onAskAiAboutBook && (
                      <button
                        type="button"
                        onClick={() => onAskAiAboutBook(book.id)}
                        className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-sky-600" />
                        <span>Questionner l'IA</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenBook(book)}
                      className="ml-auto px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Continuer</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Spiritual Encouragement Note at Bottom */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-50 via-slate-50 to-amber-50/40 border border-sky-100 text-center space-y-2">
        <p className="text-xs sm:text-sm text-sky-950 font-serif italic max-w-2xl mx-auto">
          « Que ce livre de la loi ne s'éloigne point de ta bouche ; médite-le jour et nuit, pour agir fidèlement selon tout ce qui y est écrit. »
        </p>
        <span className="text-[11px] font-bold text-sky-800 uppercase tracking-widest block">
          Josué 1:8 • Persévérance dans la lecture sainte
        </span>
      </div>

    </div>
  );
};
