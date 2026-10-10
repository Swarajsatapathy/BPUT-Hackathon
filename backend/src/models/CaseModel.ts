import mongoose, { Schema, Document } from "mongoose";
import { CaseRecord } from "./types.js";

const CaseSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    patientId: { type: String, required: true, ref: "Patient", index: true },
    tokenNumber: { type: String, required: true },
    facilityType: { 
      type: String, 
      enum: ["PRIMARY_HEALTH_CENTER", "PUBLIC_HEALTH_CAMP", "INDUSTRIAL_HEALTH_UNIT", "CAMPUS_HEALTH_CENTER", "DISTRICT_HOSPITAL"],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["PENDING_REVIEW", "IN_REVIEW", "COMPLETED", "REFERRED"],
      default: "PENDING_REVIEW",
      index: true
    },
    inputLanguage: { type: String, default: "en" },
    rawSymptomInput: { type: String, required: true },
    voiceTranscript: { type: String },
    symptomDuration: { type: String },
    followUpResponses: [
      {
        question: String,
        answer: String,
        recordedAt: { type: Date, default: Date.now },
      }
    ],
    translatedEnglishInput: { type: String, required: true },
    vitals: {
      bpSystolic: Number,
      bpDiastolic: Number,
      pulseRate: Number,
      spo2: Number,
      temperature: Number,
      bloodSugar: Number,
      respiratoryRate: Number,
    },
    attachments: [
      {
        id: String,
        type: { type: String },
        fileName: String,
        fileUrl: String,
        base64Data: String,
        ocrExtractedText: String,
        parsedValues: Schema.Types.Mixed,
        visualObservations: [String],
      }
    ],
    triageOutput: {
      urgencyLevel: { 
        type: String, 
        enum: ["EMERGENCY_RED", "URGENT_YELLOW", "ROUTINE_GREEN"],
        required: true,
        index: true 
      },
      urgencyScore: Number,
      urgencyReason: String,
      timelineSummary: String,
      chiefComplaints: [String],
      deterministicFlags: [String],
      aiReasoningNotes: String,
      missingInformationAlerts: [String],
      suggestedFollowUpQuestions: [String],
      patientFacingAdvisory: {
        en: String,
        originalLanguage: String,
        languageCode: String,
      },
      generatedAt: { type: Date, default: Date.now },
    },
    doctorReview: {
      reviewedByDoctorId: String,
      doctorName: String,
      doctorRole: String,
      overrideUrgency: String,
      overrideReason: String,
      clinicalImpression: String,
      prescribedMedications: [String],
      referralDetails: {
        isReferred: Boolean,
        referralFacilityName: String,
        department: String,
        urgencyOfTransfer: String,
        reasonForTransfer: String,
        transportRecommendation: String,
      },
      signedAt: Date,
    },
    auditTrail: [
      {
        action: String,
        actor: String,
        timestamp: { type: Date, default: Date.now },
        details: String,
      }
    ]
  },
  { _id: false, timestamps: true }
);

export const CaseModel = mongoose.models.Case || mongoose.model<CaseRecord & Document>("Case", CaseSchema);
