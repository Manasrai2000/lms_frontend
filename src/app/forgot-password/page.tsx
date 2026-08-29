"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { KeyRound, Mail, Sparkles, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

import { useAuthStore } from "@/lib/store/auth";

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isAuthenticated && user) {
      router.replace("/dashboard");
    }
  }, [isMounted, isAuthenticated, user, router]);

  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: forgotErrors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSendOtp = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", data);
      setEmail(data.email);
      toast.success("OTP has been sent to your email!");
      setStep(2);
    } catch (error: unknown) {
      let message = "Failed to send OTP. Please try again.";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    try {
      await api.post("/auth/verify-otp", {
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast.success("Password reset successfully! Please log in.");
      router.push("/login");
    } catch (error: unknown) {
      let message = "Failed to reset password. Please check your OTP and try again.";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#dbe1ff]/60 via-[#faf8ff] to-white px-4 selection:bg-primary/20 selection:text-primary">
      <div className="relative w-full max-w-md">
        {/* Glow effect */}
        <div className="absolute -top-10 -left-10 h-72 w-72 rounded-full bg-[#004ac6]/10 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative bg-white rounded-2xl border border-[#c3c6d7] p-8 shadow-xl">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#004ac6]/10 text-[#004ac6] border border-[#004ac6]/20">
              {step === 1 ? (
                <Sparkles className="h-6 w-6 animate-pulse" />
              ) : (
                <ShieldCheck className="h-6 w-6 text-[#004ac6]" />
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131b2e]">
              {step === 1 ? "Forgot Password" : "Reset Password"}
            </h1>
            <p className="text-sm text-[#505f76]">
              {step === 1
                ? "Enter your email to receive a password reset OTP"
                : `We've sent a 6-digit OTP to ${email}`}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSubmitForgot(onSendOtp)} className="mt-8 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">Email Address</label>
                <div className="relative">
                  <Mail className="absolute top-3 left-3 h-4.5 w-4.5 text-[#505f76]" />
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    className="pl-10 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] placeholder:text-zinc-400 focus:border-[#004ac6]/50"
                    {...registerForgot("email")}
                  />
                </div>
                {forgotErrors.email && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    {forgotErrors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 h-10 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white flex items-center justify-center font-semibold cursor-pointer shadow-sm shadow-[#004ac6]/10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP
                  </>
                ) : (
                  "Send Reset OTP"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmitReset(onResetPassword)} className="mt-8 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">OTP Code</label>
                <div className="relative">
                  <KeyRound className="absolute top-3 left-3 h-4.5 w-4.5 text-[#505f76]" />
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    className="pl-10 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] placeholder:text-zinc-400 focus:border-[#004ac6]/50"
                    {...registerReset("otp")}
                  />
                </div>
                {resetErrors.otp && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    {resetErrors.otp.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute top-3 left-3 h-4.5 w-4.5 text-[#505f76]" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] placeholder:text-zinc-400 focus:border-[#004ac6]/50"
                    {...registerReset("newPassword")}
                  />
                </div>
                {resetErrors.newPassword && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    {resetErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">Confirm New Password</label>
                <div className="relative">
                  <KeyRound className="absolute top-3 left-3 h-4.5 w-4.5 text-[#505f76]" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] placeholder:text-zinc-400 focus:border-[#004ac6]/50"
                    {...registerReset("confirmPassword")}
                  />
                </div>
                {resetErrors.confirmPassword && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    {resetErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 h-10 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white flex items-center justify-center font-semibold cursor-pointer shadow-sm shadow-[#004ac6]/10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting Password
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs font-semibold text-[#505f76] hover:text-[#004ac6] mt-2 flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="h-3 w-3" /> Change email
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-semibold text-[#004ac6] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
