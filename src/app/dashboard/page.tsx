"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { Activity } from "@/lib/types";
import { 
  Users, BookOpen, HelpCircle, Video, FileSpreadsheet, 
  Sparkles, Clock, AlertCircle
} from "lucide-react";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats Card data
  const stats = [
    { title: "Total Users", value: "1,248", change: "+12% this month", icon: Users, color: "text-[#004ac6]", bg: "bg-[#004ac6]/10" },
    { title: "Total Books", value: "356", change: "+4 new books", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { title: "Questions Bank", value: "18,450", change: "+1,200 imported", icon: HelpCircle, color: "text-violet-600", bg: "bg-violet-500/10" },
    { title: "Videos Host", value: "482", change: "YouTube streams", icon: Video, color: "text-rose-600", bg: "bg-rose-500/10" },
    { title: "Worksheets", value: "920", change: "PDF templates", icon: FileSpreadsheet, color: "text-amber-600", bg: "bg-amber-500/10" },
  ];

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await api.get("/activities");
        setActivities(res.data || []);
      } catch (err) {
        setActivities([
          { id: 1, title: "Book 'English Grammar' Added", description: "Teacher Manual & Lesson Planner files uploaded by Admin.", timestamp: "10 mins ago" },
          { id: 2, title: "Bulk QR Codes Generated", description: "Successfully generated 45 codes for Class 8 Mathematics Chapters.", timestamp: "2 hours ago" },
          { id: 3, title: "Question Bank Import", description: "Excel template imported: 120 MCQ questions added to Science.", timestamp: "1 day ago" },
          { id: 4, title: "Permissions Updated", description: "Book permissions assigned to Teacher ID #204.", timestamp: "2 days ago" },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivities();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#c3c6d7]/35 bg-gradient-to-b from-[#dbe1ff]/60 via-[#faf8ff] to-white p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#004ac6]/5 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-xl md:text-3xl font-bold text-[#131b2e] flex items-center gap-2">
              Welcome back, {user?.fullName || "Admin"} <Sparkles className="h-6 w-6 text-[#004ac6] animate-pulse" />
            </h2>
            <p className="text-sm text-[#505f76] max-w-xl leading-relaxed">
              Here is your control summary for the Learning Management System. Review statistics, audit access, and manage curriculum objects.
            </p>
          </div>
          <div className="text-xs bg-white border border-[#c3c6d7]/50 px-4 py-2.5 rounded-xl text-[#131b2e] font-semibold shadow-sm w-fit">
            Role: <span className="font-bold text-[#004ac6] uppercase">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl p-5 border border-[#c3c6d7]/40 shadow-sm space-y-4 hover:border-[#004ac6]/30 transition-colors">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#505f76] font-semibold">{stat.title}</span>
                <div className={`h-8 w-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#131b2e] tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-[#505f76] font-medium">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div> */}

      {/* Detailed Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#c3c6d7]/45 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Clock className="h-5 w-5 text-[#505f76]" />
            <h3 className="text-sm font-bold text-[#131b2e] uppercase tracking-wider">Recent System Activity</h3>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-zinc-400 text-sm">Loading activity logs...</div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-sm">No activity recorded.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex gap-4 p-3 rounded-lg hover:bg-[#faf8ff] bg-white border border-[#c3c6d7]/20">
                  <div className="h-2 w-2 rounded-full bg-[#004ac6] mt-2 shrink-0 animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#131b2e]">{act.title}</p>
                    <p className="text-xs text-[#505f76]">{act.description}</p>
                    <p className="text-[10px] text-zinc-400">{act.timestamp || "just now"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit / Alerts */}
        <div className="bg-white rounded-xl border border-[#c3c6d7]/45 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <AlertCircle className="h-5 w-5 text-[#004ac6]" />
            <h3 className="text-sm font-bold text-[#131b2e] uppercase tracking-wider">Action Items</h3>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            <div className="p-3 border border-amber-200 bg-amber-50/50 rounded-lg text-amber-800 flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold text-amber-900">Pending Permissions</p>
                <p className="text-[10px] text-amber-700 font-medium">3 teachers requested book authorizations.</p>
              </div>
            </div>

            <div className="p-3 border border-[#004ac6]/20 bg-[#eaedff]/30 rounded-lg text-[#004ac6] flex gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-[#004ac6]" />
              <div>
                <p className="font-bold text-[#131b2e]">System Status: Optimal</p>
                <p className="text-[10px] text-[#505f76] font-medium">All API routes responding within 120ms.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
