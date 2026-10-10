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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2.5">

      {/* 1. Total Registered Cases (Active Queue + Reviewed Cases) - BEFORE Active Queue */}
      <div
        onClick={() => onSelectTab && onSelectTab("TOTAL_CASES")}
        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${activeTab === "TOTAL_CASES"
            ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400"
            : "bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50/80"
          }`}
        title="View All Registered Cases (Active Queue + Reviewed Cases)"
      >
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${activeTab === "TOTAL_CASES" ? "text-slate-300" : "text-slate-500"
            }`}>
            {t("totalCases")}
          </span>
          <Layers className={`w-3.5 h-3.5 ${activeTab === "TOTAL_CASES" ? "text-slate-300" : "text-slate-400"}`} />
        </div>
        <span className={`text-xl font-extrabold ${activeTab === "TOTAL_CASES" ? "text-white" : "text-slate-900"}`}>
          {stats.totalCases}
        </span>
      </div>

      {/* 2. Active Waiting Queue */}
      <div
        onClick={() => onSelectTab && onSelectTab("ACTIVE_QUEUE")}
        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${activeTab === "ACTIVE_QUEUE" || activeTab === "ALL"
            ? "bg-brand-50 border-brand-400 ring-2 ring-brand-300"
            : "bg-white border-slate-200 hover:border-brand-300 hover:bg-slate-50/70"
          }`}
        title="View All Active Waiting Patients"
      >
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t("activeQueue")}</span>
        <span className="text-xl font-extrabold text-slate-900">{stats.pendingReview ?? 0}</span>
      </div>

      {/* 3. Emergency Red */}
      <div
        onClick={() => onSelectTab && onSelectTab("EMERGENCY_RED")}
        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${activeTab === "EMERGENCY_RED"
            ? "bg-rose-100 border-rose-400 ring-2 ring-rose-300"
            : "bg-rose-50/80 border-rose-200 hover:bg-rose-100/70"
          }`}
        title="View Active Emergency Cases"
      >
        <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">{t("tabEmergency")}</span>
        <span className="text-xl font-extrabold text-rose-800">{stats.emergencyRed}</span>
      </div>

      {/* 4. Urgent Yellow */}
      <div
        onClick={() => onSelectTab && onSelectTab("URGENT_YELLOW")}
        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${activeTab === "URGENT_YELLOW"
            ? "bg-amber-100 border-amber-400 ring-2 ring-amber-300"
            : "bg-amber-50/80 border-amber-200 hover:bg-amber-100/70"
          }`}
        title="View Active Urgent Cases"
      >
        <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">{t("tabUrgent")}</span>
        <span className="text-xl font-extrabold text-amber-900">{stats.urgentYellow}</span>
      </div>

      {/* 5. Routine Green */}
      <div
        onClick={() => onSelectTab && onSelectTab("ROUTINE_GREEN")}
        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${activeTab === "ROUTINE_GREEN"
            ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300"
            : "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70"
          }`}
        title="View Active Routine Cases"
      >
        <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">{t("tabRoutine")}</span>
        <span className="text-xl font-extrabold text-emerald-900">{stats.routineGreen}</span>
      </div>

      {/* 6. Avg Triage Turnaround */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">{t("avgTurnaround")}</span>
        <span className="text-xl font-extrabold text-slate-900">{stats.avgTriageTimeMinutes || 2.4} min</span>
      </div>

      {/* 7. Reviewed Cases (Completed & Referred) - Next to Avg Turnaround */}
      <div
        onClick={() => onSelectTab && onSelectTab("REVIEWED_CASE")}
        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${activeTab === "REVIEWED_CASE"
            ? "bg-purple-100 border-purple-400 ring-2 ring-purple-300"
            : "bg-purple-50/80 border-purple-200 hover:bg-purple-100/70"
          }`}
        title="View All Reviewed & Discharged/Referred Cases"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">{t("reviewedCases")}</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
        </div>
        <span className="text-xl font-extrabold text-purple-900">{stats.completed}</span>
      </div>

    </div>
  );
};
