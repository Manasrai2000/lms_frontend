export type QRCodeType = "EXISTING" | "GENERATED";
export type QRCodeStatus = "UNMAPPED" | "ACTIVE" | "INACTIVE";

export interface QRWorksheet {
  id: number;
  title: string;
  fileUrl: string;
}

export interface QRFlipbook {
  id: number;
  title: string;
  fileUrl: string;
  coverImage?: string | null;
}

export interface QRVideo {
  id: number;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  duration?: string | null;
}

export interface QRCodeBook {
  id: number;
  title: string;
  class?: string;
  subject?: string;
  language?: string;
  coverImage?: string | null;
  description?: string | null;
  worksheet?: QRWorksheet | null;
  flipbooks?: QRFlipbook[];
  videos?: QRVideo[];
  chaptersCount?: number;
}

export type QRCodeTargetType = "BOOK" | "VIDEO";

export interface QRCodeVideo {
  id: number;
  title: string;
  videoUrl: string;
  youtubeVideoId?: string | null;
  duration?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  bookId: number;
  book?: {
    id: number;
    title: string;
    class: string;
    subject: string;
  } | null;
  chapterId?: number | null;
  chapter?: {
    id: number;
    title: string;
  } | null;
}

export interface QRCodeItem {
  id: number;
  code: string;
  bookId: number | null;
  book: QRCodeBook | null;
  videoId?: number | null;
  video?: QRCodeVideo | null;
  targetType?: QRCodeTargetType;
  type: QRCodeType;
  status: QRCodeStatus;
  payload: string | null;
  mappedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedQRResponse {
  data: QRCodeItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QRVerifyResponse {
  valid: boolean;
  status: "ACTIVE" | "UNMAPPED" | "INACTIVE" | "NOT_FOUND";
  code?: string;
  type?: QRCodeType;
  targetType?: QRCodeTargetType;
  reason?: "QR_NOT_FOUND" | "QR_NOT_MAPPED" | "QR_INACTIVE";
  message?: string;
  // If targetType is VIDEO:
  video?: QRCodeVideo;
  // If targetType is BOOK:
  book?: QRCodeBook;
}

export type VerifyQRResponse = QRVerifyResponse;

export interface BulkQRResultItem {
  bookId?: number;
  bookTitle?: string;
  videoId?: number;
  videoTitle?: string;
  status: "GENERATED" | "SKIPPED" | "FAILED";
  code?: string;
  reason?: string;
}

export interface BulkQRResponse {
  success: boolean;
  data: {
    totalRequested: number;
    generated: number;
    skipped: number;
    failed: number;
    results: BulkQRResultItem[];
  };
}
