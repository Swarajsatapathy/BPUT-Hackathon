"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { getPatientProfile } from "../../services/api";
import { CaseRecord } from "../../types";
import { SymptomIntakeWizard } from "./SymptomIntakeWizard";
import { CaseConfirmationSlip } from "./CaseConfirmationSlip";
import { StatusBadge } from "../common/StatusBadge";
import { 
  Plus, 
  Building2, 
  FileText, 
  Phone, 
  ChevronRight, 
  RefreshCw,
  Clock
} from "lucide-react";

export const PatientDashboard: React.FC = () => {
  const { currentPatient } = useAuth();
  const { t } = useLanguage();

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewState, setViewState] = useState<"LIST" | "NEW_CASE" | "CONFIRMATION">("LIST");
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);

  const fetchCases = async () => {
    if (!currentPatient) return;
    try {
      setLoading(true);
      const res = await getPatientProfile({ id: currentPatient._id });
      if (res.success) {
        setCases(res.cases || []);
      }
    } catch (err) {
      console.warn("Failed to load patient cases", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [currentPatient]);

  const handleCaseCreated = (newCase: CaseRecord) => {
    setSelectedCase(newCase);
    setViewState("CONFIRMATION");
    fetchCases();
  };

  if (!currentPatient) return null;

  return (
    <div className="space-y-5">
      
      {/* 1. Patient Profile Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-card">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">{currentPatient.fullName}</h2>
            <span className="bg-brand-50 text-brand-900 text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border border-brand-200">
              {currentPatient._id}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span><strong>{t("ageLabel")}:</strong> {currentPatient.age} Y</span>
            <span className="text-slate-300">•</span>
            <span><strong>{t("sexLabel")}:</strong> {currentPatient.sex}</span>
            <span className="text-slate-300">•</span>
            <span><strong>{t("bloodLabel")}:</strong> {currentPatient.bloodGroup || "Unknown"}</span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              +91 {currentPatient.phoneNumber}
            </span>
          </div>

          {currentPatient.emergencyContact?.name && (
            <div className="text-[11px] text-slate-500 pt-0.5">
              <span>{t("emergencyContactLabel")}: </span>
              <strong className="text-slate-700">{currentPatient.emergencyContact.name}</strong> ({currentPatient.emergencyContact.relation})
              {currentPatient.emergencyContact.phone && (
                <span className="text-slate-600 font-mono ml-1">+91 {currentPatient.emergencyContact.phone}</span>
              )}
            </div>
          )}
        </div>

        {/* Start New Triage Visit CTA */}
        {viewState === "LIST" && (
          <button
            onClick={() => setViewState("NEW_CASE")}
            className="btn-maya-primary text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 font-bold shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{t("startTriage")}</span>
          </button>
        )}
      </div>

      {/* 2. Dynamic View State Handler */}
      {viewState === "NEW_CASE" && (
        <SymptomIntakeWizard
          onCaseCreated={handleCaseCreated}
          onCancel={() => setViewState("LIST")}
        />
      )}

      {viewState === "CONFIRMATION" && selectedCase && (
        <CaseConfirmationSlip
          caseData={selectedCase}
          patient={currentPatient}
          onBackToDashboard={() => {
            setViewState("LIST");
            setSelectedCase(null);
          }}
        />
      )}

      {viewState === "LIST" && (
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-card">
          
          {/* Section Header */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t("visitHistoryTitle")}
              </h3>
            </div>
            <button
              onClick={fetchCases}
              className="text-xs text-slate-600 hover:text-brand-700 flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{t("refreshBtn")}</span>
            </button>
          </div>

          {/* Cases List */}
          <div className="divide-y divide-slate-100">
            {cases.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs">{t("noVisitsYet")}</p>
                <button
                  onClick={() => setViewState("NEW_CASE")}
                  className="btn-maya-primary px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t("startTriage")}</span>
                </button>
              </div>
            ) : (
              cases.map((c) => (
                <div
                  key={c._id}
                  onClick={() => {
                    setSelectedCase(c);
                    setViewState("CONFIRMATION");
                  }}
                  className="p-4 hover:bg-brand-50/30 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{c.tokenNumber}</span>
                      <span className="text-slate-400 font-mono text-[11px]">({c._id})</span>
                      <StatusBadge urgency={c.triageOutput.urgencyLevel} size="sm" />
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                        c.status === "COMPLETED" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                        c.status === "REFERRED" ? "bg-purple-50 text-purple-800 border-purple-200" :
                        "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {c.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-1 font-medium">
                      {c.translatedEnglishInput || c.rawSymptomInput}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {c.facilityType.replace(/_/g, " ")}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-xs font-bold text-brand-700 shrink-0">
                    <span>{t("reviewDetailsBtn")}</span>
                    <ChevronRight className="w-4 h-4 text-brand-500" />
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
};
