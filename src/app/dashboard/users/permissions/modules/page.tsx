"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/lib/store/auth";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Save,
  BookOpen,
  FileCheck,
  BookMarked,
  PlayCircle,
  Calendar,
  FileSpreadsheet,
  Edit3,
  Newspaper,
  CheckSquare,
  Square,
  Lock,
  LayoutDashboard,
  User,
  Shield,
  GraduationCap,
  Globe,
  Layers,
  HelpCircle,
  QrCode,
  Download,
  Upload,
  ClipboardList,
  TrendingUp,
  Award,
  PieChart,
  BarChart3,
  Settings,
  History,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const getId = (obj: any): string => {
  if (obj === null || obj === undefined) return "";
  if (typeof obj === "string" || typeof obj === "number") return String(obj);
  return String(obj.id ?? obj._id ?? obj.userId ?? "");
};

interface UserOption {
  _id?: string | number;
  id?: string | number;
  fullName?: string;
  name?: string;
  email: string;
  role: string;
  classId?: number | null;
  className?: string | null;
  classEntity?: { id: number; name: string; code?: string } | null;
}

export interface ModuleDefinition {
  key: string;
  name: string;
  description: string;
  icon: any;
  category: string;
}

export const MASTER_MODULE_KEYS = [
  "dashboard",
  "profile",
  "users",
  "permissions",
  "books_permission",
  "module_permission",
  "my_classes",
  "classes",
  "subjects",
  "languages",
  "books",
  "chapters",
  "worksheets",
  "videos",
  "teacher_manuals",
  "lesson_planners",
  "flipbooks",
  "current_affairs",
  "questions",
  "question_types",
  "import_questions",
  "export_questions",
  "generate_qr",
  "qr_list",
  "bulk_qr",
  "tests",
  "assignments",
  "student_performance",
  "results",
  "my_progress",
  "reports",
  "user_reports",
  "book_reports",
  "question_reports",
  "profile",
  "test_generator",
  "flip_book",
  "teacher_manual",
  "lesson_planner",
  "worksheet",
  "exercise",
];

export const masterModules: ModuleDefinition[] = [
  // 1. Core Navigation & Profile
  {
    key: "dashboard",
    name: "Dashboard Home",
    description: "Main analytics summary and overview control center.",
    icon: LayoutDashboard,
    category: "Core Navigation & Profile",
  },
  {
    key: "profile",
    name: "User Profile",
    description: "Personal account settings, avatar, and security profile.",
    icon: User,
    category: "Core Navigation & Profile",
  },

  // 2. User & Access Control
  {
    key: "users",
    name: "User Directory",
    description: "Manage accounts, roles, and status for teachers & students.",
    icon: Users,
    category: "User & Access Control",
  },
  {
    key: "permissions",
    name: "Access Permissions",
    description: "Global system security policies and role controls.",
    icon: ShieldCheck,
    category: "User & Access Control",
  },
  {
    key: "books_permission",
    name: "Books Permission",
    description: "Grant or revoke textbook access for users.",
    icon: BookOpen,
    category: "User & Access Control",
  },
  {
    key: "module_permission",
    name: "Module Permission",
    description: "Configure system feature module access for roles & users.",
    icon: Shield,
    category: "User & Access Control",
  },
  {
    key: "profile",
    name: "Profile",
    description: "User Profile",
    icon: User,
    category: "User & Access Control",
  },

  // 3. Academic Masters
  {
    key: "my_classes",
    name: "My Classes",
    description: "Assigned classroom groups, student rosters, and schedules.",
    icon: GraduationCap,
    category: "Academic Masters",
  },
  {
    key: "classes",
    name: "Classes Master",
    description: "Configure grade levels, standard sections, and class masters.",
    icon: GraduationCap,
    category: "Academic Masters",
  },
  {
    key: "subjects",
    name: "Subjects Master",
    description: "Manage curriculum subject definitions and course codes.",
    icon: BookMarked,
    category: "Academic Masters",
  },
  {
    key: "languages",
    name: "Languages Master",
    description: "Manage medium of instruction languages (English, Hindi, etc.).",
    icon: Globe,
    category: "Academic Masters",
  },

  // 4. Learning Content & E-Resources
  {
    key: "books",
    name: "Book Library",
    description: "Manage textbooks, digital covers, and publications catalog.",
    icon: BookOpen,
    category: "Learning Content & E-Resources",
  },
  {
    key: "chapters",
    name: "Chapter Management",
    description: "Organize book chapters, sequence topics, and syllabus units.",
    icon: Layers,
    category: "Learning Content & E-Resources",
  },
  {
    key: "worksheets",
    name: "Worksheets",
    description: "Downloadable practice worksheets and printable activity sheets.",
    icon: FileSpreadsheet,
    category: "Learning Content & E-Resources",
  },
  {
    key: "worksheet",
    name: "Worksheet Resource",
    description: "Printable chapter practice sheet materials.",
    icon: FileSpreadsheet,
    category: "Learning Content & E-Resources",
  },
  {
    key: "videos",
    name: "Video Lectures",
    description: "Embedded YouTube video lectures and animated video lessons.",
    icon: PlayCircle,
    category: "Learning Content & E-Resources",
  },
  {
    key: "teacher_manuals",
    name: "Teacher Manuals List",
    description: "Access master teaching guides and reference answer manuals.",
    icon: BookMarked,
    category: "Learning Content & E-Resources",
  },
  {
    key: "teacher_manual",
    name: "Teacher Manual",
    description: "Comprehensive teaching guides, solutions, and reference answers.",
    icon: BookMarked,
    category: "Learning Content & E-Resources",
  },
  {
    key: "lesson_planners",
    name: "Lesson Planners List",
    description: "Structured syllabus distribution and day-wise teaching plans.",
    icon: Calendar,
    category: "Learning Content & E-Resources",
  },
  {
    key: "lesson_planner",
    name: "Lesson Planner",
    description: "Day-wise lesson planning tool for teachers.",
    icon: Calendar,
    category: "Learning Content & E-Resources",
  },
  {
    key: "flipbooks",
    name: "Digital Flipbooks",
    description: "Interactive animated textbook page viewer and PDF reader.",
    icon: BookOpen,
    category: "Learning Content & E-Resources",
  },
  {
    key: "flip_book",
    name: "Flip Book Viewer",
    description: "Interactive digital animated textbook page viewer.",
    icon: BookOpen,
    category: "Learning Content & E-Resources",
  },
  {
    key: "current_affairs",
    name: "Current Affairs",
    description: "Monthly news digests, general knowledge articles, and updates.",
    icon: Newspaper,
    category: "Learning Content & E-Resources",
  },
  {
    key: "exercise",
    name: "Online Drills & Exercises",
    description: "Interactive online practice drills and instant feedback exercises.",
    icon: Edit3,
    category: "Learning Content & E-Resources",
  },

  // 5. Question Bank & QR Tools
  {
    key: "questions",
    name: "Questions Repository",
    description: "Centralized question bank repository and tagging system.",
    icon: HelpCircle,
    category: "Question Bank & QR Tools",
  },
  {
    key: "question_types",
    name: "Question Types",
    description: "Manage MCQ, True/False, Fill in blanks, and Subjective types.",
    icon: HelpCircle,
    category: "Question Bank & QR Tools",
  },
  {
    key: "import_questions",
    name: "Import Questions",
    description: "Bulk import question items from Excel/Word files.",
    icon: Upload,
    category: "Question Bank & QR Tools",
  },
  {
    key: "export_questions",
    name: "Export Questions",
    description: "Export question bank items to PDF, Word, or Excel format.",
    icon: Download,
    category: "Question Bank & QR Tools",
  },
  {
    key: "test_generator",
    name: "Test Generator Tool",
    description: "Create, customize, and generate test papers and question sheets.",
    icon: FileCheck,
    category: "Question Bank & QR Tools",
  },
  {
    key: "generate_qr",
    name: "Generate QR Codes",
    description: "Generate embedded QR codes for textbook chapters & resources.",
    icon: QrCode,
    category: "Question Bank & QR Tools",
  },
  {
    key: "qr_list",
    name: "QR Codes Directory",
    description: "Directory of generated resource QR codes.",
    icon: QrCode,
    category: "Question Bank & QR Tools",
  },
  {
    key: "bulk_qr",
    name: "Bulk QR Generator",
    description: "Batch export and generate QR codes for full book series.",
    icon: QrCode,
    category: "Question Bank & QR Tools",
  },

  // 6. Assessments & Exams
  {
    key: "tests",
    name: "Tests & Examinations",
    description: "Schedule online exams, mock tests, and timed assessments.",
    icon: FileCheck,
    category: "Assessments & Exams",
  },
  {
    key: "assignments",
    name: "Assignments & Homework",
    description: "Assign class homework, track submissions, and grade tasks.",
    icon: ClipboardList,
    category: "Assessments & Exams",
  },
  {
    key: "student_performance",
    name: "Student Performance",
    description: "Track student test scores, progress metrics, and grade analytics.",
    icon: TrendingUp,
    category: "Assessments & Exams",
  },
  {
    key: "results",
    name: "Exam Results",
    description: "Publish test marksheets, grade cards, and scorecards.",
    icon: Award,
    category: "Assessments & Exams",
  },
  {
    key: "my_progress",
    name: "My Progress Tracker",
    description: "Personal learning milestone tracker and completion progress.",
    icon: PieChart,
    category: "Assessments & Exams",
  },

  // 7. Analytics & Reports
  {
    key: "reports",
    name: "Main Reports Hub",
    description: "Overall platform analytics, performance reports, and logs.",
    icon: BarChart3,
    category: "Analytics & Reports",
  },
  {
    key: "user_reports",
    name: "User Activity Reports",
    description: "Analyze login activity, active hours, and engagement stats.",
    icon: FileText,
    category: "Analytics & Reports",
  },
  {
    key: "book_reports",
    name: "Book Usage Reports",
    description: "Track textbook reads, video views, and flipbook interactions.",
    icon: FileText,
    category: "Analytics & Reports",
  },
  {
    key: "question_reports",
    name: "Question Analytics",
    description: "Difficulty analytics, item discrimination, and question usage stats.",
    icon: FileText,
    category: "Analytics & Reports",
  },
];

export default function ModulePermissionPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userClassFilter, setUserClassFilter] = useState("all");
  const [classListOptions, setClassListOptions] = useState<{ id: number; name: string; code?: string }[]>([]);

  const [moduleSearchQuery, setModuleSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  const [grantedModuleKeys, setGrantedModuleKeys] = useState<Set<string>>(new Set());
  const [teacherAllowedModuleKeys, setTeacherAllowedModuleKeys] = useState<Set<string>>(new Set());

  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isTeacher = currentUser?.role?.toLowerCase() === "teacher";

  // Fetch Public Classes List on Mount
  useEffect(() => {
    async function fetchClasses() {
      try {
        let res: any;
        try {
          res = await api.get("/v1/classes", { params: { limit: 100 } });
        } catch {
          res = await api.get("/classes", { params: { limit: 100 } });
        }
        const raw = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(raw) && raw.length > 0) {
          setClassListOptions(
            raw.map((c: any) => ({
              id: Number(c.id ?? c._id),
              name: c.name || `Class ${c.id}`,
              code: c.code,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load classes dropdown data:", err);
      }
    }
    fetchClasses();
  }, []);

  // 1. Fetch Users List from GET /api/v1/admin/users
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const params: Record<string, any> = {
        page: 1,
        limit: 100,
      };
      if (userSearchQuery.trim()) params.search = userSearchQuery.trim();
      if (userRoleFilter !== "all") params.role = userRoleFilter;
      if (userClassFilter !== "all") params.classId = userClassFilter;

      let res: any = null;
      try {
        const r = await api.get("/v1/admin/users", { params });
        res = r.data;
      } catch {
        try {
          const r = await api.get("/admin/users", { params });
          res = r.data;
        } catch {
          const r = await api.get("/users", { params });
          res = r.data;
        }
      }

      const userList = Array.isArray(res) ? res : res?.data || res?.users || [];
      let normalizedUsers: UserOption[] = userList
        .map((u: any) => {
          const clsId = u.classId != null ? Number(u.classId) : (u.classEntity?.id ? Number(u.classEntity.id) : null);
          const clsObj = classListOptions.find((c) => c.id === clsId);
          const cName = u.classEntity?.name || clsObj?.name || u.className || null;
          return {
            id: u.id ?? u._id,
            fullName: u.fullName || u.name || "User",
            email: u.email || "",
            role: u.role || "student",
            classId: clsId,
            className: cName,
            classEntity: u.classEntity || (clsId ? { id: clsId, name: cName || `Class ${clsId}` } : null),
          };
        })
        .filter((u: UserOption) => getId(u) !== getId(currentUser));

      if (userRoleFilter !== "all") {
        normalizedUsers = normalizedUsers.filter(
          (u) => u.role?.toLowerCase() === userRoleFilter.toLowerCase()
        );
      }
      if (userClassFilter !== "all") {
        normalizedUsers = normalizedUsers.filter(
          (u) => String(u.classId) === String(userClassFilter) || (u.classEntity?.id && String(u.classEntity.id) === String(userClassFilter))
        );
      }

      setUsers(normalizedUsers);

      if (normalizedUsers.length > 0) {
        if (!selectedUserId || !normalizedUsers.some((u) => getId(u) === selectedUserId)) {
          setSelectedUserId(getId(normalizedUsers[0]));
        }
      } else {
        setSelectedUserId("");
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error("Failed to load users list.");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // 2. Fetch Granted Module Permissions for Selected User: GET /api/v1/permissions/modules/:userId
  const fetchUserModulePermissions = async (userId: string) => {
    if (!userId) return;
    try {
      setIsLoadingModules(true);
      let permRes: any = null;
      try {
        const r = await api.get(`/v1/permissions/modules/${userId}`);
        permRes = r.data;
      } catch {
        try {
          const r = await api.get(`/api/v1/permissions/modules/${userId}`);
          permRes = r.data;
        } catch {
          const r = await api.get(`/permissions/modules/${userId}`);
          permRes = r.data;
        }
      }

      const resData = permRes?.data ?? permRes;
      let grantedKeysArr: string[] = [];

      if (Array.isArray(resData)) {
        grantedKeysArr = resData.map((item) => (typeof item === "string" ? item : item.moduleKey || item.key));
      } else if (Array.isArray(resData?.moduleKeys)) {
        grantedKeysArr = resData.moduleKeys;
      } else if (Array.isArray(resData?.grantedModuleKeys)) {
        grantedKeysArr = resData.grantedModuleKeys;
      }

      setGrantedModuleKeys(new Set(grantedKeysArr));

      // If logged in user is Teacher, fetch Teacher's own allowed modules
      if (isTeacher && currentUser?.id) {
        try {
          let teacherRes: any = null;
          try {
            const tr = await api.get(`/v1/permissions/modules/${currentUser.id}`);
            teacherRes = tr.data;
          } catch {
            const tr = await api.get(`/permissions/modules/${currentUser.id}`);
            teacherRes = tr.data;
          }
          const tData = teacherRes?.data ?? teacherRes;
          const tKeys = Array.isArray(tData)
            ? tData.map((item) => (typeof item === "string" ? item : item.moduleKey || item.key))
            : Array.isArray(tData?.moduleKeys)
              ? tData.moduleKeys
              : [];
          setTeacherAllowedModuleKeys(new Set(tKeys));
        } catch {
          // Allow all if endpoint is open
        }
      }
    } catch (err) {
      console.error("Failed to load user module permissions:", err);
    } finally {
      setIsLoadingModules(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userSearchQuery, userRoleFilter, userClassFilter]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserModulePermissions(selectedUserId);
    }
  }, [selectedUserId]);

  const selectedUser = users.find((u) => getId(u) === selectedUserId);

  // Toggle Single Module Access
  const toggleModuleAccess = (moduleKey: string) => {
    if (isTeacher && teacherAllowedModuleKeys.size > 0 && !teacherAllowedModuleKeys.has(moduleKey)) {
      toast.error("This module is not enabled for your teacher profile.");
      return;
    }

    setGrantedModuleKeys((prev) => {
      const updated = new Set(prev);
      if (updated.has(moduleKey)) {
        updated.delete(moduleKey);
      } else {
        updated.add(moduleKey);
      }
      return updated;
    });
  };

  // Grant All Filtered Modules
  const handleGrantAll = () => {
    const nextGranted = new Set(grantedModuleKeys);
    filteredModules.forEach((mod) => {
      if (!isTeacher || teacherAllowedModuleKeys.size === 0 || teacherAllowedModuleKeys.has(mod.key)) {
        nextGranted.add(mod.key);
      }
    });
    setGrantedModuleKeys(nextGranted);
    toast.success("Granted access to all currently displayed modules.");
  };

  // Revoke All Filtered Modules
  const handleRevokeAll = () => {
    const nextGranted = new Set(grantedModuleKeys);
    filteredModules.forEach((mod) => {
      nextGranted.delete(mod.key);
    });
    setGrantedModuleKeys(nextGranted);
    toast.info("Revoked access from all currently displayed modules.");
  };

  // Save Permissions: POST /api/v1/permissions/modules
  const handleSaveChanges = async () => {
    if (!selectedUserId) {
      toast.error("Please select a target user first.");
      return;
    }
    setIsSaving(true);
    setStatusMessage(null);

    const payload = {
      userId: !isNaN(Number(selectedUserId)) ? Number(selectedUserId) : selectedUserId,
      moduleKeys: Array.from(grantedModuleKeys),
    };

    try {
      let response: any = null;
      try {
        response = await api.post("/v1/permissions/modules", payload);
      } catch {
        try {
          response = await api.post("/api/v1/permissions/modules", payload);
        } catch {
          response = await api.post("/permissions/modules", payload);
        }
      }

      const msg =
        response?.data?.message ||
        `Module permissions updated successfully for ${selectedUser?.fullName || selectedUser?.name || "user"}`;
      setStatusMessage({
        type: "success",
        text: msg,
      });
      toast.success(msg);
    } catch (err: any) {
      console.error("Failed to save module permissions:", err);
      const errMsg = err.response?.data?.message || "Failed to update module permissions.";
      setStatusMessage({
        type: "error",
        text: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 6000);
    }
  };

  const categories = useMemo(() => {
    const setCat = new Set<string>();
    masterModules.forEach((m) => setCat.add(m.category));
    return Array.from(setCat).sort();
  }, []);

  const filteredModules = useMemo(() => {
    return masterModules.filter((mod) => {
      const q = moduleSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        mod.name.toLowerCase().includes(q) ||
        mod.key.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategoryFilter === "all" || mod.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [moduleSearchQuery, selectedCategoryFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#131b2e]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#c3c6d7]/40 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#131b2e] tracking-tight">Module Permission Matrix</h1>
              <p className="text-xs text-[#505f76] font-medium">
                {isTeacher
                  ? "Grant module feature access to your students (restricted to your authorized tools)."
                  : "Enable or disable 42 system feature modules for Teachers and Students."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/users/permissions/books">
            <Button variant="outline" className="border-[#c3c6d7] text-[#505f76] hover:bg-[#eaedff]/40 cursor-pointer">
              <BookOpen className="h-4 w-4 mr-2 text-[#004ac6]" />
              Books Permission
            </Button>
          </Link>
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving || !selectedUserId}
            className="bg-[#004ac6] hover:bg-[#003cb0] text-white shadow-md shadow-[#004ac6]/20 font-semibold cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Permissions
          </Button>
        </div>
      </div>

      {/* Alert Status Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-semibold border ${statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left User Selection Panel & Right Modules Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Select Target User */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#131b2e] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#004ac6]" />
                Select Target User
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#eaedff] text-[#004ac6]">
                {users.length} Users
              </span>
            </div>

            {/* User Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
              />
            </div>

            {/* User Filters: Role & Class */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-[#505f76] uppercase tracking-wider block mb-1">
                  Role
                </label>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-xl border border-[#c3c6d7]/60 bg-[#faf8ff] text-[#131b2e] focus:outline-none focus:border-[#004ac6] font-semibold cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#505f76] uppercase tracking-wider block mb-1">
                  Class
                </label>
                <select
                  value={userClassFilter}
                  onChange={(e) => setUserClassFilter(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-xl border border-[#c3c6d7]/60 bg-[#faf8ff] text-[#131b2e] focus:outline-none focus:border-[#004ac6] font-semibold cursor-pointer"
                >
                  <option value="all">All Classes</option>
                  {classListOptions.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {isLoadingUsers ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#004ac6]" />
                  <p className="text-xs text-[#505f76] font-semibold">Loading users list...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#505f76] font-semibold bg-[#faf8ff] rounded-xl border border-dashed border-[#c3c6d7]">
                  No matching users found.
                </div>
              ) : (
                users.map((u, idx) => {
                  const uId = getId(u);
                  const isSelected = uId === selectedUserId;
                  return (
                    <button
                      key={uId || idx}
                      onClick={() => setSelectedUserId(uId)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                          ? "bg-[#004ac6] text-white border-[#004ac6] shadow-sm shadow-[#004ac6]/15"
                          : "bg-white hover:bg-[#eaedff]/50 border-[#c3c6d7]/40 text-[#131b2e]"
                        }`}
                    >
                      <div className="overflow-hidden">
                        <p className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-[#131b2e]"}`}>
                          {u.fullName || u.name}
                        </p>
                        <p className={`text-[11px] truncate ${isSelected ? "text-white/80" : "text-[#505f76]"}`}>
                          {u.email}
                        </p>
                        {u.className && (
                          <p className={`text-[10px] font-semibold mt-0.5 ${isSelected ? "text-white/90" : "text-[#004ac6]"}`}>
                            {u.className}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shrink-0 ${isSelected
                            ? "bg-white/20 text-white"
                            : u.role?.toLowerCase() === "teacher"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                      >
                        {u.role}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 42 Modules Access Matrix */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-5 shadow-sm space-y-5">
            {/* Selected User Header Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#c3c6d7]/30">
              <div>
                <span className="text-[11px] font-bold text-[#505f76] uppercase tracking-wider">
                  Configuring Access For:
                </span>
                <h3 className="text-base font-extrabold text-[#131b2e]">
                  {selectedUser
                    ? `${selectedUser.fullName || selectedUser.name} (${selectedUser.email})`
                    : "Select a User"}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGrantAll}
                  disabled={!selectedUserId || filteredModules.length === 0}
                  className="text-xs font-semibold text-[#004ac6] border-[#004ac6]/30 hover:bg-[#004ac6]/10 cursor-pointer"
                >
                  <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                  Grant All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeAll}
                  disabled={!selectedUserId || filteredModules.length === 0}
                  className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5 mr-1.5" />
                  Revoke All
                </Button>
              </div>
            </div>

            {/* Modules Filter Bar (Search + Category Select) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search 42 modules by name or key..."
                  value={moduleSearchQuery}
                  onChange={(e) => setModuleSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
                />
              </div>

              <div className="sm:col-span-5 relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] appearance-none cursor-pointer"
                >
                  <option value="all">All Categories ({masterModules.length})</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modules Grid */}
            {isLoadingModules ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#004ac6]" />
                <p className="text-sm font-semibold text-[#505f76]">Loading module permissions...</p>
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="py-12 text-center bg-[#faf8ff] rounded-xl border border-dashed border-[#c3c6d7]">
                <ShieldCheck className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
                <p className="text-sm font-bold text-[#131b2e]">No modules found</p>
                <p className="text-xs text-[#505f76]">Try adjusting your search or category filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                {filteredModules.map((mod) => {
                  const Icon = mod.icon || ShieldCheck;
                  const isGranted = grantedModuleKeys.has(mod.key);
                  const isTeacherDisabled = isTeacher && teacherAllowedModuleKeys.size > 0 && !teacherAllowedModuleKeys.has(mod.key);

                  return (
                    <div
                      key={mod.key}
                      onClick={() => !isTeacherDisabled && toggleModuleAccess(mod.key)}
                      className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${isTeacherDisabled
                          ? "bg-zinc-50 border-zinc-200 opacity-60 cursor-not-allowed"
                          : isGranted
                            ? "bg-emerald-50/50 border-emerald-300 shadow-sm cursor-pointer hover:border-emerald-400"
                            : "bg-white border-[#c3c6d7]/50 hover:bg-[#faf8ff] cursor-pointer"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isGranted ? "bg-emerald-100 text-emerald-700" : "bg-[#faf8ff] text-[#505f76] border border-[#c3c6d7]/40"
                            }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#004ac6]/10 text-[#004ac6]">
                              {mod.category}
                            </span>
                            <span className="text-[10px] font-mono text-[#505f76]">{mod.key}</span>
                          </div>
                          <h4 className="text-xs font-bold text-[#131b2e] leading-snug">{mod.name}</h4>
                          <p className="text-[11px] text-[#505f76] leading-relaxed line-clamp-2">{mod.description}</p>
                          {isTeacherDisabled && (
                            <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mt-1">
                              <Lock className="h-3 w-3" /> Not enabled for Teacher
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Access Toggle Switch */}
                      <div className="shrink-0 pt-0.5">
                        {isTeacherDisabled ? (
                          <div className="h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400">
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={`h-6 w-11 rounded-full transition-colors p-0.5 relative cursor-pointer ${isGranted ? "bg-emerald-500" : "bg-zinc-300"
                              }`}
                          >
                            <span
                              className={`block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${isGranted ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Summary Bar */}
            <div className="pt-3 border-t border-[#c3c6d7]/30 flex items-center justify-between text-xs text-[#505f76] font-semibold">
              <span>
                Total Granted: <strong className="text-[#004ac6]">{grantedModuleKeys.size}</strong> / {masterModules.length} Modules
              </span>
              <span>
                Showing {filteredModules.length} modules
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
