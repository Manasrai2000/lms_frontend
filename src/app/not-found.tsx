"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Home,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const router = useRouter();

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#004ac6]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        {/* Animated Badge & Icon */}
        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-slate-800/80 border border-slate-700/60 shadow-2xl backdrop-blur-xl mb-2 group">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#004ac6] to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-[#004ac6]/30 group-hover:scale-105 transition-transform duration-300">
            <Compass className="h-8 w-8 animate-pulse" />
          </div>
        </div>

        {/* 404 Large Display Text */}
        <div className="space-y-3">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#004ac6]/20 border border-[#004ac6]/40 text-[#60a5fa] text-xs font-extrabold uppercase tracking-widest">
            404 Error - Page Not Found
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Lost in Digital Space?
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
            The route you are trying to access does not exist, has been moved, or you might not have permission to view it.
          </p>
        </div>

        {/* Action Buttons: Go Back & Go Home */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button
            onClick={handleGoBack}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-white font-bold px-6 py-6 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5 text-[#60a5fa]" />
            Go Back to Previous Page
          </Button>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-[#004ac6] to-indigo-600 hover:from-[#003cb0] hover:to-indigo-700 text-white font-bold px-8 py-6 rounded-2xl shadow-xl shadow-[#004ac6]/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" />
              Return to Dashboard
            </Button>
          </Link>
        </div>

      
      </div>
    </div>
  );
}
