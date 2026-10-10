import { isDbConnected } from "../config/db.js";
import { CaseModel } from "../models/CaseModel.js";
import { PatientModel } from "../models/PatientModel.js";
import { CaseRecord, Patient, StaffMember } from "../models/types.js";
import { initialStaffMembers, seedCases, seedPatients } from "../data/syntheticSeeds.js";

// In-Memory Fallback State (initialized with synthetic seeds)
let memoryPatients: Patient[] = [...seedPatients];
let memoryCases: CaseRecord[] = [...seedCases];
let memoryStaff: StaffMember[] = [...initialStaffMembers];

export const store = {
  // Patient Operations
  async findPatientByPhone(phone: string): Promise<Patient | null> {
    if (isDbConnected()) {
      try {
        const found = await PatientModel.findOne({ phoneNumber: phone }).lean();
        return found as unknown as Patient | null;
      } catch (err) {
        console.warn("DB search error, fallback to memory:", err);
      }
    }
    return memoryPatients.find(p => p.phoneNumber === phone) || null;
  },

  async findPatientById(id: string): Promise<Patient | null> {
    if (isDbConnected()) {
      try {
        const found = await PatientModel.findById(id).lean();
        return found as unknown as Patient | null;
      } catch (err) {
        console.warn("DB findById error, fallback to memory:", err);
      }
    }
    return memoryPatients.find(p => p._id === id) || null;
  },

  async createPatient(patient: Patient): Promise<Patient> {
    if (isDbConnected()) {
      try {
        const created = await PatientModel.create(patient);
        return created.toObject() as Patient;
      } catch (err) {
        console.warn("DB createPatient error, writing to memory:", err);
      }
    }
    memoryPatients.push(patient);
    return patient;
  },

  // Case Operations
  async createCase(caseRecord: CaseRecord): Promise<CaseRecord> {
    if (isDbConnected()) {
      try {
        const created = await CaseModel.create(caseRecord);
        return created.toObject() as CaseRecord;
      } catch (err) {
        console.warn("DB createCase error, writing to memory:", err);
      }
    }
    memoryCases.unshift(caseRecord);
    return caseRecord;
  },

  async getCases(filters?: { facilityType?: string; urgency?: string; status?: string }): Promise<CaseRecord[]> {
    if (isDbConnected()) {
      try {
        const query: any = {};
        if (filters?.facilityType && filters.facilityType !== "ALL") query.facilityType = filters.facilityType;
        if (filters?.urgency && filters.urgency !== "ALL") query["triageOutput.urgencyLevel"] = filters.urgency;
        if (filters?.status && filters.status !== "ALL") {
          if (filters.status === "REVIEWED_CASE") {
            query.status = { $in: ["COMPLETED", "REFERRED"] };
          } else if (filters.status === "ACTIVE_UNREVIEWED") {
            query.status = { $nin: ["COMPLETED", "REFERRED"] };
          } else {
            query.status = filters.status;
          }
        }

        const results = await CaseModel.find(query).sort({ createdAt: -1 }).lean();
        return results as unknown as CaseRecord[];
      } catch (err) {
        console.warn("DB getCases error, fallback to memory:", err);
      }
    }

    let filtered = [...memoryCases];
    if (filters?.facilityType && filters.facilityType !== "ALL") {
      filtered = filtered.filter(c => c.facilityType === filters.facilityType);
    }
    if (filters?.urgency && filters.urgency !== "ALL") {
      filtered = filtered.filter(c => c.triageOutput.urgencyLevel === filters.urgency);
    }
    if (filters?.status && filters.status !== "ALL") {
      if (filters.status === "REVIEWED_CASE") {
        filtered = filtered.filter(c => c.status === "COMPLETED" || c.status === "REFERRED");
      } else if (filters.status === "ACTIVE_UNREVIEWED") {
        filtered = filtered.filter(c => c.status !== "COMPLETED" && c.status !== "REFERRED");
      } else {
        filtered = filtered.filter(c => c.status === filters.status);
      }
    }

    // Urgency Priority Sort: RED (10..8) > YELLOW (7..4) > GREEN (3..1)
    const urgencyWeight: Record<string, number> = {
      EMERGENCY_RED: 3,
      URGENT_YELLOW: 2,
      ROUTINE_GREEN: 1,
    };

    return filtered.sort((a, b) => {
      const wA = urgencyWeight[a.triageOutput.urgencyLevel] || 0;
      const wB = urgencyWeight[b.triageOutput.urgencyLevel] || 0;
      if (wA !== wB) return wB - wA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  async getCasesByPatientId(patientId: string): Promise<CaseRecord[]> {
    if (isDbConnected()) {
      try {
        const results = await CaseModel.find({ patientId }).sort({ createdAt: -1 }).lean();
        return results as unknown as CaseRecord[];
      } catch (err) {
        console.warn("DB getCasesByPatientId error, fallback to memory:", err);
      }
    }
    return memoryCases.filter(c => c.patientId === patientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getCaseById(caseId: string): Promise<CaseRecord | null> {
    if (isDbConnected()) {
      try {
        const found = await CaseModel.findById(caseId).lean();
        return found as unknown as CaseRecord | null;
      } catch (err) {
        console.warn("DB getCaseById error, fallback to memory:", err);
      }
    }
    return memoryCases.find(c => c._id === caseId) || null;
  },

  async updateCase(caseId: string, updates: Partial<CaseRecord>): Promise<CaseRecord | null> {
    if (isDbConnected()) {
      try {
        const updated = await CaseModel.findByIdAndUpdate(
          caseId,
          { $set: updates },
          { new: true }
        ).lean();
        return updated as unknown as CaseRecord | null;
      } catch (err) {
        console.warn("DB updateCase error, fallback to memory:", err);
      }
    }

    const idx = memoryCases.findIndex(c => c._id === caseId);
    if (idx === -1) return null;
    memoryCases[idx] = { ...memoryCases[idx], ...updates, updatedAt: new Date() };
    return memoryCases[idx];
  },

  // Staff Operations
  async getStaffMembers(): Promise<StaffMember[]> {
    return memoryStaff;
  },

  async findStaffById(staffId: string): Promise<StaffMember | null> {
    return memoryStaff.find(s => s._id === staffId) || null;
  },

  // Reset to initial seed state
  async resetAndSeed(): Promise<void> {
    memoryPatients = [...seedPatients];
    memoryCases = [...seedCases];
    memoryStaff = [...initialStaffMembers];

    if (isDbConnected()) {
      try {
        await PatientModel.deleteMany({});
        await CaseModel.deleteMany({});
        await PatientModel.insertMany(seedPatients);
        await CaseModel.insertMany(seedCases);
        console.log("🌱 MongoDB Atlas successfully populated with initial test cases!");
      } catch (err) {
        console.warn("DB seed error:", err);
      }
    }
  }
};
