"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  BookOpen,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Save,
  CheckSquare,
  Square,
  Lock,
  X,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const getId = (obj: any): string => {
  if (obj === null || obj === undefined) return "";
  if (typeof obj === "string" || typeof obj === "number") return String(obj);
  return String(obj.id ?? obj._id ?? obj.userId ?? obj.bookId ?? "");
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

interface BookItem {
  _id?: string | number;
  id?: string | number;
  title: string;
  classId?: number | string;
  className?: string;
  class?: string;
  subjectId?: number | string;
  subject?: string;
  subjectName?: string;
  languageId?: number | string;
  language?: string;
  languageName?: string;
  coverImage?: string;
  code?: string;
}

export default function BooksPermissionPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userClassFilter, setUserClassFilter] = useState("all");

  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState("all");

  const [classListOptions, setClassListOptions] = useState<{ id: number | string; name: string; code?: string }[]>([]);
  const [subjectListOptions, setSubjectListOptions] = useState<{ id: number | string; name: string; code?: string }[]>([]);
  const [languageListOptions, setLanguageListOptions] = useState<{ id: number | string; name: string; code?: string }[]>([]);

  const [allBooks, setAllBooks] = useState<BookItem[]>([]);
  const [teacherAllowedBookIds, setTeacherAllowedBookIds] = useState<Set<string>>(new Set());
  const [grantedBookIds, setGrantedBookIds] = useState<Set<string>>(new Set());

  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isTeacher = currentUser?.role?.toLowerCase() === "teacher";

  // Fetch Public Classes, Subjects & Languages Master Data on Mount
  useEffect(() => {
    async function fetchMasterFilters() {
      try {
        const [classRes, subRes, langRes] = await Promise.allSettled([
          api.get("/v1/classes", { params: { limit: 100 } }).catch(() => api.get("/classes", { params: { limit: 100 } })),
          api.get("/v1/subjects", { params: { limit: 100 } }).catch(() => api.get("/subjects", { params: { limit: 100 } })),
          api.get("/v1/languages", { params: { limit: 100 } }).catch(() => api.get("/languages", { params: { limit: 100 } })),
        ]);

        if (classRes.status === "fulfilled" && classRes.value?.data) {
          const raw = classRes.value.data?.data || (Array.isArray(classRes.value.data) ? classRes.value.data : []);
          if (Array.isArray(raw) && raw.length > 0) {
            setClassListOptions(
              raw.map((c: any) => ({
                id: c.id ?? c._id,
                name: c.name || `Class ${c.id}`,
                code: c.code,
              }))
            );
          }
        }

        if (subRes.status === "fulfilled" && subRes.value?.data) {
          const raw = subRes.value.data?.data || (Array.isArray(subRes.value.data) ? subRes.value.data : []);
          if (Array.isArray(raw) && raw.length > 0) {
            setSubjectListOptions(
              raw.map((s: any) => ({
                id: s.id ?? s._id,
                name: s.name || `Subject ${s.id}`,
                code: s.code,
              }))
            );
          }
        }

        if (langRes.status === "fulfilled" && langRes.value?.data) {
          const raw = langRes.value.data?.data || (Array.isArray(langRes.value.data) ? langRes.value.data : []);
          if (Array.isArray(raw) && raw.length > 0) {
            setLanguageListOptions(
              raw.map((l: any) => ({
                id: l.id ?? l._id,
                name: l.name || `Language ${l.id}`,
                code: l.code,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load master filter dropdown data:", err);
      }
    }
    fetchMasterFilters();
  }, []);

  // 1. Fetch Users List from GET /api/v1/admin/users?page=1&limit=100
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

      const userList = Array.isArray(res)
        ? res
        : res?.data || res?.users || [];

      // Filter target users and normalize name/class
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

      // Extra client-side filter fallback if backend does not filter
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

  // 2. Fetch Catalog Books from GET /api/v1/books?page=1&limit=100&classId={classId}&subjectId={subjectId}&languageId={languageId}&search={search}
  const fetchCatalogBooks = async () => {
    try {
      setIsLoadingBooks(true);
      const params: Record<string, any> = {
        page: 1,
        limit: 100,
      };
      if (selectedClassFilter !== "all") params.classId = selectedClassFilter;
      if (selectedSubjectFilter !== "all") params.subjectId = selectedSubjectFilter;
      if (selectedLanguageFilter !== "all") params.languageId = selectedLanguageFilter;
      if (bookSearchQuery.trim()) params.search = bookSearchQuery.trim();

      let booksRes: any = null;
      try {
        const r = await api.get("/v1/books", { params });
        booksRes = r.data;
      } catch {
        const r = await api.get("/api/v1/books", { params });
        booksRes = r.data;
      }

      const rawBooks = Array.isArray(booksRes)
        ? booksRes
        : booksRes?.data || booksRes?.books || [];

      let normalized: BookItem[] = rawBooks.map((b: any, idx: number) => {
        const clsId = b.classId ?? b.class?.id ?? b.classEntity?.id;
        const clsName = b.className || b.class?.name || (typeof b.class === "string" ? b.class : null) || "General";

        const subId = b.subjectId ?? b.subject?.id ?? b.subjectEntity?.id;
        const subName = b.subjectName || b.subject?.name || (typeof b.subject === "string" ? b.subject : null) || "";

        const langId = b.languageId ?? b.language?.id ?? b.languageEntity?.id;
        const langName = b.languageName || b.language?.name || (typeof b.language === "string" ? b.language : null) || "";

        return {
          id: b.id ?? b._id,
          title: b.title || "Untitled Book",
          classId: clsId,
          class: clsName,
          className: clsName,
          subjectId: subId,
          subject: subName,
          subjectName: subName,
          languageId: langId,
          language: langName,
          languageName: langName,
          code: b.code || b.isbn || `BK-${b.id ?? idx + 1}`,
          coverImage: b.coverImage || b.coverUrl,
        };
      });

      // Extra client-side filter fallback if backend does not filter
      if (selectedClassFilter !== "all") {
        normalized = normalized.filter(
          (b) => String(b.classId) === String(selectedClassFilter) || String(b.className?.toLowerCase()) === String(selectedClassFilter.toLowerCase())
        );
      }
      if (selectedSubjectFilter !== "all") {
        normalized = normalized.filter(
          (b) => String(b.subjectId) === String(selectedSubjectFilter) || String(b.subjectName?.toLowerCase()) === String(selectedSubjectFilter.toLowerCase())
        );
      }
      if (selectedLanguageFilter !== "all") {
        normalized = normalized.filter(
          (b) => String(b.languageId) === String(selectedLanguageFilter) || String(b.languageName?.toLowerCase()) === String(selectedLanguageFilter.toLowerCase())
        );
      }

      setAllBooks(normalized);
    } catch (err) {
      console.error("Failed to fetch catalog books:", err);
      toast.error("Failed to load books catalog.");
    } finally {
      setIsLoadingBooks(false);
    }
  };

  // 3. Fetch User's Assigned Books Permissions: GET /api/v1/permissions/books/:userId
  const fetchUserPermissions = async (userId: string) => {
    if (!userId) return;
    try {
      setIsLoadingPermissions(true);
      let permRes: any = null;
      try {
        const r = await api.get(`/v1/permissions/books/${userId}`);
        permRes = r.data;
      } catch {
        try {
          const r = await api.get(`/api/v1/permissions/books/${userId}`);
          permRes = r.data;
        } catch {
          const r = await api.get(`/permissions/books/${userId}`);
          permRes = r.data;
        }
      }

      const resData = permRes?.data ?? permRes;
      let rawBookIds: any[] = [];

      if (Array.isArray(resData)) {
        rawBookIds = resData;
      } else if (Array.isArray(resData?.bookIds)) {
        rawBookIds = resData.bookIds;
      } else if (Array.isArray(resData?.grantedBookIds)) {
        rawBookIds = resData.grantedBookIds;
      }

      const grantedIds = rawBookIds.map((idVal) => getId(idVal));
      setGrantedBookIds(new Set(grantedIds));

      // If logged in user is Teacher, fetch Teacher's own allowed books
      if (isTeacher && currentUser?.id) {
        try {
          let teacherRes: any = null;
          try {
            const tr = await api.get(`/v1/permissions/books/${currentUser.id}`);
            teacherRes = tr.data;
          } catch {
            const tr = await api.get(`/permissions/books/${currentUser.id}`);
            teacherRes = tr.data;
          }
          const tData = teacherRes?.data ?? teacherRes;
          const tBookIds = Array.isArray(tData)
            ? tData
            : Array.isArray(tData?.bookIds)
            ? tData.bookIds
            : [];
          setTeacherAllowedBookIds(new Set(tBookIds.map(getId)));
        } catch {
          // Allow all if endpoint is open
        }
      }
    } catch (err) {
      console.error("Failed to load user book permissions:", err);
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userSearchQuery, userRoleFilter, userClassFilter]);

  useEffect(() => {
    fetchCatalogBooks();
  }, [selectedClassFilter, selectedSubjectFilter, selectedLanguageFilter, bookSearchQuery]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserPermissions(selectedUserId);
      const targetUser = users.find((u) => getId(u) === selectedUserId);
      if (targetUser) {
        const targetClassId = targetUser.classId ?? targetUser.classEntity?.id;
        if (targetClassId) {
          setSelectedClassFilter(String(targetClassId));
        } else {
          setSelectedClassFilter("all");
        }
      }
    }
  }, [selectedUserId, users]);

  const selectedUser = users.find((u) => getId(u) === selectedUserId);

  // Single Toggle Switch / Card Click
  const toggleBookAccess = (bookId: string) => {
    if (isTeacher && teacherAllowedBookIds.size > 0 && !teacherAllowedBookIds.has(bookId)) {
      toast.error("This book is not assigned to your teacher profile.");
      return;
    }

    setGrantedBookIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(bookId)) {
        updated.delete(bookId);
      } else {
        updated.add(bookId);
      }
      return updated;
    });
  };

  // Grant All Helper
  const handleGrantAll = () => {
    const nextGranted = new Set(grantedBookIds);
    allBooks.forEach((book) => {
      const bId = getId(book);
      if (bId && (!isTeacher || teacherAllowedBookIds.size === 0 || teacherAllowedBookIds.has(bId))) {
        nextGranted.add(bId);
      }
    });
    setGrantedBookIds(nextGranted);
    toast.success("Granted access to all currently displayed books.");
  };

  // Revoke All Helper
  const handleRevokeAll = () => {
    const nextGranted = new Set(grantedBookIds);
    allBooks.forEach((book) => {
      const bId = getId(book);
      if (bId) nextGranted.delete(bId);
    });
    setGrantedBookIds(nextGranted);
    toast.info("Revoked access from all currently displayed books.");
  };

  // 4. Save Permissions: POST /api/v1/permissions/books
  const handleSaveChanges = async () => {
    if (!selectedUserId) {
      toast.error("Please select a target user first.");
      return;
    }
    setIsSaving(true);
    setStatusMessage(null);

    // Format bookIds as numbers if numeric, or strings
    const bookIdsArray = Array.from(grantedBookIds).map((id) =>
      !isNaN(Number(id)) ? Number(id) : id
    );

    const payload = {
      userId: !isNaN(Number(selectedUserId)) ? Number(selectedUserId) : selectedUserId,
      bookIds: bookIdsArray,
    };

    try {
      let response: any = null;
      try {
        response = await api.post("/v1/permissions/books", payload);
      } catch {
        try {
          response = await api.post("/api/v1/permissions/books", payload);
        } catch {
          response = await api.post("/permissions/books", payload);
        }
      }

      const msg = response?.data?.message || `Books permissions updated successfully for ${selectedUser?.fullName || selectedUser?.name || "user"}`;
      setStatusMessage({
        type: "success",
        text: msg,
      });
      toast.success(msg);
    } catch (err: any) {
      console.error("Failed to save book permissions:", err);
      const errMsg = err.response?.data?.message || "Failed to update book permissions.";
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

  const resetUserFilters = () => {
    setUserSearchQuery("");
    setUserRoleFilter("all");
    setUserClassFilter("all");
  };

  const resetBookFilters = () => {
    setBookSearchQuery("");
    setSelectedClassFilter("all");
    setSelectedSubjectFilter("all");
    setSelectedLanguageFilter("all");
  };

  const isUserFilterActive =
    userSearchQuery.trim() !== "" ||
    userRoleFilter !== "all" ||
    userClassFilter !== "all";

  const isBookFilterActive =
    bookSearchQuery.trim() !== "" ||
    selectedClassFilter !== "all" ||
    selectedSubjectFilter !== "all" ||
    selectedLanguageFilter !== "all";

  const classesList = Array.from(
    new Set(allBooks.map((b) => b.className || b.class || "General"))
  ).sort();

  return (
    <div className="space-y-4 md:space-y-5 max-w-7xl mx-auto pb-12 text-[#131b2e]">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-2xl border border-[#c3c6d7]/40 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#131b2e] tracking-tight">Books Permission</h1>
              <p className="text-xs text-[#505f76] font-medium">
                {isTeacher
                  ? "Grant book access permissions to your students (restricted to your assigned books)."
                  : "Assign and manage textbook catalog permissions for Teachers and Students."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/users/permissions/modules">
            <Button variant="outline" className="border-[#c3c6d7] text-[#505f76] hover:bg-[#eaedff]/40 cursor-pointer h-9 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-[#004ac6]" />
              Module Permissions
            </Button>
          </Link>
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving || !selectedUserId}
            className="bg-[#004ac6] hover:bg-[#003cb0] text-white shadow-md shadow-[#004ac6]/20 font-semibold cursor-pointer h-9 text-xs"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save Permissions
          </Button>
        </div>
      </div>

      {/* Alert Status Notification */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold border ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Left User Selection Panel & Right Books Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
        {/* Left Column: Select Target User */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-3.5 sm:p-4 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#131b2e] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#004ac6]" />
                Select Target User
              </h2>
              <div className="flex items-center gap-2">
                {isUserFilterActive && (
                  <button
                    onClick={resetUserFilters}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Reset user filters"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                )}
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#eaedff] text-[#004ac6]">
                  {users.length} Users
                </span>
              </div>
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

            {/* Users List Container */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
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

        {/* Right Column: Books Permission Matrix */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-3.5 sm:p-4 shadow-sm space-y-4">
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
                  disabled={!selectedUserId || allBooks.length === 0}
                  className="text-xs font-semibold text-[#004ac6] border-[#004ac6]/30 hover:bg-[#004ac6]/10 cursor-pointer"
                >
                  <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                  Grant All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeAll}
                  disabled={!selectedUserId || allBooks.length === 0}
                  className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5 mr-1.5" />
                  Revoke All
                </Button>
              </div>
            </div>

            {/* Books Filter Controls: Search, Class (classId), Subject (subjectId), Language (languageId) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#505f76] flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-[#004ac6]" /> Filter Books Catalog
                </span>
                {isBookFilterActive && (
                  <button
                    onClick={resetBookFilters}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Search Bar */}
                <div className="sm:col-span-12 lg:col-span-4 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search title or code..."
                    value={bookSearchQuery}
                    onChange={(e) => setBookSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
                  />
                </div>

              {/* Class Filter Dropdown (passes classId) */}
              <div className="sm:col-span-4 lg:col-span-3 relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] appearance-none cursor-pointer font-semibold text-[#131b2e]"
                >
                  <option value="all">All Classes</option>
                  {classListOptions.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Filter Dropdown (passes subjectId) */}
              <div className="sm:col-span-4 lg:col-span-3 relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] appearance-none cursor-pointer font-semibold text-[#131b2e]"
                >
                  <option value="all">All Subjects</option>
                  {subjectListOptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language Filter Dropdown (passes languageId) */}
              <div className="sm:col-span-4 lg:col-span-2 relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                <select
                  value={selectedLanguageFilter}
                  onChange={(e) => setSelectedLanguageFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] appearance-none cursor-pointer font-semibold text-[#131b2e]"
                >
                  <option value="all">All Languages</option>
                  {languageListOptions.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

            {/* Books Grid */}
            {isLoadingBooks || isLoadingPermissions ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#004ac6]" />
                <p className="text-sm font-semibold text-[#505f76]">Loading book catalog permissions...</p>
              </div>
            ) : allBooks.length === 0 ? (
              <div className="py-12 text-center bg-[#faf8ff] rounded-xl border border-dashed border-[#c3c6d7]">
                <BookOpen className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
                <p className="text-sm font-bold text-[#131b2e]">No books found</p>
                <p className="text-xs text-[#505f76]">Try adjusting your search, class, subject, or language filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {allBooks.map((book, bIdx) => {
                  const bId = getId(book) || `b-${bIdx}`;
                  const isGranted = grantedBookIds.has(bId);
                  const isTeacherDisabled = isTeacher && teacherAllowedBookIds.size > 0 && !teacherAllowedBookIds.has(bId);

                  return (
                    <div
                      key={bId}
                      onClick={() => !isTeacherDisabled && toggleBookAccess(bId)}
                      className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        isTeacherDisabled
                          ? "bg-zinc-50 border-zinc-200 opacity-60 cursor-not-allowed"
                          : isGranted
                          ? "bg-emerald-50/50 border-emerald-300 shadow-sm cursor-pointer hover:border-emerald-400"
                          : "bg-white border-[#c3c6d7]/50 hover:bg-[#faf8ff] cursor-pointer"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#004ac6]/10 text-[#004ac6]">
                            {book.className || book.class || "General"}
                          </span>
                          {book.subject && (
                            <span className="text-[10px] font-semibold text-[#505f76]">
                              {book.subject}
                            </span>
                          )}
                          {book.language && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                              {book.language}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-[#131b2e] leading-snug">{book.title}</h4>
                        {book.code && (
                          <p className="text-[10px] font-mono text-[#505f76]">{book.code}</p>
                        )}
                        {isTeacherDisabled && (
                          <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mt-1">
                            <Lock className="h-3 w-3" /> Not assigned to Teacher
                          </p>
                        )}
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
            )}

            {/* Bottom Summary Bar */}
            <div className="pt-3 border-t border-[#c3c6d7]/30 flex items-center justify-between text-xs text-[#505f76] font-semibold">
              <span>
                Total Granted: <strong className="text-[#004ac6]">{grantedBookIds.size}</strong> / {allBooks.length} Books
              </span>
              <span>
                Showing {allBooks.length} books
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
