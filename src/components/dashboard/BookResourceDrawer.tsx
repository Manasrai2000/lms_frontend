"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  BookOpen,
  FileText,
  Video,
  BookMarked,
  Download,
  ExternalLink,
  Play,
  CheckCircle2,
  Sparkles,
  Maximize2,
  ChevronRight,
  Layers,
  GraduationCap,
} from "lucide-react";
import { QRCodeBook, QRVideo, QRFlipbook } from "@/types/qrcode";

interface BookResourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  book: QRCodeBook | null;
  scannedCode?: string;
}

export default function BookResourceDrawer({
  isOpen,
  onClose,
  book,
  scannedCode,
}: BookResourceDrawerProps) {
  const [activeTab, setActiveTab] = useState<"flipbook" | "worksheet" | "videos" | "overview">("overview");
  const [activeVideo, setActiveVideo] = useState<QRVideo | null>(null);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);

  if (!isOpen || !book) return null;

  // Helper to format video embed URL (especially YouTube)
  const getEmbedVideoUrl = (url: string) => {
    if (!url) return "";
    // If YouTube watch URL
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]+)/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
    return url;
  };

  const primaryFlipbook: QRFlipbook | undefined = book.flipbooks?.[0];
  const videosList = book.videos || [];
  const worksheet = book.worksheet;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over Container */}
      <div className="relative w-full max-w-2xl h-full bg-[#faf8ff] text-[#131b2e] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 overflow-hidden">
        {/* Drawer Header */}
        <div className="bg-white border-b border-[#c3c6d7]/30 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-black text-sm">
              <BookOpen className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#131b2e] leading-tight">Digital Book Resources</h2>
              <p className="text-[11px] text-[#505f76] flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Verified via QR: <span className="font-mono font-bold text-[#004ac6]">{scannedCode || `BK-${book.id}`}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-[#131b2e] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Book Hero Showcase Banner */}
        <div className="bg-gradient-to-r from-[#dbe1ff]/60 via-[#faf8ff] to-white p-6 border-b border-[#c3c6d7]/30 shrink-0">
          <div className="flex gap-4 items-start">
            {/* Cover Image */}
            <div className="h-28 w-20 shrink-0 rounded-xl bg-white border border-[#c3c6d7]/40 shadow-sm overflow-hidden flex items-center justify-center relative">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="p-2 text-center flex flex-col items-center justify-center">
                  <BookOpen className="h-6 w-6 text-[#004ac6] mb-1" />
                  <span className="text-[9px] font-bold text-[#505f76] line-clamp-2">{book.title}</span>
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 items-center">
                {book.class && (
                  <span className="text-[10px] font-bold bg-[#004ac6] text-white px-2 py-0.5 rounded-full">
                    {book.class}
                  </span>
                )}
                {book.subject && (
                  <span className="text-[10px] font-semibold bg-white border border-[#c3c6d7]/50 text-[#131b2e] px-2 py-0.5 rounded-full">
                    {book.subject}
                  </span>
                )}
                {book.language && (
                  <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                    {book.language}
                  </span>
                )}
              </div>

              <h1 className="text-lg font-bold text-[#131b2e] leading-snug line-clamp-2">
                {book.title}
              </h1>

              {book.description && (
                <p className="text-xs text-[#505f76] line-clamp-2">
                  {book.description}
                </p>
              )}

              <div className="text-[11px] text-[#505f76] flex items-center gap-3 pt-1">
                <span>📚 <b>{book.chaptersCount || 0}</b> Chapters</span>
                <span>🎥 <b>{videosList.length}</b> Video Lessons</span>
                <span>📝 <b>{worksheet ? "1" : "0"}</b> Worksheet</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#c3c6d7]/30 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => { setActiveTab("overview"); setActiveVideo(null); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "overview"
                  ? "bg-[#004ac6] text-white shadow-sm"
                  : "bg-white text-[#505f76] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#c3c6d7]/30"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Overview
            </button>

            <button
              onClick={() => { setActiveTab("flipbook"); setActiveVideo(null); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "flipbook"
                  ? "bg-[#004ac6] text-white shadow-sm"
                  : "bg-white text-[#505f76] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#c3c6d7]/30"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Digital Flipbook {primaryFlipbook && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            </button>

            <button
              onClick={() => { setActiveTab("worksheet"); setActiveVideo(null); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "worksheet"
                  ? "bg-[#004ac6] text-white shadow-sm"
                  : "bg-white text-[#505f76] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#c3c6d7]/30"
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              Worksheet {worksheet && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            </button>

            <button
              onClick={() => { 
                setActiveTab("videos"); 
                if (videosList.length > 0 && !activeVideo) {
                  setActiveVideo(videosList[0]);
                }
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "videos"
                  ? "bg-[#004ac6] text-white shadow-sm"
                  : "bg-white text-[#505f76] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#c3c6d7]/30"
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              Video Lessons ({videosList.length})
            </button>
          </div>
        </div>

        {/* Tab Contents Viewport */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                Quick Resource Access
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Flipbook Card */}
                <div
                  onClick={() => {
                    if (primaryFlipbook) {
                      setActiveTab("flipbook");
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all ${
                    primaryFlipbook
                      ? "bg-white border-[#c3c6d7]/40 hover:border-[#004ac6] hover:shadow-md cursor-pointer group"
                      : "bg-zinc-50 border-zinc-200 opacity-70 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    {primaryFlipbook ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400">Unavailable</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[#131b2e] group-hover:text-[#004ac6]">Digital Flipbook</h4>
                  <p className="text-xs text-[#505f76] mt-1">Read high-resolution interactive pages with page turn effect.</p>
                </div>

                {/* Worksheet Card */}
                <div
                  onClick={() => {
                    if (worksheet) {
                      setActiveTab("worksheet");
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all ${
                    worksheet
                      ? "bg-white border-[#c3c6d7]/40 hover:border-[#004ac6] hover:shadow-md cursor-pointer group"
                      : "bg-zinc-50 border-zinc-200 opacity-70 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Download className="h-5 w-5" />
                    </div>
                    {worksheet ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        PDF Ready
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400">No Worksheet</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[#131b2e] group-hover:text-[#004ac6]">Practice Worksheet</h4>
                  <p className="text-xs text-[#505f76] mt-1">Download homework exercises, worksheets and review questions.</p>
                </div>

                {/* Video Lessons Card */}
                <div
                  onClick={() => {
                    if (videosList.length > 0) {
                      setActiveTab("videos");
                      setActiveVideo(videosList[0]);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all ${
                    videosList.length > 0
                      ? "bg-white border-[#c3c6d7]/40 hover:border-[#004ac6] hover:shadow-md cursor-pointer group"
                      : "bg-zinc-50 border-zinc-200 opacity-70 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                      <Video className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      {videosList.length} Lessons
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#131b2e] group-hover:text-[#004ac6]">Video Lectures</h4>
                  <p className="text-xs text-[#505f76] mt-1">Watch teacher explanations and chapter-wise animated concepts.</p>
                </div>

                {/* Chapters Breakdown Card */}
                <Link
                  href={`/dashboard/books/chapters?bookId=${book.id}`}
                  onClick={onClose}
                  className="p-4 rounded-2xl border bg-white border-[#c3c6d7]/40 hover:border-[#004ac6] hover:shadow-md transition-all group block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Layers className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {book.chaptersCount || 0} Chapters
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#131b2e] group-hover:text-[#004ac6] flex items-center justify-between">
                    <span>Curriculum & Chapters</span>
                    <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-[#004ac6]" />
                  </h4>
                  <p className="text-xs text-[#505f76] mt-1">Browse chapter list, topics, syllabus and reading plans.</p>
                </Link>
              </div>

              {/* Direct Full Book Navigation */}
              <div className="pt-3">
                <Link
                  href={`/dashboard/books/chapters?bookId=${book.id}`}
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 p-3.5 bg-[#004ac6] hover:bg-[#003899] text-white rounded-xl font-bold text-xs shadow-md transition-all"
                >
                  <BookMarked className="h-4 w-4" />
                  <span>Open Chapters & Complete Syllabus &rarr;</span>
                </Link>
              </div>
            </div>
          )}

          {/* TAB 2: FLIPBOOK READER */}
          {activeTab === "flipbook" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#131b2e]">Digital Flipbook Reader</h3>
                  <p className="text-xs text-[#505f76]">Read the official digital edition with turnable pages.</p>
                </div>

                {primaryFlipbook?.fileUrl && (
                  <a
                    href={primaryFlipbook.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-[#004ac6] hover:underline"
                  >
                    <span>Full Screen</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {primaryFlipbook?.fileUrl ? (
                <div className="space-y-3">
                  <div className="w-full h-[450px] rounded-2xl border border-[#c3c6d7]/50 overflow-hidden bg-black/5 relative shadow-inner">
                    <iframe
                      src={primaryFlipbook.fileUrl}
                      className="w-full h-full border-0"
                      title={primaryFlipbook.title || "Flipbook"}
                      allow="fullscreen"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#505f76] bg-white p-3 rounded-xl border border-[#c3c6d7]/30">
                    <span className="font-semibold">{primaryFlipbook.title || "Book Flipbook Edition"}</span>
                    <a
                      href={primaryFlipbook.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#004ac6] text-white rounded-lg font-bold text-xs hover:bg-[#003899]"
                    >
                      Open in New Window
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-10 rounded-2xl border border-[#c3c6d7]/30 text-center space-y-2">
                  <BookOpen className="h-10 w-10 text-zinc-300 mx-auto" />
                  <h4 className="text-sm font-bold text-[#131b2e]">No Flipbook Attached</h4>
                  <p className="text-xs text-[#505f76] max-w-sm mx-auto">
                    The digital flipbook reader is being prepared by the curriculum department. Please check back soon.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WORKSHEETS */}
          {activeTab === "worksheet" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#131b2e]">Practice Worksheets</h3>
                <p className="text-xs text-[#505f76]">Download practice assignments and chapter test papers.</p>
              </div>

              {worksheet ? (
                <div className="bg-white p-5 rounded-2xl border border-[#c3c6d7]/40 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#131b2e] truncate">{worksheet.title}</h4>
                      <p className="text-xs text-[#505f76]">Official PDF Worksheet • Ready for print or solve</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={worksheet.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 p-3 bg-[#004ac6] hover:bg-[#003899] text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </a>

                    <a
                      href={worksheet.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-xs transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Preview</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-10 rounded-2xl border border-[#c3c6d7]/30 text-center space-y-2">
                  <FileText className="h-10 w-10 text-zinc-300 mx-auto" />
                  <h4 className="text-sm font-bold text-[#131b2e]">No Worksheet Uploaded</h4>
                  <p className="text-xs text-[#505f76] max-w-sm mx-auto">
                    There are currently no printable worksheet attachments linked to this textbook.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VIDEO LESSONS */}
          {activeTab === "videos" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#131b2e]">Video Lectures ({videosList.length})</h3>
                <p className="text-xs text-[#505f76]">Watch high quality chapter video lessons directly.</p>
              </div>

              {videosList.length > 0 ? (
                <div className="space-y-4">
                  {/* Embedded Player */}
                  {activeVideo && (
                    <div className="space-y-2 bg-black rounded-2xl overflow-hidden shadow-lg">
                      <div className="relative w-full pt-[56.25%]">
                        <iframe
                          src={getEmbedVideoUrl(activeVideo.videoUrl)}
                          className="absolute inset-0 w-full h-full border-0"
                          title={activeVideo.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="p-3 bg-zinc-900 text-white flex items-center justify-between">
                        <p className="text-xs font-bold truncate">{activeVideo.title}</p>
                        <a
                          href={activeVideo.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                        >
                          Watch on YouTube <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Video List */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#505f76]">
                      Select a Video to Play:
                    </p>
                    {videosList.map((vid, idx) => {
                      const isSelected = activeVideo?.id === vid.id;
                      return (
                        <div
                          key={vid.id || idx}
                          onClick={() => setActiveVideo(vid)}
                          className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#eaedff] border-[#004ac6] shadow-sm"
                              : "bg-white border-[#c3c6d7]/40 hover:border-[#004ac6]/50"
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-[#004ac6] text-white" : "bg-rose-50 text-rose-600"
                          }`}>
                            <Play className="h-4 w-4 fill-current" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#131b2e] truncate">{vid.title}</p>
                            <p className="text-[10px] text-[#505f76]">Lesson #{idx + 1}</p>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-[#004ac6] bg-white px-2 py-0.5 rounded-full shadow-xs">
                              Playing Now
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-10 rounded-2xl border border-[#c3c6d7]/30 text-center space-y-2">
                  <Video className="h-10 w-10 text-zinc-300 mx-auto" />
                  <h4 className="text-sm font-bold text-[#131b2e]">No Video Lessons Linked</h4>
                  <p className="text-xs text-[#505f76] max-w-sm mx-auto">
                    Video lectures for this textbook will be added shortly.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Bottom Bar */}
        <div className="p-4 bg-white border-t border-[#c3c6d7]/30 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#505f76]">
            Textbook ID: #{book.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Close Resources
          </button>
        </div>
      </div>
    </div>
  );
}
