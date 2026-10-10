"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { UrgencyLevel } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

interface StatusBadgeProps {
  urgency: UrgencyLevel;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  urgency, 
  size = "md", 
  showIcon = true 
}) => {
  const { t } = useLanguage();
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] font-medium",
    md: "px-2.5 py-0.5 text-xs font-semibold",
    lg: "px-3 py-1 text-xs font-bold uppercase tracking-wider",
  };

  if (urgency === "EMERGENCY_RED") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs ${sizeClasses[size]}`}>
        {showIcon && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
        <span>{t("urgencyLevel1")}</span>
      </span>
    );
  }

  if (urgency === "URGENT_YELLOW") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs ${sizeClasses[size]}`}>
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
        <span>{t("urgencyLevel2")}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs ${sizeClasses[size]}`}>
      {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
      <span>{t("urgencyLevel3")}</span>
    </span>
  );
};
