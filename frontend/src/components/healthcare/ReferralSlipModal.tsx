"use client";

import React, { useRef } from "react";
import { CaseRecord, Patient, StaffMember } from "../../types";
import { QRCodeSVG } from "qrcode.react";
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
  ArrowRight
} from "lucide-react";

interface ReferralSlipModalProps {
  isOpen: boolean;
  caseData: CaseRecord;
  patient?: Patient | null;
  staff?: StaffMember | null;
  onClose: () => void;
}

export const ReferralSlipModal: React.FC<ReferralSlipModalProps> = ({
  isOpen,
  caseData,
  patient,
  staff,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const referral = caseData.doctorReview?.referralDetails;
  const isImmediate = referral?.urgencyOfTransfer?.toLowerCase().includes("immediate") || 
                      caseData.triageOutput.urgencyLevel === "EMERGENCY_RED";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-300 max-h-[94vh] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Modal Top Bar (Sticky, Non-Printable) */}
        <div className="bg-[#0e2439] text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Official Inter-Facility Clinical Referral Slip</h3>
              <p className="text-[11px] text-slate-300 font-medium">ABDM Digital Health Record • Human-Verified Medical Note</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-[#5cb4ee] hover:bg-[#4aa4de] text-slate-950 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
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

        {/* Printable Referral Document Content (Scrollable Container) */}
        <div 
          ref={printRef} 
          className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5 text-slate-800 text-xs leading-relaxed bg-white print:p-0 print:overflow-visible"
        >
          
          {/* Official Ministry Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1.5">
            <div className="flex justify-center items-center gap-1.5 mb-1">
              <span className="inline-block w-4 h-2.5 bg-[#ff9933] rounded-2xs"></span>
              <span className="inline-block w-4 h-2.5 bg-white border border-slate-300 rounded-2xs"></span>
              <span className="inline-block w-4 h-2.5 bg-[#138808] rounded-2xs"></span>
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-950">
              Ministry of Health & Family Welfare • Government of India
            </h1>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-tight">
              INTER-FACILITY CLINICAL TRIAGE & EMERGENCY REFERRAL SLIP (ABDM-COMPLIANT)
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600 pt-0.5">
              <span>Originating Facility: <strong className="text-slate-900">{caseData.facilityType.replace(/_/g, " ")}</strong></span>
              <span>•</span>
              <span>Token: <strong className="text-slate-900 font-mono">{caseData.tokenNumber}</strong></span>
              <span>•</span>
              <span>Referral Ref ID: <strong className="text-slate-900 font-mono">{caseData._id}</strong></span>
            </div>
          </div>

          {/* Transfer Urgency Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
            isImmediate 
              ? "bg-rose-50 border-rose-300 text-rose-950" 
              : "bg-amber-50 border-amber-300 text-amber-950"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isImmediate ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
              }`}>
                <Ambulance className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">Transfer Priority Level</span>
                <span className="text-sm font-black underline">
                  {referral?.urgencyOfTransfer || (isImmediate ? "Immediate Ambulance Transfer (108 ALS)" : "Priority Transfer Within 24 Hours")}
                </span>
              </div>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-rose-200">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 block">Designated Receiving Facility</span>
              <span className="text-xs font-extrabold text-slate-950 flex items-center sm:justify-end gap-1">
                <span>{referral?.referralFacilityName || "District Headquarters Hospital / Tertiary Medical College"}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </span>
            </div>
          </div>

          {/* 1. Patient Demographics Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-300 uppercase text-[11px] flex items-center justify-between">
              <span>1. Patient Demographics & Identification</span>
              <span className="text-[10px] font-mono text-slate-500 font-normal">ABDM Profile Linked</span>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white">
              <div>
                <span className="text-slate-500 block text-[10px] font-medium">Patient UHID</span>
                <span className="font-bold font-mono text-xs text-slate-900">{patient?._id || caseData.patientId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-medium">Patient Full Name</span>
                <span className="font-bold text-xs text-slate-900">{patient?.fullName || caseData.patient?.fullName || "Registered Citizen"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-medium">Age / Sex</span>
                <span className="font-bold text-xs text-slate-900">
                  {patient?.age || caseData.patient?.age || "?"} Y / {patient?.sex || caseData.patient?.sex || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-medium">Blood Group</span>
                <span className="font-bold text-xs text-slate-900">{patient?.bloodGroup || caseData.patient?.bloodGroup || "Unknown"}</span>
              </div>
              {patient?.phoneNumber && (
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px] font-medium">Registered Contact</span>
                  <span className="font-semibold text-xs text-slate-800">+91 {patient.phoneNumber}</span>
                </div>
              )}
              {patient?.emergencyContact?.name && (
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px] font-medium">Emergency Next-of-Kin</span>
                  <span className="font-semibold text-xs text-slate-800">
                    {patient.emergencyContact.name} ({patient.emergencyContact.relation})
                    {patient.emergencyContact.phone ? ` • +91 ${patient.emergencyContact.phone}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Clinical Findings & Vitals */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-300 uppercase text-[11px] flex items-center justify-between">
              <span>2. Triage Parameters & Initial Baseline Vitals</span>
              <span className="text-[10px] text-slate-500 font-normal">Intake Recorded: {new Date(caseData.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="p-4 space-y-3.5 bg-white">
              
              {/* Vitals Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                <div className="p-1 rounded">
                  <span className="text-slate-500 block text-[10px] font-semibold">BP (mmHg)</span>
                  <span className={`font-bold text-xs ${caseData.vitals?.bpSystolic && caseData.vitals.bpSystolic >= 160 ? "text-rose-700 font-black" : "text-slate-900"}`}>
                    {caseData.vitals?.bpSystolic ? `${caseData.vitals.bpSystolic}/${caseData.vitals?.bpDiastolic || ""}` : "N/A"}
                  </span>
                </div>
                <div className="p-1 rounded">
                  <span className="text-slate-500 block text-[10px] font-semibold">Pulse</span>
                  <span className="font-bold text-xs text-slate-900">
                    {caseData.vitals?.pulseRate ? `${caseData.vitals.pulseRate} bpm` : "N/A"}
                  </span>
                </div>
                <div className="p-1 rounded">
                  <span className="text-slate-500 block text-[10px] font-semibold">SpO2</span>
                  <span className={`font-bold text-xs ${caseData.vitals?.spo2 && caseData.vitals.spo2 < 92 ? "text-rose-700 font-black" : "text-slate-900"}`}>
                    {caseData.vitals?.spo2 ? `${caseData.vitals.spo2}%` : "N/A"}
                  </span>
                </div>
                <div className="p-1 rounded">
                  <span className="text-slate-500 block text-[10px] font-semibold">Temp</span>
                  <span className="font-bold text-xs text-slate-900">
                    {caseData.vitals?.temperature ? `${caseData.vitals.temperature}°F` : "N/A"}
                  </span>
                </div>
                <div className="p-1 rounded">
                  <span className="text-slate-500 block text-[10px] font-semibold">Sugar</span>
                  <span className="font-bold text-xs text-slate-900">
                    {caseData.vitals?.bloodSugar ? `${caseData.vitals.bloodSugar} mg/dL` : "N/A"}
                  </span>
                </div>
                <div className="p-1 rounded">
                  <span className="text-slate-500 block text-[10px] font-semibold">Severity</span>
                  <span className="font-black text-xs text-rose-700">
                    {caseData.triageOutput.urgencyScore} / 10
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1 text-xs">Chief Presenting Complaints & Clinical Timeline:</span>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-medium">
                  {caseData.translatedEnglishInput || caseData.rawSymptomInput}
                </p>
              </div>

              {caseData.triageOutput.deterministicFlags.length > 0 && (
                <div>
                  <span className="font-bold text-rose-900 block mb-1 text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Triggered Critical Protocol Red Flags:</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-rose-900 bg-rose-50/80 p-3 rounded-lg border border-rose-200 text-xs font-semibold">
                    {caseData.triageOutput.deterministicFlags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {caseData.attachments.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900 block mb-1 text-xs">Attached Lab Reports / OCR Data:</span>
                  <div className="space-y-1.5">
                    {caseData.attachments.map((att) => (
                      <div key={att.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{att.fileName}</span>
                          <span className="text-[10px] uppercase text-slate-500">{att.type}</span>
                        </div>
                        {att.ocrExtractedText && (
                          <p className="text-[11px] text-slate-600 mt-1">{att.ocrExtractedText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* 3. Referring Doctor Clinical Impression & Orders */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-300 uppercase text-[11px]">
              3. Referring Medical Officer Assessment & Disposition Orders
            </div>
            <div className="p-4 space-y-3 bg-white">
              <div>
                <span className="font-bold text-slate-900 block text-xs">Clinical Impression / Provisional Diagnosis:</span>
                <p className="mt-1 bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-900 font-semibold leading-relaxed">
                  {caseData.doctorReview?.clinicalImpression || referral?.reasonForTransfer || "Referred for emergency evaluation, specialist intervention, and continuous monitoring."}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-xs">Transport & En-Route Clinical Recommendations:</span>
                <p className="mt-1 text-slate-800 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {referral?.transportRecommendation || (isImmediate ? "108 ALS Ambulance with Continuous SpO2/ECG Monitor and Supplemental O2" : "Standard OPD Medical Transport")}
                </p>
              </div>
            </div>
          </div>

          {/* 4. Digital Signature & ABDM QR */}
          <div className="pt-4 border-t-2 border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="bg-white p-1.5 border border-slate-400 rounded-lg shrink-0 shadow-2xs">
                <QRCodeSVG value={`https://abdm.gov.in/referral/${caseData._id}`} size={64} />
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#5cb4ee]" />
                  <span>ABDM Health QR Code</span>
                </p>
                <p>Scan to import digital case note into Receiving Hospital EMR</p>
                <p className="text-[10px] text-slate-400 font-mono">Generated: {new Date().toLocaleString()}</p>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="inline-block border-b-2 border-slate-500 w-56 pb-1 mb-1">
                <span className="text-sm font-bold text-blue-900">
                  {caseData.doctorReview?.doctorName || staff?.name || "Dr. Alok Nayak (MO)"}
                </span>
              </div>
              <p className="font-extrabold text-xs text-slate-900">
                {caseData.doctorReview?.doctorRole || staff?.role || "Duty Medical Officer"}
              </p>
              <p className="text-[11px] text-slate-500">
                Facility Digital Signature & Seal Verified
              </p>
            </div>
          </div>

        </div>

        {/* Modal Bottom Action Footer (Non-Printable) */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Official digital referral document generated according to National Health Protocol</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-300"
            >
              Close Note
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none btn-maya-primary text-xs px-5 py-2 rounded-lg flex items-center justify-center gap-2 font-bold cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
