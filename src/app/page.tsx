"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Terminal, UserCheck, BookOpen, HelpCircle, QrCode, 
  ShieldCheck, ArrowRight, Layers, Cpu, Database, 
  PlayCircle, GitBranch, Sparkles, LayoutDashboard, User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isLoggedIn = isMounted && isAuthenticated && Boolean(user);

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-[#faf8ff]/80 backdrop-blur-md border-b border-[#c3c6d7]/30 shadow-sm">
        <nav className="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#131b2e] flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#004ac6] flex items-center justify-center text-white font-black text-sm shadow-sm shadow-[#004ac6]/20">
              A
            </div>
            AdminCore
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <a className="text-[#004ac6] font-semibold border-b-2 border-[#004ac6] text-sm py-1" href="#features">Platform</a>
            <a className="text-[#505f76] hover:text-[#004ac6] transition-colors text-sm" href="#features">Questions</a>
            <a className="text-[#505f76] hover:text-[#004ac6] transition-colors text-sm" href="#security">Security</a>
            <a className="text-[#505f76] hover:text-[#004ac6] transition-colors text-sm" href="#preview">Preview</a>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button className="bg-[#004ac6] hover:bg-[#004ac6]/90 text-white font-semibold shadow-sm flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff]">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-[#004ac6] hover:bg-[#004ac6]/90 text-white font-semibold shadow-sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="pt-16 flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-36 bg-gradient-to-b from-[#dbe1ff]/60 via-[#faf8ff] to-white border-b border-[#c3c6d7]/20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] opacity-40 pointer-events-none">
            <div className="w-full h-full bg-radial from-[#b4c5ff]/30 via-[#dbe1ff]/10 to-transparent blur-3xl rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#004ac6]/10 border border-[#004ac6]/20 text-xs font-semibold text-[#004ac6]">
              <Terminal className="h-3.5 w-3.5" />
              <span>Built for Next.js & TypeScript</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 max-w-4xl tracking-tight text-[#131b2e] leading-tight">
              Precision Engineering for <span className="text-[#004ac6] bg-clip-text text-transparent bg-gradient-to-r from-[#004ac6] to-[#2563eb]">Modern Education.</span>
            </h1>
            
            <p className="text-base md:text-lg text-[#434655] max-w-2xl mb-10 leading-relaxed">
              AdminCore is a high-performance LMS administrative backbone designed for scale. Manage users, curate complex question banks, and generate QR-linked educational assets with millisecond latency.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {isLoggedIn ? (
                <>
                  <Button 
                    onClick={() => router.push("/dashboard")}
                    size="lg" 
                    className="bg-[#004ac6] hover:bg-[#004ac6]/90 text-white font-semibold shadow-lg shadow-[#004ac6]/15 hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Go to Dashboard
                  </Button>
                  <Button 
                    onClick={() => router.push("/dashboard/profile")}
                    size="lg" 
                    variant="outline" 
                    className="bg-white border-[#c3c6d7] text-[#131b2e] hover:bg-[#f2f3ff] font-semibold hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer"
                  >
                    <UserIcon className="h-5 w-5 text-[#004ac6]" />
                    My Profile
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => router.push("/login")}
                    size="lg" 
                    className="bg-[#004ac6] hover:bg-[#004ac6]/90 text-white font-semibold shadow-lg shadow-[#004ac6]/15 hover:scale-105 transition-transform cursor-pointer"
                  >
                    Explore Dashboard
                  </Button>
                  <Button 
                    onClick={() => router.push("/register")}
                    size="lg" 
                    variant="outline" 
                    className="bg-white border-[#c3c6d7] text-[#131b2e] hover:bg-[#f2f3ff] font-semibold hover:scale-105 transition-transform cursor-pointer"
                  >
                    Create Account
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Technical Stack */}
        <section className="py-8 border-b border-[#c3c6d7]/20 bg-white">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-80 text-[#505f76]">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase">
              <Layers className="h-4.5 w-4.5 text-[#004ac6]" />
              <span>Next.js</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase">
              <Cpu className="h-4.5 w-4.5 text-[#004ac6]" />
              <span>TypeScript</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase">
              <Database className="h-4.5 w-4.5 text-[#004ac6]" />
              <span>MySQL</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase">
              <PlayCircle className="h-4.5 w-4.5 text-[#004ac6]" />
              <span>YouTube API</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase">
              <GitBranch className="h-4.5 w-4.5 text-[#004ac6]" />
              <span>Node.js</span>
            </div>
          </div>
        </section>

        {/* Key Features Grid */}
        <section id="features" className="py-24 bg-[#faf8ff]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16 text-center md:text-left space-y-2">
              <h2 className="text-3xl font-bold text-[#131b2e]">Administrative Core</h2>
              <p className="text-[#505f76] max-w-xl text-sm leading-relaxed">
                A specialized suite of tools designed to handle the heavy lifting of large-scale educational platforms.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* User Management */}
              <div className="group p-6 rounded-xl bg-white border border-[#c3c6d7]/40 shadow-sm hover:shadow-md hover:border-[#004ac6]/30 transition-all duration-300 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[#004ac6]/10 flex items-center justify-center group-hover:bg-[#004ac6] transition-colors">
                  <UserCheck className="h-6 w-6 text-[#004ac6] group-hover:text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#131b2e]">User Management</h3>
                <p className="text-xs text-[#505f76] leading-relaxed">
                  Granular access control and dynamic role assignment for faculty, students, and staff.
                </p>
                <div className="pt-2 border-t border-[#c3c6d7]/30">
                  <span className="font-mono text-[10px] text-[#004ac6] bg-[#004ac6]/10 px-2 py-0.5 rounded">RBAC SUPPORT</span>
                </div>
              </div>

              {/* Book Management */}
              <div className="group p-6 rounded-xl bg-white border border-[#c3c6d7]/40 shadow-sm hover:shadow-md hover:border-[#004ac6]/30 transition-all duration-300 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[#004ac6]/10 flex items-center justify-center group-hover:bg-[#004ac6] transition-colors">
                  <BookOpen className="h-6 w-6 text-[#004ac6] group-hover:text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#131b2e]">Content Management</h3>
                <p className="text-xs text-[#505f76] leading-relaxed">
                  Structured data for chapters, worksheets, and automated lesson planning across levels.
                </p>
                <div className="pt-2 border-t border-[#c3c6d7]/30">
                  <span className="font-mono text-[10px] text-[#004ac6] bg-[#004ac6]/10 px-2 py-0.5 rounded">JSON SCHEMA</span>
                </div>
              </div>

              {/* Question Bank */}
              <div className="group p-6 rounded-xl bg-white border border-[#c3c6d7]/40 shadow-sm hover:shadow-md hover:border-[#004ac6]/30 transition-all duration-300 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[#004ac6]/10 flex items-center justify-center group-hover:bg-[#004ac6] transition-colors">
                  <HelpCircle className="h-6 w-6 text-[#004ac6] group-hover:text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#131b2e]">Question Bank</h3>
                <p className="text-xs text-[#505f76] leading-relaxed">
                  Advanced import/export for MCQs, True/False, and complex math-ready question types.
                </p>
                <div className="pt-2 border-t border-[#c3c6d7]/30">
                  <span className="font-mono text-[10px] text-[#004ac6] bg-[#004ac6]/10 px-2 py-0.5 rounded">LATEX READY</span>
                </div>
              </div>

              {/* QR Generator */}
              <div className="group p-6 rounded-xl bg-white border border-[#c3c6d7]/40 shadow-sm hover:shadow-md hover:border-[#004ac6]/30 transition-all duration-300 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[#004ac6]/10 flex items-center justify-center group-hover:bg-[#004ac6] transition-colors">
                  <QrCode className="h-6 w-6 text-[#004ac6] group-hover:text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#131b2e]">QR Generator</h3>
                <p className="text-xs text-[#505f76] leading-relaxed">
                  Bulk generation of physical-to-digital QR bridges for textbook assets and videos.
                </p>
                <div className="pt-2 border-t border-[#c3c6d7]/30">
                  <span className="font-mono text-[10px] text-[#004ac6] bg-[#004ac6]/10 px-2 py-0.5 rounded">SVG VECTOR</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Administrative Excellence Section */}
        <section id="security" className="py-24 bg-white overflow-hidden border-t border-[#c3c6d7]/20">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-white p-6 rounded-2xl border border-[#c3c6d7] shadow-xl relative z-10">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#004ac6]/10 flex items-center justify-center text-[#004ac6]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#131b2e]">Audit Logs</h4>
                      <p className="text-[11px] text-[#505f76]">Real-time system observability</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-[10px] font-mono border border-emerald-200 text-emerald-600">ACTIVE</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-px h-auto bg-slate-100 mt-1" />
                    <div className="flex-1">
                      <p className="font-mono text-[11px] text-[#004ac6]">09:42:01 — SYS_ADMIN</p>
                      <p className="text-xs text-[#434655]">Modified Permission Set: &apos;Department Lead&apos;</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 opacity-70">
                    <div className="w-px h-auto bg-slate-100 mt-1" />
                    <div className="flex-1">
                      <p className="font-mono text-[11px] text-[#505f76]">09:41:45 — AUTH_SERVICE</p>
                      <p className="text-xs text-[#434655]">User login success from 192.168.1.1</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 opacity-50">
                    <div className="w-px h-auto bg-slate-100 mt-1" />
                    <div className="flex-1">
                      <p className="font-mono text-[11px] text-[#505f76]">09:38:12 — DB_POOL</p>
                      <p className="text-xs text-[#434655]">Index optimization complete for &apos;Questions&apos; table</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#004ac6]/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-[#b4c5ff]/20 rounded-full blur-3xl" />
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-[#131b2e] leading-tight">Engineered for Security & Complete Compliance.</h2>
              <p className="text-sm text-[#505f76] leading-relaxed">
                Every action within AdminCore is tracked, measured, and secure. We prioritize the integrity of your educational data with enterprise-standard audit logs and granular permission management.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#004ac6] shrink-0" />
                  <span className="text-sm font-semibold text-[#434655]">Immutable Audit History</span>
                </li>
                <li className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#004ac6] shrink-0" />
                  <span className="text-sm font-semibold text-[#434655]">JWT & OAuth2 Ready</span>
                </li>
                <li className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#004ac6] shrink-0" />
                  <span className="text-sm font-semibold text-[#434655]">Auto-scaling Database Architecture</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Product Preview */}
        <section id="preview" className="py-24 bg-[#faf8ff]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="rounded-2xl overflow-hidden border border-[#c3c6d7]/40 shadow-2xl bg-white p-2">
              <img 
                className="w-full h-auto object-cover rounded-xl" 
                alt="A clean, minimalist high-fidelity user interface dashboard of AdminCore platform" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyF2v2HNLkwthzDvJRzsspta94_NxhbaQK6bw6g_z7TLEpsdLszqJkK1uKGcNWbrrcOF87oQINiNWkYHCjyW7AeQMoAYPCGMUcBr2Kgf_LWGotHW9r161NAd-2Yh1ab4nmiupS0TuquwccAStlzNOZYt8eyp2DTkm-0UgMwqgF4ogRA4__x73AX6mV-fPji54as7IsmYVb4D1QINNywRBg6xjaH_h-In7LNzHfd396mku2-wuom-jOEF4eIsBfbgqRodAcADKH_QaC"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 text-center border-t border-[#c3c6d7]/20 bg-gradient-to-b from-white to-[#f2f3ff]">
          <div className="max-w-xl mx-auto px-6 space-y-6">
            <h2 className="text-3xl font-bold text-[#131b2e]">Ready to transform your administration?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={() => router.push("/register")} size="lg" className="bg-[#004ac6] hover:bg-[#004ac6]/90 text-white font-semibold shadow-md">
                Start Free Trial
              </Button>
              <Button onClick={() => router.push("/login")} size="lg" variant="outline" className="bg-white border-[#c3c6d7] text-[#131b2e] hover:bg-[#f2f3ff] font-semibold">
                View Admin Dashboard
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 bg-white border-t border-[#c3c6d7]/20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 px-6 max-w-7xl mx-auto">
          <div className="col-span-2 space-y-4">
            <div className="text-lg font-bold text-[#131b2e]">AdminCore</div>
            <p className="text-xs text-[#505f76] max-w-xs leading-relaxed">
              Precision engineering for the future of education. Scalable, secure, and developer-first.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h5 className="text-xs font-bold text-[#131b2e] uppercase tracking-wider">Solutions</h5>
            <a className="text-[#505f76] hover:text-[#004ac6] text-xs transition-colors hover:underline" href="#">User Management</a>
            <a className="text-[#505f76] hover:text-[#004ac6] text-xs transition-colors hover:underline" href="#">Question Banks</a>
            <a className="text-[#505f76] hover:text-[#004ac6] text-xs transition-colors hover:underline" href="#">QR Generation</a>
          </div>
          <div className="flex flex-col gap-3">
            <h5 className="text-xs font-bold text-[#131b2e] uppercase tracking-wider">Resources</h5>
            <a className="text-[#505f76] hover:text-[#004ac6] text-xs transition-colors hover:underline" href="#">API Docs</a>
            <a className="text-[#505f76] hover:text-[#004ac6] text-xs transition-colors hover:underline" href="#">Help Center</a>
            <a className="text-[#505f76] hover:text-[#004ac6] text-xs transition-colors hover:underline" href="#">Changelog</a>
          </div>
          <div className="flex flex-col gap-3">
            <h5 className="text-xs font-bold text-[#131b2e] uppercase tracking-wider">Legal</h5>
            <a className="text-[#505f76] hover:text-[#004ac6] text-xs transition-colors hover:underline" href="#">Privacy Policy</a>
            <a className="text-[#505f76] hover:text-[#004ac6] text-xs transition-colors hover:underline" href="#">Terms of Service</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 mt-8 border-t border-[#c3c6d7]/10 text-center">
          <p className="text-xs text-[#505f76]">© 2024 AdminCore LMS. Precision Engineering for Education.</p>
        </div>
      </footer>
    </div>
  );
}
