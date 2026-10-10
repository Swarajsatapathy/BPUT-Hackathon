"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { SUPPORTED_LANGUAGES } from "../../i18n/translations";
import { createSpeechRecognizer, startAudioRecording, AudioRecorderHandle } from "../../services/speech";
import { processOcrUpload, submitNewTriageCase, transcribeAudioApi, translateTextApi } from "../../services/api";
import { CaseRecord, FacilityType, Vitals } from "../../types";
import { 
  Mic, 
  MicOff, 
  Upload, 
  FileText, 
  Activity, 
  Send, 
  AlertTriangle, 
  Building2,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle2,
  Languages,
  ArrowRightLeft,
  Copy,
  RefreshCw
} from "lucide-react";

interface SymptomIntakeWizardProps {
  onCaseCreated: (newCase: CaseRecord) => void;
  onCancel?: () => void;
}

export const SymptomIntakeWizard: React.FC<SymptomIntakeWizardProps> = ({ onCaseCreated, onCancel }) => {
  const { currentPatient, selectedFacility } = useAuth();
  const { currentLanguage, t } = useLanguage();

  const [facility, setFacility] = useState<FacilityType>(selectedFacility);
  const [spokenLangCode, setSpokenLangCode] = useState<string>(currentLanguage.code);
  const [symptomText, setSymptomText] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceTranslation, setVoiceTranslation] = useState("");
  const [detectedVoiceLang, setDetectedVoiceLang] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [vitalsExtractedBadge, setVitalsExtractedBadge] = useState<string | null>(null);

  const audioRecorderRef = useRef<AudioRecorderHandle | null>(null);
  const recognizerRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const liveTranscriptRef = useRef<string>("");

  // Vitals State
  const [bpSystolic, setBpSystolic] = useState<string>("");
  const [bpDiastolic, setBpDiastolic] = useState<string>("");
  const [pulseRate, setPulseRate] = useState<string>("");
  const [spo2, setSpo2] = useState<string>("");
  const [temperature, setTemperature] = useState<string>("");
  const [bloodSugar, setBloodSugar] = useState<string>("");

  // Attachments State
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync spoken language if website language changes (unless user explicitly customized)
  useEffect(() => {
    setSpokenLangCode(currentLanguage.code);
  }, [currentLanguage]);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioRecorderRef.current) audioRecorderRef.current.cancel();
      if (recognizerRef.current) recognizerRef.current.stop();
    };
  }, []);

  const getActiveSpeechLocale = (langCode: string): string => {
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    return found ? found.speechLocale : "en-IN";
  };

  const startRecordingFlow = async () => {
    setErrorMessage(null);
    setVitalsExtractedBadge(null);
    setRecordingSeconds(0);
    liveTranscriptRef.current = "";

    const localeToUse = getActiveSpeechLocale(spokenLangCode);

    try {
      // 1. Start high-fidelity audio recorder
      const recorder = await startAudioRecording();
      audioRecorderRef.current = recorder;

      // 2. Start Web Speech recognition for instant live interim feedback
      const rec = createSpeechRecognizer(
        localeToUse,
        (transcript) => {
          liveTranscriptRef.current = transcript;
          setVoiceTranscript(transcript);
        },
        () => {},
        (err) => console.warn("Live speech interim warning:", err)
      );
      recognizerRef.current = rec;
      rec.start();

      // 3. Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      setIsRecording(true);
    } catch (err: any) {
      console.warn("Audio recording initialization error:", err);
      // Fallback to browser Web Speech API directly
      const rec = createSpeechRecognizer(
        localeToUse,
        (transcript) => {
          liveTranscriptRef.current = transcript;
          setVoiceTranscript(transcript);
        },
        () => setIsRecording(false),
        (err) => setErrorMessage("Microphone permission denied or not supported.")
      );
      recognizerRef.current = rec;
      rec.start();
      setIsRecording(true);
    }
  };

  const applyDetectedVitals = (detected: any) => {
    if (!detected) return;
    const detectedKeys: string[] = [];
    if (detected.spo2 && !spo2) {
      setSpo2(String(detected.spo2));
      detectedKeys.push(`SpO2: ${detected.spo2}%`);
    }
    if (detected.temperature && !temperature) {
      setTemperature(String(detected.temperature));
      detectedKeys.push(`Temp: ${detected.temperature}°F`);
    }
    if (detected.bpSystolic && !bpSystolic) {
      setBpSystolic(String(detected.bpSystolic));
      detectedKeys.push(`BP Systolic: ${detected.bpSystolic}`);
    }
    if (detected.bpDiastolic && !bpDiastolic) {
      setBpDiastolic(String(detected.bpDiastolic));
      detectedKeys.push(`BP Diastolic: ${detected.bpDiastolic}`);
    }
    if (detected.pulseRate && !pulseRate) {
      setPulseRate(String(detected.pulseRate));
      detectedKeys.push(`Pulse: ${detected.pulseRate}`);
    }
    if (detected.bloodSugar && !bloodSugar) {
      setBloodSugar(String(detected.bloodSugar));
      detectedKeys.push(`Sugar: ${detected.bloodSugar}`);
    }

    if (detectedKeys.length > 0) {
      setVitalsExtractedBadge(`Auto-filled from voice: ${detectedKeys.join(", ")}`);
    }
  };

  const stopRecordingFlow = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }

    setIsRecording(false);
    setIsTranscribing(true);

    const capturedInterim = liveTranscriptRef.current || voiceTranscript;

    try {
      if (audioRecorderRef.current) {
        const { base64, mimeType } = await audioRecorderRef.current.stop();
        audioRecorderRef.current = null;

        // Send to Gemini 1.5 Flash for high-accuracy medical audio transcription & translation
        const result = await transcribeAudioApi(base64, mimeType, spokenLangCode, capturedInterim);

        if (result.success) {
          if (result.transcript) setVoiceTranscript(result.transcript);
          if (result.transcriptEnglish) setVoiceTranslation(result.transcriptEnglish);
          if (result.detectedLanguage) setDetectedVoiceLang(result.detectedLanguage);
          applyDetectedVitals(result.detectedVitals);
        } else if (capturedInterim) {
          // Fallback text translation if audio transcription failed
          const transRes = await translateTextApi(capturedInterim, spokenLangCode);
          if (transRes.success && transRes.translatedEnglish) {
            setVoiceTranslation(transRes.translatedEnglish);
            if (transRes.detectedLanguage) setDetectedVoiceLang(transRes.detectedLanguage);
            applyDetectedVitals(transRes.detectedVitals);
          }
        }
      } else if (capturedInterim) {
        // Direct text translation if only Web Speech was captured
        const transRes = await translateTextApi(capturedInterim, spokenLangCode);
        if (transRes.success && transRes.translatedEnglish) {
          setVoiceTranslation(transRes.translatedEnglish);
          if (transRes.detectedLanguage) setDetectedVoiceLang(transRes.detectedLanguage);
          applyDetectedVitals(transRes.detectedVitals);
        }
      }
    } catch (err) {
      console.warn("AI Audio Transcription fallback to text translation:", err);
      if (capturedInterim) {
        try {
          const transRes = await translateTextApi(capturedInterim, spokenLangCode);
          if (transRes.success && transRes.translatedEnglish) {
            setVoiceTranslation(transRes.translatedEnglish);
            if (transRes.detectedLanguage) setDetectedVoiceLang(transRes.detectedLanguage);
            applyDetectedVitals(transRes.detectedVitals);
          }
        } catch (tErr) {
          console.error("Text translation fallback error:", tErr);
        }
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleManualTranslate = async () => {
    const textToTranslate = voiceTranscript || symptomText;
    if (!textToTranslate) return;

    try {
      setIsTranscribing(true);
      const transRes = await translateTextApi(textToTranslate, spokenLangCode);
      if (transRes.success && transRes.translatedEnglish) {
        setVoiceTranslation(transRes.translatedEnglish);
        if (transRes.detectedLanguage) setDetectedVoiceLang(transRes.detectedLanguage);
        applyDetectedVitals(transRes.detectedVitals);
      }
    } catch (err) {
      console.error("Manual translate error:", err);
    } finally {
      setIsTranscribing(false);
    }
  };


  const toggleRecording = () => {
    if (isRecording) {
      stopRecordingFlow();
    } else {
      startRecordingFlow();
    }
  };



  // Clean Presets for Demonstration
  const quickPresets = [
    {
      label: "Acute Angina / Chest Pain",
      text: "Severe crushing retrosternal chest pain radiating to left arm with cold diaphoresis for 45 mins.",
      lang: "en",
      vitals: { bpSystolic: "184", bpDiastolic: "112", pulseRate: "118", spo2: "91", temperature: "98.4", bloodSugar: "210" },
      facility: "PRIMARY_HEALTH_CENTER" as FacilityType,
    },
    {
      label: "Campus Dengue / Fever",
      text: "High fever (102.8°F) for 4 days, severe retro-orbital headache, joint ache, nausea, and rash on forearms.",
      lang: "en",
      vitals: { bpSystolic: "110", bpDiastolic: "74", pulseRate: "98", spo2: "98", temperature: "102.8", bloodSugar: "92" },
      facility: "CAMPUS_HEALTH_CENTER" as FacilityType,
    },
    {
      label: "Maternal Preeclampsia (ଓଡ଼ିଆ)",
      text: "୮ ମାସର ଗର୍ଭବତୀ। ୨ ଦିନ ହେବ ପ୍ରବଳ ମୁଣ୍ଡବିନ୍ଧା, ଆଖି ଆଗରେ ଅନ୍ଧାର ଏବଂ ପାଦରେ ଅତ୍ୟଧିକ ଫୁଲା।",
      lang: "or",
      vitals: { bpSystolic: "168", bpDiastolic: "106", pulseRate: "94", spo2: "97", temperature: "98.6", bloodSugar: "104" },
      facility: "PUBLIC_HEALTH_CAMP" as FacilityType,
    },
    {
      label: "Industrial Solvent Inhalation",
      text: "Accidental chemical vapor inhalation in plant 2 hours ago. Persistent dry coughing, burning in throat, and forearm redness.",
      lang: "en",
      vitals: { bpSystolic: "132", bpDiastolic: "86", pulseRate: "104", spo2: "94", temperature: "99.1", bloodSugar: "110" },
      facility: "INDUSTRIAL_HEALTH_UNIT" as FacilityType,
    },
  ];

  const applyPreset = (preset: typeof quickPresets[0]) => {
    setSymptomText(preset.text);
    setBpSystolic(preset.vitals.bpSystolic);
    setBpDiastolic(preset.vitals.bpDiastolic);
    setPulseRate(preset.vitals.pulseRate);
    setSpo2(preset.vitals.spo2);
    setTemperature(preset.vitals.temperature);
    setBloodSugar(preset.vitals.bloodSugar);
    setFacility(preset.facility);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setOcrLoading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const ocrRes = await processOcrUpload(base64, file.type);
          const newAtt = {
            id: `att-${Date.now()}`,
            type: file.type.includes("pdf") ? "lab_report" : "prescription",
            fileName: file.name,
            base64Data: base64,
            ocrExtractedText: ocrRes.extractedText,
            parsedValues: ocrRes.structuredLabValues,
          };
          setUploadedFiles((prev) => [...prev, newAtt]);
        } catch (err) {
          setUploadedFiles((prev) => [
            ...prev,
            {
              id: `att-${Date.now()}`,
              type: "lab_report",
              fileName: file.name,
              base64Data: base64,
              ocrExtractedText: "Uploaded report attached for clinician inspection.",
            },
          ]);
        } finally {
          setOcrLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullSymptoms = (symptomText + " " + voiceTranscript).trim();
    if (!fullSymptoms && uploadedFiles.length === 0) {
      setErrorMessage("Please enter symptoms, use voice dictation, or attach a document.");
      return;
    }

    if (!currentPatient) {
      setErrorMessage("Patient profile required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const vitalsObj: Vitals = {};
      if (bpSystolic) vitalsObj.bpSystolic = Number(bpSystolic);
      if (bpDiastolic) vitalsObj.bpDiastolic = Number(bpDiastolic);
      if (pulseRate) vitalsObj.pulseRate = Number(pulseRate);
      if (spo2) vitalsObj.spo2 = Number(spo2);
      if (temperature) vitalsObj.temperature = Number(temperature);
      if (bloodSugar) vitalsObj.bloodSugar = Number(bloodSugar);

      const effectiveLang = (spokenLangCode && spokenLangCode !== "auto") ? spokenLangCode : currentLanguage.code;

      const payload = {
        patientId: currentPatient._id,
        facilityType: facility,
        inputLanguage: effectiveLang,
        rawSymptomInput: symptomText.trim(),
        voiceTranscript: voiceTranscript.trim() || undefined,
        vitals: vitalsObj,
        attachments: uploadedFiles,
      };


      const res = await submitNewTriageCase(payload);
      if (res.success && res.case) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("triage_case_created", { detail: res.case }));
        }
        onCaseCreated(res.case);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || "Submission failed. Please verify server connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-card">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5cb4ee] via-[#48aae9] to-[#389ad8] text-slate-950 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#3b93ce]">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2 text-slate-950">
            <span>{t("multimodalIntakeTitle")}</span>
            <span className="text-slate-900 font-mono text-xs font-semibold bg-white/40 px-2 py-0.5 rounded border border-white/40">
              {currentPatient?.fullName} • {currentPatient?._id}
            </span>
          </h2>
        </div>

        {/* Facility Selector */}
        <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-lg border border-white/70 text-xs shadow-2xs">
          <Building2 className="w-3.5 h-3.5 text-brand-900 shrink-0" />
          <select
            value={facility}
            onChange={(e) => setFacility(e.target.value as FacilityType)}
            className="bg-transparent text-slate-950 text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="PRIMARY_HEALTH_CENTER">Primary Health Centre (PHC)</option>
            <option value="PUBLIC_HEALTH_CAMP">Public Health Outreach Camp</option>
            <option value="CAMPUS_HEALTH_CENTER">Campus Health Centre</option>
            <option value="INDUSTRIAL_HEALTH_UNIT">Industrial Estate Clinic</option>
            <option value="DISTRICT_HOSPITAL">District Hospital</option>
          </select>
        </div>
      </div>

      {/* Clean Presets Strip */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-5 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-0.5">
          <span className="text-slate-600 font-bold shrink-0">{t("sampleCasesLabel")}</span>
          {quickPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="bg-white hover:bg-brand-50 hover:border-brand-300 text-slate-800 border border-slate-200/90 px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-all shadow-2xs font-medium cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Voice & Text Section */}
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-900 block">
                {t("sectionSymptomNarrative")}
              </label>
              <span className="text-[11px] text-slate-500">
                Speak in any Indian language — Clinical AI translates to English, transcribes, and extracts vitals.
              </span>
            </div>
            
            {/* Voice Controls: Spoken Language Selector + Mic Button */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Spoken Language Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300/90 px-2.5 py-1.5 rounded-lg text-xs transition-colors shadow-2xs">
                <Languages className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">Speaking:</span>
                <select
                  value={spokenLangCode}
                  onChange={(e) => setSpokenLangCode(e.target.value)}
                  disabled={isRecording || isTranscribing}
                  className="bg-transparent text-slate-900 font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="auto">✨ Auto-Detect Spoken Language</option>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Record / Stop Button */}
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isTranscribing}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer ${
                  isRecording
                    ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                    : isTranscribing
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : "bg-brand-50 text-brand-900 hover:bg-brand-100 border border-brand-200"
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Stop Recording ({String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:{String(recordingSeconds % 60).padStart(2, "0")})</span>
                  </>
                ) : isTranscribing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                    <span>AI Processing Voice...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-brand-700" />
                    <span>{t("speakSymptoms")}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Recording Waveform Indicator */}
          {isRecording && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center justify-between gap-3 text-xs text-rose-900 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                </span>
                <span className="font-semibold">
                  Recording voice in {SUPPORTED_LANGUAGES.find((l) => l.code === spokenLangCode)?.name || "Auto-detect"}... Speak symptoms or vitals clearly.
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono font-bold text-rose-700 bg-white/80 px-2 py-0.5 rounded border border-rose-200">
                {String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:{String(recordingSeconds % 60).padStart(2, "0")}
              </div>
            </div>
          )}

          {/* AI Transcribing Spinner */}
          {isTranscribing && (
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 flex items-center gap-3 text-xs text-brand-950 animate-fadeIn">
              <Loader2 className="w-4 h-4 text-brand-600 animate-spin shrink-0" />
              <div className="flex-1">
                <span className="font-bold block text-brand-900">Gemini Clinical Multimodal AI Analyzing Audio...</span>
                <span className="text-[11px] text-slate-600">Transcribing native speech, generating clinical English translation, and extracting spoken vitals.</span>
              </div>
            </div>
          )}

          {/* Auto-filled Vitals Badge */}
          {vitalsExtractedBadge && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between text-xs text-emerald-900 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{vitalsExtractedBadge}</span>
              </div>
              <button
                type="button"
                onClick={() => setVitalsExtractedBadge(null)}
                className="text-emerald-700 hover:text-emerald-900 text-[11px] underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* DUAL-BOX DISPLAY: Original Spoken Voice + AI Clinical English Translation */}
          {(voiceTranscript || voiceTranslation) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 animate-fadeIn">
              
              {/* Box 1: Original Spoken Voice */}
              <div className="bg-brand-50/70 border border-brand-200 rounded-xl p-3.5 flex flex-col justify-between space-y-2.5 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-brand-900 font-bold text-xs">
                      <Mic className="w-3.5 h-3.5 text-brand-700" />
                      <span>Original Spoken Voice</span>
                      <span className="text-[10px] bg-brand-200/70 text-brand-900 font-semibold px-1.5 py-0.5 rounded">
                        {detectedVoiceLang || SUPPORTED_LANGUAGES.find((l) => l.code === spokenLangCode)?.nativeName || "Speech"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceTranscript("");
                        setVoiceTranslation("");
                        setDetectedVoiceLang("");
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      title="Clear speech output"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-brand-200/70 min-h-[52px]">
                    {voiceTranscript || <span className="text-slate-400 italic">No speech captured yet...</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSymptomText((prev) => (prev ? `${prev}\n${voiceTranscript}` : voiceTranscript))}
                    disabled={!voiceTranscript}
                    className="text-[11px] font-bold bg-white hover:bg-brand-100 text-brand-900 px-2.5 py-1 rounded-md border border-brand-300 shadow-2xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Use Original in Box</span>
                  </button>
                </div>
              </div>

              {/* Box 2: AI Clinical English Translation */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-col justify-between space-y-2.5 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>AI Clinical English Translation</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleManualTranslate}
                        disabled={isTranscribing || (!voiceTranscript && !symptomText)}
                        title="Translate / Re-translate text with Gemini"
                        className="text-[10px] font-bold text-emerald-900 hover:text-emerald-950 bg-white hover:bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded shadow-2xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${isTranscribing ? "animate-spin" : ""}`} />
                        <span>Translate</span>
                      </button>
                      <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-mono px-1.5 py-0.5 rounded font-semibold">
                        Gemini 1.5 Flash
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-900 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-emerald-200/70 min-h-[52px]">
                    {isTranscribing ? (
                      <span className="text-emerald-800 italic flex items-center gap-1.5 font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        Translating into clinical English with Gemini...
                      </span>
                    ) : voiceTranslation ? (
                      voiceTranslation
                    ) : (
                      <span className="text-slate-400 italic">English clinical translation will appear here...</span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSymptomText(voiceTranslation || voiceTranscript)}
                    disabled={!voiceTranslation && !voiceTranscript}
                    className="text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded-md shadow-2xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Use English for Triage</span>
                  </button>
                  {voiceTranscript && voiceTranslation && voiceTranscript !== voiceTranslation && (
                    <button
                      type="button"
                      onClick={() => setSymptomText(`${voiceTranslation} [Spoken: ${voiceTranscript}]`)}
                      className="text-[11px] font-semibold bg-white hover:bg-emerald-100 text-emerald-900 px-2 py-1 rounded-md border border-emerald-300 shadow-2xs transition-all cursor-pointer"
                    >
                      Include Both
                    </button>
                  )}
                </div>
              </div>


            </div>
          )}

          <textarea
            rows={3}
            value={symptomText}
            onChange={(e) => setSymptomText(e.target.value)}
            placeholder={t("orTypeSymptoms")}
            className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* 2. Vital Signs Form */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-brand-700" />
            <span>{t("sectionBaselineVitals")}</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">{t("bpSystolicLabel")}</label>
              <input
                type="number"
                value={bpSystolic}
                onChange={(e) => setBpSystolic(e.target.value)}
                placeholder="120"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">{t("bpDiastolicLabel")}</label>
              <input
                type="number"
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(e.target.value)}
                placeholder="80"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">{t("pulseRateLabel")}</label>
              <input
                type="number"
                value={pulseRate}
                onChange={(e) => setPulseRate(e.target.value)}
                placeholder="72"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">{t("spo2Label")}</label>
              <input
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                placeholder="98"
                className={`w-full px-2.5 py-1.5 text-xs border rounded-md focus:outline-none ${
                  spo2 && Number(spo2) < 90 ? "border-rose-400 bg-rose-50 text-rose-800 font-bold" : "border-slate-300"
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">{t("tempLabel")}</label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="98.6"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">{t("bloodSugarLabel")}</label>
              <input
                type="number"
                value={bloodSugar}
                onChange={(e) => setBloodSugar(e.target.value)}
                placeholder="110"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Document OCR & Image Upload Section */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-brand-700" />
            <span>{t("sectionAttachReport")}</span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer bg-white hover:bg-brand-50 text-slate-700 hover:text-brand-900 border border-slate-300 hover:border-brand-300 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-brand-700" />
              <span>{ocrLoading ? t("extractingData") : t("attachDocumentBtn")}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                disabled={ocrLoading}
                onChange={handleFileUpload}
              />
            </label>
            <span className="text-[11px] text-slate-500">{t("reportSupportHint")}</span>
          </div>

          {/* Quick-Load Sample Clinical Reports for Instant Testing */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 block">
              Or attach verified sample clinical reports for instant evaluation:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const sampleAtt = {
                    id: `att-${Date.now()}`,
                    type: "lab_report" as const,
                    fileName: "Dengue_CBC_Platelet_Report.pdf",
                    ocrExtractedText: "COMPLETE BLOOD COUNT (CBC): Platelet Count: 38,000 /µL (Ref: 150,000-450,000). Hematocrit: 48.2% (Elevated). Total WBC: 3,200 /µL. Impression: Severe Thrombocytopenia with Hemoconcentration suggestive of Dengue Hemorrhagic Phase.",
                    parsedValues: {
                      plateletCount: 38000,
                      hematocrit: "48.2%",
                      wbc: 3200,
                      testDate: "Today"
                    }
                  };
                  setUploadedFiles((prev) => [...prev, sampleAtt]);
                }}
                className="bg-white hover:bg-brand-50 text-brand-900 border border-brand-200 hover:border-brand-300 px-2.5 py-1 rounded text-[11px] font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <FileText className="w-3 h-3 text-brand-600" />
                <span>+ Dengue Platelet / CBC Report</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const sampleAtt = {
                    id: `att-${Date.now()}`,
                    type: "prescription" as const,
                    fileName: "Hypertension_Cardiology_Rx.jpg",
                    ocrExtractedText: "Rx CLINICAL NOTE: Tab Telmisartan 40mg 1 tab OD morning, Tab Amlodipine 5mg OD. History of essential hypertension x 6 years. Note: Patient reports skipping doses for past 2 weeks.",
                    parsedValues: {
                      medication: "Telmisartan 40mg + Amlodipine 5mg",
                      compliance: "Non-compliant (skipped 2 weeks)",
                      diagnosis: "Essential Hypertension"
                    }
                  };
                  setUploadedFiles((prev) => [...prev, sampleAtt]);
                }}
                className="bg-white hover:bg-brand-50 text-brand-900 border border-brand-200 hover:border-brand-300 px-2.5 py-1 rounded text-[11px] font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <FileText className="w-3 h-3 text-brand-600" />
                <span>+ Cardiology Rx Prescription</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const sampleAtt = {
                    id: `att-${Date.now()}`,
                    type: "lab_report" as const,
                    fileName: "Antenatal_Urine_Dipstick_Report.pdf",
                    ocrExtractedText: "URINALYSIS REPORT: Protein: 3+ (300 mg/dL - High/Abnormal). Glucose: Nil. Ketones: Negative. Leuko Esterase: Negative. Specific Gravity: 1.020. Impression: Significant Proteinuria in 3rd trimester pregnancy.",
                    parsedValues: {
                      proteinuria: "3+ (300 mg/dL)",
                      glucose: "Nil",
                      clinicalRisk: "Preeclampsia Marker"
                    }
                  };
                  setUploadedFiles((prev) => [...prev, sampleAtt]);
                }}
                className="bg-white hover:bg-brand-50 text-brand-900 border border-brand-200 hover:border-brand-300 px-2.5 py-1 rounded text-[11px] font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <FileText className="w-3 h-3 text-brand-600" />
                <span>+ Obstetric Urine Protein Report</span>
              </button>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2 mt-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/90 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4 text-brand-700 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800">{file.fileName}</span>
                      {file.ocrExtractedText && (
                        <p className="text-[11px] text-slate-500 truncate max-w-md">
                          OCR: {file.ocrExtractedText}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {t("cancelBtn")}
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || ocrLoading}
            className="btn-maya-primary text-xs px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-slate-950" />
            <span>{isSubmitting ? t("processingTriage") : t("submitTriage")}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
