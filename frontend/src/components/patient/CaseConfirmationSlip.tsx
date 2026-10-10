import React, { useState, useEffect } from "react";
import { CaseRecord, Patient } from "../../types";
import { StatusBadge } from "../common/StatusBadge";
import { useLanguage } from "../../context/LanguageContext";
import { SUPPORTED_LANGUAGES } from "../../i18n/translations";
import { speakText, stopSpeech } from "../../services/speech";
import { QRCodeSVG } from "qrcode.react";
import { 
  Volume2, 
  Square,
  AlertTriangle, 
  ArrowLeft, 
  FileCheck2,
  Languages
} from "lucide-react";

interface CaseConfirmationSlipProps {
  caseData: CaseRecord;
  patient: Patient;
  onBackToDashboard: () => void;
}

export const CaseConfirmationSlip: React.FC<CaseConfirmationSlipProps> = ({
  caseData,
  patient,
  onBackToDashboard,
}) => {
  const { currentLanguage } = useLanguage();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Identify the intake language of this case
  const intakeLang = SUPPORTED_LANGUAGES.find((l) => l.code === caseData.inputLanguage) 
    || SUPPORTED_LANGUAGES.find((l) => l.code === "or") 
    || { code: "en", name: "English", nativeName: "English", speechLocale: "en-IN" };

  const [viewLanguage, setViewLanguage] = useState<"native" | "en">(
    caseData.inputLanguage && caseData.inputLanguage !== "en" ? "native" : "en"
  );

  useEffect(() => {
    return () => {
      stopSpeech();
      setIsPlayingAudio(false);
    };
  }, [caseData._id]);

  const displayedLanguageName = viewLanguage === "en" 
    ? "English" 
    : `${intakeLang.nativeName} (${intakeLang.name})`;

  const advisoryText = viewLanguage === "en"
    ? (caseData.triageOutput.patientFacingAdvisory?.en || caseData.triageOutput.patientFacingAdvisory?.originalLanguage || "")
    : (caseData.triageOutput.patientFacingAdvisory?.originalLanguage || caseData.triageOutput.patientFacingAdvisory?.en || "");

  const handleToggleReadAloud = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      const localeToSpeak = viewLanguage === "en" ? "en-IN" : intakeLang.speechLocale;
      speakText(
        advisoryText, 
        localeToSpeak,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false)
      );
    }
  };

  const isEmergency = caseData.triageOutput.urgencyLevel === "EMERGENCY_RED";

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden max-w-2xl mx-auto shadow-card">
      
      {/* Top Slip Header */}
      <div className="bg-gradient-to-r from-[#5cb4ee] via-[#48aae9] to-[#389ad8] text-slate-950 px-5 py-4 flex items-center justify-between border-b border-[#3b93ce]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-white/40 flex items-center justify-center border border-white/50 shadow-2xs">
            <FileCheck2 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="text-[10px] text-slate-900 uppercase tracking-wider block font-bold">
              Official Triage Queue Ticket
            </span>
            <h2 className="text-base font-extrabold font-mono text-slate-950">
              {caseData.tokenNumber}
            </h2>
          </div>
        </div>

        <StatusBadge urgency={caseData.triageOutput.urgencyLevel} size="md" />
      </div>

      {/* Slip Content */}
      <div className="p-6 space-y-5">
        
        {/* Emergency Alert Banner if Red */}
        {isEmergency && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-lg p-3.5 text-xs flex items-start gap-2.5 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Priority Clinical Alert:</strong>
              <span>Symptoms indicate immediate medical priority. Please alert the nearest duty nurse or medical officer without delay.</span>
            </div>
          </div>
        )}

        {/* Patient & Case Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200/90 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">Patient UHID</span>
            <span className="font-bold font-mono text-slate-900">{patient._id}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Patient Name</span>
            <span className="font-bold text-slate-900">{patient.fullName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Age / Sex</span>
            <span className="font-bold text-slate-900">{patient.age} Y / {patient.sex}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Case ID</span>
            <span className="font-bold font-mono text-slate-900 text-[11px]">{caseData._id}</span>
          </div>
        </div>

        {/* Patient Advisory Box */}
        <div className="bg-brand-50/50 border border-brand-200/90 rounded-lg p-4 space-y-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-brand-950 uppercase tracking-wider flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-brand-700" />
              <span>Patient Advisory ({displayedLanguageName})</span>
            </span>

            <div className="flex items-center gap-2">
              {/* Language Switcher Pill */}
              {intakeLang.code !== "en" && (
                <div className="flex items-center bg-white rounded-md border border-brand-200 p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      stopSpeech();
                      setIsPlayingAudio(false);
                      setViewLanguage("native");
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      viewLanguage === "native"
                        ? "bg-brand-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {intakeLang.nativeName}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopSpeech();
                      setIsPlayingAudio(false);
                      setViewLanguage("en");
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      viewLanguage === "en"
                        ? "bg-brand-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    English
                  </button>
                </div>
              )}

              {/* Listen / Stop Button */}
              <button
                type="button"
                onClick={handleToggleReadAloud}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 border shadow-2xs cursor-pointer transition-all ${
                  isPlayingAudio
                    ? "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                    : "bg-white hover:bg-brand-50 text-brand-900 border-brand-200"
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Square className="w-3 h-3 fill-rose-600 text-rose-600" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-brand-700" />
                    <span>Listen</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white/80 p-2.5 rounded-md border border-brand-200/60">
            {advisoryText}
          </p>
        </div>


        {/* QR Code & Facility Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-200">
          <div className="flex items-center space-x-3.5 text-xs text-slate-600">
            <div className="bg-white p-2 border border-slate-200 rounded-lg shadow-2xs">
              <QRCodeSVG value={`https://health.gov.in/triage/${caseData._id}`} size={56} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Scan at Nurse / Doctor Desk</p>
              <p className="text-[11px] text-slate-500">{caseData.facilityType.replace(/_/g, " ")}</p>
              <p className="text-[11px] text-slate-500">{new Date(caseData.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>

          <button
            onClick={onBackToDashboard}
            className="w-full sm:w-auto btn-maya-primary text-xs px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-950" />
            <span>Back to Dashboard</span>
          </button>
        </div>

      </div>

    </div>
  );
};
