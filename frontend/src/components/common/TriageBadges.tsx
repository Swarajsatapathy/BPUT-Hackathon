"use client";

import React from "react";
import { AlertTriangle, Camera, CircleAlert, CircleCheck, FileText, Keyboard, Mic, UserRound } from "lucide-react";
import { UrgencyLevel } from "../../types";

export type RiskLevel = "urgent" | "priority" | "routine" | "RED_EMERGENCY" | "YELLOW_URGENT" | "GREEN_ROUTINE";
export type SourceKind = "voice" | "text" | "ocr" | "image" | "worker";

function normalizeRisk(level: RiskLevel): "urgent" | "priority" | "routine" {
  if (level === "RED_EMERGENCY" || level === "urgent") return "urgent";
  if (level === "YELLOW_URGENT" || level === "priority") return "priority";
  return "routine";
}

const riskMeta = {
  urgent: { label: "Urgent (Red)", short: "Urgent" },
  priority: { label: "Priority (Yellow)", short: "Priority" },
  routine: { label: "Routine (Green)", short: "Routine" },
};

const riskStyles = {
  urgent: "bg-red-50 text-red-700 border-red-200/80",
  priority: "bg-amber-50 text-amber-800 border-amber-200/80",
  routine: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
};

export const RiskBadge: React.FC<{ level: RiskLevel; size?: "sm" | "md" }> = ({ level, size = "sm" }) => {
  const norm = normalizeRisk(level);
  const Icon = norm === "urgent" ? AlertTriangle : norm === "priority" ? CircleAlert : CircleCheck;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      } ${riskStyles[norm]}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} aria-hidden="true" />
      {size === "sm" ? riskMeta[norm].short : riskMeta[norm].label}
    </span>
  );
};

export const RiskDot: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const norm = normalizeRisk(level);
  return (
    <span
      aria-hidden="true"
      className={`inline-block w-2 h-2 shrink-0 rounded-full ${
        norm === "urgent" ? "bg-red-500" : norm === "priority" ? "bg-amber-500" : "bg-emerald-500"
      }`}
    />
  );
};

const sourceIcons: Record<SourceKind, typeof Mic> = {
  voice: Mic,
  text: Keyboard,
  ocr: FileText,
  image: Camera,
  worker: UserRound,
};

const sourceLabels: Record<SourceKind, string> = {
  voice: "Voice",
  text: "Typed",
  ocr: "Report OCR",
  image: "Photo",
  worker: "Health worker",
};

export const SourceIcon: React.FC<{ kind: SourceKind; className?: string }> = ({ kind, className }) => {
  const Icon = sourceIcons[kind] || UserRound;
  return <Icon className={className || "w-3.5 h-3.5"} aria-hidden="true" />;
};

export const SourceTag: React.FC<{ kind: SourceKind }> = ({ kind }) => {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
      <SourceIcon kind={kind} className="w-3 h-3 text-slate-500" />
      {sourceLabels[kind] || kind}
    </span>
  );
};
