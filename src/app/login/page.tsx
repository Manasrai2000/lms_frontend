"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/lib/store/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { KeyRound, Mail, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth } = useAuthStore();
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
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  if (isMounted && isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="flex items-center gap-2 text-sm text-[#004ac6] font-semibold">
          <Loader2 className="h-5 w-5 animate-spin" /> Redirecting to dashboard...
        </div>
      </div>
    );
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", data);
      const { user, accessToken, refreshToken } = response.data;
      
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.fullName}!`);
      
      router.push("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.message || "Invalid credentials. Please try again.";
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
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131b2e]">
              LMS Admin Control
            </h1>
            <p className="text-sm text-[#505f76]">
              Sign in to manage users, books, and permissions
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
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
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] placeholder:text-zinc-400 focus:border-[#004ac6]/50"
                  {...register("password")}
                />

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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#004ac6] hover:underline"
                >
                  Forgot Password?
                </Link>
          </div>
          <div className="mt-2 text-center text-xs">
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
  );
}
