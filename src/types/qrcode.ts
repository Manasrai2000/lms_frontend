export type QRCodeType = "EXISTING" | "GENERATED";
export type QRCodeStatus = "UNMAPPED" | "ACTIVE" | "INACTIVE";

export interface QRCodeBook {
  id: number;
  title: string;
  class?: string;
  subject?: string;
  language?: string;
  coverImage?: string | null;
  description?: string | null;
}

export interface QRCodeItem {
  id: number;
  code: string;
  bookId: number | null;
  book: QRCodeBook | null;
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
  reason?: "QR_NOT_FOUND" | "QR_NOT_MAPPED" | "QR_INACTIVE";
  message?: string;
  book?: QRCodeBook;
}

export interface BulkQRResultItem {
  bookId: number;
  bookTitle: string;
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
