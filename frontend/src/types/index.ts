export type UrgencyLevel = "EMERGENCY_RED" | "URGENT_YELLOW" | "ROUTINE_GREEN";

export type FacilityType = 
  | "PRIMARY_HEALTH_CENTER" 
  | "PUBLIC_HEALTH_CAMP" 
  | "INDUSTRIAL_HEALTH_UNIT" 
  | "CAMPUS_HEALTH_CENTER" 
  | "DISTRICT_HOSPITAL"
  | "ALL";

export type CaseStatus = "PENDING_REVIEW" | "IN_REVIEW" | "COMPLETED" | "REFERRED";

export interface EmergencyContact {
  name?: string;
  relation?: string;
  phone?: string;
}

export interface Patient {
  _id: string;
  phoneNumber: string;
  fullName: string;
  age: number;
  sex: "Male" | "Female" | "Other" | "Prefer not to say";
  bloodGroup?: string;
  emergencyContact?: EmergencyContact;
  registeredAt: string;
}

export interface Vitals {
  bpSystolic?: number;
  bpDiastolic?: number;
  pulseRate?: number;
  spo2?: number;
  temperature?: number;
  bloodSugar?: number;
  respiratoryRate?: number;
}

export interface Attachment {
  id: string;
  type: "lab_report" | "prescription" | "symptom_photo" | "audio_note";
  fileName: string;
  fileUrl?: string;
  base64Data?: string;
  ocrExtractedText?: string;
  parsedValues?: Record<string, any>;
  visualObservations?: string[];
}

export interface TriageOutput {
  urgencyLevel: UrgencyLevel;
  urgencyScore: number;
  urgencyReason: string;
  timelineSummary: string;
  chiefComplaints: string[];
  deterministicFlags: string[];
  aiReasoningNotes: string;
  missingInformationAlerts: string[];
  suggestedFollowUpQuestions: string[];
  patientFacingAdvisory: {
    en: string;
    originalLanguage?: string;
    languageCode?: string;
  };
  generatedAt: string;
}

export interface DoctorReview {
  reviewedByDoctorId?: string;
  doctorName?: string;
  doctorRole?: string;
  overrideUrgency?: UrgencyLevel;
  overrideReason?: string;
  clinicalImpression?: string;
  prescribedMedications?: string[];
  referralDetails?: {
    isReferred: boolean;
    referralFacilityName?: string;
    department?: string;
    urgencyOfTransfer?: "Immediate Ambulance" | "Within 24 Hours" | "Elective OPD";
    reasonForTransfer?: string;
    transportRecommendation?: string;
  };
  signedAt?: string;
}

export interface CaseRecord {
  _id: string;
  patientId: string;
  tokenNumber: string;
  facilityType: FacilityType;
  status: CaseStatus;
  inputLanguage: string;
  rawSymptomInput: string;
  voiceTranscript?: string;
  translatedEnglishInput: string;
  vitals: Vitals;
  attachments: Attachment[];
  triageOutput: TriageOutput;
  doctorReview?: DoctorReview;
  patient?: {
    fullName: string;
    age: number;
    sex: string;
    bloodGroup?: string;
    phoneNumber: string;
    emergencyContact?: EmergencyContact;
  };
  auditTrail: Array<{
    action: string;
    actor: string;
    timestamp: string;
    details?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface StaffMember {
  _id: string;
  name: string;
  role: "Medical Officer" | "Staff Nurse" | "ASHA Worker" | "Triage Incharge";
  facilityName: string;
  facilityType: FacilityType;
  pin: string;
}
