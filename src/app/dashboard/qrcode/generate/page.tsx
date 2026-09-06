"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  QrCode,
  Search,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Copy,
  Check,
  ChevronLeft,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import qrApi from "@/lib/api/qrcode";
import { QRCodeItem } from "@/types/qrcode";

interface BookOption {
  id: number | string;
  title: string;
  class?: string;
  subject?: string;
  language?: string;
  coverImage?: string | null;
  description?: string | null;
}

export default function GenerateQRPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialBookId = searchParams.get("bookId");

  // Books catalog
  const [booksList, setBooksList] = useState<BookOption[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(true);
  const [bookQuery, setBookQuery] = useState<string>("");

  // Selected book state
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);

  // Active QR check state
  const [isCheckingActive, setIsCheckingActive] = useState<boolean>(false);
  const [existingActiveQr, setExistingActiveQr] = useState<QRCodeItem | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<QRCodeItem | null>(null);

  // Copy URL state tracker
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Fetch books catalog
  const fetchBooks = useCallback(async () => {
    try {
      setIsLoadingBooks(true);
      const res = await api.get("/books", { params: { limit: 200 } }).catch(() =>
        api.get("/api/v1/books", { params: { limit: 200 } })
      );
      const arr = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const formatted: BookOption[] = arr.map((b: any) => ({
        id: b.id ?? b._id,
        title: b.title || "Untitled Book",
        class: b.class || b.className || "",
        subject: b.subject || b.subjectName || "",
        language: b.language || b.languageName || "",
        coverImage: b.coverImage || null,
        description: b.description || null,
      }));

      setBooksList(formatted);

      // Pre-select if URL query param provided
      if (initialBookId) {
        const match = formatted.find((b) => String(b.id) === String(initialBookId));
        if (match) {
          setSelectedBook(match);
        }
      }
    } catch (err) {
      console.error("Failed to load books:", err);
      toast.error("Failed to load books list");
    } finally {
      setIsLoadingBooks(false);
    }
  }, [initialBookId]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Check existing active QR whenever selectedBook changes
  useEffect(() => {
    if (!selectedBook) {
      setExistingActiveQr(null);
      setGeneratedResult(null);
      return;
    }

    async function checkActiveQR() {
      if (!selectedBook) return;
      try {
        setIsCheckingActive(true);
        setExistingActiveQr(null);
        setGeneratedResult(null);

        const res = await qrApi.getList({
          bookId: selectedBook.id,
          status: "ACTIVE",
          limit: 1,
        });

        if (res.data && res.data.length > 0) {
          setExistingActiveQr(res.data[0]);
        }
      } catch (err) {
        console.error("Active QR check failed:", err);
      } finally {
        setIsCheckingActive(false);
      }
    }

    checkActiveQR();
  }, [selectedBook]);

  // Handle QR Generation Action
  const handleGenerateQR = async () => {
    if (!selectedBook) return;
    try {
      setIsGenerating(true);
      const res = await qrApi.generateForBook(selectedBook.id);
      const dataItem: QRCodeItem = res.data || res;
      setGeneratedResult(dataItem);
      toast.success(`QR Code ${dataItem.code || ""} generated successfully!`);
    } catch (err: any) {
      console.error("Generation error:", err);
      toast.error(err?.response?.data?.message || "Failed to generate QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Public Link Helper
  const handleCopyLink = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/q/${code}`;
    navigator.clipboard.writeText(publicUrl);
    setIsCopied(true);
    toast.success("Public scanner link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Print Label Handler
  const handlePrintLabel = (item: QRCodeItem) => {
    const imageUrl = qrApi.getImageUrl(item.id, "png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print label");
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/q/${item.code}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Label - ${item.code}</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fff; }
            .label { border: 2px dashed #004ac6; padding: 24px; text-align: center; border-radius: 12px; max-width: 320px; }
            .img-box { margin: 16px 0; }
            .img-box img { width: 180px; height: 180px; }
            .title { font-weight: bold; font-size: 16px; margin-bottom: 4px; color: #131b2e; }
            .sub { font-size: 12px; color: #505f76; margin-bottom: 12px; }
            .code { font-family: monospace; font-size: 14px; font-weight: bold; background: #eaedff; padding: 4px 8px; border-radius: 4px; color: #004ac6; }
            .url { font-size: 10px; color: #888; margin-top: 8px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="title">${item.book?.title || selectedBook?.title || "Textbook"}</div>
            <div class="sub">${item.book?.class || selectedBook?.class ? `Class: ${item.book?.class || selectedBook?.class}` : ""} ${item.book?.subject || selectedBook?.subject ? `| Subject: ${item.book?.subject || selectedBook?.subject}` : ""}</div>
            <div class="img-box">
              <img src="${imageUrl}" alt="QR Code" />
            </div>
            <div class="code">${item.code}</div>
            <div class="url">${publicUrl}</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered books list
  const filteredBooks = booksList.filter((b) => {
    const q = bookQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      (b.class && b.class.toLowerCase().includes(q)) ||
      (b.subject && b.subject.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[#c3c6d7]/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#004ac6]/10 text-[#004ac6]">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#131b2e]">Generate QR Code for Book</h1>
            <p className="text-xs text-[#505f76] mt-0.5">
              Generate a unique cryptographic QR code (`BK-XXXXXXXX`) and map it automatically to a textbook
            </p>
          </div>
        </div>

        <Link href="/dashboard/qrcode">
          <Button
            variant="outline"
            className="border-[#c3c6d7] text-[#131b2e] hover:bg-[#eaedff]/50 gap-2 font-semibold text-xs h-9 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to List
          </Button>
        </Link>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Book Selector */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#c3c6d7]/30 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#131b2e]">Select Textbook</h2>
            <p className="text-xs text-[#505f76] mt-0.5">
              Choose the book for which you want to generate a new QR code sticker.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by book title, class, or subject..."
              value={bookQuery}
              onChange={(e) => setBookQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-[#c3c6d7] rounded-xl focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
            />
          </div>

          {/* Book Catalog List */}
          {isLoadingBooks ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#004ac6]" />
              <p className="text-xs text-[#505f76]">Loading textbook catalog...</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto border border-[#c3c6d7]/40 rounded-xl divide-y divide-[#c3c6d7]/20 custom-scrollbar">
              {filteredBooks.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#505f76]">
                  No matching books found.
                </div>
              ) : (
                filteredBooks.map((b) => {
                  const isSelected = selectedBook?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBook(b)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#eaedff] border-l-4 border-l-[#004ac6]"
                          : "hover:bg-[#faf8ff]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold text-xs shrink-0">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#131b2e]">{b.title}</p>
                          <p className="text-[11px] text-[#505f76] mt-0.5">
                            {b.class ? `Class: ${b.class}` : ""}{" "}
                            {b.subject ? `| Subject: ${b.subject}` : ""}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="h-6 w-6 rounded-full bg-[#004ac6] text-white flex items-center justify-center shrink-0">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Column: Generation Panel / Preview */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#c3c6d7]/30 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#131b2e]">QR Status & Action</h2>
            <p className="text-xs text-[#505f76] mt-0.5">
              Review selected book status before triggering QR generation.
            </p>
          </div>

          {!selectedBook ? (
            <div className="p-8 text-center bg-[#faf8ff] rounded-xl border border-dashed border-[#c3c6d7]/50 my-auto">
              <BookOpen className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#131b2e]">No Book Selected</p>
              <p className="text-[11px] text-[#505f76] mt-0.5">
                Select a book from the list on the left to check its QR status.
              </p>
            </div>
          ) : isCheckingActive ? (
            <div className="p-8 text-center my-auto">
              <Loader2 className="h-6 w-6 animate-spin text-[#004ac6] mx-auto mb-2" />
              <p className="text-xs text-[#505f76]">Checking active QR records...</p>
            </div>
          ) : generatedResult ? (
            /* SUCCESS STATE AFTER GENERATION */
            <div className="space-y-4 text-center animate-in fade-in">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  QR Code Generated & Mapped!
                </p>
              </div>

              {/* Visual QR render */}
              <div className="p-3 bg-white border-2 border-dashed border-[#004ac6]/30 rounded-xl inline-block">
                <img
                  src={qrApi.getImageUrl(generatedResult.id, "png")}
                  alt={`QR ${generatedResult.code}`}
                  className="w-40 h-40 object-contain mx-auto"
                />
              </div>

              <div>
                <span className="font-mono text-sm font-black text-[#004ac6] bg-[#eaedff] px-3 py-1 rounded-lg">
                  {generatedResult.code}
                </span>
              </div>

              {/* Copy public link */}
              <div className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg border border-zinc-200 text-xs">
                <span className="font-mono text-[11px] text-zinc-500 truncate mr-2">
                  /q/{generatedResult.code}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyLink(generatedResult.code)}
                  className="h-7 text-xs text-[#004ac6] hover:bg-[#eaedff]"
                >
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  {isCopied ? "Copied" : "Copy Link"}
                </Button>
              </div>

              {/* Download / Print Actions */}
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={qrApi.getImageUrl(generatedResult.id, "png", true)}
                  download={`QR-${generatedResult.code}.png`}
                >
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold border-[#004ac6]/30 text-[#004ac6] h-8 px-2"
                  >
                    <Download className="h-3 w-3 mr-1" /> PNG
                  </Button>
                </a>
                <a
                  href={qrApi.getImageUrl(generatedResult.id, "svg", true)}
                  download={`QR-${generatedResult.code}.svg`}
                >
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold border-purple-300 text-purple-700 h-8 px-2"
                  >
                    <Download className="h-3 w-3 mr-1" /> SVG
                  </Button>
                </a>
                <Button
                  onClick={() => handlePrintLabel(generatedResult)}
                  className="bg-[#004ac6] hover:bg-[#003899] text-white text-xs font-semibold h-8 px-2 cursor-pointer"
                >
                  <Printer className="h-3 w-3 mr-1" /> Print
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setGeneratedResult(null);
                  setSelectedBook(null);
                }}
                className="w-full text-xs font-semibold text-[#505f76] hover:text-[#131b2e]"
              >
                Generate For Another Book
              </Button>
            </div>
          ) : existingActiveQr ? (
            /* ACTIVE QR ALREADY EXISTS CALLOUT */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-900">Active QR Already Exists</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      This book already has an active QR code assigned:{" "}
                      <span className="font-mono font-bold">{existingActiveQr.code}</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Display existing QR preview */}
              <div className="p-4 bg-[#faf8ff] rounded-xl border border-[#c3c6d7]/30 text-center space-y-3">
                <img
                  src={qrApi.getImageUrl(existingActiveQr.id, "png")}
                  alt="Existing QR"
                  className="w-32 h-32 object-contain mx-auto"
                />
                <div>
                  <span className="font-mono text-xs font-bold text-[#004ac6]">
                    {existingActiveQr.code}
                  </span>
                </div>
                <div className="flex justify-center gap-2">
                  <a
                    href={qrApi.getImageUrl(existingActiveQr.id, "png", true)}
                    download={`QR-${existingActiveQr.code}.png`}
                  >
                    <Button variant="outline" size="sm" className="h-7 text-xs text-[#004ac6]">
                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    onClick={() => handlePrintLabel(existingActiveQr)}
                    className="h-7 text-xs bg-[#004ac6] text-white"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" /> Print Label
                  </Button>
                </div>
              </div>

              <p className="text-[10px] text-zinc-400 text-center">
                To generate a new QR code for this book, please unmap or deactivate the existing one first.
              </p>
            </div>
          ) : (
            /* READY TO GENERATE STATE */
            <div className="space-y-6 my-auto">
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">Ready for QR Generation</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    "<span className="font-bold text-[#131b2e]">{selectedBook.title}</span>" does not have an active QR code.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleGenerateQR}
                disabled={isGenerating}
                className="w-full bg-[#004ac6] hover:bg-[#003899] text-white font-semibold text-xs h-11 rounded-xl gap-2 shadow-sm cursor-pointer"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                Generate QR Code Now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
