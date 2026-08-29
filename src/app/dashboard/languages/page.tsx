"use client";

import React from "react";
import AcademicMasterManager from "@/components/academic/AcademicMasterManager";
import { Globe } from "lucide-react";

export default function LanguagesPage() {
  return (
    <AcademicMasterManager
      resourceType="languages"
      title="Language Management"
      singularTitle="Language"
      description="Manage medium of instruction languages, map language-specific books, and set up multi-lingual learning resources."
      icon={Globe}
      codePrefix="LANG"
      codePlaceholder="LANG-EN"
    />
  );
}
