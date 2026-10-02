import { Book } from '../types';

/**
 * IndexedDB Configuration for Persistent Offline Book Storage
 */
const DB_NAME = 'bdh_library_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'cached_books';

export interface CachedBookRecord {
  id: string;
  book: Book;
  cachedAt: string; // ISO date string
  lastReadAt: string; // ISO date string
  sizeBytes: number;
  isFavorite: boolean;
  readingProgress?: {
    chapterIdx: number;
    sentenceIdx?: number;
    percentage?: number;
    updatedAt: string;
  };
}

export interface OfflineCacheStats {
  totalBooks: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  totalChapters: number;
  lastUpdated?: string;
  favoriteBooksCount: number;
}

/**
 * Check if IndexedDB is available in the current runtime environment
 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

/**
 * Open or initialize the IndexedDB database
 */
export function openOfflineDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB n'est pas supporté par ce navigateur."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
        store.createIndex('lastReadAt', 'lastReadAt', { unique: false });
        store.createIndex('isFavorite', 'isFavorite', { unique: false });
        store.createIndex('category', 'book.category', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Impossible d'ouvrir la base IndexedDB."));
    };
  });
}

/**
 * Calculate the rough byte size of a Book record in JSON format
 */
function estimateBookSizeBytes(book: Book): number {
  try {
    const jsonStr = JSON.stringify(book);
    return new Blob([jsonStr]).size;
  } catch {
    return 1024 * 10; // 10 KB default fallback
  }
}

/**
 * Notify components of cache mutations across the app
 */
function emitCacheUpdated(bookId?: string, action: 'add' | 'remove' | 'update' | 'clear' = 'add') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('bdh-offline-cache-updated', {
        detail: { bookId, action, timestamp: Date.now() }
      })
    );
  }
}

/**
 * Subscribe to offline cache mutations
 */
export function subscribeToCacheUpdates(callback: (event: CustomEvent) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => callback(e as CustomEvent);
  window.addEventListener('bdh-offline-cache-updated', handler);
  return () => window.removeEventListener('bdh-offline-cache-updated', handler);
}

/**
 * Save / Cache a book into IndexedDB (consulted book or explicit download)
 */
export async function saveBookToOfflineCache(book: Book, isFavorite: boolean = false): Promise<CachedBookRecord> {
  const db = await openOfflineDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const getReq = store.get(book.id);

    getReq.onsuccess = () => {
      const existing: CachedBookRecord | undefined = getReq.result;
      const now = new Date().toISOString();

      const record: CachedBookRecord = {
        id: book.id,
        book: {
          ...book,
          // ensure chapters and reading content are preserved
          chapters: book.chapters && book.chapters.length > 0 ? book.chapters : existing?.book?.chapters,
          reading_file: book.reading_file || existing?.book?.reading_file || ''
        },
        cachedAt: existing?.cachedAt || now,
        lastReadAt: now,
        sizeBytes: estimateBookSizeBytes(book),
        isFavorite: isFavorite !== undefined ? isFavorite : existing?.isFavorite || false,
        readingProgress: existing?.readingProgress
      };

      const putReq = store.put(record);

      putReq.onsuccess = () => {
        emitCacheUpdated(book.id, existing ? 'update' : 'add');
        resolve(record);
      };

      putReq.onerror = () => {
        reject(putReq.error || new Error("Erreur lors de l'enregistrement dans IndexedDB"));
      };
    };

    getReq.onerror = () => {
      reject(getReq.error || new Error("Erreur de lecture dans IndexedDB"));
    };

    transaction.onabort = () => {
      reject(transaction.error || new Error("Transaction annulée."));
    };
  });
}

/**
 * Retrieve a specific cached book by its ID
 */
export async function getCachedBookById(bookId: string): Promise<CachedBookRecord | null> {
  if (!isIndexedDBAvailable()) return null;
  try {
    const db = await openOfflineDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(bookId);

      req.onsuccess = () => {
        resolve(req.result || null);
      };

      req.onerror = () => {
        resolve(null);
      };
    });
  } catch (e) {
    console.warn("Erreur getCachedBookById:", e);
    return null;
  }
}

/**
 * Check if a specific book is cached in IndexedDB
 */
export async function isBookCached(bookId: string): Promise<boolean> {
  const record = await getCachedBookById(bookId);
  return record !== null;
}

/**
 * Retrieve all cached books from IndexedDB
 */
export async function getAllCachedBooks(): Promise<CachedBookRecord[]> {
  if (!isIndexedDBAvailable()) return [];
  try {
    const db = await openOfflineDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records: CachedBookRecord[] = req.result || [];
        // Sort by lastReadAt descending
        records.sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime());
        resolve(records);
      };

      req.onerror = () => {
        reject(req.error || new Error("Impossible de lire les livres en cache."));
      };
    });
  } catch (e) {
    console.warn("Erreur getAllCachedBooks:", e);
    return [];
  }
}

/**
 * Retrieve only the set of IDs for all cached books
 */
export async function getCachedBookIds(): Promise<string[]> {
  const books = await getAllCachedBooks();
  return books.map(b => b.id);
}

/**
 * Remove a cached book from IndexedDB
 */
export async function removeBookFromOfflineCache(bookId: string): Promise<boolean> {
  if (!isIndexedDBAvailable()) return false;
  try {
    const db = await openOfflineDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(bookId);

      req.onsuccess = () => {
        emitCacheUpdated(bookId, 'remove');
        resolve(true);
      };

      req.onerror = () => {
        reject(req.error || new Error("Impossible de supprimer le livre du cache."));
      };
    });
  } catch (e) {
    console.warn("Erreur removeBookFromOfflineCache:", e);
    return false;
  }
}

/**
 * Update reading progress of a cached book
 */
export async function saveReadingProgress(
  bookId: string,
  chapterIdx: number,
  sentenceIdx?: number,
  percentage?: number
): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  try {
    const db = await openOfflineDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getReq = store.get(bookId);

    getReq.onsuccess = () => {
      const record: CachedBookRecord | undefined = getReq.result;
      if (record) {
        record.lastReadAt = new Date().toISOString();
        record.readingProgress = {
          chapterIdx,
          sentenceIdx,
          percentage,
          updatedAt: new Date().toISOString()
        };
        store.put(record);
      }
    };
  } catch (e) {
    // Non-blocking progress save
  }
}

/**
 * Synchronize and cache all user favorites into IndexedDB
 */
export async function syncFavoritesToOfflineCache(
  allBooks: Book[],
  favoriteIds: string[]
): Promise<{ added: number; total: number }> {
  if (!favoriteIds || favoriteIds.length === 0) {
    return { added: 0, total: 0 };
  }

  let addedCount = 0;
  for (const favId of favoriteIds) {
    const book = allBooks.find(b => b.id === favId);
    if (book) {
      await saveBookToOfflineCache(book, true);
      addedCount++;
    }
  }

  emitCacheUpdated(undefined, 'update');
  return { added: addedCount, total: favoriteIds.length };
}

/**
 * Get aggregate statistics on the offline cache
 */
export async function getOfflineCacheStats(): Promise<OfflineCacheStats> {
  const records = await getAllCachedBooks();
  let totalBytes = 0;
  let totalChapters = 0;
  let favoriteCount = 0;
  let lastUpdated: string | undefined = undefined;

  for (const r of records) {
    totalBytes += r.sizeBytes || 0;
    if (r.book.chapters) {
      totalChapters += r.book.chapters.length;
    }
    if (r.isFavorite) {
      favoriteCount++;
    }
    if (!lastUpdated || new Date(r.lastReadAt).getTime() > new Date(lastUpdated).getTime()) {
      lastUpdated = r.lastReadAt;
    }
  }

  return {
    totalBooks: records.length,
    totalSizeBytes: totalBytes,
    totalSizeFormatted: formatBytes(totalBytes),
    totalChapters,
    lastUpdated,
    favoriteBooksCount: favoriteCount
  };
}

/**
 * Format bytes into human-readable unit (KB, MB)
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 Ko';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

/**
 * Clear the entire offline books cache
 */
export async function clearAllOfflineCache(): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  const db = await openOfflineDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => {
      emitCacheUpdated(undefined, 'clear');
      resolve();
    };

    req.onerror = () => {
      reject(req.error || new Error("Erreur lors de la vidange du cache."));
    };
  });
}

/**
 * Estimate storage quota from browser StorageManager API if supported
 */
export async function getStorageQuotaEstimate(): Promise<{ usedBytes: number; quotaBytes: number; percent: number } | null> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percent = quota > 0 ? Math.round((used / quota) * 100) : 0;
      return { usedBytes: used, quotaBytes: quota, percent };
    } catch {
      return null;
    }
  }
  return null;
}
