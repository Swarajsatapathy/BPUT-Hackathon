"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { fetchDashboardStats, fetchLiveTriageQueue, triggerReSeedData } from "../../services/api";
import { CaseRecord, FacilityType } from "../../types";
import { StatsOverview } from "./StatsOverview";
import { CaseReviewDrawer } from "./CaseReviewDrawer";
import { ReferralSlipModal } from "./ReferralSlipModal";
import { StatusBadge } from "../common/StatusBadge";
import {
  Building2,
  RefreshCw,
  Search,
  Stethoscope,
  ChevronRight,
  RotateCcw,
  Download,
  FileSpreadsheet,
  FileText
} from "lucide-react";

export const StaffDashboard: React.FC = () => {
  const { currentStaff, selectedFacility, setSelectedFacility } = useAuth();
  const { t } = useLanguage();

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    emergencyRed: 0,
    urgentYellow: 0,
    routineGreen: 0,
    completed: 0,
    pendingReview: 0,
    avgTriageTimeMinutes: 2.4,
  });

  const [selectedUrgency, setSelectedUrgency] = useState<string>("ACTIVE_QUEUE");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Review Drawer state
  const [activeCase, setActiveCase] = useState<CaseRecord | null>(null);
  const [patientPastHistory, setPatientPastHistory] = useState<CaseRecord[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Referral Modal state
  const [referralCase, setReferralCase] = useState<CaseRecord | null>(null);
  const [isReferralOpen, setIsReferralOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const isTotalCasesTab = selectedUrgency === "TOTAL_CASES";
      const isReviewedTab = selectedUrgency === "REVIEWED_CASE";
      const isAllActiveTab = selectedUrgency === "ACTIVE_QUEUE" || selectedUrgency === "ALL";

      let urgencyParam: string | undefined = undefined;
      let statusParam: string | undefined = undefined;

      if (isTotalCasesTab) {
        urgencyParam = undefined;
        statusParam = undefined; // fetch all registered cases
      } else if (isReviewedTab) {
        urgencyParam = undefined;
        statusParam = "REVIEWED_CASE"; // only completed & referred
      } else if (isAllActiveTab) {
        urgencyParam = undefined;
        statusParam = "ACTIVE_UNREVIEWED"; // only active waiting cases
      } else {
        urgencyParam = selectedUrgency;
        statusParam = "ACTIVE_UNREVIEWED";
      }

      const [queueRes, statsRes] = await Promise.all([
        fetchLiveTriageQueue({
          facilityType: selectedFacility !== "ALL" as any ? selectedFacility : undefined,
          urgency: urgencyParam,
          status: statusParam,
        }),
        fetchDashboardStats(selectedFacility !== "ALL" as any ? selectedFacility : undefined),
      ]);

      if (queueRes.success) setCases(queueRes.cases || []);
      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
    } catch (err) {
      console.warn("Failed to load staff queue data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);

    const handleNewCase = () => {
      loadData();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "triage_case_created_trigger" || e.key === "triage_last_reviewed_case") {
        loadData();
      }
    };

    window.addEventListener("triage_case_created", handleNewCase);
    window.addEventListener("case_reviewed", handleNewCase);
    window.addEventListener("focus", handleNewCase);
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleNewCase);

    return () => {
      clearInterval(interval);
      window.removeEventListener("triage_case_created", handleNewCase);
      window.removeEventListener("case_reviewed", handleNewCase);
      window.removeEventListener("focus", handleNewCase);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleNewCase);
    };
  }, [selectedFacility, selectedUrgency, selectedStatus]);

  const handleOpenCase = (c: CaseRecord) => {
    setActiveCase(c);
    const history = cases.filter((item) => item.patientId === c.patientId && item._id !== c._id);
    setPatientPastHistory(history);
    setIsReviewOpen(true);
  };

  const handleCaseUpdated = (updated: CaseRecord) => {
    setCases((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    loadData();
  };

  const handleSeedData = async () => {
    try {
      setLoading(true);
      await triggerReSeedData();
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c._id.toLowerCase().includes(q) ||
      c.tokenNumber.toLowerCase().includes(q) ||
      (c.patient?.fullName && c.patient.fullName.toLowerCase().includes(q)) ||
      (c.translatedEnglishInput && c.translatedEnglishInput.toLowerCase().includes(q))
    );
  });

  const exportQueueToCSV = () => {
    if (filteredCases.length === 0) {
      alert("No patient records in the current queue to export.");
      return;
    }

    const headers = [
      "Token Number",
      "Case ID",
      "Patient UHID",
      "Patient Name",
      "Age",
      "Sex",
      "Urgency Level",
      "Severity Score (1-10)",
      "Status",
      "Facility Type",
      "BP (mmHg)",
      "Pulse (bpm)",
      "SpO2 (%)",
      "Temp (F)",
      "Blood Sugar (mg/dL)",
      "Symptoms Summary",
      "Intake Timestamp"
    ];

    const rows = filteredCases.map((c) => [
      `"${c.tokenNumber}"`,
      `"${c._id}"`,
      `"${c.patientId}"`,
      `"${c.patient?.fullName || 'Citizen'}"`,
      c.patient?.age || "",
      `"${c.patient?.sex || ''}"`,
      `"${c.triageOutput.urgencyLevel}"`,
      c.triageOutput.urgencyScore,
      `"${c.status}"`,
      `"${c.facilityType}"`,
      `"${c.vitals?.bpSystolic ? `${c.vitals.bpSystolic}/${c.vitals.bpDiastolic || ''}` : ''}"`,
      c.vitals?.pulseRate || "",
      c.vitals?.spo2 || "",
      c.vitals?.temperature || "",
      c.vitals?.bloodSugar || "",
      `"${(c.translatedEnglishInput || c.rawSymptomInput).replace(/"/g, '""')}"`,
      `"${new Date(c.createdAt).toLocaleString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `National_Clinical_Triage_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">

      {/* Clinician Desk Header & Facility Switcher */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-card">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-extrabold text-slate-900">
              {currentStaff?.name || t("dutyConsole")}
            </h2>
            <span className="bg-brand-50 text-brand-900 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-brand-200">
              {currentStaff?.role === "Medical Officer" ? t("medicalOfficer") : (currentStaff?.role || t("medicalOfficer"))}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("activeQueueSubtitle")}
          </p>
        </div>

        {/* Facility Selector & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value as FacilityType)}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer font-semibold shadow-2xs"
          >
            <option value="ALL">{t("allFacilities")}</option>
            <option value="PRIMARY_HEALTH_CENTER">{t("facility_PRIMARY_HEALTH_CENTER")}</option>
            <option value="PUBLIC_HEALTH_CAMP">{t("facility_PUBLIC_HEALTH_CAMP")}</option>
            <option value="CAMPUS_HEALTH_CENTER">{t("facility_CAMPUS_HEALTH_CENTER")}</option>
            <option value="INDUSTRIAL_HEALTH_UNIT">{t("facility_INDUSTRIAL_HEALTH_UNIT")}</option>
            <option value="DISTRICT_HOSPITAL">{t("facility_DISTRICT_HOSPITAL")}</option>
          </select>

          {/* Export Triage Log (CSV) */}
          <button
            onClick={exportQueueToCSV}
            title="Export Triage Queue Log to CSV"
            className="bg-brand-50 hover:bg-brand-100 text-brand-950 border border-brand-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-brand-700" />
            <span>{t("exportCsvBtn")}</span>
          </button>

          <button
            onClick={handleSeedData}
            title="Reset test queue cases"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{t("resetDemoCases")}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview with Interactive Filters */}
      <StatsOverview
        stats={stats}
        activeTab={selectedUrgency}
        onSelectTab={(tabKey) => setSelectedUrgency(tabKey)}
      />

      {/* Triage Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-card">

        {/* Controls and Filter Bar */}
        <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">

          {/* Urgency & Reviewed Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-600 font-bold mr-1">{t("queueFilterLabel")}</span>
            {[
              { key: "TOTAL_CASES", label: t("totalCases"), count: stats.totalCases, isTotal: true },
              { key: "ACTIVE_QUEUE", label: t("activeQueue"), count: stats.pendingReview },
              { key: "EMERGENCY_RED", label: t("tabEmergency"), count: stats.emergencyRed },
              { key: "URGENT_YELLOW", label: t("tabUrgent"), count: stats.urgentYellow },
              { key: "ROUTINE_GREEN", label: t("tabRoutine"), count: stats.routineGreen },
              { key: "REVIEWED_CASE", label: t("reviewedCases"), count: stats.completed, isReviewed: true },
            ].map((urg) => {
              const isSelected = selectedUrgency === urg.key || (urg.key === "ACTIVE_QUEUE" && selectedUrgency === "ALL");
              return (
                <button
                  key={urg.key}
                  onClick={() => setSelectedUrgency(urg.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 ${isSelected
                      ? urg.isTotal
                        ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-400"
                        : urg.isReviewed
                          ? "bg-purple-700 text-white shadow-sm ring-2 ring-purple-300"
                          : "bg-[#5cb4ee] text-slate-950 border border-[#3b93ce] shadow-sm"
                      : urg.isTotal
                        ? "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200"
                        : urg.isReviewed
                          ? "bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  <span>{urg.label}</span>
                  {typeof urg.count === "number" && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${isSelected
                        ? "bg-black/20 text-current"
                        : "bg-slate-200 text-slate-800"
                      }`}>
                      {urg.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            className="text-xs text-slate-600 hover:text-brand-700 flex items-center gap-1.5 font-bold shrink-0 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{t("refreshBtn")}</span>
          </button>
        </div>

        {/* Priority Triage Queue List */}
        <div className="divide-y divide-slate-200">
          {filteredCases.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-1">
              <p className="font-bold text-xs text-slate-700">
                {selectedUrgency === "TOTAL_CASES"
                  ? t("noCasesTotal")
                  : selectedUrgency === "REVIEWED_CASE"
                    ? t("noCasesReviewed")
                    : t("noCasesActive")}
              </p>
              <p className="text-[11px] text-slate-400">
                {selectedUrgency === "TOTAL_CASES"
                  ? "Register new triage visits or click Reset Demo Cases to reload sample records."
                  : selectedUrgency === "REVIEWED_CASE"
                    ? "Once a doctor signs off or refers a patient, they will appear here."
                    : "All cases in this category have been attended to."}
              </p>
            </div>
          ) : (
            filteredCases.map((c) => {
              const isEmergency = c.triageOutput.urgencyLevel === "EMERGENCY_RED";
              const isUrgent = c.triageOutput.urgencyLevel === "URGENT_YELLOW";
              const isReviewed = c.status === "COMPLETED" || c.status === "REFERRED";

              return (
                <div
                  key={c._id}
                  onClick={() => handleOpenCase(c)}
                  className={`p-4 cursor-pointer transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 ${isReviewed
                      ? c.status === "REFERRED"
                        ? "bg-purple-50/40 hover:bg-purple-50/80 border-l-4 border-purple-600"
                        : "bg-emerald-50/30 hover:bg-emerald-50/70 border-l-4 border-emerald-500"
                      : isEmergency
                        ? "bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-rose-600"
                        : isUrgent
                          ? "bg-amber-50/30 hover:bg-amber-50/60 border-l-4 border-amber-500"
                          : "hover:bg-brand-50/30 border-l-4 border-[#5cb4ee]"
                    }`}
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{c.tokenNumber}</span>
                      <span className="text-slate-400 font-mono text-[11px]">({c._id})</span>
                      <StatusBadge urgency={c.triageOutput.urgencyLevel} size="sm" />
                      <span className="text-xs font-bold text-slate-800">
                        {c.patient?.fullName || "Citizen"} ({c.patient?.age}Y/{c.patient?.sex})
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${c.status === "COMPLETED" ? "bg-emerald-100 text-emerald-900 border-emerald-300" :
                          c.status === "REFERRED" ? "bg-purple-100 text-purple-900 border-purple-300" :
                            "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                        {t(`status_${c.status}`) || c.status.replace(/_/g, " ")}
                      </span>
                      {c.doctorReview?.doctorName && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                          MO: {c.doctorReview.doctorName}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-2 font-medium">
                      {c.translatedEnglishInput || c.rawSymptomInput}
                    </p>

                    {/* If reviewed and has doctor impression / referral */}
                    {c.doctorReview?.clinicalImpression && (
                      <p className="text-[11px] text-slate-900 font-semibold bg-white/80 p-1.5 rounded border border-slate-200/80 line-clamp-1">
                        <span className="text-slate-500 font-medium">{t("drAssessmentLabel")} </span>
                        {c.doctorReview.clinicalImpression}
                      </p>
                    )}

                    {c.doctorReview?.referralDetails?.referralFacilityName && (
                      <p className="text-[11px] text-purple-900 font-bold">
                        {t("referredToLabel")} {c.doctorReview.referralDetails.referralFacilityName} ({c.doctorReview.referralDetails.urgencyOfTransfer || "Priority"})
                      </p>
                    )}

                    {/* Vitals Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                      {c.vitals?.bpSystolic && (
                        <span className={`px-2 py-0.5 rounded-md font-mono ${c.vitals.bpSystolic >= 180 ? "bg-rose-100 text-rose-900 font-bold border border-rose-200" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                          BP: {c.vitals.bpSystolic}/{c.vitals?.bpDiastolic || ""}
                        </span>
                      )}
                      {c.vitals?.spo2 && (
                        <span className={`px-2 py-0.5 rounded-md font-mono ${c.vitals.spo2 < 92 ? "bg-rose-100 text-rose-900 font-bold border border-rose-200" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                          SpO2: {c.vitals.spo2}%
                        </span>
                      )}
                      {c.vitals?.pulseRate && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono border border-slate-200">
                          Pulse: {c.vitals.pulseRate}
                        </span>
                      )}
                      {c.vitals?.temperature && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono border border-slate-200">
                          {c.vitals.temperature}°F
                        </span>
                      )}
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">{t(`facility_${c.facilityType}`) || c.facilityType.replace(/_/g, " ")}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {c.status === "REFERRED" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReferralCase(c);
                          setIsReferralOpen(true);
                        }}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 font-bold cursor-pointer transition-colors"
                        title="View Official ABDM Referral Slip"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-700" />
                        <span>Referral Slip</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-maya-primary text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 font-bold cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-slate-950" />
                      <span>{isReviewed ? "Inspect Case" : t("reviewCaseBtn")}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-950" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Case Review Drawer */}
      <CaseReviewDrawer
        isOpen={isReviewOpen}
        caseData={activeCase}
        patientHistory={patientPastHistory}
        currentStaff={currentStaff}
        onClose={() => {
          setIsReviewOpen(false);
          setActiveCase(null);
        }}
        onCaseUpdated={handleCaseUpdated}
        onOpenReferralModal={(c) => {
          setReferralCase(c);
          setIsReferralOpen(true);
        }}
      />

      {/* Referral Slip Export Modal */}
      {referralCase && (
        <ReferralSlipModal
          isOpen={isReferralOpen}
          caseData={referralCase}
          patient={referralCase.patient as any}
          staff={currentStaff}
          onClose={() => {
            setIsReferralOpen(false);
            setReferralCase(null);
          }}
        />
      )}

    </div>
  );
};
