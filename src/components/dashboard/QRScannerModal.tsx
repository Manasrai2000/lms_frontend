"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  Upload,
  Keyboard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  RefreshCw,
  QrCode,
  FlipHorizontal,
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import qrApi, { extractQRCode } from "@/lib/api/qrcode";
import { QRCodeBook, QRCodeVideo, QRVerifyResponse } from "@/types/qrcode";
import { toast } from "sonner";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: (book: QRCodeBook, code: string) => void;
  onVerifiedVideo?: (video: QRCodeVideo, code: string) => void;
  onVerifiedResult?: (result: QRVerifyResponse, code: string) => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onVerified,
  onVerifiedVideo,
  onVerifiedResult,
}: QRScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "manual">("camera");
  const [manualCode, setManualCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = "html5-qr-reader-dashboard";

  // Handle scanned code verification
  const handleCodeFound = async (rawCode: string) => {
    const cleanCode = extractQRCode(rawCode);
    if (!cleanCode) return;

    // Stop scanner if running
    if (scannerRef.current && isScanningActive) {
      try {
        await scannerRef.current.stop();
        setIsScanningActive(false);
      } catch (e) {
        // ignore
      }
    }

    setIsLoading(true);
    setVerificationError(null);

    try {
      const result: QRVerifyResponse = await qrApi.verify(cleanCode);

      if (result.valid) {
        if (result.targetType === "VIDEO" && result.video) {
          toast.success(`Video verified: ${result.video.title}`);
          if (onVerifiedVideo) {
            onVerifiedVideo(result.video, cleanCode);
          }
          if (onVerifiedResult) {
            onVerifiedResult(result, cleanCode);
          }
          onClose();
          return;
        } else if (result.book) {
          toast.success(`Textbook verified: ${result.book.title}`);
          if (onVerified) {
            onVerified(result.book, cleanCode);
          }
          if (onVerifiedResult) {
            onVerifiedResult(result, cleanCode);
          }
          onClose();
          return;
        }
      }
      
      if (result.status === "UNMAPPED") {
        setVerificationError(`QR Code "${cleanCode}" is registered but not linked to any item yet.`);
        toast.warning("QR code not mapped.");
      } else if (result.status === "INACTIVE") {
        setVerificationError(`QR Code "${cleanCode}" has been deactivated.`);
        toast.error("QR code is inactive.");
      } else {
        setVerificationError(result.message || `QR Code "${cleanCode}" is not registered in the system.`);
        toast.error("Unrecognized QR Code.");
      }
    } catch (err: unknown) {
      console.error("Verification error:", err);
      setVerificationError(`Could not verify code "${cleanCode}". Please check your network or try again.`);
      toast.error("QR verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // ignore
      }
      setIsScanningActive(false);
    }
  };

  // Lifecycle for Camera Scanner
  useEffect(() => {
    let isCancelled = false;

    async function initCamera() {
      if (!isOpen || activeTab !== "camera") return;

      // Wait for mount
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (isCancelled) return;

      const element = document.getElementById(readerId);
      if (!element) return;

      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(readerId, {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
          });
        }

        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }

        if (isCancelled) return;

        await scannerRef.current.start(
          { facingMode },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleCodeFound(decodedText);
          },
          () => {
            // continuous scan tick
          }
        );

        if (!isCancelled) {
          setIsScanningActive(true);
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        console.error("Camera start error:", err);
        setIsScanningActive(false);
        const errorObj = err as { message?: string; name?: string };
        setCameraError(
          errorObj?.message?.includes("Permission") || errorObj?.name === "NotAllowedError"
            ? "Camera permission was denied. Please enable camera access in your browser or enter the code manually."
            : "Could not access camera. Please make sure no other app is using it, or use manual entry."
        );
      }
    }

    if (isOpen && activeTab === "camera") {
      initCamera();
    } else {
      stopCamera();
    }

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode]);

  // Handle File Upload Scan
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setVerificationError(null);

    try {
      const html5QrCode = new Html5Qrcode("html5-qr-file-scanner");
      const decodedText = await html5QrCode.scanFile(file, true);
      await handleCodeFound(decodedText);
    } catch (err: unknown) {
      console.error("File scan failed:", err);
      setVerificationError("No valid QR code found in the uploaded image. Please try another photo.");
      toast.error("Could not find QR in image");
      setIsLoading(false);
    }
  };

  // Handle Manual Submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error("Please enter a QR code or URL");
      return;
    }
    handleCodeFound(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#c3c6d7]/40 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Hidden element for file scanning */}
        <div id="html5-qr-file-scanner" className="hidden" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#c3c6d7]/30 flex items-center justify-between bg-[#faf8ff]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#004ac6] text-white flex items-center justify-center font-bold shadow-sm shadow-[#004ac6]/20">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#131b2e]">Scan Physical Book QR</h2>
              <p className="text-[11px] text-[#505f76]">Instant access to Flipbooks, Worksheets & Videos</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-500 hover:text-[#131b2e] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#c3c6d7]/30 bg-white p-1.5 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "camera"
                ? "bg-[#004ac6] text-white shadow-xs font-bold"
                : "text-[#505f76] hover:bg-[#eaedff]/60 hover:text-[#004ac6]"
            }`}
          >
            <Camera className="h-4 w-4" />
            Live Camera
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-[#004ac6] text-white shadow-xs font-bold"
                : "text-[#505f76] hover:bg-[#eaedff]/60 hover:text-[#004ac6]"
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "manual"
                ? "bg-[#004ac6] text-white shadow-xs font-bold"
                : "text-[#505f76] hover:bg-[#eaedff]/60 hover:text-[#004ac6]"
            }`}
          >
            <Keyboard className="h-4 w-4" />
            Enter Code
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* Verification Alert / Status */}
          {verificationError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Verification Notice</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{verificationError}</p>
              </div>
            </div>
          )}

          {/* TAB 1: LIVE CAMERA */}
          {activeTab === "camera" && (
            <div className="space-y-3">
              <div className="relative w-full aspect-square max-w-[320px] mx-auto rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-[#004ac6]/30 shadow-inner">
                {/* HTML5 QR Code Mount Element */}
                <div id={readerId} className="w-full h-full object-cover" />

                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2 z-20">
                    <Loader2 className="h-8 w-8 animate-spin text-[#004ac6]" />
                    <p className="text-xs font-bold">Verifying Textbook QR...</p>
                  </div>
                )}

                {/* Camera Error Display */}
                {cameraError && (
                  <div className="absolute inset-0 bg-zinc-900/90 p-6 flex flex-col items-center justify-center text-center text-white gap-3 z-10">
                    <AlertCircle className="h-8 w-8 text-rose-400" />
                    <p className="text-xs text-zinc-300">{cameraError}</p>
                    <button
                      onClick={() => setActiveTab("manual")}
                      className="px-4 py-1.5 bg-[#004ac6] text-white text-xs font-bold rounded-lg hover:bg-[#003899]"
                    >
                      Enter Code Manually
                    </button>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between text-xs text-[#505f76] px-2">
                <span className="flex items-center gap-1 text-[11px]">
                  <Sparkles className="h-3 w-3 text-[#004ac6]" />
                  Align the QR sticker inside the frame
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-[#004ac6] hover:underline cursor-pointer"
                >
                  <FlipHorizontal className="h-3.5 w-3.5" />
                  Flip Camera
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <label
                htmlFor="qr-file-upload-input"
                className="border-2 border-dashed border-[#c3c6d7] hover:border-[#004ac6] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#faf8ff] hover:bg-[#eaedff]/30"
              >
                <div className="h-12 w-12 rounded-2xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center mb-3">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-[#131b2e]">Upload QR Code Image</p>
                <p className="text-xs text-[#505f76] mt-1 max-w-xs">
                  Upload a photo or screenshot of the QR code printed on the textbook
                </p>
                <span className="mt-4 px-4 py-2 bg-white border border-[#c3c6d7]/50 rounded-xl text-xs font-bold text-[#004ac6] shadow-2xs">
                  Choose Image File
                </span>
                <input
                  id="qr-file-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#004ac6] py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing image and verifying QR...
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANUAL INPUT */}
          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#131b2e]">
                  Enter QR Code or URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. BK-43098571 or https://domain.com/q/BK-..."
                    className="w-full px-4 py-3 bg-[#faf8ff] border border-[#c3c6d7]/60 rounded-xl text-sm font-mono text-[#131b2e] placeholder:text-zinc-400 focus:outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/20 transition-all"
                    autoFocus
                  />
                  {manualCode && (
                    <button
                      type="button"
                      onClick={() => setManualCode("")}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#505f76]">
                  Tip: You can enter the alphanumeric code printed beneath the sticker or paste the full scanned URL.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !manualCode.trim()}
                className="w-full py-3 bg-[#004ac6] hover:bg-[#003899] text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Verify & Open Resources</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#faf8ff] border-t border-[#c3c6d7]/30 flex items-center justify-between text-xs text-[#505f76]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            LMS Live Verification Engine
          </span>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-3 py-1.5 bg-white border border-[#c3c6d7]/40 rounded-lg font-semibold hover:bg-zinc-100 text-zinc-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
