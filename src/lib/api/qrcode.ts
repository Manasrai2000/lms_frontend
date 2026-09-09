import api from "@/lib/api";
import {
  QRCodeItem,
  PaginatedQRResponse,
  QRVerifyResponse,
  BulkQRResponse,
} from "@/types/qrcode";

// Helper function to attempt primary path and fallback path if 404 occurs
async function requestWithFallback<T = any>(
  method: "get" | "post" | "patch" | "delete",
  primaryUrl: string,
  dataOrConfig?: any,
  config?: any
): Promise<T> {
  const fallbackUrl = primaryUrl.startsWith("/api")
    ? primaryUrl.replace(/^\/api/, "")
    : `/api${primaryUrl}`;

  try {
    let res;
    if (method === "get" || method === "delete") {
      res = await api[method](primaryUrl, dataOrConfig);
    } else {
      res = await api[method](primaryUrl, dataOrConfig, config);
    }
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      let res;
      if (method === "get" || method === "delete") {
        res = await api[method](fallbackUrl, dataOrConfig);
      } else {
        res = await api[method](fallbackUrl, dataOrConfig, config);
      }
      return res.data;
    }
    throw err;
  }
}

export const qrApi = {
  // 1. Get QR list with filters
  getList: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    bookId?: number | string;
    videoId?: number | string;
    targetType?: "BOOK" | "VIDEO" | string;
  }): Promise<PaginatedQRResponse> => {
    return requestWithFallback<PaginatedQRResponse>("get", "/qr-codes", { params });
  },

  // 2. Get QR details by ID
  getById: async (id: number | string): Promise<QRCodeItem> => {
    const data = await requestWithFallback("get", `/qr-codes/${id}`);
    return data?.data || data;
  },

  // 3. Register existing physical QR
  registerExisting: async (code: string, type: "EXISTING" = "EXISTING") => {
    return requestWithFallback("post", "/qr-codes", { code, type });
  },

  // 4. Map QR to book
  mapToBook: async (id: number | string, bookId: number | string) => {
    return requestWithFallback("post", `/qr-codes/${id}/map`, { bookId: Number(bookId) });
  },

  // 5. Remap QR to another book
  remapToBook: async (id: number | string, bookId: number | string) => {
    return requestWithFallback("patch", `/qr-codes/${id}/map`, { bookId: Number(bookId) });
  },

  // 6. Map QR to video
  mapToVideo: async (id: number | string, videoId: number | string) => {
    return requestWithFallback("post", `/qr-codes/${id}/map-video`, { videoId: Number(videoId) });
  },

  // 7. Unmap QR from book or video
  unmap: async (id: number | string) => {
    return requestWithFallback("delete", `/qr-codes/${id}/map`);
  },

  // 8. Update QR status
  updateStatus: async (id: number | string, status: "ACTIVE" | "INACTIVE") => {
    return requestWithFallback("patch", `/qr-codes/${id}/status`, { status });
  },

  // 9. Generate QR for single book
  generateForBook: async (bookId: number | string) => {
    return requestWithFallback("post", "/qr-codes/generate", { bookId: Number(bookId) });
  },

  // 10. Generate QR for single video
  generateForVideo: async (videoId: number | string) => {
    return requestWithFallback("post", "/qr-codes/generate-video", { videoId: Number(videoId) });
  },

  // 11. Bulk generate QRs for books
  bulkGenerate: async (bookIds: (number | string)[]): Promise<BulkQRResponse> => {
    return requestWithFallback<BulkQRResponse>("post", "/qr-codes/bulk-generate", {
      bookIds: bookIds.map((id) => Number(id)),
    });
  },

  // 12. Bulk generate QRs for videos
  bulkGenerateVideos: async (videoIds: (number | string)[]): Promise<BulkQRResponse> => {
    return requestWithFallback<BulkQRResponse>("post", "/qr-codes/bulk-generate-videos", {
      videoIds: videoIds.map((id) => Number(id)),
    });
  },

  // 13. Public verification
  verify: async (code: string): Promise<QRVerifyResponse> => {
    const cleanCode = extractQRCode(code);
    return requestWithFallback<QRVerifyResponse>("get", `/qr-codes/verify/${encodeURIComponent(cleanCode)}`);
  },

  // Helper for image URLs
  getImageUrl: (idOrCode: number | string, format: "png" | "svg" = "png", download = false) => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://lms-backend-96fq.onrender.com/api";
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");
    const rootUrl = baseUrl.endsWith("/api") ? baseUrl.slice(0, -4) : baseUrl;
    return `${rootUrl}/api/qr-codes/${idOrCode}/image?format=${format}&download=${download}`;
  },
};

/**
 * Utility to extract clean QR code from scanned text, full URL, or query param
 * e.g., "https://domain.com/q/BK-43098571" -> "BK-43098571"
 * e.g., "https://domain.com?code=BK-43098571" -> "BK-43098571"
 * e.g., "BK-43098571" -> "BK-43098571"
 */
export function extractQRCode(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  
  // Match path pattern like /q/CODE or /verify/CODE
  const pathMatch = trimmed.match(/(?:\/q\/|\/verify\/)([A-Za-z0-9_-]+)/i);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // Match query parameter like ?code=CODE
  const queryMatch = trimmed.match(/[?&]code=([A-Za-z0-9_-]+)/i);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }

  return trimmed;
}

export default qrApi;
