"use client";

import React from "react";
import AcademicMasterManager from "@/components/academic/AcademicMasterManager";
import { GraduationCap } from "lucide-react";

export default function ClassesPage() {
  return (
    <AcademicMasterManager
      resourceType="classes"
      title="Class Management"
      singularTitle="Class"
      description="Configure and manage academic classes, assign relevant textbooks, and maintain grade levels across the system."
      icon={GraduationCap}
      codePrefix="CLS"
      codePlaceholder="CLS-10"
    />
  );
}
