"use client";

import React from "react";
import AcademicMasterManager from "@/components/academic/AcademicMasterManager";
import { BookOpen } from "lucide-react";

export default function SubjectsPage() {
  return (
    <AcademicMasterManager
      resourceType="subjects"
      title="Subject Management"
      singularTitle="Subject"
      description="Manage academic subjects, assign curriculum course books, and organize study disciplines."
      icon={BookOpen}
      codePrefix="SUB"
      codePlaceholder="SUB-MATH"
    />
  );
}
