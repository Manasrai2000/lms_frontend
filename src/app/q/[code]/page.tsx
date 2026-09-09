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
  HelpCircle as QuestionIcon,
  BookMarked,
  ArrowRight,
  Loader2,
  ShieldCheck,
  GraduationCap,
  Play,
  Video,
  Clock,
  ExternalLink,
} from "lucide-react";
import qrApi from "@/lib/api/qrcode";
import { QRVerifyResponse } from "@/types/qrcode";

export default function PublicQRScanPage({
  params,
}: {
  params: Promise<{ code: string }> | { code: string };
}) {
  const [code, setCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [verifyResult, setVerifyResult] = useState<QRVerifyResponse | null>(null);

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

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col justify-between font-sans">
      {/* Top Public Header */}
      <header className="bg-white border-b border-[#c3c6d7]/30 py-4 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-base text-[#131b2e]">
            <div className="h-8 w-8 rounded-lg bg-[#004ac6] flex items-center justify-center text-white font-black text-sm shadow-sm">
              L
            </div>
            <span>LMS Learning Portal</span>
          </Link>

          <span className="text-xs font-semibold bg-[#eaedff] text-[#004ac6] px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Official QR Verification
          </span>
        </div>
      </header>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-xl w-full mx-auto p-6 flex flex-col justify-center">
        {isLoading ? (
          <div className="bg-white p-8 rounded-3xl border border-[#c3c6d7]/30 shadow-xl text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#004ac6] mx-auto" />
            <h2 className="text-base font-bold text-[#131b2e]">Verifying QR Code...</h2>
            <p className="text-xs text-[#505f76]">
              Connecting to LMS textbook database for code{" "}
              <span className="font-mono font-bold text-[#004ac6]">{code}</span>
            </p>
          </div>
        ) : !verifyResult ? (
          <div className="bg-white p-8 rounded-3xl border border-[#c3c6d7]/30 shadow-xl text-center space-y-4">
            <HelpCircle className="h-12 w-12 text-zinc-400 mx-auto" />
            <h2 className="text-lg font-bold text-[#131b2e]">Unable to Process Code</h2>
            <p className="text-xs text-[#505f76]">
              Please check your internet connection or rescan the QR sticker.
            </p>
          </div>
        ) : verifyResult.valid && verifyResult.targetType === "VIDEO" && verifyResult.video ? (
          /* STATE 1A: VALID & ACTIVE VIDEO SHOWCASE */
          <div className="bg-white rounded-3xl border border-rose-200 shadow-xl overflow-hidden animate-in fade-in duration-200">
            {/* Header Badge Banner */}
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">
                  Video Lesson Verified
                </span>
              </div>
              <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                {code}
              </span>
            </div>

            {/* Video Player Theater */}
            <div className="relative w-full bg-black aspect-video flex items-center justify-center overflow-hidden shadow-inner">
              {verifyResult.video.youtubeVideoId ||
              verifyResult.video.videoUrl?.includes("youtube.com") ||
              verifyResult.video.videoUrl?.includes("youtu.be") ? (
                <iframe
                  src={
                    verifyResult.video.youtubeVideoId
                      ? `https://www.youtube.com/embed/${verifyResult.video.youtubeVideoId}?autoplay=1&rel=0`
                      : verifyResult.video.videoUrl.replace("watch?v=", "embed/") + "?autoplay=1&rel=0"
                  }
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
                  Your browser does not support HTML video.
                </video>
              )}
            </div>

            {/* Video Metadata Body */}
            <div className="p-6 space-y-4">
              <div>
                <h1 className="text-lg font-bold text-[#131b2e] leading-snug">
                  {verifyResult.video.title}
                </h1>
                {verifyResult.video.duration && (
                  <p className="text-xs text-[#505f76] flex items-center gap-1.5 mt-1">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    Duration: {verifyResult.video.duration}
                  </p>
                )}
              </div>

              {/* Book & Chapter Context */}
              {(verifyResult.video.book || verifyResult.video.chapter) && (
                <div className="p-3 bg-[#faf8ff] rounded-2xl border border-[#c3c6d7]/40 space-y-2 text-xs">
                  {verifyResult.video.book && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#004ac6] shrink-0" />
                      <span className="text-[#505f76]">
                        Textbook: <b className="text-[#131b2e]">{verifyResult.video.book.title}</b>{" "}
                        ({verifyResult.video.book.class} • {verifyResult.video.book.subject})
                      </span>
                    </div>
                  )}

                  {verifyResult.video.chapter && (
                    <div className="flex items-center gap-2">
                      <BookMarked className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="text-[#505f76]">
                        Chapter: <b className="text-[#131b2e]">{verifyResult.video.chapter.title}</b>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {verifyResult.video.description && (
                <p className="text-xs text-[#505f76] line-clamp-3">
                  {verifyResult.video.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                {verifyResult.video.bookId && (
                  <Link
                    href={`/dashboard/books/chapters?bookId=${verifyResult.video.bookId}`}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-[#004ac6] hover:bg-[#003899] text-white rounded-xl transition-colors font-bold text-xs shadow-xs"
                  >
                    <BookMarked className="h-4 w-4" />
                    <span>View Chapters & Resources</span>
                  </Link>
                )}

                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 p-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors font-bold text-xs"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Student Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        ) : verifyResult.valid && verifyResult.book ? (
          /* STATE 1B: VALID & ACTIVE BOOK SHOWCASE */
          <div className="bg-white rounded-3xl border border-emerald-200/80 shadow-xl overflow-hidden animate-in fade-in duration-200">
            {/* Header Badge Banner */}
            <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Textbook Verified & Active
                </span>
              </div>
              <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                {code}
              </span>
            </div>

            {/* Book Details Body */}
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
                {/* Book Cover Image / Fallback */}
                <div className="h-40 w-32 shrink-0 rounded-xl bg-[#faf8ff] border border-[#c3c6d7]/40 shadow-sm flex flex-col items-center justify-center p-2 relative overflow-hidden">
                  {verifyResult.book.coverImage ? (
                    <img
                      src={verifyResult.book.coverImage}
                      alt={verifyResult.book.title}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <BookOpen className="h-10 w-10 text-[#004ac6] mb-2" />
                      <span className="text-[10px] font-bold text-[#505f76] text-center line-clamp-2">
                        {verifyResult.book.title}
                      </span>
                    </>
                  )}
                </div>

                {/* Metadata */}
                <div className="space-y-2 flex-1">
                  <h1 className="text-xl font-black text-[#131b2e] leading-tight">
                    {verifyResult.book.title}
                  </h1>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                    {verifyResult.book.class && (
                      <span className="text-xs bg-[#eaedff] text-[#004ac6] px-2.5 py-0.5 rounded-full font-bold">
                        {verifyResult.book.class}
                      </span>
                    )}
                    {verifyResult.book.subject && (
                      <span className="text-xs bg-zinc-100 text-zinc-700 px-2.5 py-0.5 rounded-full font-bold">
                        {verifyResult.book.subject}
                      </span>
                    )}
                    {verifyResult.book.language && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-bold">
                        {verifyResult.book.language}
                      </span>
                    )}
                  </div>

                  {verifyResult.book.description && (
                    <p className="text-xs text-[#505f76] line-clamp-3 pt-1">
                      {verifyResult.book.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Dynamic Action Buttons & Learning Materials */}
              <div className="space-y-3 pt-4 border-t border-[#c3c6d7]/20">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-[#505f76] uppercase tracking-wider">
                    Official Digital Learning Resources
                  </p>
                  {verifyResult.book.chaptersCount ? (
                    <span className="text-[10px] font-bold bg-[#eaedff] text-[#004ac6] px-2 py-0.5 rounded-full">
                      {verifyResult.book.chaptersCount} Chapters
                    </span>
                  ) : null}
                </div>

                {/* 1. Digital Flipbook (E-Book Reader) */}
                {verifyResult.book.flipbooks && verifyResult.book.flipbooks.length > 0 ? (
                  <a
                    href={verifyResult.book.flipbooks[0].fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl transition-all font-bold text-xs shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <BookOpen className="h-4.5 w-4.5" />
                      </div>
                      <div className="text-left">
                        <p className="leading-tight">Read Digital Flipbook (E-Book)</p>
                        <p className="text-[10px] text-indigo-100 font-normal mt-0.5">
                          {verifyResult.book.flipbooks[0].title || "Official flipbook reader"}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ) : null}

                {/* 2. Practice Worksheet PDF */}
                {verifyResult.book.worksheet ? (
                  <a
                    href={verifyResult.book.worksheet.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl transition-all font-bold text-xs shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="text-left">
                        <p className="leading-tight">Download Practice Worksheet (PDF)</p>
                        <p className="text-[10px] text-amber-100 font-normal mt-0.5">
                          {verifyResult.book.worksheet.title}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ) : null}

                {/* 3. Video Lessons */}
                {verifyResult.book.videos && verifyResult.book.videos.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold text-[#505f76] uppercase tracking-wider">
                      Chapter Video Lectures ({verifyResult.book.videos.length})
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                      {verifyResult.book.videos.map((vid, idx) => (
                        <a
                          key={vid.id || idx}
                          href={vid.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl transition-colors text-xs font-semibold border border-rose-200"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="h-6 w-6 rounded bg-rose-200 text-rose-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="truncate">{vid.title}</span>
                          </div>
                          <span className="text-[10px] font-bold text-rose-600 shrink-0 ml-2">Watch &rarr;</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 4. Open Chapters & LMS Portal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <Link
                    href={`/dashboard/books/chapters?bookId=${verifyResult.book.id}`}
                    className="flex items-center justify-center gap-2 p-3 bg-[#004ac6] hover:bg-[#003899] text-white rounded-xl transition-colors font-bold text-xs shadow-xs"
                  >
                    <BookMarked className="h-4 w-4" />
                    <span>View Chapters</span>
                  </Link>

                  <Link
                    href="/dashboard"
                    className="flex items-center justify-center gap-2 p-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors font-bold text-xs"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Open in Dashboard</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : verifyResult.status === "UNMAPPED" ? (
          /* STATE 2: UNMAPPED QR CODE */
          <div className="bg-white p-8 rounded-3xl border border-amber-200 shadow-xl text-center space-y-4 animate-in fade-in duration-200">
            <div className="h-16 w-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div>
              <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                {code}
              </span>
              <h2 className="text-lg font-bold text-[#131b2e] mt-3">
                QR Code Not Yet Linked
              </h2>
            </div>

            <p className="text-xs text-[#505f76] leading-relaxed max-w-sm mx-auto">
              This physical QR code sticker is registered in our system but has not yet been assigned to a textbook. Please contact your school administrator or teacher.
            </p>

            <div className="pt-4 border-t border-[#c3c6d7]/20">
              <Link
                href="/login"
                className="text-xs font-bold text-[#004ac6] hover:underline"
              >
                Admin Login to Map this QR &rarr;
              </Link>
            </div>
          </div>
        ) : verifyResult.status === "INACTIVE" ? (
          /* STATE 3: INACTIVE QR CODE */
          <div className="bg-white p-8 rounded-3xl border border-rose-200 shadow-xl text-center space-y-4 animate-in fade-in duration-200">
            <div className="h-16 w-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertOctagon className="h-8 w-8" />
            </div>

            <div>
              <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                {code}
              </span>
              <h2 className="text-lg font-bold text-[#131b2e] mt-3">
                QR Code Inactive
              </h2>
            </div>

            <p className="text-xs text-[#505f76] leading-relaxed max-w-sm mx-auto">
              This QR code has been retired or deactivated by the school library. Please check with your teacher or administrator for updated learning materials.
            </p>
          </div>
        ) : (
          /* STATE 4: UNREGISTERED / NOT FOUND */
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl text-center space-y-4 animate-in fade-in duration-200">
            <div className="h-16 w-16 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto">
              <HelpCircle className="h-8 w-8" />
            </div>

            <div>
              <span className="font-mono text-xs font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">
                {code}
              </span>
              <h2 className="text-lg font-bold text-[#131b2e] mt-3">
                Unrecognized QR Code
              </h2>
            </div>

            <p className="text-xs text-[#505f76] leading-relaxed max-w-sm mx-auto">
              This code is not associated with any learning material in our LMS. Make sure you are scanning a valid LMS QR sticker.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-400 border-t border-[#c3c6d7]/20 bg-white">
        &copy; {new Date().getFullYear()} LMS Platform. All rights reserved.
      </footer>
    </div>
  );
}
