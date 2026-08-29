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
}

interface BookItem {
  _id?: string | number;
  id?: string | number;
  title: string;
  className?: string;
  class?: string;
  subject?: string;
  subjectName?: string;
  coverImage?: string;
  code?: string;
}

export default function BooksPermissionPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");

  const [allBooks, setAllBooks] = useState<BookItem[]>([]);
  const [teacherAllowedBookIds, setTeacherAllowedBookIds] = useState<Set<string>>(new Set());
  const [grantedBookIds, setGrantedBookIds] = useState<Set<string>>(new Set());

  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isTeacher = currentUser?.role?.toLowerCase() === "teacher";

  // 1. Fetch Users List from GET /api/v1/admin/users?page=1&limit=50&search={query}
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const params: Record<string, any> = {
        page: 1,
        limit: 50,
      };
      if (userSearchQuery.trim()) params.search = userSearchQuery.trim();

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

      // Filter target users and normalize name
      const normalizedUsers: UserOption[] = userList
        .map((u: any) => ({
          id: u.id ?? u._id,
          fullName: u.fullName || u.name || "User",
          email: u.email || "",
          role: u.role || "student",
        }))
        .filter((u: UserOption) => getId(u) !== getId(currentUser));

      setUsers(normalizedUsers);

      if (normalizedUsers.length > 0 && !selectedUserId) {
        setSelectedUserId(getId(normalizedUsers[0]));
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error("Failed to load users list.");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // 2. Fetch Catalog Books from GET /api/v1/books?page=1&limit=100&classId={classId}&search={search}
  const fetchCatalogBooks = async () => {
    try {
      setIsLoadingBooks(true);
      const params: Record<string, any> = {
        page: 1,
        limit: 100,
      };
      if (selectedClassFilter !== "all") params.classId = selectedClassFilter;
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

      const normalized: BookItem[] = rawBooks.map((b: any, idx: number) => ({
        id: b.id ?? b._id,
        title: b.title || "Untitled Book",
        class: b.class || b.className || "General",
        className: b.className || b.class || "General",
        subject: b.subject || b.subjectName || "General",
        code: b.code || b.isbn || `BK-${b.id ?? idx + 1}`,
        coverImage: b.coverImage || b.coverUrl,
      }));

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
  }, [userSearchQuery]);

  useEffect(() => {
    fetchCatalogBooks();
  }, [selectedClassFilter, bookSearchQuery]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserPermissions(selectedUserId);
    }
  }, [selectedUserId]);

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

  const classesList = Array.from(
    new Set(allBooks.map((b) => b.className || b.class || "General"))
  ).sort();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#131b2e]">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#c3c6d7]/40 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#131b2e] tracking-tight">Books Permission</h1>
              <p className="text-xs text-[#505f76] font-medium">
                {isTeacher
                  ? "Grant book access permissions to your students (restricted to your assigned books)."
                  : "Assign and manage textbook catalog permissions for Teachers and Students."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/users/permissions/modules">
            <Button variant="outline" className="border-[#c3c6d7] text-[#505f76] hover:bg-[#eaedff]/40 cursor-pointer">
              <ShieldCheck className="h-4 w-4 mr-2 text-[#004ac6]" />
              Module Permissions
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
            statusMessage.type === "success"
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

      {/* Main Grid: Left User Selection Panel & Right Books Checklist */}
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
                placeholder="Search target user name or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
              />
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

            {/* Books Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter books by title or subject..."
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
                />
              </div>

              <div className="sm:col-span-5 relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] appearance-none cursor-pointer"
                >
                  <option value="all">All Classes</option>
                  {classesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
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
                <p className="text-xs text-[#505f76]">Try adjusting your search or class filter.</p>
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
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#004ac6]/10 text-[#004ac6]">
                            {book.className || book.class || "General"}
                          </span>
                          <span className="text-[10px] font-semibold text-[#505f76]">
                            {book.subject}
                          </span>
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
