"use client";

import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { CheckCircle2, Clock, AlertCircle, AlertTriangle, Layers } from "lucide-react";

interface StatsOverviewProps {
  stats: {
    totalCases: number;
    emergencyRed: number;
    urgentYellow: number;
    routineGreen: number;
    completed: number;
    pendingReview: number;
    avgTriageTimeMinutes?: number;
  };
  activeTab?: string;
  onSelectTab?: (tabKey: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, activeTab = "ACTIVE_QUEUE", onSelectTab }) => {
  const { t } = useLanguage();

  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 shadow-xs">

      {/* 1. Total Registered Cases */}
      <div
        onClick={() => onSelectTab && onSelectTab("TOTAL_CASES")}
        className={`px-4 py-3.5 transition-all cursor-pointer ${
          activeTab === "TOTAL_CASES"
            ? "bg-slate-900 text-white"
            : "bg-white hover:bg-slate-50 text-slate-800"
        }`}
        title="View All Registered Cases"
      >
        <div className="flex items-center justify-between">
          <dt className={`text-[10px] font-bold uppercase tracking-wider block ${
            activeTab === "TOTAL_CASES" ? "text-slate-300" : "text-slate-500"
          }`}>
            {t("totalCases")}
          </dt>
          <Layers className={`w-3.5 h-3.5 ${activeTab === "TOTAL_CASES" ? "text-slate-300" : "text-slate-400"}`} />
        </div>
        <dd className={`mt-1 font-mono text-xl font-extrabold tabular-nums ${activeTab === "TOTAL_CASES" ? "text-white" : "text-slate-900"}`}>
          {stats.totalCases}
        </dd>
      </div>

      {/* 2. Active Waiting Queue */}
      <div
        onClick={() => onSelectTab && onSelectTab("ACTIVE_QUEUE")}
        className={`px-4 py-3.5 transition-all cursor-pointer ${
          activeTab === "ACTIVE_QUEUE" || activeTab === "ALL"
            ? "bg-teal-50 text-teal-950 ring-2 ring-inset ring-teal-600"
            : "bg-white hover:bg-slate-50 text-slate-800"
        }`}
        title="View All Active Waiting Patients"
      >
        <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t("activeQueue")}</dt>
        <dd className="mt-1 font-mono text-xl font-extrabold text-teal-900 tabular-nums">{stats.pendingReview ?? 0}</dd>
      </div>

      {/* 3. Emergency Red */}
      <div
        onClick={() => onSelectTab && onSelectTab("EMERGENCY_RED")}
        className={`px-4 py-3.5 transition-all cursor-pointer ${
          activeTab === "EMERGENCY_RED"
            ? "bg-red-100 text-red-950 ring-2 ring-inset ring-red-500"
            : "bg-white hover:bg-red-50/50 text-slate-800"
        }`}
        title="View Active Emergency Cases"
      >
        <dt className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">{t("tabEmergency")}</dt>
        <dd className="mt-1 font-mono text-xl font-extrabold text-red-600 tabular-nums">{stats.emergencyRed}</dd>
      </div>

      {/* 4. Urgent Yellow */}
      <div
        onClick={() => onSelectTab && onSelectTab("URGENT_YELLOW")}
        className={`px-4 py-3.5 transition-all cursor-pointer ${
          activeTab === "URGENT_YELLOW"
            ? "bg-amber-100 text-amber-950 ring-2 ring-inset ring-amber-500"
            : "bg-white hover:bg-amber-50/50 text-slate-800"
        }`}
        title="View Active Urgent Cases"
      >
        <dt className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">{t("tabUrgent")}</dt>
        <dd className="mt-1 font-mono text-xl font-extrabold text-amber-700 tabular-nums">{stats.urgentYellow}</dd>
      </div>

      {/* 5. Routine Green */}
      <div
        onClick={() => onSelectTab && onSelectTab("ROUTINE_GREEN")}
        className={`px-4 py-3.5 transition-all cursor-pointer ${
          activeTab === "ROUTINE_GREEN"
            ? "bg-emerald-100 text-emerald-950 ring-2 ring-inset ring-emerald-500"
            : "bg-white hover:bg-emerald-50/50 text-slate-800"
        }`}
        title="View Active Routine Cases"
      >
        <dt className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">{t("tabRoutine")}</dt>
        <dd className="mt-1 font-mono text-xl font-extrabold text-emerald-700 tabular-nums">{stats.routineGreen}</dd>
      </div>

      {/* 6. Avg Triage Turnaround */}
      <div className="bg-white px-4 py-3.5">
        <dt className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">{t("avgTurnaround")}</dt>
        <dd className="mt-1 font-mono text-xl font-extrabold text-slate-900 tabular-nums">{stats.avgTriageTimeMinutes || 2.4} min</dd>
      </div>

      {/* 7. Reviewed Cases */}
      <div
        onClick={() => onSelectTab && onSelectTab("REVIEWED_CASE")}
        className={`px-4 py-3.5 transition-all cursor-pointer ${
          activeTab === "REVIEWED_CASE"
            ? "bg-purple-100 text-purple-950 ring-2 ring-inset ring-purple-500"
            : "bg-white hover:bg-purple-50/50 text-slate-800"
        }`}
        title="View All Reviewed & Discharged/Referred Cases"
      >
        <div className="flex items-center justify-between">
          <dt className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">{t("reviewedCases")}</dt>
          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
        </div>
        <dd className="mt-1 font-mono text-xl font-extrabold text-purple-800 tabular-nums">{stats.completed}</dd>
      </div>

    </dl>
  );
};
