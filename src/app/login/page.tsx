"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/lib/store/auth";
import api, { saveNewTokens } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { KeyRound, Mail, Sparkles, Loader2, LogOut, ArrowRight, User as UserIcon, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      // Purge any existing session before authenticating new account
      clearAuth();

      const response = await api.post("/auth/login", data);
      const { user: loggedInUser, accessToken, refreshToken } = response.data;

      // Save tokens to both localStorage and Zustand Store synchronously
      saveNewTokens(accessToken, refreshToken, loggedInUser);
      toast.success(`Welcome back, ${loggedInUser.fullName || loggedInUser.name || "User"}!`);

      router.push("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.message || "Invalid credentials. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    clearAuth();
    toast.info("Previous session cleared. Please log in with your new account.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#dbe1ff]/60 via-[#faf8ff] to-white px-4 py-8 selection:bg-primary/20 selection:text-primary">
      <div className="relative w-full max-w-md">
        {/* Background Glow Effect */}
        <div className="absolute -top-10 -left-10 h-72 w-72 rounded-full bg-[#004ac6]/10 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative bg-white rounded-2xl border border-[#c3c6d7] p-8 shadow-xl space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#004ac6]/10 text-[#004ac6] border border-[#004ac6]/20">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131b2e]">
              LMS Portal Sign In
            </h1>
            <p className="text-sm text-[#505f76]">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {/* Active Session Callout Banner */}
          {isMounted && isAuthenticated && user && (
            <div className="p-4 bg-[#eaedff]/60 border border-[#004ac6]/30 rounded-xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#004ac6] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-[#505f76]">Currently logged in as:</p>
                  <p className="text-xs font-bold text-[#131b2e] truncate">{user.fullName || user.email}</p>
                  <p className="text-[10px] text-[#505f76] capitalize">{user.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-[#c3c6d7]/30">
                <Button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="flex-1 bg-[#004ac6] hover:bg-[#003899] text-white text-xs font-semibold h-8 rounded-lg gap-1.5 cursor-pointer"
                >
                  Go to Dashboard
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSwitchAccount}
                  className="border-[#c3c6d7] text-zinc-700 hover:bg-white text-xs font-semibold h-8 rounded-lg gap-1.5 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-zinc-500" />
                  Switch Account
                </Button>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#131b2e]">Email Address</label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 h-4.5 w-4.5 text-[#505f76]" />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] placeholder:text-zinc-400 focus:border-[#004ac6]/50"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[#131b2e]">Password</label>
              </div>
              <div className="relative">
                <KeyRound className="absolute top-3 left-3 h-4.5 w-4.5 text-[#505f76]" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] placeholder:text-zinc-400 focus:border-[#004ac6]/50"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-2.5 right-3 text-[#505f76] hover:text-[#131b2e] transition-colors cursor-pointer p-0.5 rounded focus:outline-hidden"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {errors.password.message}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="space-y-2 text-center text-xs">
            <div>
              <Link
                href="/forgot-password"
                className="font-medium text-[#004ac6] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div>
              <span className="text-[#505f76]">Don&apos;t have an account? </span>
              <Link
                href="/register"
                className="font-semibold text-[#004ac6] hover:underline"
              >
                Register here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
