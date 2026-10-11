import { CaseRecord, ChangeItem, Patient, PatientHealthTimelineComparison, TimelineCaseSummary } from "../models/types.js";
import { getGeminiClient } from "../config/gemini.js";

function formatDate(d: Date | string | undefined): string {
  if (!d) return "Unknown Date";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  return dateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, "");
}

/**
 * Builds deterministic, source-grounded comparison between the current case
 * and previous recorded cases for a patient.
 * STRICT CLINICAL SAFETY: Non-diagnostic, strictly fact-based, no progression or resolution assumptions.
 */
export function buildDeterministicTimelineComparison(
  currentCase: CaseRecord,
  allPatientCases: CaseRecord[],
  patient: Patient
): PatientHealthTimelineComparison {
  // Sort cases chronologically (newest first for timeline presentation)
  const sortedCases = [...allPatientCases].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalCasesCount = sortedCases.length;
  const isReturningPatient = totalCasesCount > 1;

  // Filter previous cases excluding current case
  const previousCases = sortedCases.filter((c) => c._id !== currentCase._id);

  // Map into TimelineCaseSummary format
  const timelineCases: TimelineCaseSummary[] = sortedCases.map((c) => ({
    caseId: c._id,
    tokenNumber: c.tokenNumber,
    facilityType: c.facilityType,
    status: c.status,
    submissionDate: formatDate(c.createdAt),
    chiefComplaints: c.triageOutput?.chiefComplaints || [],
    symptomDuration: c.symptomDuration || c.triageOutput?.timelineSummary || "Duration not specified",
    symptomDescription: c.translatedEnglishInput || c.rawSymptomInput,
    vitals: c.vitals || {},
    uploadedReports: (c.attachments || []).map((att) => ({
      id: att.id,
      type: att.type,
      fileName: att.fileName,
      ocrExtractedText: att.ocrExtractedText,
      parsedValues: att.parsedValues,
    })),
    followUpResponses: (c.followUpResponses || []).map((f) => ({
      question: f.question,
      answer: f.answer,
      recordedAt: formatDate(f.recordedAt),
    })),
    triageOutput: {
      urgencyLevel: c.triageOutput.urgencyLevel,
      urgencyScore: c.triageOutput.urgencyScore,
      urgencyReason: c.triageOutput.urgencyReason,
      timelineSummary: c.triageOutput.timelineSummary,
      chiefComplaints: c.triageOutput.chiefComplaints || [],
      suggestedFollowUpQuestions: c.triageOutput.suggestedFollowUpQuestions || [],
    },
    doctorReview: c.doctorReview,
    reviewerActions: [
      ...(c.doctorReview ? [{
        action: c.doctorReview.referralDetails?.isReferred ? "CASE_REFERRED" : "CASE_REVIEWED",
        actor: `${c.doctorReview.doctorName || "Doctor"} (${c.doctorReview.doctorRole || "Medical Officer"})`,
        timestamp: formatDate(c.doctorReview.signedAt),
        details: c.doctorReview.clinicalImpression || "Clinical review recorded",
      }] : []),
      ...(c.auditTrail || []).map((log) => ({
        action: log.action,
        actor: log.actor,
        timestamp: formatDate(log.timestamp),
        details: log.details,
      })),
    ],
  }));

  const newlyReportedInfo: ChangeItem[] = [];
  const previouslyReportedAbsent: ChangeItem[] = [];
  const conflictingOrDifferingInfo: ChangeItem[] = [];
  const verifiedFacts: string[] = [];
  const flaggedDiscrepancies: string[] = [];

  if (!isReturningPatient || previousCases.length === 0) {
    // New patient with no prior history
    return {
      patientId: patient._id,
      patientName: patient.fullName,
      currentCaseId: currentCase._id,
      totalCasesCount: 1,
      isReturningPatient: false,
      newlyReportedInfo: [],
      previouslyReportedAbsent: [],
      conflictingOrDifferingInfo: [],
      factualSummary: `First recorded encounter for ${patient.fullName} (${patient._id}). No previous clinical cases are documented in the system. Baseline records established on ${formatDate(currentCase.createdAt)}.`,
      isAiGenerated: false,
      verifiedFacts: [
        `Encounter ${currentCase._id} initiated on ${formatDate(currentCase.createdAt)}.`,
        `Patient age: ${patient.age}, Sex: ${patient.sex}, Blood Group: ${patient.bloodGroup || "Unknown"}.`,
      ],
      flaggedDiscrepancies: [],
      timelineCases,
    };
  }

  // Reference the most recent prior case for direct differential, and collect all historical symptoms
  const mostRecentPrevCase = previousCases[0];
  const allHistoricalComplaints = new Set<string>();
  const historicalComplaintSourceMap = new Map<string, { caseId: string; date: string }>();

  previousCases.forEach((prev) => {
    (prev.triageOutput?.chiefComplaints || []).forEach((comp) => {
      const norm = normalizeText(comp);
      allHistoricalComplaints.add(norm);
      if (!historicalComplaintSourceMap.has(norm)) {
        historicalComplaintSourceMap.set(norm, {
          caseId: prev._id,
          date: formatDate(prev.createdAt),
        });
      }
    });
  });

  const currentComplaints = currentCase.triageOutput?.chiefComplaints || [];
  const currentNormalized = new Set(currentComplaints.map(normalizeText));

  // 1. SECTION A: Newly Reported Information (Present in current, not in historical cases)
  currentComplaints.forEach((comp, idx) => {
    const norm = normalizeText(comp);
    let matchedPrior = false;
    for (const hist of allHistoricalComplaints) {
      if (hist.includes(norm) || norm.includes(hist)) {
        matchedPrior = true;
        break;
      }
    }

    if (!matchedPrior) {
      newlyReportedInfo.push({
        id: `new-comp-${idx}`,
        category: "complaint",
        title: comp,
        description: `Reported as chief complaint in current case. Not documented in previous recorded cases.`,
        currentValue: comp,
        sourceCaseIdCurrent: currentCase._id,
        sourceDateCurrent: formatDate(currentCase.createdAt),
        observationNote: `Documented for the first time in current encounter.`,
      });
      verifiedFacts.push(`New symptom "${comp}" reported on ${formatDate(currentCase.createdAt)} (Case: ${currentCase._id}).`);
    }
  });

  // Check for newly uploaded reports / attachments
  if (currentCase.attachments && currentCase.attachments.length > 0) {
    currentCase.attachments.forEach((att, idx) => {
      const existsPreviously = previousCases.some((p) =>
        (p.attachments || []).some((pa) => pa.fileName === att.fileName)
      );
      if (!existsPreviously) {
        newlyReportedInfo.push({
          id: `new-att-${idx}`,
          category: "lab_report",
          title: `Uploaded Document: ${att.fileName}`,
          description: `Document of type "${att.type.replace(/_/g, " ")}" attached to current case.`,
          currentValue: att.fileName,
          sourceCaseIdCurrent: currentCase._id,
          sourceDateCurrent: formatDate(currentCase.createdAt),
          observationNote: att.ocrExtractedText
            ? `OCR Text: ${att.ocrExtractedText.slice(0, 100)}...`
            : "No previous upload matching this document name.",
        });
      }
    });
  }

  // Check for newly documented vitals (present now, absent in most recent previous case)
  const currV = currentCase.vitals || {};
  const prevV = mostRecentPrevCase.vitals || {};

  if (currV.bloodSugar !== undefined && prevV.bloodSugar === undefined) {
    newlyReportedInfo.push({
      id: "new-vital-bs",
      category: "vital",
      title: "Blood Glucose Reading",
      description: `Blood sugar recorded as ${currV.bloodSugar} mg/dL in current case; was not recorded in prior encounter (${mostRecentPrevCase._id}).`,
      currentValue: `${currV.bloodSugar} mg/dL`,
      sourceCaseIdCurrent: currentCase._id,
      sourceDateCurrent: formatDate(currentCase.createdAt),
      sourceCaseIdPrevious: mostRecentPrevCase._id,
      sourceDatePrevious: formatDate(mostRecentPrevCase.createdAt),
    });
  }

  // 2. SECTION B: Previously Reported Information Not Mentioned in Current Submission
  previousCases.forEach((prev) => {
    (prev.triageOutput?.chiefComplaints || []).forEach((prevComp, idx) => {
      const norm = normalizeText(prevComp);
      let presentInCurrent = false;
      for (const currNorm of currentNormalized) {
        if (currNorm.includes(norm) || norm.includes(currNorm)) {
          presentInCurrent = true;
          break;
        }
      }

      if (!presentInCurrent) {
        const alreadyAdded = previouslyReportedAbsent.some(
          (item) => normalizeText(item.title) === norm
        );
        if (!alreadyAdded) {
          previouslyReportedAbsent.push({
            id: `absent-comp-${prev._id}-${idx}`,
            category: "complaint",
            title: prevComp,
            description: `Documented on ${formatDate(prev.createdAt)} (Case: ${prev._id}). Not mentioned in current submission on ${formatDate(currentCase.createdAt)}.`,
            previousValue: prevComp,
            sourceCaseIdCurrent: currentCase._id,
            sourceDateCurrent: formatDate(currentCase.createdAt),
            sourceCaseIdPrevious: prev._id,
            sourceDatePrevious: formatDate(prev.createdAt),
            observationNote: `Absence on current intake form indicates it was not recorded on this submission. No inference is made regarding clinical resolution.`,
          });
          verifiedFacts.push(`Previously noted symptom "${prevComp}" (documented on ${formatDate(prev.createdAt)}) is not recorded on current submission.`);
        }
      }
    });
  });

  // 3. SECTION C: Information That Appears Different or Conflicting
  // Compare Vitals between most recent previous case and current case
  const vitalKeys: Array<{ key: keyof typeof currV; label: string; unit: string; diffThreshold: number }> = [
    { key: "bpSystolic", label: "Systolic Blood Pressure", unit: "mmHg", diffThreshold: 10 },
    { key: "bpDiastolic", label: "Diastolic Blood Pressure", unit: "mmHg", diffThreshold: 10 },
    { key: "pulseRate", label: "Heart Rate / Pulse", unit: "bpm", diffThreshold: 10 },
    { key: "spo2", label: "Oxygen Saturation (SpO2)", unit: "%", diffThreshold: 2 },
    { key: "temperature", label: "Body Temperature", unit: "°F", diffThreshold: 0.8 },
    { key: "respiratoryRate", label: "Respiratory Rate", unit: "/min", diffThreshold: 4 },
    { key: "bloodSugar", label: "Blood Sugar", unit: "mg/dL", diffThreshold: 25 },
  ];

  vitalKeys.forEach((vk) => {
    const cVal = currV[vk.key];
    const pVal = prevV[vk.key];

    if (cVal !== undefined && pVal !== undefined && typeof cVal === "number" && typeof pVal === "number") {
      const diff = cVal - pVal;
      if (Math.abs(diff) >= vk.diffThreshold) {
        const sign = diff > 0 ? `+${diff}` : `${diff}`;
        conflictingOrDifferingInfo.push({
          id: `vital-diff-${String(vk.key)}`,
          category: "vital",
          title: vk.label,
          description: `Recorded value changed from ${pVal} ${vk.unit} to ${cVal} ${vk.unit} (Difference: ${sign} ${vk.unit}).`,
          previousValue: `${pVal} ${vk.unit}`,
          currentValue: `${cVal} ${vk.unit}`,
          sourceCaseIdCurrent: currentCase._id,
          sourceDateCurrent: formatDate(currentCase.createdAt),
          sourceCaseIdPrevious: mostRecentPrevCase._id,
          sourceDatePrevious: formatDate(mostRecentPrevCase.createdAt),
          observationNote: `Values documented across two separate clinical measurements.`,
        });
        flaggedDiscrepancies.push(`${vk.label}: ${pVal} ${vk.unit} (${formatDate(mostRecentPrevCase.createdAt)}) vs ${cVal} ${vk.unit} (${formatDate(currentCase.createdAt)}).`);
      }
    }
  });

  // Compare Blood Pressure compound (Systolic/Diastolic together if recorded)
  if (currV.bpSystolic && currV.bpDiastolic && prevV.bpSystolic && prevV.bpDiastolic) {
    const prevBP = `${prevV.bpSystolic}/${prevV.bpDiastolic} mmHg`;
    const currBP = `${currV.bpSystolic}/${currV.bpDiastolic} mmHg`;
    if (prevBP !== currBP) {
      const existingSys = conflictingOrDifferingInfo.some((item) => item.id === "vital-diff-bpSystolic");
      if (!existingSys) {
        conflictingOrDifferingInfo.push({
          id: "vital-diff-bp",
          category: "vital",
          title: "Blood Pressure Reading",
          description: `Recorded as ${prevBP} on ${formatDate(mostRecentPrevCase.createdAt)} vs ${currBP} on ${formatDate(currentCase.createdAt)}.`,
          previousValue: prevBP,
          currentValue: currBP,
          sourceCaseIdCurrent: currentCase._id,
          sourceDateCurrent: formatDate(currentCase.createdAt),
          sourceCaseIdPrevious: mostRecentPrevCase._id,
          sourceDatePrevious: formatDate(mostRecentPrevCase.createdAt),
          observationNote: "Comparative blood pressure readings between encounters.",
        });
      }
    }
  }

  // Recurrent Symptoms (Present in BOTH prior and current cases)
  currentComplaints.forEach((comp, idx) => {
    const norm = normalizeText(comp);
    previousCases.forEach((prev) => {
      const prevMatched = (prev.triageOutput?.chiefComplaints || []).find((pc) => {
        const pNorm = normalizeText(pc);
        return pNorm.includes(norm) || norm.includes(pNorm);
      });

      if (prevMatched) {
        conflictingOrDifferingInfo.push({
          id: `recurrent-${prev._id}-${idx}`,
          category: "complaint",
          title: `Recurrent Symptom: ${comp}`,
          description: `The patient reported this symptom in previous encounter (${prev._id} on ${formatDate(prev.createdAt)}) and reported it again in current encounter (${currentCase._id} on ${formatDate(currentCase.createdAt)}).`,
          previousValue: `Reported on ${formatDate(prev.createdAt)}`,
          currentValue: `Reported on ${formatDate(currentCase.createdAt)}`,
          sourceCaseIdCurrent: currentCase._id,
          sourceDateCurrent: formatDate(currentCase.createdAt),
          sourceCaseIdPrevious: prev._id,
          sourceDatePrevious: formatDate(prev.createdAt),
          observationNote: `Documented in two separate cases. Stored records confirm reporting across encounters.`,
        });
        verifiedFacts.push(`Symptom "${comp}" documented in both Case ${prev._id} and Case ${currentCase._id}.`);
      }
    });
  });

  // Symptom duration differences if documented
  const currentDuration = currentCase.symptomDuration || currentCase.triageOutput?.timelineSummary || "";
  const prevDuration = mostRecentPrevCase.symptomDuration || mostRecentPrevCase.triageOutput?.timelineSummary || "";
  if (currentDuration && prevDuration && currentDuration !== prevDuration) {
    conflictingOrDifferingInfo.push({
      id: "duration-diff",
      category: "duration",
      title: "Patient-Reported Symptom Timeline / Duration",
      description: `Previous case reported duration: "${prevDuration}". Current case reports duration: "${currentDuration}".`,
      previousValue: prevDuration,
      currentValue: currentDuration,
      sourceCaseIdCurrent: currentCase._id,
      sourceDateCurrent: formatDate(currentCase.createdAt),
      sourceCaseIdPrevious: mostRecentPrevCase._id,
      sourceDatePrevious: formatDate(mostRecentPrevCase.createdAt),
      observationNote: `Durations recorded as communicated by patient across separate triage encounters.`,
    });
    flaggedDiscrepancies.push(`Reported timeline changed: Previous "${prevDuration}" vs Current "${currentDuration}".`);
  }

  // Build factual summary statement (deterministic fallback)
  const factualSummary = `Returning patient with ${totalCasesCount} total documented encounters (Current: ${currentCase._id} on ${formatDate(currentCase.createdAt)}, Previous: ${mostRecentPrevCase._id} on ${formatDate(mostRecentPrevCase.createdAt)}). ` +
    `${newlyReportedInfo.length} newly reported parameter(s), ${previouslyReportedAbsent.length} previously documented symptom(s) not mentioned in current submission, and ${conflictingOrDifferingInfo.length} parameter difference(s) recorded. ` +
    `Data reflects stored records across separate encounters. No clinical diagnosis is inferred.`;

  return {
    patientId: patient._id,
    patientName: patient.fullName,
    currentCaseId: currentCase._id,
    totalCasesCount,
    isReturningPatient,
    newlyReportedInfo,
    previouslyReportedAbsent,
    conflictingOrDifferingInfo,
    factualSummary,
    isAiGenerated: false,
    verifiedFacts,
    flaggedDiscrepancies,
    timelineCases,
  };
}

/**
 * AI-assisted summary of documented changes using structured, source-grounded data.
 * STRICT CLINICAL SAFETY GUARDRAILS:
 * - Distinguishes known facts from missing information.
 * - Never invents dates, symptoms, or values.
 * - Preserves distinction between patient-reported info and report data.
 * - Flags contradictions without guessing.
 * - Non-diagnostic: avoids predicting disease or claiming recovery.
 */
export async function summarizeTimelineChangesWithAI(
  comparison: PatientHealthTimelineComparison
): Promise<{
  factualSummary: string;
  isAiGenerated: boolean;
  verifiedFacts: string[];
  flaggedDiscrepancies: string[];
}> {
  const gemini = getGeminiClient();

  if (!gemini) {
    // Graceful offline fallback
    return {
      factualSummary: comparison.factualSummary,
      isAiGenerated: false,
      verifiedFacts: comparison.verifiedFacts,
      flaggedDiscrepancies: comparison.flaggedDiscrepancies,
    };
  }

  try {
    const model = gemini.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1, // Zero hallucination / strict factual adherence
      },
    });

    const prompt = `
You are a Clinical Records Audit AI for a Hospital Triage System.
Your job is to produce a STRICTLY SOURCE-GROUNDED factual change summary comparing a returning patient's current case with their prior documented cases.

MANDATORY RULES:
1. NON-DIAGNOSTIC: Do NOT conclude that the patient has a disease, that a condition has worsened, or that an earlier symptom resolved merely because it is absent from a later form.
2. DISTINGUISH FACTS: Clearly distinguish between patient-reported symptoms and lab/report findings.
3. PRESERVE DATES & SOURCES: Explicitly cite Case IDs and recorded dates for every statement.
4. FLAG CONTRADICTIONS: If measurements or reported durations conflict, flag them as factual differences; do not guess or reconcile them.
5. NO INVENTIONS: Do not invent any symptoms, vitals, or dates not provided in the input.

INPUT DATA:
- Patient: ${comparison.patientName} (${comparison.patientId})
- Current Case ID: ${comparison.currentCaseId}
- Total Documented Encounters: ${comparison.totalCasesCount}
- Section A (Newly Reported): ${JSON.stringify(comparison.newlyReportedInfo)}
- Section B (Previously Documented, Absent in Current Submission): ${JSON.stringify(comparison.previouslyReportedAbsent)}
- Section C (Different or Conflicting Values): ${JSON.stringify(comparison.conflictingOrDifferingInfo)}

OUTPUT FORMAT (Respond ONLY in JSON):
{
  "factualSummary": "Concise factual summary (3-4 sentences) citing Case IDs and dates. Strictly non-diagnostic.",
  "verifiedFacts": ["List of strictly verified factual statements with source Case IDs and dates"],
  "flaggedDiscrepancies": ["List of noted measurement or duration differences across records"]
}
`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    return {
      factualSummary: parsed.factualSummary || comparison.factualSummary,
      isAiGenerated: true,
      verifiedFacts: Array.isArray(parsed.verifiedFacts) && parsed.verifiedFacts.length > 0
        ? parsed.verifiedFacts
        : comparison.verifiedFacts,
      flaggedDiscrepancies: Array.isArray(parsed.flaggedDiscrepancies) && parsed.flaggedDiscrepancies.length > 0
        ? parsed.flaggedDiscrepancies
        : comparison.flaggedDiscrepancies,
    };
  } catch (err) {
    console.warn("⚠️ AI Timeline summarization error, falling back to deterministic engine:", (err as Error).message);
    return {
      factualSummary: comparison.factualSummary,
      isAiGenerated: false,
      verifiedFacts: comparison.verifiedFacts,
      flaggedDiscrepancies: comparison.flaggedDiscrepancies,
    };
  }
}
