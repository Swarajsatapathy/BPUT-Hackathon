import axios from "axios";
import { CaseRecord, FacilityType, Patient, StaffMember, UrgencyLevel, Vitals } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Patient & Auth APIs
export const sendPatientOtp = async (phoneNumber: string) => {
  const res = await api.post("/auth/patient/send-otp", { phoneNumber });
  return res.data;
};

export const verifyPatientOtp = async (phoneNumber: string, otp: string) => {
  const res = await api.post("/auth/patient/verify-otp", { phoneNumber, otp });
  return res.data;
};

export const registerPatientProfile = async (data: {
  phoneNumber: string;
  fullName: string;
  age: number;
  sex: string;
  bloodGroup?: string;
  emergencyContact?: { name?: string; relation?: string; phone?: string };
}) => {
  const res = await api.post("/auth/patient/register", data);
  return res.data;
};

export const getPatientProfile = async (phoneOrId: { phone?: string; id?: string }) => {
  const res = await api.get("/patient/profile", { params: phoneOrId });
  return res.data;
};

export const staffLoginApi = async (staffId: string, pin?: string) => {
  const res = await api.post("/auth/staff/login", { staffId, pin });
  return res.data;
};

export const getDemoStaffProfiles = async () => {
  const res = await api.get("/auth/staff/demo-profiles");
  return res.data;
};

// Case & Triage APIs
export const submitNewTriageCase = async (payload: {
  patientId: string;
  facilityType: FacilityType;
  inputLanguage: string;
  rawSymptomInput: string;
  voiceTranscript?: string;
  vitals?: Vitals;
  attachments?: any[];
}) => {
  const res = await api.post("/cases", payload);
  return res.data;
};

export const fetchLiveTriageQueue = async (filters?: {
  facilityType?: string;
  urgency?: string;
  status?: string;
}) => {
  const res = await api.get("/cases/queue", { params: filters });
  return res.data;
};

export const fetchCaseDetails = async (caseId: string) => {
  const res = await api.get(`/cases/${caseId}`);
  return res.data;
};

export const submitDoctorReview = async (
  caseId: string,
  reviewData: {
    doctorId?: string;
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
      urgencyOfTransfer?: string;
      reasonForTransfer?: string;
      transportRecommendation?: string;
    };
    status?: string;
  }
) => {
  const res = await api.patch(`/cases/${caseId}/review`, reviewData);
  return res.data;
};

export const fetchPatientTimelineComparison = async (caseId: string, staffId?: string) => {
  const headers: Record<string, string> = {};
  if (staffId) {
    headers["x-staff-id"] = staffId;
  }
  const res = await api.get(`/cases/${caseId}/timeline`, { headers });
  return res.data;
};

export const processOcrUpload = async (imageBase64: string, mimeType: string = "image/jpeg") => {
  const res = await api.post("/triage/ocr", { imageBase64, mimeType });
  return res.data;
};

export const transcribeAudioApi = async (
  audioBase64: string, 
  mimeType: string = "audio/webm", 
  language: string = "en",
  interimTextHint?: string
) => {
  const res = await api.post("/triage/transcribe-audio", { audioBase64, mimeType, language, interimTextHint });
  return res.data;
};


export const translateTextApi = async (text: string, language: string = "auto") => {
  const res = await api.post("/triage/translate", { text, language });
  return res.data;
};

export const fetchDashboardStats = async (facilityType?: string) => {

  const res = await api.get("/stats/dashboard", { params: { facilityType } });
  return res.data;
};


export const triggerReSeedData = async () => {
  const res = await api.post("/stats/seed");
  return res.data;
};
