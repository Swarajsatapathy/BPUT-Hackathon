import { Request, Response } from "express";
import { store } from "../services/mockStore.service.js";
import { generateCaseId, generateQueueToken } from "../utils/tokenGenerator.js";
import { processTriageWithAI } from "../services/gemini.service.js";
import { CaseRecord, DoctorReview } from "../models/types.js";

export const createCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patientId,
      facilityType = "PRIMARY_HEALTH_CENTER",
      inputLanguage = "en",
      rawSymptomInput,
      voiceTranscript,
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
