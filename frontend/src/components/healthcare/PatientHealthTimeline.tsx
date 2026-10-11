"use client";

import React, { useState, useEffect } from "react";
import { 
  PatientHealthTimelineComparison, 
  TimelineCaseSummary, 
  ChangeItem, 
  StaffMember, 
  CaseStatus 
} from "../../types";
import { fetchPatientTimelineComparison } from "../../services/api";
import { StatusBadge } from "../common/StatusBadge";
import { 
  Clock, 
  Calendar, 
  GitCompare, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Filter, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  UserCheck, 
  PlusCircle, 
  MinusCircle, 
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from "lucide-react";

interface PatientHealthTimelineProps {
  caseId: string;
  currentStaff?: StaffMember | null;
  onClose?: () => void;
  onSelectCase?: (caseSummary: TimelineCaseSummary) => void;
}

export const PatientHealthTimeline: React.FC<PatientHealthTimelineProps> = ({
  caseId,
  currentStaff,
  onClose,
  onSelectCase,
}) => {
  const [data, setData] = useState<PatientHealthTimelineComparison | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState<"ALL" | "7D" | "30D" | "90D">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CaseStatus>("ALL");
  const [activeTab, setActiveTab] = useState<"CHANGE_DETECTION" | "TIMELINE">("CHANGE_DETECTION");

  // Expanded details for timeline items
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(caseId);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPatientTimelineComparison(caseId, currentStaff?._id);
      if (res.success && res.comparison) {
        setData(res.comparison);
      } else {
        setError(res.error || "Failed to load timeline comparison.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || err.message || "Failed to retrieve health timeline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      loadTimelineData();
    }
  }, [caseId, currentStaff?._id]);

  // Apply filters to timeline cases
  const filteredTimelineCases = (data?.timelineCases || []).filter((item) => {
    // Status filter
    if (statusFilter !== "ALL" && item.status !== statusFilter) {
      return false;
    }

    // Date filter
    if (dateFilter !== "ALL") {
      const caseDate = new Date(item.submissionDate).getTime();
      const now = Date.now();
      const days = dateFilter === "7D" ? 7 : dateFilter === "30D" ? 30 : 90;
      if (now - caseDate > days * 24 * 3600 * 1000) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 space-y-3">
        <RefreshCw className="w-8 h-8 text-[#5cb4ee] animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-200">
          Auditing Patient Health Timeline & Comparing Historical Cases...
        </p>
        <p className="text-xs text-slate-400">
          Source-grounded verification running across all recorded patient encounters.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800/80 rounded-xl text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-red-400 mx-auto" />
        <h4 className="text-sm font-bold text-red-200">Access Restricted or Error Occurred</h4>
        <p className="text-xs text-red-300 max-w-md mx-auto">{error || "Unable to display medical history."}</p>
        <button
          onClick={loadTimelineData}
          className="px-3 py-1.5 bg-red-800/60 hover:bg-red-700/60 text-white rounded text-xs font-semibold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#5cb4ee]" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Patient Health Timeline & Change Detection
            </h3>
            {data.isReturningPatient ? (
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/30">
                Returning Patient ({data.totalCasesCount} Encounters)
              </span>
            ) : (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                First Recorded Encounter
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Patient: <span className="text-slate-200 font-semibold">{data.patientName}</span> [{data.patientId}] • Current Encounter: <span className="font-mono text-slate-300">{data.currentCaseId}</span>
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab("CHANGE_DETECTION")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "CHANGE_DETECTION"
                ? "bg-[#5cb4ee] text-slate-950 shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Change Detection ({data.newlyReportedInfo.length + data.previouslyReportedAbsent.length + data.conflictingOrDifferingInfo.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("TIMELINE")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "TIMELINE"
                ? "bg-[#5cb4ee] text-slate-950 shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chronological Timeline ({data.timelineCases.length})</span>
          </button>
        </div>
      </div>

      {/* Strict Non-Diagnostic Medical Notice */}
      <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-[#5cb4ee] shrink-0" />
        <span>
          <strong>Clinical Safety Protocol:</strong> Observations reflect strictly documented records across encounters. This tool does not infer automated disease diagnoses, worsening of conditions, or clinical resolution from absence.
        </span>
      </div>

      {/* Main Body */}
      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        
        {/* ===================== TAB 1: CHANGE DETECTION ===================== */}
        {activeTab === "CHANGE_DETECTION" && (
          <div className="space-y-4">
            
            {/* AI / Deterministic Factual Summary Box */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900 border border-slate-700 rounded-lg p-3.5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#5cb4ee]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Source-Grounded Change Synthesis
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  data.isAiGenerated 
                    ? "bg-purple-900/30 text-purple-300 border-purple-700/50" 
                    : "bg-blue-900/30 text-blue-300 border-blue-700/50"
                }`}>
                  {data.isAiGenerated ? "AI Synthesized (Gemini 3.8 Flash)" : "Deterministic Rule Engine (High Reliability)"}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {data.factualSummary}
              </p>

              {/* Verified Facts & Flagged Discrepancies Chips */}
              {(data.verifiedFacts.length > 0 || data.flaggedDiscrepancies.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-[11px]">
                  {data.verifiedFacts.length > 0 && (
                    <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                      <span className="text-emerald-400 font-bold block mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified Documented Facts
                      </span>
                      <ul className="space-y-0.5 text-slate-300 list-disc list-inside">
                        {data.verifiedFacts.slice(0, 4).map((f, i) => (
                          <li key={i} className="truncate">{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.flaggedDiscrepancies.length > 0 && (
                    <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                      <span className="text-amber-400 font-bold block mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Flagged Documented Discrepancies
                      </span>
                      <ul className="space-y-0.5 text-slate-300 list-disc list-inside">
                        {data.flaggedDiscrepancies.slice(0, 4).map((d, i) => (
                          <li key={i} className="truncate">{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!data.isReturningPatient ? (
              <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-lg text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold text-white">First Encounter for this Citizen</h4>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  No previous historical cases exist in the database for this Patient ID. Baseline clinical parameters have been established for this visit. Future visits will automatically generate comparative change detection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                
                {/* SECTION A: NEWLY REPORTED INFORMATION */}
                <div className="bg-slate-800/60 border border-emerald-900/50 rounded-lg overflow-hidden shadow-xs">
                  <div className="bg-emerald-950/40 border-b border-emerald-900/50 px-3.5 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-emerald-200">
                        Section A: Newly Reported Information ({data.newlyReportedInfo.length})
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-400/80 font-mono">Present only in current encounter</span>
                  </div>

                  <div className="p-3 space-y-2">
                    {data.newlyReportedInfo.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">
                        No novel symptoms, vitals, or reports reported in current case compared to previous visits.
                      </p>
                    ) : (
                      data.newlyReportedInfo.map((item) => (
                        <div key={item.id} className="bg-slate-900/70 border border-slate-700/60 p-2.5 rounded text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{item.title}</span>
                            <span className="bg-emerald-900/40 text-emerald-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-800/50">
                              Current: {item.sourceCaseIdCurrent}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300">{item.description}</p>
                          {item.observationNote && (
                            <p className="text-[10px] text-slate-400 italic font-mono bg-slate-950/40 px-2 py-0.5 rounded">
                              {item.observationNote}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* SECTION B: PREVIOUSLY REPORTED (NOT MENTIONED CURRENTLY) */}
                <div className="bg-slate-800/60 border border-amber-900/50 rounded-lg overflow-hidden shadow-xs">
                  <div className="bg-amber-950/40 border-b border-amber-900/50 px-3.5 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MinusCircle className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-amber-200">
                        Section B: Previously Reported Information Not Mentioned in Current Submission ({data.previouslyReportedAbsent.length})
                      </h4>
                    </div>
                    <span className="text-[10px] text-amber-400/80 font-mono">Documented previously • Absent now</span>
                  </div>

                  <div className="p-3 space-y-2">
                    {data.previouslyReportedAbsent.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">
                        All previously documented symptoms continue to be tracked in current submission.
                      </p>
                    ) : (
                      data.previouslyReportedAbsent.map((item) => (
                        <div key={item.id} className="bg-slate-900/70 border border-slate-700/60 p-2.5 rounded text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">{item.title}</span>
                            <span className="bg-amber-900/40 text-amber-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-amber-800/50">
                              Previous: {item.sourceCaseIdPrevious} ({item.sourceDatePrevious})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300">{item.description}</p>
                          <p className="text-[10px] text-amber-300/80 italic font-mono bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/30">
                            {item.observationNote}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* SECTION C: INFORMATION DIFFERENT OR CONFLICTING */}
                <div className="bg-slate-800/60 border border-purple-900/50 rounded-lg overflow-hidden shadow-xs">
                  <div className="bg-purple-950/40 border-b border-purple-900/50 px-3.5 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold text-purple-200">
                        Section C: Information That Appears Different, Conflicting, or Recurrent ({data.conflictingOrDifferingInfo.length})
                      </h4>
                    </div>
                    <span className="text-[10px] text-purple-400/80 font-mono">Comparative Differentials</span>
                  </div>

                  <div className="p-3 space-y-2">
                    {data.conflictingOrDifferingInfo.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">
                        No differing vital sign measurements or conflicting timeline parameters detected across encounters.
                      </p>
                    ) : (
                      data.conflictingOrDifferingInfo.map((item) => (
                        <div key={item.id} className="bg-slate-900/70 border border-slate-700/60 p-2.5 rounded text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-200">{item.title}</span>
                            <div className="flex items-center gap-1 text-[10px] font-mono">
                              <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                                {item.sourceCaseIdPrevious}
                              </span>
                              <span>➔</span>
                              <span className="bg-[#5cb4ee]/20 text-[#5cb4ee] px-1.5 py-0.5 rounded border border-[#5cb4ee]/40">
                                {item.sourceCaseIdCurrent}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-300">{item.description}</p>

                          {item.previousValue && item.currentValue && (
                            <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/50 p-1.5 rounded border border-slate-800">
                              <div>
                                <span className="text-slate-400 block">Documented on {item.sourceDatePrevious}:</span>
                                <span className="font-mono text-slate-200 font-semibold">{item.previousValue}</span>
                              </div>
                              <div>
                                <span className="text-[#5cb4ee] block">Documented on {item.sourceDateCurrent}:</span>
                                <span className="font-mono text-white font-semibold">{item.currentValue}</span>
                              </div>
                            </div>
                          )}

                          {item.observationNote && (
                            <p className="text-[10px] text-slate-400 italic font-mono bg-slate-950/40 px-2 py-0.5 rounded">
                              {item.observationNote}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ===================== TAB 2: CHRONOLOGICAL TIMELINE ===================== */}
        {activeTab === "TIMELINE" && (
          <div className="space-y-3">
            
            {/* Filter Toolbar */}
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 font-medium">Filter Visits:</span>
                
                {/* Date Filter */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none"
                >
                  <option value="ALL">All Recorded Dates</option>
                  <option value="7D">Last 7 Days</option>
                  <option value="30D">Last 30 Days</option>
                  <option value="90D">Last 90 Days</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REFERRED">Referred</option>
                </select>
              </div>

              <span className="text-[11px] text-slate-400">
                Showing {filteredTimelineCases.length} of {data.timelineCases.length} case records
              </span>
            </div>

            {/* Vertical Chronological Case Cards */}
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
              {filteredTimelineCases.map((entry, index) => {
                const isCurrent = entry.caseId === caseId;
                const isExpanded = expandedCaseId === entry.caseId;

                return (
                  <div key={entry.caseId} className="relative pl-8">
                    {/* Node Dot */}
                    <div className={`absolute left-2 top-3 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 ${
                      isCurrent
                        ? "bg-[#5cb4ee] border-white shadow-xs"
                        : "bg-slate-700 border-slate-900"
                    }`} />

                    <div className={`bg-slate-800/90 rounded-lg border transition-all ${
                      isCurrent ? "border-[#5cb4ee]/70 shadow-md" : "border-slate-700/80"
                    }`}>
                      {/* Entry Header */}
                      <div 
                        onClick={() => setExpandedCaseId(isExpanded ? null : entry.caseId)}
                        className="p-3 cursor-pointer flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 hover:bg-slate-750"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-xs">{entry.caseId}</span>
                            <span className="font-mono text-[11px] text-[#5cb4ee] font-semibold bg-slate-900 px-1.5 py-0.2 rounded border border-slate-700">
                              {entry.tokenNumber}
                            </span>
                            {isCurrent && (
                              <span className="bg-[#5cb4ee]/20 text-[#5cb4ee] text-[10px] font-bold px-1.5 py-0.2 rounded border border-[#5cb4ee]/40">
                                Current Active Case
                              </span>
                            )}
                            <StatusBadge urgency={entry.triageOutput.urgencyLevel} size="sm" />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Submitted: <span className="text-slate-200">{entry.submissionDate}</span> • Facility: {entry.facilityType.replace(/_/g, " ")} • Status: <span className="font-semibold text-slate-300">{entry.status}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Summary Strip */}
                      <div className="px-3 py-2 bg-slate-900/40 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400 text-[11px]">Complaints:</span>
                          {entry.chiefComplaints.map((c, i) => (
                            <span key={i} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px] border border-slate-700">
                              {c}
                            </span>
                          ))}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Duration: <span className="text-slate-200">{entry.symptomDuration}</span>
                        </div>
                      </div>

                      {/* Expandable Permitted Details */}
                      {isExpanded && (
                        <div className="p-3.5 space-y-3 text-xs bg-slate-900/80">
                          
                          {/* 1. Patient Symptom Narrative */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                              Reported Symptom Narrative
                            </span>
                            <p className="text-slate-200 text-xs bg-slate-950 p-2 rounded border border-slate-800">
                              {entry.symptomDescription}
                            </p>
                          </div>

                          {/* 2. Recorded Vitals Grid */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                              Recorded Clinical Vitals
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-center text-xs">
                              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">BP</span>
                                <span className="font-mono font-bold text-white">
                                  {entry.vitals?.bpSystolic && entry.vitals?.bpDiastolic ? `${entry.vitals.bpSystolic}/${entry.vitals.bpDiastolic}` : "--"}
                                </span>
                              </div>
                              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">Pulse</span>
                                <span className="font-mono font-bold text-white">
                                  {entry.vitals?.pulseRate ? `${entry.vitals.pulseRate} bpm` : "--"}
                                </span>
                              </div>
                              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">SpO2</span>
                                <span className="font-mono font-bold text-white">
                                  {entry.vitals?.spo2 ? `${entry.vitals.spo2}%` : "--"}
                                </span>
                              </div>
                              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">Temp</span>
                                <span className="font-mono font-bold text-white">
                                  {entry.vitals?.temperature ? `${entry.vitals.temperature}°F` : "--"}
                                </span>
                              </div>
                              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">Blood Sugar</span>
                                <span className="font-mono font-bold text-white">
                                  {entry.vitals?.bloodSugar ? `${entry.vitals.bloodSugar} mg/dL` : "--"}
                                </span>
                              </div>
                              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">Resp. Rate</span>
                                <span className="font-mono font-bold text-white">
                                  {entry.vitals?.respiratoryRate ? `${entry.vitals.respiratoryRate}/min` : "--"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 3. Uploaded Reports References */}
                          {entry.uploadedReports.length > 0 && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Uploaded Report References ({entry.uploadedReports.length})
                              </span>
                              <div className="space-y-1.5">
                                {entry.uploadedReports.map((r, i) => (
                                  <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <FileText className="w-3.5 h-3.5 text-[#5cb4ee]" />
                                      <span className="font-mono text-slate-200">{r.fileName}</span>
                                      <span className="text-[10px] text-slate-400">({r.type})</span>
                                    </div>
                                    {r.ocrExtractedText && (
                                      <span className="text-[10px] text-slate-400 truncate max-w-xs italic">
                                        {r.ocrExtractedText.slice(0, 60)}...
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 4. Follow-up Responses */}
                          {entry.followUpResponses.length > 0 && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Follow-up Clinical Inquiries
                              </span>
                              <div className="space-y-1">
                                {entry.followUpResponses.map((f, i) => (
                                  <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] space-y-0.5">
                                    <p className="text-slate-400 font-medium">Q: {f.question}</p>
                                    <p className="text-slate-200 font-semibold">A: {f.answer}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 5. Doctor Review & Recorded Reviewer Actions */}
                          {entry.doctorReview && (
                            <div className="bg-slate-950 p-2.5 rounded border border-indigo-900/60 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5" /> Doctor Review Recorded
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {entry.doctorReview.doctorName} • {entry.doctorReview.doctorRole}
                                </span>
                              </div>
                              {entry.doctorReview.clinicalImpression && (
                                <p className="text-[11px] text-slate-200">
                                  <strong>Impression:</strong> {entry.doctorReview.clinicalImpression}
                                </p>
                              )}
                              {entry.doctorReview.prescribedMedications && entry.doctorReview.prescribedMedications.length > 0 && (
                                <div className="text-[10px] text-slate-300">
                                  <strong>Prescribed Rx:</strong> {entry.doctorReview.prescribedMedications.join("; ")}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 6. Reviewer Actions / Audit Trail */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                              Recorded Actions & Audit Trail
                            </span>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {entry.reviewerActions.map((act, i) => (
                                <div key={i} className="bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800 text-[10px] flex items-center justify-between">
                                  <span className="text-slate-300">
                                    <strong>{act.actor}</strong>: {act.details || act.action}
                                  </span>
                                  <span className="text-slate-500 font-mono">{act.timestamp}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
