"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  Play,
  ExternalLink,
  BookOpen,
  Layers,
  Clock,
  CheckCircle2,
  Video,
  Sparkles,
  BookMarked,
} from "lucide-react";
import { QRCodeVideo } from "@/types/qrcode";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: QRCodeVideo | null;
  scannedCode?: string;
}

export default function VideoPlayerModal({
  isOpen,
  onClose,
  video,
  scannedCode,
}: VideoPlayerModalProps) {
  if (!isOpen || !video) return null;

  // Extract YouTube ID if available
  const getEmbedUrl = () => {
    if (video.youtubeVideoId) {
      return `https://www.youtube.com/embed/${video.youtubeVideoId}?autoplay=1&rel=0`;
    }
    const url = video.videoUrl || "";
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]+)/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
    return url;
  };

  const isYouTube = Boolean(
    video.youtubeVideoId ||
    video.videoUrl?.includes("youtube.com") ||
    video.videoUrl?.includes("youtu.be")
  );

  const embedUrl = getEmbedUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#131b2e] rounded-3xl shadow-2xl border border-zinc-700/60 overflow-hidden flex flex-col text-white max-h-[95vh] animate-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center font-bold">
              <Video className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <Play className="h-3 w-3 fill-current" /> Auto-Playing Video
                </span>
                {scannedCode && (
                  <span className="font-mono text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-zinc-300">
                    {scannedCode}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-white truncate max-w-md sm:max-w-xl">
                {video.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video Player Theater */}
        <div className="relative w-full bg-black aspect-video flex items-center justify-center overflow-hidden shadow-inner">
          {isYouTube ? (
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={video.videoUrl}
              autoPlay
              controls
              className="w-full h-full object-contain"
            >
              Your browser does not support HTML video.
            </video>
          )}
        </div>

        {/* Video Details & Book Meta */}
        <div className="p-4 bg-zinc-900/90 overflow-y-auto space-y-3.5 max-h-56 custom-scrollbar border-t border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white leading-tight">
                {video.title}
              </h3>
              {video.duration && (
                <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  Duration: {video.duration}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {video.videoUrl && (
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <span>Open Video URL</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              {video.bookId && (
                <Link
                  href={`/dashboard/books/chapters?bookId=${video.bookId}`}
                  onClick={onClose}
                  className="px-4 py-1.5 bg-[#004ac6] hover:bg-[#003899] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <BookMarked className="h-3.5 w-3.5" />
                  <span>View Book Chapters</span>
                </Link>
              )}
            </div>
          </div>

          {/* Book / Chapter Relation Card */}
          {(video.book || video.chapter) && (
            <div className="p-3 bg-zinc-800/60 rounded-2xl border border-zinc-700/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Mapped Textbook:</span>
                  <p className="font-bold text-zinc-200">
                    {video.book?.title || "Connected Book"}{" "}
                    {video.book?.class ? `(${video.book.class})` : ""}{" "}
                    {video.book?.subject ? `• ${video.book.subject}` : ""}
                  </p>
                </div>
              </div>

              {video.chapter && (
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Chapter:</span>
                    <p className="font-bold text-zinc-200">{video.chapter.title}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {video.description && (
            <p className="text-xs text-zinc-400 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
