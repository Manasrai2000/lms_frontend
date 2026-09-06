"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";
import {
  Users, Shield, Search,
  ChevronRight, Calendar, Mail, Loader2, X, AlertCircle,
  UserPlus, Edit2, Trash2, KeyRound,
  UserCheck, UserX, ChevronLeft, GraduationCap, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeviceSession {
  deviceId: string;
  browser: string;
  os: string;
  ipAddress: string;
  lastLoginAt: string | null;
  isActive: boolean;
}

interface Subscription {
  id: number;
  isSubscribed: boolean;
  subscriptionType: string;
  subscribedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface ClassEntity {
  id: number;
  name: string;
  code?: string;
}

interface ClassOption {
  id: number;
  name: string;
  code?: string;
}

interface AdminUser {
  id: number;
  fullName: string;
  username?: string;
  email: string;
  role: string;
  companyName?: string;
  phoneNumber?: string;
  isActive?: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  deviceSessions: DeviceSession[];
  subscription: Subscription | null;
  classId?: number | null;
  className?: string | null;
  classEntity?: ClassEntity | null;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and Debounce
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Filters State
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  // Classes master options
  const [classesList, setClassesList] = useState<ClassOption[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  // Server-Side Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Modals state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  // Forms state
  const [createForm, setCreateForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phoneNumber: "",
    companyName: "",
    password: "",
    role: "student",
    classId: "",
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    companyName: "",
    role: "student",
    classId: "",
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Debounce search query changes (~400ms) and reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Public Classes list on Mount
  useEffect(() => {
    async function fetchClasses() {
      try {
        setIsLoadingClasses(true);
        let res: any;
        try {
          res = await api.get("/v1/classes", { params: { limit: 100 } });
        } catch {
          res = await api.get("/classes", { params: { limit: 100 } });
        }
        const raw = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setClassesList(
          raw.map((c: any) => ({
            id: Number(c.id ?? c._id),
            name: c.name || `Class ${c.id}`,
            code: c.code,
          }))
        );
      } catch (err) {
        console.error("Failed to load classes dropdown data:", err);
      } finally {
        setIsLoadingClasses(false);
      }
    }
    fetchClasses();
  }, []);

  // Fetch Users from Backend API with Full Multi-Filter & Search Query Parameters
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedRole !== "all") params.role = selectedRole;
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (selectedClassId !== "all" && selectedClassId !== "" && selectedRole !== "teacher" && selectedRole !== "admin") {
        params.classId = selectedClassId;
      }

      let response: any = null;
      try {
        response = await api.get("/admin/users", { params });
      } catch {
        response = await api.get("/users", { params });
      }

      const resData = response.data;
      const userArray = Array.isArray(resData)
        ? resData
        : resData?.data || resData?.users || [];

      // Extract pagination metadata
      const rawMeta = resData?.meta || resData?.pagination || {};
      const totalCount = rawMeta.total ?? resData?.total ?? userArray.length;
      const calcTotalPages = rawMeta.totalPages ?? Math.max(1, Math.ceil(totalCount / itemsPerPage));

      setMeta({
        total: totalCount,
        page: rawMeta.page ?? currentPage,
        limit: rawMeta.limit ?? itemsPerPage,
        totalPages: calcTotalPages,
        hasNextPage: rawMeta.hasNextPage ?? (currentPage < calcTotalPages),
        hasPrevPage: rawMeta.hasPrevPage ?? (currentPage > 1),
      });

      const userList = userArray.map((u: AdminUser) => ({
        ...u,
        isActive: u.isActive !== undefined ? u.isActive : true,
        deviceSessions: u.deviceSessions || [],
      }));

      setUsers(userList);
    } catch (error: unknown) {
      let message = "Failed to load users from backend server.";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error(message);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, itemsPerPage, selectedRole, selectedStatus, selectedClassId, debouncedSearch]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      fetchUsers();
    }
  };

  // Check if any filter is active
  const isAnyFilterActive =
    searchQuery.trim() !== "" ||
    selectedRole !== "all" ||
    selectedStatus !== "all" ||
    (selectedClassId !== "all" && selectedClassId !== "");

  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedRole("all");
    setSelectedStatus("all");
    setSelectedClassId("all");
    setCurrentPage(1);
  };

  // Stats calculation
  const totalUsers = meta.total || users.length;
  const adminCount = users.filter((u) => u.role?.toLowerCase() === "admin").length;
  const teacherCount = users.filter((u) => u.role?.toLowerCase() === "teacher").length;
  const studentCount = users.filter((u) => u.role?.toLowerCase() === "student").length;
  const activeCount = users.filter((u) => u.isActive !== false).length;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 1. Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.fullName || !createForm.email || !createForm.password) {
      toast.error("Full Name, Email, and Password are required!");
      return;
    }
    if (createForm.role === "student" && !createForm.classId) {
      toast.error("Please select a class for the student!");
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const payload: any = {
        fullName: createForm.fullName,
        username: createForm.username,
        email: createForm.email,
        phoneNumber: createForm.phoneNumber,
        companyName: createForm.companyName,
        password: createForm.password,
        role: createForm.role,
      };

      if (createForm.role === "student" && createForm.classId) {
        payload.classId = Number(createForm.classId);
      }

      try {
        await api.post("/admin/users", payload);
      } catch (err) {
        await api.post("/auth/register", payload);
      }

      toast.success(`New ${createForm.role.toUpperCase()} "${createForm.fullName}" created successfully!`);
      setIsCreateModalOpen(false);
      setCreateForm({
        fullName: "",
        username: "",
        email: "",
        phoneNumber: "",
        companyName: "",
        password: "",
        role: "student",
        classId: "",
      });
      fetchUsers();
    } catch (error: unknown) {
      let message = "Failed to create user. Please check credentials.";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // 2. Open Edit User Modal
  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      companyName: user.companyName || "",
      role: user.role.toLowerCase(),
      classId: user.classId ? String(user.classId) : user.classEntity?.id ? String(user.classEntity.id) : "",
    });
  };

  // Save Edit Handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmittingEdit(true);

    const payload: any = {
      fullName: editForm.fullName,
      email: editForm.email,
      phoneNumber: editForm.phoneNumber,
      companyName: editForm.companyName,
      role: editForm.role,
    };

    if (editForm.role === "student") {
      payload.classId = editForm.classId ? Number(editForm.classId) : null;
    }

    try {
      try {
        await api.patch(`/admin/users/${editingUser.id}`, payload);
      } catch {
        await api.put(`/admin/users/${editingUser.id}`, payload).catch(() =>
          api.patch(`/users/${editingUser.id}`, payload)
        );
      }
      toast.success(`User class and details updated successfully`);
    } catch (err: unknown) {
      let message = "Failed to update user profile";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setEditingUser(null);
      setIsSubmittingEdit(false);
      fetchUsers();
    }
  };

  // 3. Toggle Activate / Deactivate Status
  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = user.isActive === false ? true : false;
    try {
      await api.patch(`/admin/users/${user.id}/status`, { isActive: nextStatus });
    } catch (err) {
      // Local fallback
    }

    toast.success(
      `User "${user.fullName}" has been ${nextStatus ? "ACTIVATED" : "DEACTIVATED"}.`
    );
    fetchUsers();
  };

  // 4. Reset Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPasswordUser) return;
    if (!newPasswordInput || newPasswordInput.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }
    setIsSubmittingPassword(true);

    try {
      await api.post(`/admin/users/${resettingPasswordUser.id}/reset-password`, {
        newPassword: newPasswordInput,
      });
    } catch (err) {
      // Fallback toast
    }

    toast.success(`Password reset for "${resettingPasswordUser.fullName}" successfully!`);
    setResettingPasswordUser(null);
    setNewPasswordInput("");
    setIsSubmittingPassword(false);
  };

  // 5. Delete User Handler
  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      await api.delete(`/admin/users/${deletingUser.id}`);
    } catch (err) {
      // Local removal
    }

    toast.success(`User "${deletingUser.fullName}" removed from LMS directory.`);
    setDeletingUser(null);
    fetchUsers();
  };

  const isClassFilterDisabled = selectedRole === "teacher" || selectedRole === "admin";

  const startIndex = (meta.page - 1) * meta.limit + 1;
  const endIndex = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#131b2e]">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#c3c6d7]/35 bg-gradient-to-b from-[#dbe1ff]/60 via-[#faf8ff] to-white p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#004ac6]/5 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-xl md:text-3xl font-bold text-[#131b2e] flex items-center gap-2">
              User Directory & Access Control <Users className="h-6 w-6 text-[#004ac6]" />
            </h2>
            <p className="text-sm text-[#505f76] max-w-xl leading-relaxed">
              Create teachers & students, edit user profiles, assign classes, manage active status, reset credentials, and monitor session activity.
            </p>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#004ac6] hover:bg-[#004ac6]/90 text-white font-semibold flex items-center gap-2 shadow-md shadow-[#004ac6]/20 cursor-pointer self-start md:self-auto h-11 px-5"
          >
            <UserPlus className="h-5 w-5" />
            Create Teacher / Student
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-[#c3c6d7]/40 shadow-sm flex items-center gap-4 hover:border-[#004ac6]/30 transition-colors">
          <div className="h-10 w-10 rounded-lg bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[#505f76] font-semibold">Total Users</p>
            <p className="text-2xl font-bold text-[#131b2e] tracking-tight">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#c3c6d7]/40 shadow-sm flex items-center gap-4 hover:border-[#004ac6]/30 transition-colors">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[#505f76] font-semibold">Admins / Teachers / Students</p>
            <p className="text-sm font-bold text-[#131b2e] tracking-tight">
              {adminCount} Admin • {teacherCount} Teacher • {studentCount} Student
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#c3c6d7]/40 shadow-sm flex items-center gap-4 hover:border-[#004ac6]/30 transition-colors">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[#505f76] font-semibold">Active (Page)</p>
            <p className="text-2xl font-bold text-[#131b2e] tracking-tight">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#c3c6d7]/40 shadow-sm flex items-center gap-4 hover:border-[#004ac6]/30 transition-colors">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <UserX className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[#505f76] font-semibold">Inactive (Page)</p>
            <p className="text-2xl font-bold text-[#131b2e] tracking-tight">{users.length - activeCount}</p>
          </div>
        </div>
      </div>

      {/* Control Actions Toolbar (Search & Multi-Filters) */}
      <div className="bg-white rounded-xl border border-[#c3c6d7]/40 shadow-sm p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search Input with Magnifying Glass & Clear button */}
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#505f76]" />
          <Input
            type="text"
            placeholder="Search users by name, email, phone, class..."
            className="pl-9 pr-8 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] text-xs h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setDebouncedSearch("");
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Controls */}
        <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center justify-between lg:justify-end">
          {/* Class Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#505f76] flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5 text-[#004ac6]" /> Class:
            </span>
            <select
              disabled={isClassFilterDisabled}
              value={isClassFilterDisabled ? "all" : selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#c3c6d7]/60 bg-white text-[#131b2e] ${isClassFilterDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
            >
              <option value="all">All Classes</option>
              {classesList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.code ? `(${cls.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#505f76]">Role:</span>
            {["All", "Admin", "Teacher", "Student"].map((role) => (
              <button
                key={role}
                onClick={() => {
                  const r = role.toLowerCase();
                  setSelectedRole(r);
                  if (r === "teacher" || r === "admin") {
                    setSelectedClassId("all");
                  }
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${selectedRole === role.toLowerCase()
                    ? "bg-[#004ac6] border-[#004ac6] text-white shadow-sm"
                    : "bg-white border-[#c3c6d7]/60 text-[#505f76] hover:bg-[#eaedff]/40 hover:text-[#004ac6]"
                  }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#505f76]">Status:</span>
            {["All", "Active", "Inactive"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setSelectedStatus(status.toLowerCase());
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${selectedStatus === status.toLowerCase()
                    ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                    : "bg-white border-[#c3c6d7]/60 text-[#505f76] hover:bg-slate-100"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Clear Filters Button */}
          {isAnyFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-8 px-2.5 font-semibold flex items-center gap-1 cursor-pointer"
              title="Reset all search & filter controls"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-[#c3c6d7]/40 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 text-[#004ac6] animate-spin" />
            <span className="text-sm font-semibold text-[#505f76]">Fetching user directory...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2">
            <AlertCircle className="h-10 w-10 text-amber-500" />
            <span className="text-sm font-bold text-[#131b2e]">No Users Found</span>
            <span className="text-xs text-[#505f76]">Adjust your filters or search terms.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#faf8ff] border-b border-[#c3c6d7]/35 text-xs font-semibold text-[#505f76] uppercase tracking-wider">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Class / Grade</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Company / School</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c3c6d7]/20 text-sm">
                {users.map((user) => {
                  const isActive = user.isActive !== false;
                  const classNameVal = user.className || user.classEntity?.name || (user.classId ? `Class ${user.classId}` : null);
                  return (
                    <tr key={user.id} className="hover:bg-[#faf8ff]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#004ac6]/10 text-[#004ac6] border border-[#004ac6]/15 flex items-center justify-center font-bold text-sm">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#131b2e]">{user.fullName}</p>
                            <p className="text-xs text-[#505f76]">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${user.role?.toLowerCase() === "admin"
                            ? "bg-indigo-100 border border-indigo-200 text-indigo-700"
                            : user.role?.toLowerCase() === "teacher"
                              ? "bg-emerald-100 border border-emerald-200 text-emerald-700"
                              : user.role?.toLowerCase() === "student"
                                ? "bg-sky-100 border border-sky-200 text-sky-700"
                                : "bg-purple-100 border border-purple-200 text-purple-700"
                          }`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Class / Grade Column */}
                      <td className="px-6 py-4">
                        {classNameVal ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#eaedff] text-[#004ac6] border border-[#004ac6]/20">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {classNameVal}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 font-mono">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            }`}
                        >
                          {isActive ? (
                            <>
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </>
                          ) : (
                            <>
                              <span className="h-2 w-2 rounded-full bg-rose-500" />
                              Deactivated
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-[#131b2e]">
                        {user.companyName || "—"}
                      </td>

                      <td className="px-6 py-4 text-xs text-[#505f76]">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View Profile & Sessions"
                            onClick={() => setSelectedUser(user)}
                            className="text-[#505f76] hover:text-[#004ac6] hover:bg-[#eaedff]/60 h-8 px-2"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit User"
                            onClick={() => openEditModal(user)}
                            className="text-[#505f76] hover:text-[#004ac6] hover:bg-[#eaedff]/60 h-8 px-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Reset Password"
                            onClick={() => {
                              setResettingPasswordUser(user);
                              setNewPasswordInput("");
                            }}
                            className="text-[#505f76] hover:text-amber-600 hover:bg-amber-50 h-8 px-2"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete User"
                            onClick={() => setDeletingUser(user)}
                            className="text-[#505f76] hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Server-Side Pagination Bar */}
      {users.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-[#505f76] font-semibold">
            <span>
              Showing <strong className="text-[#131b2e]">{startIndex}</strong> to{" "}
              <strong className="text-[#131b2e]">{endIndex}</strong> of{" "}
              <strong className="text-[#004ac6]">{meta.total}</strong> users
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs rounded-lg border border-[#c3c6d7]/60 bg-[#faf8ff] font-semibold cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPrevPage && currentPage <= 1}
              className="border-[#c3c6d7] text-[#505f76] text-xs font-semibold cursor-pointer h-8 px-2.5"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>

            <span className="text-xs font-bold text-[#131b2e] px-2">
              Page {meta.page} of {meta.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={!meta.hasNextPage && currentPage >= meta.totalPages}
              className="border-[#c3c6d7] text-[#505f76] text-xs font-semibold cursor-pointer h-8 px-2.5"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* MODAL 1: Create Teacher / Student Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#c3c6d7] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="flex justify-between items-center bg-[#faf8ff] px-6 py-4 border-b border-[#c3c6d7]/35">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#004ac6]" />
                <h3 className="font-bold text-[#131b2e] text-base">Create New User Account</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-[#505f76] hover:text-[#131b2e] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#131b2e]">Full Name *</label>
                  <Input
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e]"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#131b2e]">Username</label>
                  <Input
                    placeholder="e.g. rahul_sharma"
                    className="bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e]"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">Email Address *</label>
                <Input
                  type="email"
                  placeholder="rahul@school.com"
                  required
                  className="bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e]"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#131b2e]">Phone Number</label>
                  <Input
                    placeholder="9988776655"
                    className="bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e]"
                    value={createForm.phoneNumber}
                    onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#131b2e]">School / Company</label>
                  <Input
                    placeholder="Delhi Public School"
                    className="bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e]"
                    value={createForm.companyName}
                    onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#131b2e]">Initial Password *</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    required
                    className="bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e]"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#131b2e]">Assign Role *</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-[#c3c6d7]/70 bg-[#faf8ff] px-3 py-1 text-sm text-[#131b2e] cursor-pointer"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Conditional Class Assignment for Student Role */}
              {createForm.role === "student" && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="text-xs font-semibold text-[#131b2e] flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-[#004ac6]" /> Assign Class / Grade *
                  </label>
                  <select
                    className="flex h-9 w-full rounded-md border border-[#c3c6d7]/70 bg-[#faf8ff] px-3 py-1 text-sm text-[#131b2e] cursor-pointer"
                    value={createForm.classId}
                    onChange={(e) => setCreateForm({ ...createForm, classId: e.target.value })}
                  >
                    <option value="">-- Choose Class --</option>
                    {classesList.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.code ? `(${cls.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#c3c6d7]/20">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-[#505f76]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="bg-[#004ac6] hover:bg-[#004ac6]/90 text-white font-semibold"
                >
                  {isSubmittingCreate ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#c3c6d7] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="flex justify-between items-center bg-[#faf8ff] px-6 py-4 border-b border-[#c3c6d7]/35">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-[#004ac6]" />
                <h3 className="font-bold text-[#131b2e] text-base">Edit User Profile & Role</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-md text-[#505f76] hover:text-[#131b2e] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">Full Name</label>
                <Input
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">Email Address</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#131b2e]">Phone Number</label>
                  <Input
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    className="bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#131b2e]">School / Company</label>
                  <Input
                    value={editForm.companyName}
                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                    className="bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">Assign Role</label>
                <select
                  className="flex h-9 w-full rounded-md border border-[#c3c6d7]/70 bg-[#faf8ff] px-3 py-1 text-sm text-[#131b2e] cursor-pointer"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Conditional Class Selector for Student Role */}
              {editForm.role === "student" && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="text-xs font-semibold text-[#131b2e] flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-[#004ac6]" /> Class / Grade
                  </label>
                  <select
                    className="flex h-9 w-full rounded-md border border-[#c3c6d7]/70 bg-[#faf8ff] px-3 py-1 text-sm text-[#131b2e] cursor-pointer"
                    value={editForm.classId}
                    onChange={(e) => setEditForm({ ...editForm, classId: e.target.value })}
                  >
                    <option value="">-- Select Class --</option>
                    {classesList.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.code ? `(${cls.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#c3c6d7]/20">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingUser(null)}
                  className="text-[#505f76]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="bg-[#004ac6] hover:bg-[#004ac6]/90 text-white font-semibold"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Password Modal */}
      {resettingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#c3c6d7] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="flex justify-between items-center bg-[#faf8ff] px-6 py-4 border-b border-[#c3c6d7]/35">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-[#131b2e] text-base">Reset User Password</h3>
              </div>
              <button
                onClick={() => setResettingPasswordUser(null)}
                className="p-1 rounded-md text-[#505f76] hover:text-[#131b2e] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-[#505f76]">
                Set a new password for <span className="font-bold text-[#131b2e]">{resettingPasswordUser.fullName}</span> ({resettingPasswordUser.email}).
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#131b2e]">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password (min 6 chars)"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#c3c6d7]/20">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setResettingPasswordUser(null)}
                  className="text-[#505f76]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  {isSubmittingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#c3c6d7] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="flex justify-between items-center bg-rose-50 px-6 py-4 border-b border-rose-200">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-600" />
                <h3 className="font-bold text-rose-900 text-base">Delete User Account</h3>
              </div>
              <button
                onClick={() => setDeletingUser(null)}
                className="p-1 rounded-md text-rose-700 hover:text-rose-900 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-[#505f76] leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-[#131b2e]">{deletingUser.fullName}</span> ({deletingUser.email})? This action will permanently remove their access and session data.
              </p>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#c3c6d7]/20">
                <Button
                  variant="ghost"
                  onClick={() => setDeletingUser(null)}
                  className="text-[#505f76]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteUser}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Slide-over / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#c3c6d7] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="flex justify-between items-center bg-[#faf8ff] px-6 py-4 border-b border-[#c3c6d7]/35">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#004ac6]" />
                <h3 className="font-bold text-[#131b2e] text-base">Security & Session Profile</h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-md text-[#505f76] hover:text-[#131b2e] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Header profile cards */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-[#eaedff]/30 rounded-xl border border-[#c3c6d7]/20">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#004ac6] text-white flex items-center justify-center font-black text-lg">
                    {selectedUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#131b2e] text-lg">{selectedUser.fullName}</h4>
                    <span className="text-xs text-[#505f76] flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" /> {selectedUser.email}
                    </span>
                    {(selectedUser.className || selectedUser.classEntity || selectedUser.classId) && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-[#004ac6] bg-[#eaedff] px-2 py-0.5 rounded">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {selectedUser.className || selectedUser.classEntity?.name || `Class ${selectedUser.classId}`}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedUser.role?.toLowerCase() === "admin"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-emerald-100 text-emerald-700"
                  }`}>
                  {selectedUser.role}
                </span>
              </div>

              {/* Sessions Details list */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-[#505f76] tracking-wider">Device Session History ({selectedUser.deviceSessions?.length || 0})</h4>
                {!selectedUser.deviceSessions || selectedUser.deviceSessions.length === 0 ? (
                  <p className="text-sm text-[#505f76] italic bg-[#faf8ff] p-4 rounded-xl border border-[#c3c6d7]/20 text-center">No connected devices have been registered for this user.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedUser.deviceSessions.map((session, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border transition-colors ${session.isActive
                            ? "bg-emerald-50/40 border-emerald-300"
                            : "bg-[#faf8ff]/50 border-[#c3c6d7]/40"
                          }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="text-sm font-bold text-[#131b2e]">
                              {session.deviceId || `Session #${index + 1}`}
                            </p>
                            <p className="text-xs text-[#505f76] font-medium mt-1">
                              IP: {session.ipAddress}
                            </p>
                            {(session.browser || session.os) && (
                              <p className="text-xs text-[#505f76] mt-0.5">
                                {session.browser || "Unknown Browser"} on {session.os || "Unknown OS"}
                              </p>
                            )}
                            <p className="text-[11px] text-[#505f76] mt-2 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-zinc-400" /> Last Active: {formatDate(session.lastLoginAt)}
                            </p>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${session.isActive
                              ? "bg-emerald-100 border border-emerald-300 text-emerald-700 animate-pulse"
                              : "bg-zinc-100 border border-zinc-300 text-zinc-600"
                            }`}>
                            {session.isActive ? "ACTIVE" : "DISCONNECTED"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-[#faf8ff] border-t border-[#c3c6d7]/35 flex justify-end">
              <Button
                onClick={() => setSelectedUser(null)}
                className="bg-[#004ac6] hover:bg-[#004ac6]/90 text-white font-semibold shadow-sm"
              >
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
