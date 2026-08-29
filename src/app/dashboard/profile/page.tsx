"use client";

import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { User } from "@/lib/types";
import { toast } from "sonner";
import { 
  User as UserIcon, Mail, Phone, Building2, Calendar, ShieldAlert,
  Edit2, Camera, Save, X, Loader2, Award, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: "",
    username: "",
    companyName: "",
    phoneNumber: "",
  });

  // Helper to construct profile image URL
  const getProfileImageUrl = (path: string | null | undefined) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://lms-backend-96fq.onrender.com/api";
    const apiRoot = baseUrl.endsWith("/api") ? baseUrl.slice(0, -4) : baseUrl;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${apiRoot}${cleanPath}`;
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const response = await api.get("/users/profile");
        const data = response.data;
        setProfile(data);
        updateUser(data);
        
        setEditForm({
          fullName: data.fullName || "",
          username: data.username || "",
          companyName: data.companyName || "",
          phoneNumber: data.phoneNumber || "",
        });
      } catch (err: any) {
        console.error("Error fetching profile details:", err);
        // Fallback to state user if offline or error
        if (authUser) {
          setProfile(authUser);
          setEditForm({
            fullName: authUser.fullName || "",
            username: authUser.username || "",
            companyName: authUser.companyName || "",
            phoneNumber: authUser.phoneNumber || "",
          });
        }
        toast.error("Could not fetch the latest profile details from the server.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [authUser?.profileImage]); // Reload if image changes

  const handleEditClick = () => {
    if (profile) {
      setEditForm({
        fullName: profile.fullName || "",
        username: profile.username || "",
        companyName: profile.companyName || "",
        phoneNumber: profile.phoneNumber || "",
      });
    }
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) {
      toast.error("Full Name cannot be empty");
      return;
    }
    if (!editForm.username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const response = await api.put("/users/profile", editForm);
      const updatedProfile = response.data;
      
      setProfile(updatedProfile);
      updateUser(updatedProfile);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update profile details.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleImageClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Basic file validation
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format. Please upload an image (PNG, JPG, JPEG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size is too large. Maximum size is 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    const toastId = toast.loading("Uploading profile image...");
    try {
      await api.post("/users/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Refetch profile to trigger state sync across application
      const response = await api.get("/users/profile");
      const updatedProfile = response.data;
      
      setProfile(updatedProfile);
      updateUser(updatedProfile);
      setImageError(false);
      toast.success("Profile image updated successfully!", { id: toastId });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to upload profile image.";
      toast.error(msg, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading && !profile) {
    return (
      <div className="h-[70vh] w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-[#004ac6] animate-spin" />
        <p className="text-sm font-semibold text-[#505f76]">Loading profile information...</p>
      </div>
    );
  }

  const activeProfile = profile || authUser;

  if (!activeProfile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4 text-red-800">
        <ShieldAlert className="h-6 w-6 text-red-600" />
        <div>
          <h3 className="font-bold">Access Error</h3>
          <p className="text-sm text-red-700">No profile data could be accessed. Please log in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner / Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#c3c6d7]/35 bg-gradient-to-r from-[#004ac6] via-[#2563eb] to-[#4f46e5] p-6 md:p-8 text-white shadow-md">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-white/10 rounded-full blur-2xl" />

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Avatar Container */}
          <div className="relative group cursor-pointer" onClick={handleImageClick}>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
            
            <div className="h-24 w-24 rounded-full border-4 border-white/20 bg-white/10 text-white flex items-center justify-center font-bold text-3xl uppercase shadow-lg overflow-hidden relative transition-all duration-300 group-hover:border-white/40">
              {!imageError && activeProfile.profileImage ? (
                <img
                  src={getProfileImageUrl(activeProfile.profileImage)}
                  alt={activeProfile.fullName}
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                activeProfile.fullName.substring(0, 2)
              )}
              
              {/* Camera Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {uploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
            
            {/* Camera Badge indicator */}
            <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-[#004ac6] border-2 border-white flex items-center justify-center text-white shadow shadow-black/20 group-hover:scale-110 transition-transform">
              <Camera className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* User Meta */}
          <div className="text-center md:text-left space-y-1.5 flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {activeProfile.fullName}
              </h2>
              <span className="inline-flex items-center gap-1 self-center md:self-auto px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md border border-white/10 uppercase">
                <ShieldCheck className="h-3 w-3" /> {activeProfile.role}
              </span>
            </div>
            <p className="text-white/80 text-sm font-medium">
              @{activeProfile.username}
            </p>
            <p className="text-white/70 text-xs flex items-center justify-center md:justify-start gap-1">
              <Calendar className="h-3.5 w-3.5" /> Member since {formatDate(activeProfile.createdAt || activeProfile.createdDate)}
            </p>
          </div>

          {/* Action buttons */}
          {!isEditing && (
            <Button
              onClick={handleEditClick}
              className="bg-white hover:bg-white/95 text-[#004ac6] font-bold shadow-sm shadow-[#000000]/10 flex items-center gap-2 cursor-pointer h-10 px-5 rounded-xl border border-transparent self-center md:self-end"
            >
              <Edit2 className="h-4 w-4" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Details Grid */}
      <div className="bg-white border border-[#c3c6d7]/35 rounded-2xl p-6 md:p-8 shadow-sm">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#c3c6d7]/20 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#131b2e]">Modify Profile Details</h3>
                <p className="text-xs text-[#505f76]">Keep your LMS profile information accurate and up to date.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelClick}
                  className="text-[#505f76] hover:bg-[#eaedff]/60 border border-[#c3c6d7]/30 h-9 px-3 rounded-lg flex items-center gap-1.5"
                >
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#004ac6] hover:bg-[#004ac6]/90 text-white font-bold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#131b2e]">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute top-3 left-3 h-4.5 w-4.5 text-[#505f76]" />
                  <Input
                    name="fullName"
                    value={editForm.fullName}
                    onChange={handleInputChange}
                    className="pl-10 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] focus:border-[#004ac6]/50"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#131b2e]">Username</label>
                <div className="relative">
                  <span className="absolute top-2.5 left-3 text-sm text-[#505f76] font-semibold">@</span>
                  <Input
                    name="username"
                    value={editForm.username}
                    onChange={handleInputChange}
                    className="pl-8 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] focus:border-[#004ac6]/50"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#131b2e]">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute top-3 left-3 h-4.5 w-4.5 text-[#505f76]" />
                  <Input
                    name="phoneNumber"
                    value={editForm.phoneNumber}
                    onChange={handleInputChange}
                    className="pl-10 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] focus:border-[#004ac6]/50"
                    placeholder="e.g. +1234567890"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#131b2e]">Company / Organization</label>
                <div className="relative">
                  <Building2 className="absolute top-3 left-3 h-4.5 w-4.5 text-[#505f76]" />
                  <Input
                    name="companyName"
                    value={editForm.companyName}
                    onChange={handleInputChange}
                    className="pl-10 bg-[#faf8ff] border-[#c3c6d7]/70 text-[#131b2e] focus:border-[#004ac6]/50"
                    placeholder="Enter company name"
                  />
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="border-b border-[#c3c6d7]/20 pb-4">
              <h3 className="text-lg font-bold text-[#131b2e]">Profile Details</h3>
              <p className="text-xs text-[#505f76]">These are your personal and administrative details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 pb-3.5 border-b border-[#c3c6d7]/15">
                  <div className="p-2 rounded-lg bg-[#eaedff] text-[#004ac6]">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#505f76] font-bold uppercase tracking-wider">Full Name</p>
                    <p className="text-sm font-semibold text-[#131b2e] mt-0.5">{activeProfile.fullName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pb-3.5 border-b border-[#c3c6d7]/15">
                  <div className="p-2 rounded-lg bg-[#eaedff] text-[#004ac6]">
                    <span className="text-sm font-bold w-5 h-5 flex items-center justify-center leading-none">@</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#505f76] font-bold uppercase tracking-wider">Username</p>
                    <p className="text-sm font-semibold text-[#131b2e] mt-0.5">@{activeProfile.username}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pb-3.5 md:border-b-0 border-b border-[#c3c6d7]/15">
                  <div className="p-2 rounded-lg bg-[#eaedff] text-[#004ac6]">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#505f76] font-bold uppercase tracking-wider">Email Address</p>
                    <p className="text-sm font-semibold text-[#131b2e] mt-0.5 truncate max-w-[250px]">{activeProfile.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5 pb-3.5 border-b border-[#c3c6d7]/15">
                  <div className="p-2 rounded-lg bg-[#eaedff] text-[#004ac6]">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#505f76] font-bold uppercase tracking-wider">Phone Number</p>
                    <p className="text-sm font-semibold text-[#131b2e] mt-0.5">{activeProfile.phoneNumber || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pb-3.5 border-b border-[#c3c6d7]/15">
                  <div className="p-2 rounded-lg bg-[#eaedff] text-[#004ac6]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#505f76] font-bold uppercase tracking-wider">Company / Organization</p>
                    <p className="text-sm font-semibold text-[#131b2e] mt-0.5">{activeProfile.companyName || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pb-3.5 border-b-0">
                  <div className="p-2 rounded-lg bg-[#eaedff] text-[#004ac6]">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#505f76] font-bold uppercase tracking-wider">System Role</p>
                    <p className="text-sm font-semibold text-[#131b2e] mt-0.5 capitalize">{activeProfile.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
