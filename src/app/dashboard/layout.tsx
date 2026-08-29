"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, HelpCircle, QrCode, 
  BarChart3, Settings, LogOut, Menu, X, ChevronDown, ChevronRight,
  User as UserIcon, Loader2, FileCheck, ClipboardList, Award, TrendingUp, PieChart,
  ShieldCheck, Layers, FileText, FileSpreadsheet, PlayCircle, BookMarked, Calendar,
  BookOpenCheck, Newspaper, ListFilter, Upload, Download, List, ShieldAlert
} from "lucide-react";
import Link from "next/link";

const getProfileImageUrl = (path: string | null | undefined) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://lms-backend-96fq.onrender.com/api";
  const apiRoot = baseUrl.endsWith("/api") ? baseUrl.slice(0, -4) : baseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiRoot}${cleanPath}`;
};

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  HelpCircle,
  QrCode,
  BarChart3,
  Settings,
  FileCheck,
  ClipboardList,
  Award,
  TrendingUp,
  PieChart,
  ShieldCheck,
  User: UserIcon,
  Layers,
  FileText,
  FileSpreadsheet,
  PlayCircle,
  BookMarked,
  Calendar,
  BookOpenCheck,
  Newspaper,
  ListFilter,
  Upload,
  Download,
  List,
  ShieldAlert,
};

interface MenuItem {
  title: string;
  icon?: any;
  path?: string;
  subItems?: MenuItem[];
}

function SidebarNavItem({
  item,
  level = 0,
  pathname,
  expandedMenus,
  toggleMenu,
  onMobileClick,
}: {
  item: MenuItem;
  level?: number;
  pathname: string;
  expandedMenus: Record<string, boolean>;
  toggleMenu: (title: string) => void;
  onMobileClick?: () => void;
}) {
  const Icon = item.icon;
  const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
  const isExpanded = expandedMenus[item.title];
  const isCurrentPath = item.path && pathname === item.path;

  // Level-based indentation
  const paddingLeft = level === 0 ? "px-3" : level === 1 ? "pl-8 pr-3" : "pl-12 pr-3";
  const textSize = level === 0 ? "text-sm" : "text-xs";

  if (hasSubItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => toggleMenu(item.title)}
          className={`flex w-full items-center justify-between py-2 ${textSize} ${paddingLeft} font-semibold rounded-lg text-[#505f76] hover:bg-[#eaedff]/60 hover:text-[#004ac6] transition-colors cursor-pointer`}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-4.5 w-4.5 text-zinc-400 shrink-0" />}
            <span className="truncate">{item.title}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="space-y-1">
            {item.subItems?.map((sub) => (
              <SidebarNavItem
                key={sub.title}
                item={sub}
                level={level + 1}
                pathname={pathname}
                expandedMenus={expandedMenus}
                toggleMenu={toggleMenu}
                onMobileClick={onMobileClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.path || "/dashboard"}
      onClick={onMobileClick}
      className={`flex items-center gap-3 py-2 ${textSize} ${paddingLeft} font-semibold rounded-lg transition-colors ${
        isCurrentPath
          ? "bg-[#004ac6] text-white shadow-sm"
          : "text-[#505f76] hover:bg-[#eaedff]/60 hover:text-[#004ac6]"
      }`}
    >
      {Icon && <Icon className="h-4.5 w-4.5 shrink-0" />}
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, accessToken, clearAuth, isAuthenticated, updateUser } = useAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [headerImageError, setHeaderImageError] = useState(false);
  const [sidebarImageError, setSidebarImageError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  // Dynamic Menu State from GET /auth/my-menu API
  const [dynamicMenu, setDynamicMenu] = useState<{
    portalTitle?: string;
    menus: MenuItem[];
  } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setHeaderImageError(false);
    setSidebarImageError(false);
  }, [user?.profileImage]);

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    "Academic Masters": true,
    "User Management": true,
    "Permissions": true,
    "Student Permissions": true,
    "Book Management": false,
    "My Books": true,
    "Question Bank": false,
    "QR Code Management": false,
    "Reports": false,
    "Settings": false
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Check user data validity on refresh or navigation
  useEffect(() => {
    if (!isMounted) return;
    let isSubscribed = true;

    async function checkUserData() {
      // If local cache missing auth token or user data, clear and redirect immediately
      if (!isAuthenticated || !user || !accessToken) {
        clearAuth();
        router.replace("/login");
        return;
      }

      // Validate session & fresh user data from server
      try {
        setIsVerifying(true);
        const response = await api.get("/users/profile");
        if (isSubscribed && response.data) {
          updateUser(response.data);
        }
      } catch (error: any) {
        console.error("Dashboard user data check failed:", error);
        // Clear cache and redirect if unauthorized or user not found
        if (
          error.response?.status === 401 ||
          error.response?.status === 403 ||
          error.response?.status === 404
        ) {
          clearAuth();
          router.replace("/login");
          return;
        }
      } finally {
        if (isSubscribed) {
          setIsVerifying(false);
        }
      }
    }

    checkUserData();

    return () => {
      isSubscribed = false;
    };
  }, [isMounted, isAuthenticated, accessToken]);

  // 2. Fetch Dynamic Menu from GET /auth/my-menu API (with role fallback)
  useEffect(() => {
    if (!isMounted || !isAuthenticated || !accessToken) return;
    let isSubscribed = true;

    async function fetchMyMenu() {
      try {
        let responseData: any = null;
        try {
          const res = await api.get("/auth/my-menu");
          responseData = res.data?.data || res.data;
        } catch (err) {
          // Fallback route attempt
          const res = await api.get("/v1/auth/my-menu");
          responseData = res.data?.data || res.data;
        }

        if (isSubscribed && responseData && Array.isArray(responseData.menus)) {
          const { portalTitle, menus } = responseData;

          const parseMenuItem = (m: any): MenuItem => {
            const rawChildren = Array.isArray(m.children)
              ? m.children
              : Array.isArray(m.subItems)
              ? m.subItems
              : undefined;

            return {
              title: m.title || m.name,
              icon: m.icon ? ICON_MAP[m.icon] : undefined,
              path: m.route || m.path,
              subItems: rawChildren && rawChildren.length > 0
                ? rawChildren.map(parseMenuItem)
                : undefined,
            };
          };

          const parsedMenus: MenuItem[] = menus.map(parseMenuItem);

          setDynamicMenu({
            portalTitle,
            menus: parsedMenus,
          });
        }
      } catch (err) {
        // Silent fallback to role-based hardcoded defaults if backend endpoint not active
      }
    }

    fetchMyMenu();

    return () => {
      isSubscribed = false;
    };
  }, [isMounted, isAuthenticated, accessToken]);

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  // 1. Admin Sidebar Navigation (instructions/admin.txt)
  const adminMenuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      title: "User Management",
      icon: Users,
      subItems: [
        { title: "Users", path: "/dashboard/users" },
      ],
    },
    {
      title: "Permissions",
      icon: ShieldCheck,
      subItems: [
        { title: "Books Permission", path: "/dashboard/users/permissions/books" },
        { title: "Module Permission", path: "/dashboard/users/permissions/modules" },
      ],
    },
    {
      title: "Academic Masters",
      icon: GraduationCap,
      subItems: [
        { title: "Classes", path: "/dashboard/classes" },
        { title: "Subjects", path: "/dashboard/subjects" },
        { title: "Languages", path: "/dashboard/languages" },
      ],
    },
    {
      title: "Book Management",
      icon: BookOpen,
      subItems: [
        { title: "Books", path: "/dashboard/books" },
        { title: "Chapters", path: "/dashboard/books/chapters" },
        { title: "Worksheets", path: "/dashboard/books/worksheets" },
        { title: "Videos", path: "/dashboard/books/videos" },
        { title: "Teacher Manuals", path: "/dashboard/books/teacher-manual" },
        { title: "Lesson Planners", path: "/dashboard/books/lesson-planner" },
        { title: "Flipbooks", path: "/dashboard/books/flipbook" },
        { title: "Current Affairs", path: "/dashboard/books/current-affairs" },
      ],
    },
    {
      title: "Question Bank",
      icon: HelpCircle,
      subItems: [
        { title: "Questions", path: "/dashboard/questions" },
        { title: "Question Types", path: "/dashboard/questions/types" },
        { title: "Import Questions", path: "/dashboard/questions/import" },
        { title: "Export Questions", path: "/dashboard/questions/export" },
      ],
    },
    {
      title: "QR Code Management",
      icon: QrCode,
      subItems: [
        { title: "Generate QR", path: "/dashboard/qrcode/generate" },
        { title: "QR List", path: "/dashboard/qrcode" },
        { title: "Bulk QR Generator", path: "/dashboard/qrcode/bulk" },
      ],
    },
    {
      title: "Reports",
      icon: BarChart3,
      subItems: [
        { title: "User Reports", path: "/dashboard/reports/users" },
        { title: "Book Reports", path: "/dashboard/reports/books" },
        { title: "Question Reports", path: "/dashboard/reports/questions" },
      ],
    },
    {
      title: "Settings",
      icon: Settings,
      subItems: [
        { title: "General Settings", path: "/dashboard/settings" },
        { title: "Audit Logs", path: "/dashboard/settings/audit-logs" },
      ],
    },
  ];

  // 2. Teacher Sidebar Navigation (instructions/teacher.txt)
  const teacherMenuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      title: "My Classes",
      icon: Users,
      path: "/dashboard/classes",
    },
    {
      title: "My Books",
      icon: BookOpen,
      subItems: [
        { title: "Books", path: "/dashboard/books" },
        { title: "Chapters", path: "/dashboard/books/chapters" },
        { title: "Worksheets", path: "/dashboard/books/worksheets" },
        { title: "Videos", path: "/dashboard/books/videos" },
        { title: "Teacher Manuals", path: "/dashboard/books/teacher-manual" },
        { title: "Lesson Planners", path: "/dashboard/books/lesson-planner" },
      ],
    },
    {
      title: "Question Bank",
      icon: HelpCircle,
      subItems: [
        { title: "Questions", path: "/dashboard/questions" },
        { title: "Question Types", path: "/dashboard/questions/types" },
      ],
    },
    {
      title: "Tests / Exams",
      icon: FileCheck,
      path: "/dashboard/tests",
    },
    {
      title: "Assignments",
      icon: ClipboardList,
      path: "/dashboard/assignments",
    },
    {
      title: "Student Performance",
      icon: TrendingUp,
      path: "/dashboard/performance",
    },
    {
      title: "Reports",
      icon: BarChart3,
      path: "/dashboard/reports",
    },
  ];

  // 3. Student Sidebar Navigation (instructions/student.txt)
  const studentMenuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      title: "My Books",
      icon: BookOpen,
      subItems: [
        { title: "Books", path: "/dashboard/books" },
        { title: "Chapters", path: "/dashboard/books/chapters" },
        { title: "Worksheets", path: "/dashboard/books/worksheets" },
        { title: "Videos", path: "/dashboard/books/videos" },
      ],
    },
    {
      title: "Tests / Exams",
      icon: FileCheck,
      path: "/dashboard/tests",
    },
    {
      title: "Assignments",
      icon: ClipboardList,
      path: "/dashboard/assignments",
    },
    {
      title: "Results",
      icon: Award,
      path: "/dashboard/results",
    },
    {
      title: "My Progress",
      icon: PieChart,
      path: "/dashboard/progress",
    },
    {
      title: "Profile",
      icon: UserIcon,
      path: "/dashboard/profile",
    },
  ];

  const userRole = user?.role?.toLowerCase();

  const defaultFallbackMenuItems = userRole === "teacher" 
    ? teacherMenuItems 
    : userRole === "student" 
    ? studentMenuItems 
    : adminMenuItems;

  const defaultBrandTitle = userRole === "teacher" 
    ? "LMS Teacher Portal" 
    : userRole === "student" 
    ? "LMS Student Portal" 
    : "LMS Admin Panel";

  const menuItems = dynamicMenu?.menus || defaultFallbackMenuItems;
  const brandTitle = dynamicMenu?.portalTitle || defaultBrandTitle;

  if (!isMounted || !isAuthenticated || !user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#faf8ff] text-[#131b2e] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#004ac6]" />
        <p className="text-sm font-semibold text-[#505f76]">Verifying user session...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#faf8ff] overflow-hidden text-[#131b2e]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#c3c6d7]/45 shrink-0 shadow-sm">
        {/* Brand */}
        <div className="flex h-16 items-center px-6 border-b border-[#c3c6d7]/30">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-[#131b2e]">
            <div className="h-8 w-8 rounded-lg bg-[#004ac6] flex items-center justify-center text-white font-black text-sm shadow-sm shadow-[#004ac6]/15">
              L
            </div>
            {brandTitle}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
          {menuItems.map((item) => (
            <SidebarNavItem
              key={item.title}
              item={item}
              pathname={pathname}
              expandedMenus={expandedMenus}
              toggleMenu={toggleMenu}
            />
          ))}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-[#c3c6d7]/30 space-y-3 bg-[#faf8ff]/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#eaedff] border border-[#c3c6d7]/30 flex items-center justify-center text-[#004ac6] font-bold uppercase text-xs overflow-hidden relative">
              {!sidebarImageError && user.profileImage ? (
                <img
                  src={getProfileImageUrl(user.profileImage)}
                  alt={user.fullName}
                  className="h-full w-full object-cover"
                  onError={() => setSidebarImageError(true)}
                />
              ) : (
                user.fullName.substring(0, 2)
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-[#131b2e]">{user.fullName}</p>
              <p className="text-xs text-[#505f76] capitalize truncate">{user.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-[#505f76] hover:text-destructive hover:bg-destructive/10 justify-start gap-3 h-9 px-3 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#faf8ff] overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#c3c6d7]/30 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-[#eaedff] text-zinc-500 hover:text-[#131b2e] cursor-pointer"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-[#131b2e] tracking-wide">
              {pathname === "/dashboard"
                ? "LMS Overview"
                : pathname.split("/").pop()?.replace(/-/g, " ").toUpperCase() || "LMS Panel"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#eaedff]/40 border border-transparent hover:border-[#c3c6d7]/30 transition-all cursor-pointer text-left focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-[#004ac6]/10 text-[#004ac6] border border-[#004ac6]/20 flex items-center justify-center font-bold text-xs uppercase shadow-sm overflow-hidden relative">
                  {!headerImageError && user.profileImage ? (
                    <img
                      src={getProfileImageUrl(user.profileImage)}
                      alt={user.fullName}
                      className="h-full w-full object-cover"
                      onError={() => setHeaderImageError(true)}
                    />
                  ) : (
                    user.fullName.substring(0, 2)
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-[#131b2e] leading-tight truncate max-w-[120px]">
                    {user.fullName}
                  </p>
                  <p className="text-[10px] text-[#505f76] capitalize leading-none mt-0.5">
                    {user.role}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400 hidden sm:block" />
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-[#c3c6d7]/45 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                  <div className="px-4 py-2 border-b border-[#c3c6d7]/20">
                    <p className="text-xs font-bold text-[#131b2e] truncate">{user.fullName}</p>
                    <p className="text-[10px] text-[#505f76] truncate mt-0.5">{user.email}</p>
                  </div>
                  
                  <div className="p-1">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-semibold text-[#505f76] hover:text-[#004ac6] hover:bg-[#eaedff]/50 rounded-lg transition-colors"
                    >
                      <UserIcon className="h-4 w-4" />
                      View Profile
                    </Link>

                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-xs font-semibold text-[#505f76] hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#faf8ff] custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/40 backdrop-blur-sm">
          <aside className="w-64 bg-white border-r border-[#c3c6d7]/40 flex flex-col h-full animate-in slide-in-from-left duration-200">
            <div className="flex h-16 items-center justify-between px-6 border-b border-[#c3c6d7]/30">
              <span className="font-bold text-[#131b2e] text-lg">LMS Menu</span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-md text-[#505f76] hover:text-[#131b2e]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {menuItems.map((item) => (
                <SidebarNavItem
                  key={item.title}
                  item={item}
                  pathname={pathname}
                  expandedMenus={expandedMenus}
                  toggleMenu={toggleMenu}
                  onMobileClick={() => setIsMobileOpen(false)}
                />
              ))}
            </nav>

            <div className="p-4 border-t border-[#c3c6d7]/30 bg-[#faf8ff]">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsMobileOpen(false);
                  handleLogout();
                }}
                className="w-full text-[#505f76] hover:text-destructive justify-start gap-3 h-9 px-3"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
