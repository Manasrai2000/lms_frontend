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
import { Sparkles, Loader2, UserPlus, Phone, Briefcase, User, Mail } from "lucide-react";
import Link from "next/link";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  companyName: z.string().min(2, "School/Company Name is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "teacher", "student"]),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
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
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "admin",
    },
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

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", data);
      const { user, accessToken, refreshToken } = response.data;
      
      setAuth(user, accessToken, refreshToken);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed. Try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#dbe1ff]/60 via-[#faf8ff] to-white px-4 py-12 selection:bg-primary/20 selection:text-primary">
      <div className="relative w-full max-w-lg">
        {/* Glow effect */}
        <div className="absolute -top-10 -left-10 h-72 w-72 rounded-full bg-[#004ac6]/10 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative bg-white rounded-2xl border border-[#c3c6d7] p-8 shadow-xl">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#004ac6]/10 text-[#004ac6] border border-[#004ac6]/20">
              <UserPlus className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131b2e]">
              Create Admin Account
            </h1>
            <p className="text-sm text-[#505f76]">
              Register yourself to start managing the LMS portal
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">Full Name</label>
                <div className="relative">
                  <User className="absolute top-3 left-3 h-4 w-4 text-[#505f76]" />
                  <Input
                    placeholder="John Doe"
                    className="pl-9 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] placeholder:text-zinc-400 focus:border-[#004ac6]/50"
                    {...register("fullName")}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs font-medium text-destructive mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">Username</label>
                <div className="relative">
                  <User className="absolute top-3 left-3 h-4 w-4 text-[#505f76]" />
                  <Input
                    placeholder="johndoe"
                    className="pl-9 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] placeholder:text-zinc-400 focus:border-[#004ac6]/50"
                    {...register("username")}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs font-medium text-destructive mt-1">{errors.username.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#131b2e]">Email Address</label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 h-4 w-4 text-[#505f76]" />
                <Input
                  type="email"
                  placeholder="john@company.com"
                  className="pl-9 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] placeholder:text-zinc-400 focus:border-[#004ac6]/50"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-medium text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">School/Company</label>
                <div className="relative">
                  <Briefcase className="absolute top-3 left-3 h-4 w-4 text-[#505f76]" />
                  <Input
                    placeholder="Tech Academy"
                    className="pl-9 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] placeholder:text-zinc-400 focus:border-[#004ac6]/50"
                    {...register("companyName")}
                  />
                </div>
                {errors.companyName && (
                  <p className="text-xs font-medium text-destructive mt-1">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute top-3 left-3 h-4 w-4 text-[#505f76]" />
                  <Input
                    placeholder="9988776655"
                    className="pl-9 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] placeholder:text-zinc-400 focus:border-[#004ac6]/50"
                    {...register("phoneNumber")}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-xs font-medium text-destructive mt-1">{errors.phoneNumber.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] placeholder:text-zinc-400 focus:border-[#004ac6]/50"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs font-medium text-destructive mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">Select Role</label>
                <div className="relative">
                  <select
                    className="flex h-9 w-full rounded-md border border-[#c3c6d7]/70 bg-[#faf8ff] px-3 py-1 text-sm text-[#131b2e] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:border-[#004ac6]/50 cursor-pointer"
                    {...register("role")}
                  >
                    <option value="admin" className="bg-white text-[#131b2e]">Admin</option>
                    <option value="teacher" className="bg-white text-[#131b2e]">Teacher</option>
                    <option value="student" className="bg-white text-[#131b2e]">Student</option>
                  </select>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 h-10 bg-[#004ac6] hover:bg-[#004ac6]/90 text-white flex items-center justify-center cursor-pointer font-semibold shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs">
            <span className="text-[#505f76]">Already registered? </span>
            <Link
              href="/login"
              className="font-semibold text-[#004ac6] hover:underline"
            >
              Login now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
