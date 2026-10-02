import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  HardDrive, 
  Trash2, 
  CheckCircle2, 
  BookOpen, 
  ArrowRight, 
  X, 
  DownloadCloud, 
  Sparkles, 
  RefreshCw,
  Info,
  Clock,
  Bookmark
} from 'lucide-react';
import { useOffline } from '../context/OfflineContext';
import { Book } from '../types';
import { formatBytes } from '../utils/indexedDb';

interface OfflineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  books?: Book[];
  allBooks?: Book[];
  favorites: string[];
  onOpenBook: (book: Book) => void;
}

export const OfflineManagerModal: React.FC<OfflineManagerModalProps> = ({
  isOpen,
  onClose,
  books,
  allBooks,
  favorites,
  onOpenBook
}) => {
  const booksList = books || allBooks || [];
  const { 
    isOnline, 
    cachedBooks, 
    stats, 
    isSyncing, 
    removeBookOffline, 
    syncFavorites, 
    clearCache,
    saveBookOffline 
  } = useOffline();

  const [confirmClear, setConfirmClear] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSyncFavorites = async () => {
    try {
      const added = await syncFavorites(booksList, favorites);
      setSyncFeedback(`${added} livre(s) favori(s) synchronisé(s) dans IndexedDB.`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback("Erreur lors de la synchronisation des favoris.");
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleCacheAll = async () => {
    try {
      for (const book of booksList) {
        await saveBookOffline(book, favorites.includes(book.id));
      }
      setSyncFeedback("Tous les livres de la bibliothèque sont désormais enregistrés hors-ligne !");
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback("Erreur lors de l'enregistrement général.");
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleRemove = async (bookId: string, title: string) => {
    try {
      await removeBookOffline(bookId);
    } catch (e) {
      console.warn("Erreur suppression:", e);
    }
  };

  const handleClearAll = async () => {
    await clearCache();
    setConfirmClear(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-sky-500/30 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="offline-manager-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Fermer la boîte de dialogue"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner flex-shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="offline-manager-title" className="font-display font-bold text-xl text-slate-100">
                Gestionnaire Hors-Ligne (IndexedDB)
              </h2>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Wifi className="w-3 h-3" />
                  Connecté
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-black border border-amber-300">
                  <WifiOff className="w-3 h-3 text-black" />
                  <span className="text-black">Hors-connexion</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Vos ouvrages sont persistés localement dans le stockage sécurisé IndexedDB de votre navigateur.
            </p>
          </div>
        </div>

        {/* Status & Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] text-slate-400 block font-medium">Livres enregistrés</span>
            <span className="text-lg font-bold text-sky-300">{stats.totalBooks}</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] text-slate-400 block font-medium">Favoris hors-ligne</span>
            <span className="text-lg font-bold text-white">{stats.favoriteBooksCount}</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] text-slate-400 block font-medium">Chapitres indexés</span>
            <span className="text-lg font-bold text-emerald-300">{stats.totalChapters}</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] text-slate-400 block font-medium">Espace utilisé</span>
            <span className="text-lg font-bold text-slate-200">{formatBytes(stats.totalSizeBytes)}</span>
          </div>
        </div>

        {/* Sync Actions Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={handleSyncFavorites}
            disabled={isSyncing || favorites.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black border border-amber-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-black" />
            <span className="text-black">Mettre en cache mes favoris ({favorites.length})</span>
          </button>

          <button
            onClick={handleCacheAll}
            disabled={isSyncing || books.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Tout télécharger ({books.length} livres)</span>
          </button>

          {cachedBooks.length > 0 && (
            <div className="ml-auto">
              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-medium transition-colors cursor-pointer"
                  title="Vider le cache hors-ligne"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vider le cache</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-rose-300">Confirmer ?</span>
                  <button
                    onClick={handleClearAll}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Oui, tout effacer
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {syncFeedback && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* List of Cached Books */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[160px] max-h-[380px]">
          {cachedBooks.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
              <DownloadCloud className="w-10 h-10 text-slate-600 mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-slate-300">Aucun ouvrage en cache pour l'instant</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Chaque livre que vous ouvrez dans le lecteur est automatiquement enregistré dans IndexedDB pour être lu hors-ligne.
              </p>
              <button
                onClick={handleCacheAll}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>Télécharger tous les ouvrages maintenant</span>
              </button>
            </div>
          ) : (
            cachedBooks.map((record) => {
              const b = record.book;
              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-sky-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={b.cover_image || '/images/les-5-etapes-spirituelles.jpg'}
                      alt={b.title}
                      className="w-10 h-14 object-cover rounded-lg border border-slate-700 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-200 truncate group-hover:text-sky-300 transition-colors">
                          {b.title}
                        </h4>
                        {record.isFavorite && (
                          <Bookmark className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{b.author}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Prêt hors-ligne
                        </span>
                        <span>•</span>
                        <span>{formatBytes(record.sizeBytes)}</span>
                        <span>•</span>
                        <span>{b.chapters ? `${b.chapters.length} chapitres` : 'Complet'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenBook(b);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Lire</span>
                    </button>
                    <button
                      onClick={() => handleRemove(b.id, b.title)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Supprimer du cache hors-ligne"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Notice */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>La synthèse vocale (Audio TTS) fonctionne également sans connexion Internet.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
