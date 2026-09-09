import { QRCodeBook } from "@/types/qrcode";

export interface ScannedBookRecord {
  id: number;
  code: string;
  title: string;
  class?: string;
  subject?: string;
  language?: string;
  coverImage?: string | null;
  scannedAt: string;
  chaptersCount?: number;
  hasFlipbook: boolean;
  hasWorksheet: boolean;
  hasVideos: boolean;
}

const STORAGE_KEY = "lms_recently_scanned_books";

export function getRecentlyScannedBooks(): ScannedBookRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRecentlyScannedBook(book: QRCodeBook, code: string): ScannedBookRecord[] {
  if (typeof window === "undefined" || !book) return [];
  try {
    const current = getRecentlyScannedBooks();
    const newRecord: ScannedBookRecord = {
      id: book.id,
      code,
      title: book.title,
      class: book.class,
      subject: book.subject,
      language: book.language,
      coverImage: book.coverImage,
      scannedAt: new Date().toISOString(),
      chaptersCount: book.chaptersCount || 0,
      hasFlipbook: Boolean(book.flipbooks && book.flipbooks.length > 0),
      hasWorksheet: Boolean(book.worksheet),
      hasVideos: Boolean(book.videos && book.videos.length > 0),
    };

    // Filter out duplicates of same book ID or code
    const filtered = current.filter((item) => item.id !== book.id && item.code !== code);
    const updated = [newRecord, ...filtered].slice(0, 8); // keep last 8

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("lms_recent_qr_updated"));
    return updated;
  } catch {
    return [];
  }
}
