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
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const getId = (obj: any): string => {
  if (obj === null || obj === undefined) return "";
  if (typeof obj === "string" || typeof obj === "number") return String(obj);
  return String(obj.id ?? obj._id ?? obj.userId ?? "");
};

export interface UserOption {
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

export interface ModuleItem {
  key: string;
  label: string;
  route: string;
  description: string;
  icon: any;
  group: string;
}

// 1. TEACHER Controllable Module Options (as per MODULE_PERMISSIONS_GUIDE.md)
export const TEACHER_MODULE_OPTIONS: { group: string; items: ModuleItem[] }[] = [
  {
    group: "Academic Setup",
    items: [
      {
        key: "my_classes",
        label: "My Classes",
        route: "/dashboard/classes",
        description: "Classes assigned to teacher & student rosters",
        icon: GraduationCap,
        group: "Academic Setup",
      },
    ],
  },
  {
    group: "Student Permissions",
    items: [
      {
        key: "users",
        label: "Student List",
        route: "/dashboard/users",
        description: "View & manage enrolled student accounts",
        icon: Users,
        group: "Student Permissions",
      },
      {
        key: "books_permission",
        label: "Books Permission",
        route: "/dashboard/permissions/books",
        description: "Assign & grant book access to students",
        icon: BookOpen,
        group: "Student Permissions",
      },
      {
        key: "module_permission",
        label: "Module Permission",
        route: "/dashboard/permissions/modules",
        description: "Assign & configure module permissions for students",
        icon: ShieldCheck,
        group: "Student Permissions",
      },
    ],
  },
  {
    group: "My Books & Resources",
    items: [
      {
        key: "books",
        label: "Books Catalog",
        route: "/dashboard/books",
        description: "Access assigned book list & digital catalog",
        icon: BookOpen,
        group: "My Books & Resources",
      },
      {
        key: "chapters",
        label: "Chapters",
        route: "/dashboard/books/chapters",
        description: "Chapter breakdowns & topic units",
        icon: Layers,
        group: "My Books & Resources",
      },
      {
        key: "worksheets",
        label: "Worksheets",
        route: "/dashboard/books/worksheets",
        description: "Printable worksheet PDF resources",
        icon: FileSpreadsheet,
        group: "My Books & Resources",
      },
      {
        key: "videos",
        label: "Video Lessons",
        route: "/dashboard/books/videos",
        description: "Video lectures & animated content",
        icon: PlayCircle,
        group: "My Books & Resources",
      },
      {
        key: "teacher_manuals",
        label: "Teacher Manuals",
        route: "/dashboard/books/teacher-manual",
        description: "Pedagogical guides & answer keys",
        icon: BookMarked,
        group: "My Books & Resources",
      },
      {
        key: "lesson_planners",
        label: "Lesson Planners",
        route: "/dashboard/books/lesson-planner",
        description: "Syllabus breakdown & day-wise period plans",
        icon: Calendar,
        group: "My Books & Resources",
      },
      {
        key: "flipbooks",
        label: "Digital Flipbooks",
        route: "/dashboard/books/flipbook",
        description: "Interactive textbook page viewer",
        icon: BookOpen,
        group: "My Books & Resources",
      },
    ],
  },
];

// 2. STUDENT Controllable Module Options (as per MODULE_PERMISSIONS_GUIDE.md)
export const STUDENT_MODULE_OPTIONS: { group: string; items: ModuleItem[] }[] = [
  {
    group: "My Books & Resources",
    items: [
      {
        key: "books",
        label: "Books Catalog",
        route: "/dashboard/books",
        description: "View & read assigned textbooks",
        icon: BookOpen,
        group: "My Books & Resources",
      },
      {
        key: "worksheets",
        label: "Worksheets",
        route: "/dashboard/books/worksheets",
        description: "Download practice exercise worksheets",
        icon: FileSpreadsheet,
        group: "My Books & Resources",
      },
      {
        key: "videos",
        label: "Video Lessons",
        route: "/dashboard/books/videos",
        description: "Watch video lessons & tutorial lectures",
        icon: PlayCircle,
        group: "My Books & Resources",
      },
      {
        key: "flipbooks",
        label: "Digital Flipbooks",
        route: "/dashboard/books/flipbook",
        description: "Read digital flipbooks with page animations",
        icon: BookOpen,
        group: "My Books & Resources",
      },
    ],
  },
];

// Flattened helper lists of keys
export const ALL_TEACHER_MODULE_KEYS = TEACHER_MODULE_OPTIONS.flatMap((g) => g.items.map((i) => i.key));
export const ALL_STUDENT_MODULE_KEYS = STUDENT_MODULE_OPTIONS.flatMap((g) => g.items.map((i) => i.key));

export default function ModulePermissionPage() {
  const { user: currentUser } = useAuthStore();
  const isTeacherUser = currentUser?.role?.toLowerCase() === "teacher";

  // State Management
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>(isTeacherUser ? "student" : "all");
  const [userClassFilter, setUserClassFilter] = useState("all");
  const [classListOptions, setClassListOptions] = useState<{ id: number; name: string; code?: string }[]>([]);

  const [moduleSearchQuery, setModuleSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");

  const [grantedModuleKeys, setGrantedModuleKeys] = useState<Set<string>>(new Set());
  const [teacherAllowedModuleKeys, setTeacherAllowedModuleKeys] = useState<Set<string>>(new Set());
  const [isDefaultAccess, setIsDefaultAccess] = useState<boolean>(true);

  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  // 1. Fetch Users List
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const params: Record<string, any> = {
        page: 1,
        limit: 100,
      };
      if (userSearchQuery.trim()) params.search = userSearchQuery.trim();

      // If logged in user is a Teacher, force userRoleFilter to student
      const effectiveRoleFilter = isTeacherUser ? "student" : userRoleFilter;
      if (effectiveRoleFilter !== "all") params.role = effectiveRoleFilter;
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
          const clsId = u.classId != null ? Number(u.classId) : u.classEntity?.id ? Number(u.classEntity.id) : null;
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

      if (effectiveRoleFilter !== "all") {
        normalizedUsers = normalizedUsers.filter((u) => u.role?.toLowerCase() === effectiveRoleFilter.toLowerCase());
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

  useEffect(() => {
    fetchUsers();
  }, [userSearchQuery, userRoleFilter, userClassFilter]);

  // Selected Target User details
  const selectedUser = useMemo(() => {
    return users.find((u) => getId(u) === selectedUserId) || null;
  }, [users, selectedUserId]);

  const targetRole = (selectedUser?.role || "student").toLowerCase();
  const isTargetTeacher = targetRole === "teacher";

  // Determine active controllable module groups based on target user's role
  const activeModuleGroups = useMemo(() => {
    if (isTargetTeacher) {
      return TEACHER_MODULE_OPTIONS;
    }
    return STUDENT_MODULE_OPTIONS;
  }, [isTargetTeacher]);

  const activeAllKeys = useMemo(() => {
    return activeModuleGroups.flatMap((g) => g.items.map((i) => i.key));
  }, [activeModuleGroups]);

  // 2. Fetch Granted Module Permissions for Selected User: GET /api/permissions/modules/:userId
  const fetchUserModulePermissions = async (userId: string) => {
    if (!userId) return;
    try {
      setIsLoadingModules(true);

      // If logged in user is Teacher, fetch Teacher's own allowed modules first
      if (isTeacherUser && currentUser?.id) {
        try {
          let teacherRes: any = null;
          try {
            const tr = await api.get(`/permissions/modules/${currentUser.id}`);
            teacherRes = tr.data;
          } catch {
            const tr = await api.get(`/v1/permissions/modules/${currentUser.id}`);
            teacherRes = tr.data;
          }
          const tData = teacherRes?.data ?? teacherRes;
          const tKeys: string[] = Array.isArray(tData)
            ? tData.map((item: any) => (typeof item === "string" ? item : item.moduleKey || item.key))
            : Array.isArray(tData?.moduleKeys)
            ? tData.moduleKeys
            : [];

          if (tKeys.length > 0) {
            setTeacherAllowedModuleKeys(new Set(tKeys));
          } else {
            // Default: All student module keys allowed for teacher
            setTeacherAllowedModuleKeys(new Set(ALL_STUDENT_MODULE_KEYS));
          }
        } catch (err) {
          setTeacherAllowedModuleKeys(new Set(ALL_STUDENT_MODULE_KEYS));
        }
      }

      let permRes: any = null;
      try {
        const r = await api.get(`/permissions/modules/${userId}`);
        permRes = r.data;
      } catch {
        try {
          const r = await api.get(`/v1/permissions/modules/${userId}`);
          permRes = r.data;
        } catch {
          const r = await api.get(`/api/v1/permissions/modules/${userId}`);
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

      // Default State Rule (Section 4.1):
      // If moduleKeys array is empty [], user has default access to all role modules.
      if (grantedKeysArr.length === 0) {
        setIsDefaultAccess(true);
        // Pre-check all available keys for target role
        setGrantedModuleKeys(new Set(activeAllKeys));
      } else {
        setIsDefaultAccess(false);
        setGrantedModuleKeys(new Set(grantedKeysArr));
      }
    } catch (err) {
      console.error("Failed to load user module permissions:", err);
      // Fallback default state: pre-check all
      setIsDefaultAccess(true);
      setGrantedModuleKeys(new Set(activeAllKeys));
    } finally {
      setIsLoadingModules(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchUserModulePermissions(selectedUserId);
    }
  }, [selectedUserId]);

  // Toggle Single Module Access
  const toggleModuleAccess = (moduleKey: string) => {
    if (isTeacherUser && teacherAllowedModuleKeys.size > 0 && !teacherAllowedModuleKeys.has(moduleKey)) {
      toast.error(`Forbidden: You cannot grant module permission "${moduleKey}" that you do not possess.`);
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
    setIsDefaultAccess(false);
  };

  // Grant All Filtered Modules
  const handleGrantAll = () => {
    const nextGranted = new Set(grantedModuleKeys);
    displayedModules.forEach((mod) => {
      if (!isTeacherUser || teacherAllowedModuleKeys.size === 0 || teacherAllowedModuleKeys.has(mod.key)) {
        nextGranted.add(mod.key);
      }
    });
    setGrantedModuleKeys(nextGranted);
    setIsDefaultAccess(false);
    toast.success("Granted access to all currently displayed modules.");
  };

  // Revoke All Filtered Modules
  const handleRevokeAll = () => {
    const nextGranted = new Set(grantedModuleKeys);
    displayedModules.forEach((mod) => {
      nextGranted.delete(mod.key);
    });
    setGrantedModuleKeys(nextGranted);
    setIsDefaultAccess(false);
    toast.info("Revoked access from all currently displayed modules.");
  };

  // Save Permissions: POST /api/permissions/modules
  const handleSaveChanges = async () => {
    if (!selectedUserId) {
      toast.error("Please select a target user first.");
      return;
    }

    if (isTeacherUser && targetRole !== "student") {
      toast.error("Teachers can only assign module permissions to Students.");
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
        response = await api.post("/permissions/modules", payload);
      } catch {
        try {
          response = await api.post("/v1/permissions/modules", payload);
        } catch {
          response = await api.post("/api/v1/permissions/modules", payload);
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
      setIsDefaultAccess(false);
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

  // Available groups for category filter dropdown
  const groupCategories = useMemo(() => {
    return Array.from(new Set(activeModuleGroups.map((g) => g.group)));
  }, [activeModuleGroups]);

  // Flattened displayed modules matching search and group filter
  const displayedModules = useMemo(() => {
    let list: ModuleItem[] = [];
    activeModuleGroups.forEach((g) => {
      if (selectedGroupFilter === "all" || g.group === selectedGroupFilter) {
        g.items.forEach((item) => {
          const q = moduleSearchQuery.toLowerCase().trim();
          if (!q || item.label.toLowerCase().includes(q) || item.key.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)) {
            list.push(item);
          }
        });
      }
    });
    return list;
  }, [activeModuleGroups, selectedGroupFilter, moduleSearchQuery]);

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
              <h1 className="text-2xl font-black text-[#131b2e] tracking-tight">Module & Menu Permissions</h1>
              <p className="text-xs text-[#505f76] font-medium">
                {isTeacherUser
                  ? "Manage feature modules and sidebar menu access for your students."
                  : "Control feature module access & dynamic sidebar menus for Teachers and Students."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/permissions/books">
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
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-semibold border ${
            statusMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
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

      {/* Main Grid Layout */}
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
                <label className="text-[10px] font-bold text-[#505f76] uppercase tracking-wider block mb-1">Role</label>
                <select
                  value={isTeacherUser ? "student" : userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  disabled={isTeacherUser}
                  className="w-full px-2 py-1.5 text-xs rounded-xl border border-[#c3c6d7]/60 bg-[#faf8ff] text-[#131b2e] focus:outline-none focus:border-[#004ac6] font-semibold cursor-pointer disabled:opacity-75"
                >
                  {!isTeacherUser && <option value="all">All Roles</option>}
                  <option value="student">Student</option>
                  {!isTeacherUser && <option value="teacher">Teacher</option>}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#505f76] uppercase tracking-wider block mb-1">Class</label>
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
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-[#004ac6] text-white border-[#004ac6] shadow-sm shadow-[#004ac6]/15"
                          : "bg-white hover:bg-[#eaedff]/50 border-[#c3c6d7]/40 text-[#131b2e]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-[#131b2e]"}`}>
                          {u.fullName || u.name}
                        </p>
                        <p className={`text-[11px] truncate ${isSelected ? "text-white/80" : "text-[#505f76]"}`}>{u.email}</p>
                        {u.className && (
                          <p className={`text-[10px] font-semibold mt-0.5 ${isSelected ? "text-white/90" : "text-[#004ac6]"}`}>
                            {u.className}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shrink-0 ${
                          isSelected
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

        {/* Right Column: Module Permission Matrix */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-5 shadow-sm space-y-5">
            {/* Selected User Header Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#c3c6d7]/30">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#505f76] uppercase tracking-wider">Configuring Access For:</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isDefaultAccess ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}
                  >
                    {isDefaultAccess ? "Default Full Access (Unrestricted)" : "Custom Permissions Active"}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#131b2e] mt-0.5">
                  {selectedUser ? `${selectedUser.fullName || selectedUser.name} (${selectedUser.email})` : "Select a User"}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGrantAll}
                  disabled={!selectedUserId || displayedModules.length === 0}
                  className="text-xs font-semibold text-[#004ac6] border-[#004ac6]/30 hover:bg-[#004ac6]/10 cursor-pointer"
                >
                  <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                  Grant All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeAll}
                  disabled={!selectedUserId || displayedModules.length === 0}
                  className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5 mr-1.5" />
                  Revoke All
                </Button>
              </div>
            </div>

            {/* Modules Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search modules by name or key..."
                  value={moduleSearchQuery}
                  onChange={(e) => setModuleSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
                />
              </div>

              <div className="sm:col-span-5 relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <select
                  value={selectedGroupFilter}
                  onChange={(e) => setSelectedGroupFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] appearance-none cursor-pointer"
                >
                  <option value="all">All Groups ({groupCategories.length})</option>
                  {groupCategories.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modules Matrix Grouped Display */}
            {isLoadingModules ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#004ac6]" />
                <p className="text-sm font-semibold text-[#505f76]">Loading module permissions...</p>
              </div>
            ) : displayedModules.length === 0 ? (
              <div className="py-12 text-center bg-[#faf8ff] rounded-xl border border-dashed border-[#c3c6d7]">
                <ShieldCheck className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
                <p className="text-sm font-bold text-[#131b2e]">No matching modules found</p>
                <p className="text-xs text-[#505f76]">Try adjusting search query or group filter.</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                {activeModuleGroups
                  .filter((groupObj) => selectedGroupFilter === "all" || groupObj.group === selectedGroupFilter)
                  .map((groupObj) => {
                    const groupItems = groupObj.items.filter((item) => {
                      const q = moduleSearchQuery.toLowerCase().trim();
                      return !q || item.label.toLowerCase().includes(q) || item.key.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
                    });

                    if (groupItems.length === 0) return null;

                    return (
                      <div key={groupObj.group} className="space-y-3">
                        <div className="flex items-center justify-between border-b border-[#c3c6d7]/30 pb-1.5">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#004ac6] flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5" />
                            {groupObj.group}
                          </h4>
                          <span className="text-[10px] text-[#505f76] font-semibold">
                            {groupItems.filter((i) => grantedModuleKeys.has(i.key)).length} / {groupItems.length} Enabled
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {groupItems.map((mod) => {
                            const Icon = mod.icon || ShieldCheck;
                            const isGranted = grantedModuleKeys.has(mod.key);
                            const isTeacherDisabled = isTeacherUser && teacherAllowedModuleKeys.size > 0 && !teacherAllowedModuleKeys.has(mod.key);

                            return (
                              <div
                                key={mod.key}
                                onClick={() => !isTeacherDisabled && toggleModuleAccess(mod.key)}
                                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                                  isTeacherDisabled
                                    ? "bg-zinc-50 border-zinc-200 opacity-60 cursor-not-allowed"
                                    : isGranted
                                    ? "bg-emerald-50/50 border-emerald-300 shadow-sm cursor-pointer hover:border-emerald-400"
                                    : "bg-white border-[#c3c6d7]/50 hover:bg-[#faf8ff] cursor-pointer"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                      isGranted ? "bg-emerald-100 text-emerald-700" : "bg-[#faf8ff] text-[#505f76] border border-[#c3c6d7]/40"
                                    }`}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono text-[#505f76] bg-[#faf8ff] px-1.5 py-0.5 rounded border border-[#c3c6d7]/30">
                                        {mod.key}
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-[#131b2e] leading-snug">{mod.label}</h4>
                                    <p className="text-[11px] text-[#505f76] leading-relaxed line-clamp-2">{mod.description}</p>
                                    {isTeacherDisabled && (
                                      <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mt-1">
                                        <Lock className="h-3 w-3" /> Not possessed by teacher
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
                                      className={`h-6 w-11 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                                        isGranted ? "bg-emerald-500" : "bg-zinc-300"
                                      }`}
                                    >
                                      <span
                                        className={`block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${
                                          isGranted ? "translate-x-5" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Bottom Summary Bar */}
            <div className="pt-3 border-t border-[#c3c6d7]/30 flex items-center justify-between text-xs text-[#505f76] font-semibold">
              <span>
                Total Granted: <strong className="text-[#004ac6]">{grantedModuleKeys.size}</strong> / {activeAllKeys.length} Modules for {targetRole}
              </span>
              <span>Showing {displayedModules.length} modules</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
