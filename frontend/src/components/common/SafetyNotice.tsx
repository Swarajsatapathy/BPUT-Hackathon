"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";

export const SafetyNotice: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-teal-600/30 bg-teal-50/80 px-4 py-3 text-sm text-teal-950 shadow-2xs"
    >
      <ShieldAlert className="mt-0.5 w-4 h-4 shrink-0 text-teal-700" aria-hidden="true" />
      <p className="leading-relaxed">
        <span className="font-semibold text-teal-900">Decision support only.</span>{" "}
        {compact
          ? "This assistant organizes information and flags urgency signals. It does not diagnose or prescribe."
          : "This assistant organizes patient information and highlights urgency signals for a qualified health worker, nurse, doctor or medical officer. It does not diagnose, prescribe treatment, or replace clinical judgement. In an emergency, call 108."}
      </p>
    </div>
  );
};
