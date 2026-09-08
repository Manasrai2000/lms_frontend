"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  GraduationCap,
  Users,
  Search,
  CheckSquare,
  Square,
  Save,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  BookOpen,
  Filter,
  Trash2,
  UserCheck,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeacherOption {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  companyName?: string;
  role: string;
}

interface ClassItem {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

export default function AssignTeacherClassesPage() {
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");

  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<Set<number>>(new Set());

  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingTeacherClasses, setIsLoadingTeacherClasses] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [unassigningClassId, setUnassigningClassId] = useState<number | null>(null);

  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 1. Fetch Teachers List: GET /api/v1/admin/users?role=teacher&limit=100
  const fetchTeachers = async () => {
    try {
      setIsLoadingTeachers(true);
      const params = { role: "teacher", limit: 100 };
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

      const list = Array.isArray(res) ? res : res?.data || res?.users || [];
      const normalized: TeacherOption[] = list.map((t: any) => ({
        id: Number(t.id ?? t._id),
        fullName: t.fullName || t.name || "Teacher",
        email: t.email || "",
        phoneNumber: t.phoneNumber || "",
        companyName: t.companyName || "",
        role: t.role || "teacher",
      }));

      setTeachers(normalized);
      if (normalized.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(String(normalized[0].id));
      }
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
      toast.error("Failed to load teachers list.");
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  // 2. Fetch Master Classes: GET /api/v1/classes
  const fetchAllClasses = async () => {
    try {
      setIsLoadingClasses(true);
      let res: any = null;
      try {
        const r = await api.get("/v1/classes", { params: { limit: 100 } });
        res = r.data;
      } catch {
        const r = await api.get("/classes", { params: { limit: 100 } });
        res = r.data;
      }

      const list = Array.isArray(res) ? res : res?.data || [];
      const normalized: ClassItem[] = list.map((c: any) => ({
        id: Number(c.id ?? c._id),
        name: c.name || `Class ${c.id}`,
        code: c.code || `CLS-${c.id}`,
        description: c.description || "",
      }));

      setAllClasses(normalized);
    } catch (err) {
      console.error("Failed to fetch master classes:", err);
      toast.error("Failed to load classes catalog.");
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // 3. Fetch Assigned Classes for Selected Teacher: GET /api/teachers/:teacherId/classes
  const fetchTeacherClasses = async (teacherId: string) => {
    if (!teacherId) return;
    try {
      setIsLoadingTeacherClasses(true);
      let res: any = null;
      try {
        const r = await api.get(`/teachers/${teacherId}/classes`);
        res = r.data;
      } catch {
        try {
          const r = await api.get(`/classes/teachers/${teacherId}/classes`);
          res = r.data;
        } catch {
          const r = await api.get(`/v1/classes/teachers/${teacherId}/classes`);
          res = r.data;
        }
      }

      const rawData = res?.data ?? res;
      let assignedArr: any[] = [];
      if (Array.isArray(rawData)) {
        assignedArr = rawData;
      } else if (Array.isArray(rawData?.classes)) {
        assignedArr = rawData.classes;
      }

      const assignedIds = assignedArr.map((c: any) => Number(c.id ?? c.classId ?? c._id));
      setSelectedClassIds(new Set(assignedIds));
    } catch (err) {
      console.error("Failed to fetch teacher assigned classes:", err);
      // Reset if not found
      setSelectedClassIds(new Set());
    } finally {
      setIsLoadingTeacherClasses(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchAllClasses();
  }, []);

  useEffect(() => {
    if (selectedTeacherId) {
      fetchTeacherClasses(selectedTeacherId);
    }
  }, [selectedTeacherId]);

  const selectedTeacher = teachers.find((t) => String(t.id) === selectedTeacherId);

  // Filtered lists
  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(teacherSearchQuery.toLowerCase())
  );

  const filteredClasses = allClasses.filter(
    (c) =>
      c.name.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(classSearchQuery.toLowerCase()))
  );

  // Checkbox toggle
  const toggleClass = (classId: number) => {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const next = new Set(selectedClassIds);
    filteredClasses.forEach((c) => next.add(c.id));
    setSelectedClassIds(next);
    toast.info("Selected all currently filtered classes.");
  };

  const handleDeselectAll = () => {
    const next = new Set(selectedClassIds);
    filteredClasses.forEach((c) => next.delete(c.id));
    setSelectedClassIds(next);
    toast.info("Deselected filtered classes.");
  };

  // 4. Save / Update Assignments: PUT /api/teachers/:teacherId/classes
  const handleSaveAssignments = async () => {
    if (!selectedTeacherId) {
      toast.error("Please select a teacher first.");
      return;
    }
    try {
      setIsSaving(true);
      setStatusMessage(null);
      const payload = {
        classIds: Array.from(selectedClassIds),
      };

      let res: any = null;
      try {
        const r = await api.put(`/teachers/${selectedTeacherId}/classes`, payload);
        res = r.data;
      } catch {
        try {
          const r = await api.put(`/classes/teachers/${selectedTeacherId}/classes`, payload);
          res = r.data;
        } catch {
          const r = await api.post(`/teachers/${selectedTeacherId}/classes`, payload);
          res = r.data;
        }
      }

      const msg =
        res?.message ||
        `Classes assigned to ${selectedTeacher?.fullName || "teacher"} successfully`;
      setStatusMessage({ type: "success", text: msg });
      toast.success(msg);
      fetchTeacherClasses(selectedTeacherId);
    } catch (err: any) {
      console.error("Failed to save teacher class assignments:", err);
      const errMsg = err.response?.data?.message || "Failed to assign classes to teacher.";
      setStatusMessage({ type: "error", text: errMsg });
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 6000);
    }
  };

  // 5. Quick Unassign Action: DELETE /api/teachers/:teacherId/classes/:classId
  const handleQuickUnassign = async (classId: number, className: string) => {
    if (!selectedTeacherId) return;
    try {
      setUnassigningClassId(classId);
      try {
        await api.delete(`/teachers/${selectedTeacherId}/classes/${classId}`);
      } catch {
        try {
          await api.delete(`/classes/teachers/${selectedTeacherId}/classes/${classId}`);
        } catch {
          await api.delete(`/v1/classes/teachers/${selectedTeacherId}/classes/${classId}`);
        }
      }

      setSelectedClassIds((prev) => {
        const next = new Set(prev);
        next.delete(classId);
        return next;
      });

      toast.success(`Class "${className}" unassigned from teacher successfully`);
    } catch (err: any) {
      console.error("Failed to unassign class:", err);
      toast.error(err.response?.data?.message || "Failed to unassign class.");
    } finally {
      setUnassigningClassId(null);
    }
  };

  const currentlyAssignedClasses = allClasses.filter((c) => selectedClassIds.has(c.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#131b2e]">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#c3c6d7]/40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#131b2e] tracking-tight">
              Assign Classes to Teacher
            </h1>
            <p className="text-xs text-[#505f76] font-medium">
              Manage academic grade/class access for teachers so they can view and manage enrolled students.
            </p>
          </div>
        </div>

        <Button
          onClick={handleSaveAssignments}
          disabled={isSaving || !selectedTeacherId}
          className="bg-[#004ac6] hover:bg-[#003cb0] text-white shadow-md shadow-[#004ac6]/20 font-semibold cursor-pointer"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Assignments
        </Button>
      </div>

      {/* Alert Status Banner */}
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
          <button
            onClick={() => setStatusMessage(null)}
            className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Teacher Selector & Right Classes Checkbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Left Sidebar - Select Teacher */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#131b2e] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#004ac6]" />
                Step 1: Select Teacher
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#eaedff] text-[#004ac6]">
                {teachers.length} Teachers
              </span>
            </div>

            {/* Search Teacher Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search teacher by name or email..."
                value={teacherSearchQuery}
                onChange={(e) => setTeacherSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
              />
            </div>

            {/* Teachers List */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
              {isLoadingTeachers ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#004ac6]" />
                  <p className="text-xs text-[#505f76] font-semibold">Loading teachers list...</p>
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#505f76] font-semibold bg-[#faf8ff] rounded-xl border border-dashed border-[#c3c6d7]">
                  No matching teachers found.
                </div>
              ) : (
                filteredTeachers.map((t) => {
                  const tIdStr = String(t.id);
                  const isSelected = tIdStr === selectedTeacherId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeacherId(tIdStr)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-[#004ac6] text-white border-[#004ac6] shadow-sm shadow-[#004ac6]/15"
                          : "bg-white hover:bg-[#eaedff]/50 border-[#c3c6d7]/40 text-[#131b2e]"
                      }`}
                    >
                      <div className="overflow-hidden space-y-0.5">
                        <p
                          className={`text-xs font-bold truncate ${
                            isSelected ? "text-white" : "text-[#131b2e]"
                          }`}
                        >
                          {t.fullName}
                        </p>
                        <p
                          className={`text-[11px] truncate ${
                            isSelected ? "text-white/80" : "text-[#505f76]"
                          }`}
                        >
                          {t.email}
                        </p>
                        {t.companyName && (
                          <p
                            className={`text-[10px] truncate ${
                              isSelected ? "text-white/70" : "text-zinc-400"
                            }`}
                          >
                            {t.companyName}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-purple-100 text-purple-700 border border-purple-200"
                        }`}
                      >
                        Teacher
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Step 2 & 3: Right Panel - Assigned Classes & Multi-select Checkbox Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-5 shadow-sm space-y-5">
            {/* Header Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#c3c6d7]/30">
              <div>
                <span className="text-[11px] font-bold text-[#505f76] uppercase tracking-wider">
                  Configuring Assigned Classes For:
                </span>
                <h3 className="text-base font-extrabold text-[#131b2e]">
                  {selectedTeacher
                    ? `${selectedTeacher.fullName} (${selectedTeacher.email})`
                    : "Select a Teacher"}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={!selectedTeacherId || filteredClasses.length === 0}
                  className="text-xs font-semibold text-[#004ac6] border-[#004ac6]/30 hover:bg-[#004ac6]/10 cursor-pointer"
                >
                  <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={!selectedTeacherId || filteredClasses.length === 0}
                  className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5 mr-1.5" />
                  Deselect All
                </Button>
              </div>
            </div>

            {/* Currently Assigned Classes Badges with Quick Unassign Action */}
            <div className="space-y-2 bg-[#faf8ff] p-4 rounded-xl border border-[#c3c6d7]/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#505f76] flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-[#004ac6]" /> Currently Assigned Classes (
                  {currentlyAssignedClasses.length})
                </span>
              </div>

              {isLoadingTeacherClasses ? (
                <div className="py-2 flex items-center gap-2 text-xs text-[#505f76] font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#004ac6]" /> Loading teacher's assigned classes...
                </div>
              ) : currentlyAssignedClasses.length === 0 ? (
                <p className="text-xs text-amber-700 font-medium italic">
                  No classes currently assigned to this teacher. Select classes below and click "Save Assignments".
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentlyAssignedClasses.map((cls) => (
                    <span
                      key={cls.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                    >
                      {cls.name} {cls.code && `(${cls.code})`}
                      <button
                        type="button"
                        onClick={() => handleQuickUnassign(cls.id, cls.name)}
                        disabled={unassigningClassId === cls.id}
                        title={`Quick Unassign ${cls.name}`}
                        className="hover:bg-emerald-200 p-0.5 rounded text-emerald-900 transition-colors cursor-pointer"
                      >
                        {unassigningClassId === cls.id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-emerald-900" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Classes Search Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search classes by name or code..."
                value={classSearchQuery}
                onChange={(e) => setClassSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
              />
            </div>

            {/* Checkbox Multi-Select Card Grid */}
            {isLoadingClasses || isLoadingTeacherClasses ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#004ac6]" />
                <p className="text-sm font-semibold text-[#505f76]">
                  Loading classes catalog & permissions...
                </p>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="py-12 text-center bg-[#faf8ff] rounded-xl border border-dashed border-[#c3c6d7]">
                <GraduationCap className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
                <p className="text-sm font-bold text-[#131b2e]">No classes found</p>
                <p className="text-xs text-[#505f76]">Try adjusting your search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                {filteredClasses.map((cls) => {
                  const isChecked = selectedClassIds.has(cls.id);
                  return (
                    <div
                      key={cls.id}
                      onClick={() => toggleClass(cls.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isChecked
                          ? "bg-emerald-50/60 border-emerald-300 shadow-2xs hover:border-emerald-400"
                          : "bg-white border-[#c3c6d7]/50 hover:bg-[#faf8ff]"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md ${
                              isChecked
                                ? "bg-emerald-200 text-emerald-900"
                                : "bg-[#004ac6]/10 text-[#004ac6]"
                            }`}
                          >
                            {cls.name}
                          </span>
                          {cls.code && (
                            <span className="text-[11px] font-mono font-semibold text-[#505f76]">
                              {cls.code}
                            </span>
                          )}
                        </div>
                        {cls.description && (
                          <p className="text-xs text-[#505f76] line-clamp-2">
                            {cls.description}
                          </p>
                        )}
                      </div>

                      {/* Checkbox Switch */}
                      <div className="shrink-0 pt-0.5">
                        <button
                          type="button"
                          className={`h-6 w-11 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                            isChecked ? "bg-emerald-600" : "bg-zinc-300"
                          }`}
                        >
                          <span
                            className={`block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${
                              isChecked ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Summary & Save Bar */}
            <div className="pt-4 border-t border-[#c3c6d7]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-[#505f76] font-semibold">
                Assigned Classes:{" "}
                <strong className="text-[#004ac6]">{selectedClassIds.size}</strong> /{" "}
                {allClasses.length} Master Classes
              </div>

              <Button
                onClick={handleSaveAssignments}
                disabled={isSaving || !selectedTeacherId}
                className="bg-[#004ac6] hover:bg-[#003cb0] text-white shadow-md shadow-[#004ac6]/20 font-semibold cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Assignments
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
