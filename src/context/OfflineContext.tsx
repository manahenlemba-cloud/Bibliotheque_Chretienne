import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Book } from '../types';
import { 
  CachedBookRecord, 
  OfflineCacheStats, 
  getAllCachedBooks, 
  saveBookToOfflineCache, 
  removeBookFromOfflineCache, 
  syncFavoritesToOfflineCache, 
  getOfflineCacheStats, 
  clearAllOfflineCache,
  subscribeToCacheUpdates,
  isIndexedDBAvailable
} from '../utils/indexedDb';

interface OfflineContextType {
  isOnline: boolean;
  isIndexedDbReady: boolean;
  cachedBooks: CachedBookRecord[];
  cachedBookIds: Set<string>;
  stats: OfflineCacheStats;
  isSyncing: boolean;
  isCached: (bookId: string) => boolean;
  saveBookOffline: (book: Book, isFavorite?: boolean) => Promise<void>;
  removeBookOffline: (bookId: string) => Promise<void>;
  syncFavorites: (allBooks: Book[], favoriteIds: string[]) => Promise<number>;
  clearCache: () => Promise<void>;
  refreshCache: () => Promise<void>;
}

const defaultStats: OfflineCacheStats = {
  totalBooks: 0,
  totalSizeBytes: 0,
  totalSizeFormatted: '0 Ko',
  totalChapters: 0,
  favoriteBooksCount: 0
};

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isIndexedDbReady, setIsIndexedDbReady] = useState(false);
  const [cachedBooks, setCachedBooks] = useState<CachedBookRecord[]>([]);
  const [cachedBookIds, setCachedBookIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<OfflineCacheStats>(defaultStats);
  const [isSyncing, setIsSyncing] = useState(false);

  // Refresh and reload cache list & stats
  const refreshCache = useCallback(async () => {
    if (!isIndexedDBAvailable()) return;
    try {
      const records = await getAllCachedBooks();
      setCachedBooks(records);
      setCachedBookIds(new Set(records.map(r => r.id)));
      const currentStats = await getOfflineCacheStats();
      setStats(currentStats);
    } catch (e) {
      console.warn("Erreur lors du rafraîchissement du cache IndexedDB:", e);
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);
    setIsIndexedDbReady(isIndexedDBAvailable());

    refreshCache();

    // Subscribe to internal cache events (e.g. from background or other tabs)
    const unsubscribe = subscribeToCacheUpdates(() => {
      refreshCache();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [refreshCache]);

  const isCached = useCallback((bookId: string) => {
    return cachedBookIds.has(bookId);
  }, [cachedBookIds]);

  const saveBookOffline = useCallback(async (book: Book, isFavorite: boolean = false) => {
    try {
      await saveBookToOfflineCache(book, isFavorite);
      await refreshCache();
    } catch (err) {
      console.error("Échec de mise en cache hors-ligne :", err);
      throw err;
    }
  }, [refreshCache]);

  const removeBookOffline = useCallback(async (bookId: string) => {
    try {
      await removeBookFromOfflineCache(bookId);
      await refreshCache();
    } catch (err) {
      console.error("Échec de suppression du cache :", err);
      throw err;
    }
  }, [refreshCache]);

  const syncFavorites = useCallback(async (allBooks: Book[], favoriteIds: string[]) => {
    setIsSyncing(true);
    try {
      const result = await syncFavoritesToOfflineCache(allBooks, favoriteIds);
      await refreshCache();
      return result.added;
    } finally {
      setIsSyncing(false);
    }
  }, [refreshCache]);

  const clearCache = useCallback(async () => {
    await clearAllOfflineCache();
    await refreshCache();
  }, [refreshCache]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isIndexedDbReady,
        cachedBooks,
        cachedBookIds,
        stats,
        isSyncing,
        isCached,
        saveBookOffline,
        removeBookOffline,
        syncFavorites,
        clearCache,
        refreshCache
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
