"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  BookOpen,
  FileText,
  BookMarked,
  ArrowRight,
  Loader2,
  ShieldCheck,
  GraduationCap,
  Play,
  Video,
  Clock,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Sparkles,
  Layers,
  Download,
  Library,
  Compass,
  ArrowLeft,
} from "lucide-react";
import qrApi from "@/lib/api/qrcode";
import { QRVerifyResponse } from "@/types/qrcode";

function getEmbedUrl(videoUrl?: string, youtubeVideoId?: string | null): string | null {
  if (youtubeVideoId) {
    return `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0`;
  }
  if (!videoUrl) return null;

  const shortMatch = videoUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch && shortMatch[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&rel=0`;
  }

  const longMatch = videoUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (longMatch && longMatch[1]) {
    return `https://www.youtube.com/embed/${longMatch[1]}?autoplay=1&rel=0`;
  }

  if (videoUrl.includes("/embed/")) {
    return videoUrl;
  }

  return null;
}

export default function PublicQRScanPage({
  params,
}: {
  params: Promise<{ code: string }> | { code: string };
}) {
  const [code, setCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [verifyResult, setVerifyResult] = useState<QRVerifyResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Unwrap params safely
  useEffect(() => {
    async function resolveParams() {
      const resolved = await params;
      if (resolved && resolved.code) {
        setCode(resolved.code);
      }
    }
    resolveParams();
  }, [params]);

  // Fetch verification details once code is set
  useEffect(() => {
    if (!code) return;

    async function fetchVerification() {
      try {
        setIsLoading(true);
        const res = await qrApi.verify(code);
        setVerifyResult(res);
      } catch (err: any) {
        console.error("Public QR verification error:", err);
        setVerifyResult({
          valid: false,
          status: "NOT_FOUND",
          reason: "QR_NOT_FOUND",
          message: "QR code is not registered in the system",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchVerification();
  }, [code]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isVideoState = Boolean(verifyResult?.valid && verifyResult?.targetType === "VIDEO" && verifyResult?.video);
  const isBookState = Boolean(verifyResult?.valid && verifyResult?.book);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isVideoState ? "bg-[#090d16] text-slate-100" : "bg-[#f8faff] text-[#131b2e]"
      }`}
    >
      {/* Top Full-Width Navigation Bar */}
      <header
        className={`w-full sticky top-0 z-30 transition-all backdrop-blur-md border-b ${
          isVideoState
            ? "bg-[#090d16]/90 border-slate-800/80 text-white"
            : "bg-white/90 border-[#c3c6d7]/30 text-[#131b2e] shadow-xs"
        }`}
      >
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-base tracking-tight hover:opacity-90 transition-opacity"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#003899] to-[#005bf5] flex items-center justify-center text-white font-black text-base shadow-md">
                L
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold text-sm sm:text-base">LMS Learning Portal</span>
                <span
                  className={`text-[10px] hidden sm:block ${
                    isVideoState ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Digital Curriculum Delivery
                </span>
              </div>
            </Link>
          </div>

          {/* Center / Right Verification Badges & Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {code && (
              <div
                className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  isVideoState
                    ? "bg-slate-800/80 border-slate-700 text-slate-300"
                    : "bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>QR: {code}</span>
              </div>
            )}

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                isVideoState
                  ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-400"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-700"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Verified Material</span>
            </div>

            <button
              onClick={handleCopyLink}
              type="button"
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                isVideoState
                  ? "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
              }`}
              title="Copy link to this resource"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="hidden sm:inline text-emerald-500 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#004ac6] hover:bg-[#003899] text-white font-bold text-xs shadow-sm transition-all"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Full-Width Content Canvas */}
      <main className="flex-1 w-full flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl text-center space-y-4 shadow-2xl">
              <Loader2 className="h-12 w-12 animate-spin text-[#005bf5] mx-auto" />
              <h2 className="text-lg font-bold">Verifying QR Code...</h2>
              <p className="text-xs text-slate-400">
                Retrieving official learning resources for code{" "}
                <span className="font-mono font-bold text-[#388bfd]">{code}</span>
              </p>
            </div>
          </div>
        ) : !verifyResult ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-xl">
              <HelpCircle className="h-12 w-12 text-slate-400 mx-auto" />
              <h2 className="text-xl font-bold text-[#131b2e]">Unable to Process Code</h2>
              <p className="text-xs text-[#505f76]">
                Please check your internet connection or rescan the QR sticker.
              </p>
            </div>
          </div>
        ) : isVideoState && verifyResult.video ? (
          /* ========================================================================= */
          /* STATE 1: FULL-WIDTH CINEMATIC VIDEO DELIVERY VIEW                         */
          /* ========================================================================= */
          <div className="w-full flex-1 flex flex-col">
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex-1 flex flex-col">
              {/* Breadcrumb Path */}
              <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400 mb-4">
                <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                  <Library className="h-3.5 w-3.5" />
                  <span>Portal</span>
                </Link>
                <span>/</span>
                {verifyResult.video.book && (
                  <>
                    <Link
                      href={`/dashboard/books/chapters?bookId=${verifyResult.video.book.id}`}
                      className="hover:text-blue-400 transition-colors font-medium"
                    >
                      {verifyResult.video.book.title}
                    </Link>
                    <span>/</span>
                  </>
                )}
                {verifyResult.video.chapter && (
                  <>
                    <span className="text-slate-300 font-medium">
                      {verifyResult.video.chapter.title}
                    </span>
                    <span>/</span>
                  </>
                )}
                <span className="text-blue-400 font-semibold truncate max-w-xs sm:max-w-md">
                  {verifyResult.video.title}
                </span>
              </div>

              {/* Main Theater & Companion Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* Left (or Center) Theater Main Stream - 8/12 on large, 9/12 on xl */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-5">
                  {/* Expansive Video Screen */}
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 ring-1 ring-white/10 group">
                    {getEmbedUrl(verifyResult.video.videoUrl, verifyResult.video.youtubeVideoId) ? (
                      <iframe
                        src={getEmbedUrl(verifyResult.video.videoUrl, verifyResult.video.youtubeVideoId)!}
                        title={verifyResult.video.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={verifyResult.video.videoUrl}
                        autoPlay
                        controls
                        className="w-full h-full object-contain"
                      >
                        Your browser does not support HTML5 video streaming.
                      </video>
                    )}
                  </div>

                  {/* Video Title & Primary Metadata Card */}
                  <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                            <Play className="h-3 w-3 fill-current" />
                            Lesson Video
                          </span>
                          {verifyResult.video.duration && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-slate-400" />
                              {verifyResult.video.duration}
                            </span>
                          )}
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            ID #{verifyResult.video.id}
                          </span>
                        </div>

                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
                          {verifyResult.video.title}
                        </h1>
                      </div>

                      {/* Quick Action Share */}
                      <button
                        onClick={handleCopyLink}
                        type="button"
                        className="self-start px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-colors shrink-0"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        <span>{copied ? "Link Copied!" : "Copy Lesson Link"}</span>
                      </button>
                    </div>

                    {/* Lesson Description */}
                    {verifyResult.video.description && (
                      <div className="pt-3 border-t border-slate-800">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Lesson Overview
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                          {verifyResult.video.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Companion Sidebar - 4/12 on large, 3/12 on xl */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-4">
                  {/* Linked Textbook & Chapter Card */}
                  {(verifyResult.video.book || verifyResult.video.chapter) && (
                    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <BookOpen className="h-4 w-4 text-[#388bfd]" />
                        <span>Curriculum Context</span>
                      </div>

                      {verifyResult.video.book && (
                        <div className="space-y-2 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                            Textbook
                          </p>
                          <h4 className="text-sm font-bold text-white leading-snug">
                            {verifyResult.video.book.title}
                          </h4>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {verifyResult.video.book.class && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#004ac6]/30 text-[#85b7ff] border border-[#004ac6]/40">
                                {verifyResult.video.book.class}
                              </span>
                            )}
                            {verifyResult.video.book.subject && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-700 text-slate-200">
                                {verifyResult.video.book.subject}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {verifyResult.video.chapter && (
                        <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                            Chapter
                          </p>
                          <div className="flex items-start gap-2">
                            <BookMarked className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <h4 className="text-sm font-bold text-slate-100 leading-snug">
                              {verifyResult.video.chapter.title}
                            </h4>
                          </div>
                        </div>
                      )}

                      {/* Navigation CTAs */}
                      <div className="space-y-2 pt-2">
                        {verifyResult.video.bookId && (
                          <Link
                            href={`/dashboard/books/chapters?bookId=${verifyResult.video.bookId}`}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#004ac6] hover:bg-[#003899] text-white font-bold text-xs transition-all shadow-md group"
                          >
                            <span className="flex items-center gap-2">
                              <BookMarked className="h-4 w-4" />
                              <span>Explore Full Book & Chapters</span>
                            </span>
                            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                          </Link>
                        )}

                        <Link
                          href="/dashboard"
                          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors"
                        >
                          <GraduationCap className="h-4 w-4 text-slate-400" />
                          <span>Student LMS Portal</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* QR Security & Authenticity Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>Authentic LMS Resource</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      This video lesson was directly verified from physical textbook QR code{" "}
                      <span className="font-mono text-slate-200 font-bold">{code}</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : isBookState && verifyResult.book ? (
          /* ========================================================================= */
          /* STATE 2: FULL-WIDTH TEXTBOOK CURRICULUM PORTAL VIEW                       */
          /* ========================================================================= */
          <div className="w-full flex-1 flex flex-col">
            {/* Immersive Full-Width Hero Showcase */}
            <div className="w-full bg-gradient-to-r from-slate-900 via-[#003380] to-[#004ac6] text-white py-8 sm:py-12 border-b border-blue-900/40 relative overflow-hidden shadow-lg">
              {/* Background ambient decorative elements */}
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

              <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-10">
                  {/* Book Cover / 3D Frame */}
                  <div className="h-60 sm:h-72 w-44 sm:w-52 shrink-0 rounded-2xl bg-white/10 p-2.5 backdrop-blur-md border border-white/20 shadow-2xl flex flex-col items-center justify-center relative group">
                    {verifyResult.book.coverImage ? (
                      <img
                        src={verifyResult.book.coverImage}
                        alt={verifyResult.book.title}
                        className="h-full w-full object-cover rounded-xl shadow-md"
                      />
                    ) : (
                      <div className="h-full w-full rounded-xl bg-gradient-to-b from-blue-900/60 to-slate-900/80 flex flex-col items-center justify-center p-4 text-center border border-white/10">
                        <BookOpen className="h-14 w-14 text-blue-300 mb-3" />
                        <span className="text-xs font-bold text-white line-clamp-3">
                          {verifyResult.book.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata & Headline Summary */}
                  <div className="flex-1 text-center lg:text-left space-y-4">
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Textbook Verified
                      </span>
                      {verifyResult.book.class && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm border border-white/20">
                          {verifyResult.book.class}
                        </span>
                      )}
                      {verifyResult.book.subject && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm border border-white/20">
                          {verifyResult.book.subject}
                        </span>
                      )}
                      {verifyResult.book.language && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                          {verifyResult.book.language}
                        </span>
                      )}
                      {verifyResult.book.chaptersCount ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/30 text-amber-200 border border-amber-400/30">
                          {verifyResult.book.chaptersCount} Chapters
                        </span>
                      ) : null}
                    </div>

                    <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                      {verifyResult.book.title}
                    </h1>

                    {verifyResult.book.description && (
                      <p className="text-sm sm:text-base text-blue-100 max-w-4xl leading-relaxed">
                        {verifyResult.book.description}
                      </p>
                    )}

                    {/* Primary Hero Actions */}
                    <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                      {verifyResult.book.flipbooks && verifyResult.book.flipbooks.length > 0 && (
                        <a
                          href={verifyResult.book.flipbooks[0].fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-3 rounded-xl bg-white text-[#003899] hover:bg-blue-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all"
                        >
                          <BookOpen className="h-4 w-4" />
                          <span>Open Digital Flipbook</span>
                        </a>
                      )}

                      {verifyResult.book.worksheet && (
                        <a
                          href={verifyResult.book.worksheet.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Download Worksheet</span>
                        </a>
                      )}

                      <Link
                        href={`/dashboard/books/chapters?bookId=${verifyResult.book.id}`}
                        className="px-5 py-3 rounded-xl bg-blue-900/60 hover:bg-blue-900/80 text-white border border-white/20 font-bold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-sm transition-all"
                      >
                        <BookMarked className="h-4 w-4" />
                        <span>View All Chapters</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum Resource Grid */}
            <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Chapter Video Lectures (approx 7-8 cols) */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-[#004ac6]" />
                      <h2 className="text-lg font-bold text-[#131b2e]">
                        Chapter Video Lectures
                      </h2>
                    </div>
                    {verifyResult.book.videos && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#004ac6]">
                        {verifyResult.book.videos.length} Lectures Available
                      </span>
                    )}
                  </div>

                  {verifyResult.book.videos && verifyResult.book.videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {verifyResult.book.videos.map((vid, idx) => (
                        <a
                          key={vid.id || idx}
                          href={vid.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-[#004ac6] bg-blue-50 px-2.5 py-0.5 rounded-md">
                                Lecture #{idx + 1}
                              </span>
                              {vid.duration && (
                                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {vid.duration}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-[#131b2e] group-hover:text-[#004ac6] transition-colors line-clamp-2">
                              {vid.title}
                            </h3>
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#004ac6]">
                            <span className="flex items-center gap-1">
                              <Play className="h-3.5 w-3.5 fill-current" />
                              Watch Lesson
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                      <Video className="h-8 w-8 text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold text-slate-600">
                        No individual video lectures linked directly to this book QR code.
                      </p>
                      <p className="text-xs text-slate-400">
                        Browse the chapters section below or in your student dashboard.
                      </p>
                    </div>
                  )}

                  {/* Syllabus & Chapters Portal Card */}
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BookMarked className="h-5 w-5 text-[#004ac6]" />
                        <h3 className="text-base font-bold text-[#131b2e]">
                          Complete Book Syllabus & Table of Contents
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600">
                        Access detailed chapter summaries, multimedia resources, and practice quizzes.
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/books/chapters?bookId=${verifyResult.book.id}`}
                      className="px-4 py-2.5 rounded-xl bg-[#004ac6] hover:bg-[#003899] text-white font-bold text-xs shrink-0 flex items-center gap-2 shadow-sm transition-all"
                    >
                      <span>Open Chapters</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Right Column: Digital Resources & Quick Actions (approx 4-5 cols) */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-5">
                  <h2 className="text-lg font-bold text-[#131b2e] pb-2 border-b border-slate-200 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    <span>Digital Study Materials</span>
                  </h2>

                  {/* 1. Digital Flipbook */}
                  {verifyResult.book.flipbooks && verifyResult.book.flipbooks.length > 0 ? (
                    <div className="p-5 rounded-2xl bg-white border border-indigo-200/80 shadow-xs space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#131b2e]">Digital Flipbook (E-Book)</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {verifyResult.book.flipbooks[0].title || "Official flipbook reader for interactive learning"}
                          </p>
                        </div>
                      </div>

                      <a
                        href={verifyResult.book.flipbooks[0].fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Launch E-Book Reader</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : null}

                  {/* 2. Practice Worksheet */}
                  {verifyResult.book.worksheet ? (
                    <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-xs space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#131b2e]">Practice Worksheet</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {verifyResult.book.worksheet.title}
                          </p>
                        </div>
                      </div>

                      <a
                        href={verifyResult.book.worksheet.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Worksheet PDF</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : null}

                  {/* Student LMS Access Card */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <GraduationCap className="h-4 w-4 text-[#004ac6]" />
                      <span>Student LMS Hub</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Sign in to track reading progress, complete practice quizzes, and access teacher notes.
                    </p>
                    <Link
                      href="/dashboard"
                      className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors"
                    >
                      <GraduationCap className="h-4 w-4" />
                      <span>Open Student Dashboard</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : verifyResult.status === "UNMAPPED" ? (
          /* ========================================================================= */
          /* STATE 3: UNMAPPED QR CODE (Centered Feedback Box)                         */
          /* ========================================================================= */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-white p-8 sm:p-10 rounded-3xl border border-amber-200 shadow-xl text-center space-y-5 animate-in fade-in duration-200">
              <div className="h-16 w-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-8 w-8" />
              </div>

              <div>
                <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
                  {code}
                </span>
                <h2 className="text-xl font-bold text-[#131b2e] mt-3">
                  QR Code Not Yet Linked
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                This physical QR sticker is registered in the system but has not yet been linked to a textbook or video lesson.
              </p>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xl bg-[#004ac6] hover:bg-[#003899] text-white text-xs font-bold transition-colors"
                >
                  Admin Login to Map QR
                </Link>
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        ) : verifyResult.status === "INACTIVE" ? (
          /* ========================================================================= */
          /* STATE 4: INACTIVE QR CODE                                                 */
          /* ========================================================================= */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-white p-8 sm:p-10 rounded-3xl border border-rose-200 shadow-xl text-center space-y-5 animate-in fade-in duration-200">
              <div className="h-16 w-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertOctagon className="h-8 w-8" />
              </div>

              <div>
                <span className="font-mono text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-md border border-rose-200">
                  {code}
                </span>
                <h2 className="text-xl font-bold text-[#131b2e] mt-3">
                  QR Code Inactive
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                This QR code has been retired or deactivated by the school administration. Please consult your instructor for current textbook resources.
              </p>

              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-block"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STATE 5: UNRECOGNIZED / NOT FOUND                                         */
          /* ========================================================================= */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-5 animate-in fade-in duration-200">
              <div className="h-16 w-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <HelpCircle className="h-8 w-8" />
              </div>

              <div>
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
                  {code}
                </span>
                <h2 className="text-xl font-bold text-[#131b2e] mt-3">
                  Unrecognized QR Code
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                This code is not associated with any learning material in our LMS. Ensure you are scanning an official QR code sticker.
              </p>

              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-block"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`w-full py-4 text-center text-xs border-t transition-colors ${
          isVideoState
            ? "bg-[#090d16] border-slate-800 text-slate-500"
            : "bg-white border-slate-200 text-slate-500"
        }`}
      >
        <div className="w-full max-w-[1800px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} LMS Platform. Official Educational Materials.</span>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/dashboard" className="hover:underline">Student Dashboard</Link>
            <Link href="/login" className="hover:underline">Admin Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

