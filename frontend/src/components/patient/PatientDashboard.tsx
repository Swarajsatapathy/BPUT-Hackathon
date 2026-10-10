"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { getPatientProfile } from "../../services/api";
import { CaseRecord } from "../../types";
import { SymptomIntakeWizard } from "./SymptomIntakeWizard";
import { CaseConfirmationSlip } from "./CaseConfirmationSlip";
import { PrescriptionDocumentModal } from "./PrescriptionDocumentModal";
import { ReferralSlipModal } from "../healthcare/ReferralSlipModal";
import { StatusBadge } from "../common/StatusBadge";
import { 
  Plus, 
  Building2, 
  FileText, 
  Phone, 
  ChevronRight, 
  RefreshCw,
  Clock,
  Stethoscope,
  Pill,
  Ambulance,
  Printer,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export const PatientDashboard: React.FC = () => {
  const { currentPatient } = useAuth();
  const { t } = useLanguage();

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewState, setViewState] = useState<"LIST" | "NEW_CASE" | "CONFIRMATION">("LIST");
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);

  // Modal states for full document previews
  const [selectedPrescriptionCase, setSelectedPrescriptionCase] = useState<CaseRecord | null>(null);
  const [selectedReferralCase, setSelectedReferralCase] = useState<CaseRecord | null>(null);

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

    const handleDataUpdate = () => {
      fetchCases();
    };

    window.addEventListener("triage_case_created", handleDataUpdate);
    window.addEventListener("case_reviewed", handleDataUpdate);
    window.addEventListener("focus", handleDataUpdate);

    return () => {
      window.removeEventListener("triage_case_created", handleDataUpdate);
      window.removeEventListener("case_reviewed", handleDataUpdate);
      window.removeEventListener("focus", handleDataUpdate);
    };
  }, [currentPatient]);

  const handleCaseCreated = (newCase: CaseRecord) => {
    setSelectedCase(newCase);
    setViewState("CONFIRMATION");
    fetchCases();
  };

  if (!currentPatient) return null;

  // Filter reviewed cases (cases that have clinical notes or referrals)
  const reviewedCases = cases.filter(
    (c) => Boolean(c.doctorReview?.clinicalImpression || c.status === "COMPLETED" || c.status === "REFERRED")
  );

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
        <div className="space-y-5">
          
          {/* ========================================================================= */}
          {/* DEDICATED SECTION: DOCTOR'S PRESCRIPTIONS & PHYSICIAN NOTES               */}
          {/* ========================================================================= */}
          {reviewedCases.length > 0 && (
            <div className="bg-white rounded-xl border border-blue-200/90 overflow-hidden shadow-card">
              <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      {t("patientPrescriptionsSection")}
                    </h3>
                    <p className="text-[11px] text-blue-900 font-medium">
                      Physician notes, prescribed medicines, and hospital referral slips from your doctors
                    </p>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-300">
                  {reviewedCases.length} {reviewedCases.length === 1 ? "Record" : "Records"}
                </span>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {reviewedCases.map((c) => {
                  const isReferred = c.status === "REFERRED" || Boolean(c.doctorReview?.referralDetails?.isReferred);
                  return (
                    <div 
                      key={c._id}
                      className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs transition-all"
                    >
                      <div className="space-y-2">
                        {/* Header Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">{c.tokenNumber}</span>
                            <StatusBadge urgency={c.doctorReview?.overrideUrgency || c.triageOutput.urgencyLevel} size="sm" />
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {new Date(c.doctorReview?.signedAt || c.updatedAt || c.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Doctor Identification */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-900">
                            {c.doctorReview?.doctorName || "Dr. Alok Nayak (MO)"}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 text-[11px]">{c.doctorReview?.doctorRole || "Medical Officer"}</span>
                        </div>

                        {/* Clinical Impression Note */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                            {t("doctorImpression")}:
                          </span>
                          <p className="text-slate-800 line-clamp-2 font-medium">
                            {c.doctorReview?.clinicalImpression || "Examination complete. Vitals monitored and clinical advice given."}
                          </p>
                        </div>

                        {/* Referral Alert Tag if Referred */}
                        {isReferred && (
                          <div className="bg-purple-100/80 border border-purple-300 rounded-lg p-2.5 text-xs flex items-start gap-2">
                            <Ambulance className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-purple-950 font-bold block text-[11px]">
                                {t("referralNoticeTitle")}:
                              </strong>
                              <span className="text-purple-900 font-semibold">
                                {c.doctorReview?.referralDetails?.referralFacilityName || "District Headquarters Hospital"}
                              </span>
                              <span className="text-purple-700 text-[10px] block mt-0.5">
                                Transport: {c.doctorReview?.referralDetails?.transportRecommendation || "108 ALS Ambulance"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPrescriptionCase(c)}
                          className="bg-brand-50 hover:bg-brand-100 text-brand-950 border border-brand-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Pill className="w-3.5 h-3.5 text-brand-700" />
                          <span>{t("printPrescriptionBtn")}</span>
                        </button>

                        {isReferred && (
                          <button
                            type="button"
                            onClick={() => setSelectedReferralCase(c)}
                            className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{t("viewReferralSlipBtn")}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: COMPLETE CLINICAL VISIT & TRIAGE HISTORY                         */}
          {/* ========================================================================= */}
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
                cases.map((c) => {
                  const hasDoctorNote = Boolean(c.doctorReview?.clinicalImpression || c.status === "COMPLETED" || c.status === "REFERRED");
                  const isReferred = c.status === "REFERRED" || Boolean(c.doctorReview?.referralDetails?.isReferred);

                  return (
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
                          <StatusBadge urgency={c.doctorReview?.overrideUrgency || c.triageOutput.urgencyLevel} size="sm" />
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                            c.status === "COMPLETED" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                            c.status === "REFERRED" ? "bg-purple-50 text-purple-800 border-purple-200" :
                            "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {t(`status_${c.status}`) || c.status.replace(/_/g, " ")}
                          </span>

                          {hasDoctorNote && (
                            <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold border border-blue-200 flex items-center gap-1">
                              <Stethoscope className="w-3 h-3 text-blue-600" />
                              <span>Prescription Available</span>
                            </span>
                          )}

                          {isReferred && (
                            <span className="text-[10px] bg-purple-50 text-purple-900 px-2 py-0.5 rounded font-bold border border-purple-200 flex items-center gap-1">
                              <Ambulance className="w-3 h-3 text-purple-700" />
                              <span>Referred</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 line-clamp-1 font-medium">
                          {c.translatedEnglishInput || c.rawSymptomInput}
                        </p>

                        {/* Preview of Doctor Note if present */}
                        {c.doctorReview?.clinicalImpression && (
                          <p className="text-[11px] text-blue-950 font-semibold line-clamp-1">
                            <span className="text-slate-500 font-normal">Dr. Advice: </span>
                            {c.doctorReview.clinicalImpression}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {t(`facility_${c.facilityType}`) || c.facilityType.replace(/_/g, " ")}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {hasDoctorNote && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPrescriptionCase(c);
                            }}
                            className="bg-white hover:bg-slate-50 text-blue-800 border border-blue-200 text-xs px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer"
                          >
                            Prescription
                          </button>
                        )}
                        <div className="flex items-center text-xs font-bold text-brand-700">
                          <span>{t("reviewDetailsBtn")}</span>
                          <ChevronRight className="w-4 h-4 text-brand-500" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* Full Prescription Document Modal */}
      {selectedPrescriptionCase && (
        <PrescriptionDocumentModal
          isOpen={Boolean(selectedPrescriptionCase)}
          caseData={selectedPrescriptionCase}
          patient={currentPatient}
          onClose={() => setSelectedPrescriptionCase(null)}
          onOpenReferralModal={(c) => {
            setSelectedPrescriptionCase(null);
            setSelectedReferralCase(c);
          }}
        />
      )}

      {/* Full Referral Slip Modal */}
      {selectedReferralCase && (
        <ReferralSlipModal
          isOpen={Boolean(selectedReferralCase)}
          caseData={selectedReferralCase}
          patient={currentPatient}
          onClose={() => setSelectedReferralCase(null)}
        />
      )}

    </div>
  );
};

