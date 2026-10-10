"use client";

import React, { useState, useEffect } from "react";
import { CaseRecord, Patient, StaffMember, UrgencyLevel } from "../../types";
import { StatusBadge } from "../common/StatusBadge";
import { submitDoctorReview } from "../../services/api";
import { speakText, stopSpeech } from "../../services/speech";
import { useLanguage } from "../../context/LanguageContext";
import { 
  Activity, 
  AlertCircle, 
  AlertTriangle, 
  Check, 
  FileText, 
  HelpCircle, 
  History, 
  Stethoscope, 
  User, 
  Volume2, 
  VolumeX,
  Square,
  X 
} from "lucide-react";

interface CaseReviewDrawerProps {
  isOpen: boolean;
  caseData: CaseRecord | null;
  patientHistory?: CaseRecord[];
  currentStaff?: StaffMember | null;
  onClose: () => void;
  onCaseUpdated: (updatedCase: CaseRecord) => void;
  onOpenReferralModal: (caseData: CaseRecord) => void;
}

export const CaseReviewDrawer: React.FC<CaseReviewDrawerProps> = ({
  isOpen,
  caseData,
  patientHistory = [],
  currentStaff,
  onClose,
  onCaseUpdated,
  onOpenReferralModal,
}) => {
  const { t } = useLanguage();
  if (!isOpen || !caseData) return null;

  const [overrideUrgency, setOverrideUrgency] = useState<UrgencyLevel>(
    caseData.doctorReview?.overrideUrgency || caseData.triageOutput.urgencyLevel
  );
  const [overrideReason, setOverrideReason] = useState(caseData.doctorReview?.overrideReason || "");
  const [clinicalImpression, setClinicalImpression] = useState(caseData.doctorReview?.clinicalImpression || "");
  const [referralFacility, setReferralFacility] = useState(
    caseData.doctorReview?.referralDetails?.referralFacilityName || "District Headquarters Hospital"
  );
  const [transferUrgency, setTransferUrgency] = useState<any>(
    caseData.doctorReview?.referralDetails?.urgencyOfTransfer || "Immediate Ambulance"
  );
  const [isReferredMode, setIsReferredMode] = useState(caseData.doctorReview?.referralDetails?.isReferred || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return () => {
      stopSpeech();
      setIsPlayingAudio(false);
    };
  }, [caseData._id]);

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      const speechScript = `Patient Assessment for ${caseData.patient?.fullName || "Citizen"}. Urgency: ${caseData.triageOutput.urgencyLevel.replace(/_/g, " ")}. Severity Score: ${caseData.triageOutput.urgencyScore} out of 10. ${caseData.triageOutput.urgencyReason}. Timeline: ${caseData.triageOutput.timelineSummary}. Key questions to investigate: ${caseData.triageOutput.suggestedFollowUpQuestions.join(". ")}`;
      speakText(
        speechScript,
        "en-IN",
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false)
      );
    }
  };

  const handleReviewSubmit = async (status: "COMPLETED" | "REFERRED") => {
    try {
      setIsSubmitting(true);
      const res = await submitDoctorReview(caseData._id, {
        doctorId: currentStaff?._id || "DOC-201",
        doctorName: currentStaff?.name || "Dr. Alok Nayak (MO)",
        doctorRole: currentStaff?.role || "Medical Officer",
        overrideUrgency: overrideUrgency !== caseData.triageOutput.urgencyLevel ? overrideUrgency : undefined,
        overrideReason: overrideReason || undefined,
        clinicalImpression: clinicalImpression.trim() || undefined,
        referralDetails: (status === "REFERRED" || isReferredMode) ? {
          isReferred: true,
          referralFacilityName: referralFacility,
          urgencyOfTransfer: transferUrgency,
          reasonForTransfer: clinicalImpression.trim() || "Specialist evaluation and intervention",
          transportRecommendation: transferUrgency === "Immediate Ambulance" ? "108 ALS Ambulance with Continuous SpO2/ECG Monitor" : "Standard OPD Transport",
        } : undefined,
        status: status,
      });

      if (res.success && res.case) {
        onCaseUpdated(res.case);
        if (status === "REFERRED") {
          onOpenReferralModal(res.case);
        } else {
          onClose();
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const patient = caseData.patient;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-300">
        
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-[#5cb4ee] via-[#48aae9] to-[#389ad8] text-slate-950 px-6 py-4 flex items-center justify-between border-b border-[#3b93ce] shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-extrabold text-base text-slate-950">{caseData.tokenNumber}</span>
              <span className="text-slate-900 font-mono text-xs font-semibold bg-white/40 px-2 py-0.5 rounded border border-white/40">({caseData._id})</span>
              <StatusBadge urgency={caseData.triageOutput.urgencyLevel} size="sm" />
            </div>
            <p className="text-[11px] text-slate-900 font-medium mt-0.5">
              {caseData.facilityType.replace(/_/g, " ")} • Registered: {new Date(caseData.createdAt).toLocaleTimeString()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-950 hover:bg-white/40 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-slate-800 text-xs leading-relaxed">
          
          {/* 1. Patient Profile Strip */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs">
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                {patient?.fullName || "Citizen"}
                <span className="ml-1.5 font-mono text-[11px] font-bold text-[#18548a]">
                  [{caseData.patientId}]
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">
                {patient?.age || "?"} Y • {patient?.sex || "Unknown"} • Blood: {patient?.bloodGroup || "Unknown"} • Mobile: +91 {patient?.phoneNumber || ""}
              </p>
            </div>

            {patientHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistoryModal(!showHistoryModal)}
                className="bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold flex items-center gap-1 shadow-2xs"
              >
                <History className="w-3.5 h-3.5 text-[#18548a]" />
                <span>Past Visits ({patientHistory.length})</span>
              </button>
            )}
          </div>

          {/* Past History Modal */}
          {showHistoryModal && (
            <div className="bg-slate-50 border border-slate-300 p-3 rounded space-y-2">
              <span className="font-bold text-slate-800 text-[11px] block">
                Previous Records for this Patient
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {patientHistory.map((h) => (
                  <div key={h._id} className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-mono font-semibold text-slate-800">{h._id}</span>
                      <span className="text-slate-500 ml-2">({new Date(h.createdAt).toLocaleDateString()})</span>
                      <p className="text-slate-600 truncate max-w-md">{h.translatedEnglishInput}</p>
                    </div>
                    <StatusBadge urgency={h.triageOutput.urgencyLevel} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Deterministic Red Flags */}
          {caseData.triageOutput.deterministicFlags.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-3 rounded space-y-1 text-xs">
              <div className="flex items-center space-x-1.5 text-red-800 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Deterministic Clinical Red Flags</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-red-700 pl-1">
                {caseData.triageOutput.deterministicFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Objective Vitals Table */}
          <div className="border border-slate-200 rounded overflow-hidden">
            <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#18548a]" />
              <span>{t("intakeVitalsTitle")}</span>
            </div>
            <div className="p-3 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">BP</span>
                <span className="font-semibold text-slate-800">
                  {caseData.vitals.bpSystolic ? `${caseData.vitals.bpSystolic}/${caseData.vitals.bpDiastolic || ""}` : "—"}
                </span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Pulse</span>
                <span className="font-semibold text-slate-800">{caseData.vitals.pulseRate ? `${caseData.vitals.pulseRate} bpm` : "—"}</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">SpO2</span>
                <span className={`font-semibold ${caseData.vitals.spo2 && caseData.vitals.spo2 < 92 ? "text-red-700 font-bold" : "text-slate-800"}`}>
                  {caseData.vitals.spo2 ? `${caseData.vitals.spo2}%` : "—"}
                </span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Temp</span>
                <span className="font-semibold text-slate-800">{caseData.vitals.temperature ? `${caseData.vitals.temperature}°F` : "—"}</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Sugar</span>
                <span className="font-semibold text-slate-800">{caseData.vitals.bloodSugar ? `${caseData.vitals.bloodSugar} mg/dL` : "—"}</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Severity</span>
                <span className="font-bold text-[#18548a]">{caseData.triageOutput.urgencyScore} / 10</span>
              </div>
            </div>
          </div>

          {/* 4. Multimodal Inputs & Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Left: Patient Symptoms */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-800 text-[11px] block">
                Patient Symptom Statement ({caseData.inputLanguage.toUpperCase()})
              </span>
              <p className="bg-white p-2 rounded border border-slate-200 text-slate-700 italic">
                "{caseData.rawSymptomInput}"
              </p>
              
              <span className="font-bold text-slate-800 text-[11px] block pt-1">
                Clinical English Synthesis:
              </span>
              <p className="bg-white p-2 rounded border border-slate-200 text-slate-900 font-medium">
                {caseData.translatedEnglishInput}
              </p>
            </div>

            {/* Right: Attached Lab Reports */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-800 text-[11px] block">
                Attached Documents ({caseData.attachments.length})
              </span>

              {caseData.attachments.length === 0 ? (
                <div className="bg-white p-4 rounded border border-slate-200 text-center text-slate-400 text-xs">
                  No attachments attached.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {caseData.attachments.map((att) => (
                    <div key={att.id} className="bg-white p-2 rounded border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-800">{att.fileName}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{att.type}</span>
                      </div>
                      {att.ocrExtractedText && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 mt-1">
                          {att.ocrExtractedText}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* 5. Triage Summary & Clinician Follow-up Prompts */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-brand-700" />
                <span>{t("soapAssessmentTitle")}</span>
              </span>

              <button
                type="button"
                onClick={handleToggleAudio}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all ${
                  isPlayingAudio
                    ? "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                    : "bg-white hover:bg-brand-50 text-brand-900 border border-brand-200"
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Square className="w-3 h-3 fill-rose-600 text-rose-600" />
                    <span>{t("stopBriefingBtn")}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-brand-700" />
                    <span>{t("audioBriefingBtn")}</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-0.5">Timeline:</span>
                <p className="text-slate-600 leading-relaxed">{caseData.triageOutput.timelineSummary}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-0.5">Urgency Rationale:</span>
                <p className="text-slate-600 leading-relaxed">{caseData.triageOutput.urgencyReason}</p>
              </div>
            </div>

            {/* Missing Info Alerts */}
            {caseData.triageOutput.missingInformationAlerts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-xs space-y-0.5">
                <span className="font-semibold text-amber-900 block">{t("missingParamsLabel")}</span>
                <ul className="list-disc list-inside text-amber-800 pl-1">
                  {caseData.triageOutput.missingInformationAlerts.map((alert, i) => (
                    <li key={i}>{alert}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Questions for Clinician */}
            <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-800 block text-xs">
                {t("clinicianPromptsLabel")}
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1 text-xs">
                {caseData.triageOutput.suggestedFollowUpQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 6. Doctor Action Section */}
          <div className="bg-slate-900 text-white rounded p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5cb4ee] flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-[#5cb4ee]" />
              <span>{t("dispositionActionTitle")}</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {t("overrideUrgency")}
                </label>
                <select
                  value={overrideUrgency}
                  onChange={(e) => setOverrideUrgency(e.target.value as UrgencyLevel)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#5cb4ee]"
                >
                  <option value="EMERGENCY_RED">{t("tabEmergency")}</option>
                  <option value="URGENT_YELLOW">{t("tabUrgent")}</option>
                  <option value="ROUTINE_GREEN">{t("tabRoutine")}</option>
                </select>
                {overrideUrgency !== caseData.triageOutput.urgencyLevel && (
                  <input
                    type="text"
                    placeholder="Reason for urgency override..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full mt-1.5 bg-slate-800 text-white border border-slate-700 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#5cb4ee]"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Disposition Action
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReferredMode(false)}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold border transition-colors ${
                      !isReferredMode
                        ? "bg-[#5cb4ee] text-slate-950 border-[#47a2dc]"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    Treat Locally
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReferredMode(true)}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold border transition-colors ${
                      isReferredMode
                        ? "bg-[#5cb4ee] text-slate-950 border-[#47a2dc]"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    Refer Patient
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1 text-xs">
                {t("doctorImpression")}
              </label>
              <textarea
                rows={2}
                value={clinicalImpression}
                onChange={(e) => setClinicalImpression(e.target.value)}
                placeholder="Enter clinical assessment, prescribed medications, or advice..."
                className="w-full bg-slate-800 text-white border border-slate-700 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#5cb4ee]"
              />
            </div>

            {isReferredMode && (
              <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-300 mb-0.5">Referral Facility</label>
                  <input
                    type="text"
                    value={referralFacility}
                    onChange={(e) => setReferralFacility(e.target.value)}
                    placeholder="e.g. District Hospital / Medical College"
                    className="w-full bg-slate-900 text-white border border-slate-700 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#5cb4ee]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-0.5">Transport Urgency</label>
                  <select
                    value={transferUrgency}
                    onChange={(e) => setTransferUrgency(e.target.value)}
                    className="w-full bg-slate-900 text-white border border-slate-700 rounded p-1.5 text-xs focus:outline-none"
                  >
                    <option value="Immediate Ambulance">Immediate Ambulance (108)</option>
                    <option value="Within 24 Hours">Within 24 Hours</option>
                    <option value="Elective OPD">Elective OPD</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {t("cancelBtn")}
              </button>

              {isReferredMode ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReviewSubmit("REFERRED")}
                  className="btn-maya-primary text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-4 h-4 text-slate-950" />
                  <span>{isSubmitting ? "Generating..." : t("generateReferral")}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReviewSubmit("COMPLETED")}
                  className="btn-maya-primary text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>{isSubmitting ? "Saving..." : t("signAndComplete")}</span>
                </button>
              )}
            </div>

          </div>

          {/* 7. Audit Log */}
          <div className="border-t border-slate-200 pt-3 space-y-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
              Audit Trail
            </span>
            <div className="space-y-1 max-h-24 overflow-y-auto text-[11px] text-slate-500">
              {caseData.auditTrail?.map((log, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  <span><strong>{log.actor}</strong>: {log.details || log.action}</span>
                  <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
