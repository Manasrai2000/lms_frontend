export type Role = "admin" | "teacher" | "student" | "customer";

export interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  companyName?: string; // from Postman API body fields
  schoolName?: string;
  classId?: number | string;
  className?: string;
  role: Role;
  status: "active" | "inactive";
  createdDate?: string;
  createdAt?: string;
  lastLoginDate?: string;
  avatarUrl?: string;
  profileImage?: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ModulePermissions {
  dashboard: boolean;
  userManagement: boolean;
  bookManagement: boolean;
  questionBank: boolean;
  qrCodeManagement: boolean;
  reports: boolean;
  settings: boolean;
}

export interface UserPermission {
  userId: number;
  bookIds: number[];
  modules: ModulePermissions;
}

export interface QuestionType {
  id: string;
  name: string;
  defaultMarks: number;
  description: string;
  status: "active" | "inactive";
}

export type QuestionCategory =
  | "MCQ"
  | "True/False"
  | "Fill in the Blanks"
  | "Match the Following"
  | "Short Answer"
  | "Long Answer"
  | "Essay"
  | "Case Study"
  | "Practical"
  | "Project Work";

export interface Question {
  id: number;
  text: string;
  type: QuestionCategory;
  options?: string[]; // for MCQs
  answer: string;
  marks: number;
  bookId: number;
  chapterId: number;
  subject: string;
  class: string;
}

export interface Book {
  id: number;
  title: string;
  subject: string;
  class: string;
  coverImage?: string;
  chaptersCount?: number;
}

export interface Chapter {
  id: number;
  bookId: number;
  title: string;
  orderNumber: number;
}

export interface BookMaterial {
  id: number;
  chapterId: number;
  type: "worksheet" | "video" | "teacher_manual" | "lesson_planner" | "flipbook" | "current_affairs";
  title: string;
  fileUrl?: string;
  youtubeUrl?: string;
}

export interface QRCodeRecord {
  id: string;
  targetType: "book" | "chapter" | "worksheet" | "video" | "teacher_manual" | "flipbook";
  targetId: number;
  codeUrl: string; // url to image/svg
  createdDate: string;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  content?: string;
  isPremium?: boolean;
  timestamp?: string;
}

export interface DeviceSession {
  id: string;
  deviceName: string;
  ipAddress: string;
  lastActive: string;
}
