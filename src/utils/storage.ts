export function getFavorites(): string[] {
  try {
    const saved = localStorage.getItem('bdh_favorites');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export function toggleFavorite(bookId: string): boolean {
  try {
    const current = getFavorites();
    const index = current.indexOf(bookId);
    let updated: string[];
    let isFav = false;
    if (index > -1) {
      updated = current.filter(id => id !== bookId);
      isFav = false;
    } else {
      updated = [...current, bookId];
      isFav = true;
    }
    localStorage.setItem('bdh_favorites', JSON.stringify(updated));
    return isFav;
  } catch (e) {
    return false;
  }
}

export function toggleFavoriteInStorage(bookId: string): string[] {
  try {
    const current = getFavorites();
    const index = current.indexOf(bookId);
    let updated: string[];
    if (index > -1) {
      updated = current.filter(id => id !== bookId);
    } else {
      updated = [...current, bookId];
    }
    localStorage.setItem('bdh_favorites', JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export function getRecentReads(): { bookId: string; lastRead: string }[] {
  try {
    const saved = localStorage.getItem('bdh_recent_reads');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export const getRecentReadings = getRecentReads;

export function recordRecentRead(bookId: string) {
  try {
    const current = getRecentReads().filter(r => r.bookId !== bookId);
    current.unshift({ bookId, lastRead: new Date().toISOString() });
    localStorage.setItem('bdh_recent_reads', JSON.stringify(current.slice(0, 50)));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bdh_recent_reads_updated'));
    }
  } catch (e) {
    // Ignore
  }
}

export const addRecentReading = recordRecentRead;

export function removeRecentReading(bookId: string): { bookId: string; lastRead: string }[] {
  try {
    const current = getRecentReads().filter(r => r.bookId !== bookId);
    localStorage.setItem('bdh_recent_reads', JSON.stringify(current));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bdh_recent_reads_updated'));
    }
    return current;
  } catch (e) {
    return [];
  }
}

export function clearRecentReadings(): void {
  try {
    localStorage.removeItem('bdh_recent_reads');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bdh_recent_reads_updated'));
    }
  } catch (e) {
    // Ignore
  }
}
