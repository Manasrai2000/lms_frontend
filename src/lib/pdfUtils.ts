import api from "@/lib/api";
import { toast } from "sonner";

/**
 * Helper function to construct full preview URL for static PDF files
 */
export function getFullPdfUrl(fileUrl: string | null | undefined): string {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const rootUrl = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  const cleanPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return `${rootUrl}${cleanPath}`;
}

/**
 * Helper function to download file using stream or direct URL
 */
export async function downloadPdfFile(
  downloadUrl: string | null | undefined,
  fallbackFileUrl: string | null | undefined,
  fileName?: string
): Promise<void> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const targetUrl = downloadUrl || fallbackFileUrl;

    if (!targetUrl) {
      toast.error("File URL not available for download.");
      return;
    }

    // Try authenticated download via axios API client
    const fullEndpoint = targetUrl.startsWith("http")
      ? targetUrl
      : targetUrl.startsWith("/api")
      ? targetUrl
      : `/api${targetUrl.startsWith("/") ? targetUrl : `/${targetUrl}`}`;

    const response = await api.get(fullEndpoint, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "application/pdf" });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || "document.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    toast.success("Download started!");
  } catch (error) {
    console.warn("Direct blob download failed, attempting browser open fallback:", error);
    const fallback = getFullPdfUrl(downloadUrl || fallbackFileUrl);
    if (fallback) {
      window.open(fallback, "_blank");
    } else {
      toast.error("Failed to download document.");
    }
  }
}
