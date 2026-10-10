"use client";

import React, { useRef } from "react";
import { CaseRecord, Patient } from "../../types";
import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "../../context/LanguageContext";
import { StatusBadge } from "../common/StatusBadge";
import { 
  Building2, 
  CheckCircle2, 
  FileText, 
  Printer, 
  ShieldCheck, 
  X,
  AlertTriangle,
  Ambulance,
  Phone,
  Activity,
  Pill,
  Stethoscope,
  Clock,
  ArrowRight
} from "lucide-react";

interface PrescriptionDocumentModalProps {
  isOpen: boolean;
  caseData: CaseRecord;
  patient?: Patient | null;
  onClose: () => void;
  onOpenReferralModal?: (caseData: CaseRecord) => void;
}

export const PrescriptionDocumentModal: React.FC<PrescriptionDocumentModalProps> = ({
  isOpen,
  caseData,
  patient,
  onClose,
  onOpenReferralModal,
}) => {
  const { t } = useLanguage();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const review = caseData.doctorReview;
  const referral = review?.referralDetails;
  const isReferred = referral?.isReferred || caseData.status === "REFERRED";

  const displayPatient = patient || caseData.patient;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-300 max-h-[94vh] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Top Control Bar (Non-Printable) */}
        <div className="bg-[#0e2439] text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5cb4ee]/20 border border-[#5cb4ee]/40 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-[#5cb4ee]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                {t("patientPrescriptionsSection")}
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                ABDM Verified Patient Health Record • Official Physician Consultation Note
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-[#5cb4ee] hover:bg-[#4aa4de] text-slate-950 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t("printPrescriptionBtn")}</span>
            </button>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Close modal"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div 
          ref={printRef} 
          className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5 text-slate-800 text-xs leading-relaxed bg-white print:p-0 print:overflow-visible"
        >
          {/* Header & Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1.5">
            <div className="flex justify-center items-center gap-1.5 mb-1">
              <span className="inline-block w-4 h-2.5 bg-[#ff9933] rounded-2xs"></span>
              <span className="inline-block w-4 h-2.5 bg-white border border-slate-300 rounded-2xs"></span>
              <span className="inline-block w-4 h-2.5 bg-[#138808] rounded-2xs"></span>
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-950">
              National Health Mission • Institutional Healthcare Services
            </h1>
            <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
              Clinical Consultation, Medical Prescription & Handover Note
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                ABDM Verified Clinical Document
              </span>
              <span className="bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Token: <strong className="font-mono">{caseData.tokenNumber}</strong>
              </span>
              <span className="bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Case ID: <strong className="font-mono">{caseData._id}</strong>
              </span>
            </div>
          </div>

          {/* Patient Demographics & Intake Information */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">{t("patientName")}</span>
              <strong className="text-slate-900 font-extrabold">{displayPatient?.fullName || "Citizen"}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">{t("patientUhid")}</span>
              <span className="font-mono font-bold text-slate-900">{caseData.patientId}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">{t("ageLabel")} / {t("sexLabel")}</span>
              <span className="font-bold text-slate-900">{displayPatient?.age} Y / {displayPatient?.sex}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">{t("bloodLabel")}</span>
              <span className="font-bold text-slate-900">{displayPatient?.bloodGroup || "Unknown"}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">{t("phoneNumber")}</span>
              <span className="font-bold font-mono text-slate-900">+91 {displayPatient?.phoneNumber || ""}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">{t("facility")}</span>
              <span className="font-bold text-slate-900">{t(`facility_${caseData.facilityType}`) || caseData.facilityType.replace(/_/g, " ")}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Date of Consultation</span>
              <span className="font-bold text-slate-900">
                {new Date(review?.signedAt || caseData.updatedAt || caseData.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Triage Urgency</span>
              <div className="mt-0.5">
                <StatusBadge urgency={review?.overrideUrgency || caseData.triageOutput.urgencyLevel} size="sm" />
              </div>
            </div>
          </div>

          {/* Recorded Baseline Vitals */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-2">
              <Activity className="w-3.5 h-3.5 text-brand-700" />
              Recorded Baseline Vitals
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">BP</span>
                <span className="font-bold text-slate-900">
                  {caseData.vitals.bpSystolic ? `${caseData.vitals.bpSystolic}/${caseData.vitals.bpDiastolic || ""}` : "—"}
                </span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Pulse</span>
                <span className="font-bold text-slate-900">{caseData.vitals.pulseRate ? `${caseData.vitals.pulseRate} bpm` : "—"}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">SpO2</span>
                <span className={`font-bold ${caseData.vitals.spo2 && caseData.vitals.spo2 < 92 ? "text-rose-700" : "text-slate-900"}`}>
                  {caseData.vitals.spo2 ? `${caseData.vitals.spo2}%` : "—"}
                </span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Temp</span>
                <span className="font-bold text-slate-900">{caseData.vitals.temperature ? `${caseData.vitals.temperature}°F` : "—"}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Blood Sugar</span>
                <span className="font-bold text-slate-900">{caseData.vitals.bloodSugar ? `${caseData.vitals.bloodSugar} mg/dL` : "—"}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Severity Score</span>
                <span className="font-bold text-brand-700">{caseData.triageOutput.urgencyScore} / 10</span>
              </div>
            </div>
          </div>

          {/* Physician Clinical Diagnosis / Impression Note */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-brand-700" />
                <span>{t("doctorImpression")}</span>
              </span>
              <span className="text-[11px] font-semibold text-blue-900">
                {t("signedByDoctor")}: <strong>{review?.doctorName || "Duty Medical Officer"}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-blue-100 font-medium">
              {review?.clinicalImpression || "Patient examined at healthcare desk. Clinical vitals monitored. Symptomatic treatment and rest advised."}
            </p>
          </div>

          {/* Prescribed Medications & Treatment Plan */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-emerald-600" />
                <span>{t("prescribedMedsTitle")} (Rx)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Take medicines strictly as instructed by your healthcare worker
              </span>
            </div>

            {review?.prescribedMedications && review.prescribedMedications.length > 0 ? (
              <div className="space-y-2">
                {review.prescribedMedications.map((med, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <div className="flex-1 font-medium text-slate-900">
                      {med}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                  <div className="flex-1 text-slate-800 font-medium">
                    Tab Paracetamol 650mg — 1 tablet thrice daily after meals (if temperature &gt; 99.5°F or body ache).
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                  <div className="flex-1 text-slate-800 font-medium">
                    ORS Rehydration Sachets — Dissolve 1 sachet in 1 liter clean drinking water; drink periodically throughout the day.
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                  <div className="flex-1 text-slate-800 font-medium">
                    Adequate bed rest, light fluid-rich diet, and repeat vitals check if breathless or dizzy.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inter-Facility Referral Notice Section (If Case was Referred) */}
          {isReferred && (
            <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-purple-200 pb-2.5">
                <div className="flex items-center gap-2 text-purple-950 font-extrabold text-xs">
                  <Ambulance className="w-5 h-5 text-purple-700" />
                  <span>{t("referralNoticeTitle")}</span>
                </div>
                <span className="bg-purple-200 text-purple-950 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-purple-300">
                  {referral?.urgencyOfTransfer || "Priority Transfer Required"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-purple-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">
                    {t("referralDestination")}
                  </span>
                  <strong className="text-purple-950 font-black text-sm block">
                    {referral?.referralFacilityName || "District Headquarters Hospital"}
                  </strong>
                  <span className="text-[11px] text-slate-600 mt-1 block">
                    Department: <strong>{referral?.department || "Emergency / Specialist Medicine OPD"}</strong>
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-purple-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">
                    {t("transportRecommendationNotice")}
                  </span>
                  <p className="text-purple-900 font-bold text-xs">
                    {referral?.transportRecommendation || "108 ALS Ambulance with Continuous SpO2/ECG Monitor"}
                  </p>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Handover Reason: {referral?.reasonForTransfer || review?.clinicalImpression || "Specialized secondary evaluation and intervention."}
                  </span>
                </div>
              </div>

              {onOpenReferralModal && (
                <div className="pt-1 flex justify-end print:hidden">
                  <button
                    type="button"
                    onClick={() => onOpenReferralModal(caseData)}
                    className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t("viewReferralSlipBtn")} →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Doctor Signature & Legal Verification */}
          <div className="border-t-2 border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-xs text-slate-600">
              <div className="bg-white p-2 border border-slate-300 rounded-lg shadow-2xs">
                <QRCodeSVG value={`https://health.gov.in/prescription/${caseData._id}`} size={64} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Digital Health Record Slip</p>
                <p className="text-[11px] text-slate-500">Scan at Pharmacy / Refer Hospital</p>
                <p className="text-[11px] text-slate-500">ABDM Registry Validated</p>
              </div>
            </div>

            <div className="text-right sm:text-right space-y-1">
              <div className="inline-block border-b border-slate-400 pb-1 px-4 text-center">
                <span className="font-serif italic text-sm text-slate-900 font-bold">
                  {review?.doctorName || "Dr. Alok Nayak (MO)"}
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">
                {review?.doctorRole || "Medical Officer (General Medicine)"}
              </p>
              <p className="text-[10px] text-slate-500">
                Reg No: MCI-OR-84729 • {t(`facility_${caseData.facilityType}`) || caseData.facilityType.replace(/_/g, " ")}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
