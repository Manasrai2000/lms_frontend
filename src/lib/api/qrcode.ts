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

  // 6. Unmap QR from book
  unmap: async (id: number | string) => {
    return requestWithFallback("delete", `/qr-codes/${id}/map`);
  },

  // 7. Update QR status
  updateStatus: async (id: number | string, status: "ACTIVE" | "INACTIVE") => {
    return requestWithFallback("patch", `/qr-codes/${id}/status`, { status });
  },

  // 8. Generate QR for single book
  generateForBook: async (bookId: number | string) => {
    return requestWithFallback("post", "/qr-codes/generate", { bookId: Number(bookId) });
  },

  // 9. Bulk generate QRs
  bulkGenerate: async (bookIds: (number | string)[]): Promise<BulkQRResponse> => {
    return requestWithFallback<BulkQRResponse>("post", "/qr-codes/bulk-generate", {
      bookIds: bookIds.map((id) => Number(id)),
    });
  },

  // 10. Public verification
  verify: async (code: string): Promise<QRVerifyResponse> => {
    return requestWithFallback<QRVerifyResponse>("get", `/qr/verify/${encodeURIComponent(code)}`);
  },

  // Helper for image URLs
  getImageUrl: (idOrCode: number | string, format: "png" | "svg" = "png", download = false) => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://lms-backend-96fq.onrender.com/api";
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");
    const rootUrl = baseUrl.endsWith("/api") ? baseUrl.slice(0, -4) : baseUrl;
    return `${rootUrl}/api/qr-codes/${idOrCode}/image?format=${format}&download=${download}`;
  },
};

export default qrApi;
