import { Request, Response } from "express";
import { store } from "../services/mockStore.service.js";
import { generateCaseId, generateQueueToken } from "../utils/tokenGenerator.js";
import { processTriageWithAI } from "../services/gemini.service.js";
import { CaseRecord, DoctorReview } from "../models/types.js";
import { buildDeterministicTimelineComparison, summarizeTimelineChangesWithAI } from "../services/timelineChangeDetector.service.js";

export const createCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patientId,
      facilityType = "PRIMARY_HEALTH_CENTER",
      inputLanguage = "en",
      rawSymptomInput,
      voiceTranscript,
      symptomDuration,
      followUpResponses,
      vitals = {},
      attachments = [],
    } = req.body;

    if (!patientId || (!rawSymptomInput && !voiceTranscript)) {
      res.status(400).json({ error: "patientId and symptom details are required." });
      return;
    }

    const patient = await store.findPatientById(patientId);
    if (!patient) {
      res.status(404).json({ error: "Patient record not found." });
      return;
    }

    // Process Triage Output via Gemini + Safety Rule Engine
    const { triageOutput, translatedEnglish } = await processTriageWithAI({
      rawSymptoms: rawSymptomInput || "",
      voiceTranscript,
      inputLanguage,
      vitals,
      attachments,
      facilityType,
      patientDemographics: {
        age: patient.age,
        sex: patient.sex,
        bloodGroup: patient.bloodGroup,
      }
    });

    const caseId = generateCaseId();
    const tokenNumber = generateQueueToken(facilityType, triageOutput.urgencyLevel);

    const newCase: CaseRecord = {
      _id: caseId,
      patientId,
      tokenNumber,
      facilityType,
      status: "PENDING_REVIEW",
      inputLanguage,
      rawSymptomInput: rawSymptomInput || voiceTranscript || "",
      voiceTranscript,
      symptomDuration: symptomDuration || triageOutput.timelineSummary,
      followUpResponses: followUpResponses || [],
      translatedEnglishInput: translatedEnglish,
      vitals,
      attachments,
      triageOutput,
      auditTrail: [
        {
          action: "CASE_CREATED",
          actor: `Patient (${patient.fullName})`,
          timestamp: new Date(),
          details: `Assigned token ${tokenNumber} with urgency ${triageOutput.urgencyLevel}`,
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const saved = await store.createCase(newCase);

    res.status(201).json({
      success: true,
      case: saved,
      patient,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create case", details: (err as Error).message });
  }
};

export const getCasesQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { facilityType, urgency, status } = req.query;

    const cases = await store.getCases({
      facilityType: facilityType as string,
      urgency: urgency as string,
      status: status as string,
    });

    // Populate basic patient info for each case
    const populated = await Promise.all(
      cases.map(async (c) => {
        const patient = await store.findPatientById(c.patientId);
        return {
          ...c,
          patient: patient ? {
            fullName: patient.fullName,
            age: patient.age,
            sex: patient.sex,
            bloodGroup: patient.bloodGroup,
            phoneNumber: patient.phoneNumber,
            emergencyContact: patient.emergencyContact,
          } : null,
        };
      })
    );

    res.json({ success: true, count: populated.length, cases: populated });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cases queue", details: (err as Error).message });
  }
};

export const getCaseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const caseId = req.params.id as string;
    const caseRecord = await store.getCaseById(caseId);

    if (!caseRecord) {
      res.status(404).json({ error: "Case not found." });
      return;
    }

    const patient = await store.findPatientById(caseRecord.patientId);
    const pastCases = await store.getCasesByPatientId(caseRecord.patientId);

    res.json({
      success: true,
      case: caseRecord,
      patient,
      patientHistory: pastCases.filter(c => c._id !== caseRecord._id),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch case details", details: (err as Error).message });
  }
};

export const reviewCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const caseId = req.params.id as string;
    const {
      doctorId,
      doctorName,
      doctorRole,
      overrideUrgency,
      overrideReason,
      clinicalImpression,
      prescribedMedications,
      referralDetails,
      status = "COMPLETED",
    } = req.body;

    const existing = await store.getCaseById(caseId);
    if (!existing) {
      res.status(404).json({ error: "Case not found." });
      return;
    }

    const doctorReview: DoctorReview = {
      reviewedByDoctorId: doctorId || "DOC-DEFAULT",
      doctorName: doctorName || "Reviewing Medical Officer",
      doctorRole: doctorRole || "Medical Officer",
      overrideUrgency: overrideUrgency || existing.triageOutput.urgencyLevel,
      overrideReason,
      clinicalImpression,
      prescribedMedications,
      referralDetails,
      signedAt: new Date(),
    };

    const newAuditEntry = {
      action: referralDetails?.isReferred ? "CASE_REFERRED" : "CASE_REVIEWED_AND_COMPLETED",
      actor: doctorName || "Medical Officer",
      timestamp: new Date(),
      details: overrideUrgency && overrideUrgency !== existing.triageOutput.urgencyLevel
        ? `Doctor adjusted urgency from ${existing.triageOutput.urgencyLevel} to ${overrideUrgency}. Reason: ${overrideReason || "Clinical judgment"}`
        : `Signed off by ${doctorName || "Doctor"}. Status: ${status}`,
    };

    const updated = await store.updateCase(caseId, {
      doctorReview,
      status: referralDetails?.isReferred ? "REFERRED" : (status as any),
      auditTrail: [...existing.auditTrail, newAuditEntry],
    });

    res.json({ success: true, case: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review", details: (err as Error).message });
  }
};

export const getCaseTimeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const caseId = req.params.id as string;
    const currentCase = await store.getCaseById(caseId);

    if (!currentCase) {
      res.status(404).json({ success: false, error: "Case not found." });
      return;
    }

    // Privacy & Authorization checks
    // 1. Staff authentication via header or query
    const staffId = (req.headers["x-staff-id"] || req.query.staffId) as string | undefined;
    // 2. Patient authentication via header or query
    const patientAuthId = (req.headers["x-patient-id"] || req.query.patientId) as string | undefined;
    const patientPhone = (req.headers["x-patient-phone"] || req.query.patientPhone) as string | undefined;

    // Requirement: Patient history is NOT accessible using a Patient ID alone.
    if (!staffId && !patientAuthId && !patientPhone) {
      res.status(401).json({
        success: false,
        error: "Unauthorized: Patient health history is protected medical data and cannot be accessed using an ID alone. Authorized healthcare staff credentials (x-staff-id) or verified patient credentials required.",
      });
      return;
    }

    let staffActorName: string | null = null;
    if (staffId) {
      const staffMember = await store.findStaffById(staffId);
      if (!staffMember) {
        res.status(403).json({
          success: false,
          error: "Forbidden: Healthcare staff credentials could not be verified.",
        });
        return;
      }
      staffActorName = `${staffMember.name} (${staffMember.role})`;
    } else {
      // Patient attempting access: Must match this specific case's patientId
      if (patientAuthId && patientAuthId !== currentCase.patientId) {
        res.status(403).json({
          success: false,
          error: "Forbidden: You are only permitted to access your own medical records.",
        });
        return;
      }
      if (patientPhone) {
        const patientByPhone = await store.findPatientByPhone(patientPhone);
        if (!patientByPhone || patientByPhone._id !== currentCase.patientId) {
          res.status(403).json({
            success: false,
            error: "Forbidden: You are only permitted to access your own medical records.",
          });
          return;
        }
      }
    }

    // Retrieve patient profile and all historical cases
    const patient = await store.findPatientById(currentCase.patientId);
    if (!patient) {
      res.status(404).json({ success: false, error: "Patient record not found." });
      return;
    }

    const allCases = await store.getCasesByPatientId(currentCase.patientId);

    // Record access in audit log if accessed by healthcare worker
    if (staffActorName) {
      const auditEntry = {
        action: "PATIENT_TIMELINE_ACCESSED",
        actor: staffActorName,
        timestamp: new Date(),
        details: `Authorized staff viewed complete health timeline and change detection across ${allCases.length} case records.`,
      };
      await store.updateCase(currentCase._id, {
        auditTrail: [...currentCase.auditTrail, auditEntry],
      });
    }

    // Build structured, source-grounded comparison
    const comparison = buildDeterministicTimelineComparison(currentCase, allCases, patient);

    // AI-assisted summary with strict non-diagnostic guardrails
    const aiResult = await summarizeTimelineChangesWithAI(comparison);

    const finalComparison = {
      ...comparison,
      factualSummary: aiResult.factualSummary,
      isAiGenerated: aiResult.isAiGenerated,
      verifiedFacts: aiResult.verifiedFacts,
      flaggedDiscrepancies: aiResult.flaggedDiscrepancies,
    };

    res.json({
      success: true,
      comparison: finalComparison,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to build patient timeline comparison", details: (err as Error).message });
  }
};
