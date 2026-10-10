import { Request, Response } from "express";
import { store } from "../services/mockStore.service.js";
import { generatePatientId } from "../utils/tokenGenerator.js";
import { Patient } from "../models/types.js";

// Active OTP cache for demo verification
const otpCache = new Map<string, { otp: string; expiresAt: number }>();

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber || !/^[6-9]\d{9}$/.test(phoneNumber.trim())) {
      res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
      return;
    }

    const cleanPhone = phoneNumber.trim();
    // Deterministic demo OTP or 6-digit random
    const demoOtp = "123456";
    otpCache.set(cleanPhone, {
      otp: demoOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    res.json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone}.`,
      demoOtpNotice: `For demo/testing, use OTP: ${demoOtp}`,
      phoneNumber: cleanPhone,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to send OTP", details: (err as Error).message });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
      res.status(400).json({ error: "Phone number and OTP are required." });
      return;
    }

    const cleanPhone = phoneNumber.trim();
    const cached = otpCache.get(cleanPhone);

    // Accept demo OTP '123456' or cached OTP
    const isValid = otp === "123456" || (cached && cached.otp === otp.trim() && cached.expiresAt > Date.now());

    if (!isValid) {
      res.status(400).json({ error: "Invalid or expired OTP. Please enter 123456." });
      return;
    }

    // Check if patient already exists
    const existingPatient = await store.findPatientByPhone(cleanPhone);

    res.json({
      success: true,
      isRegistered: !!existingPatient,
      patient: existingPatient || null,
      phoneNumber: cleanPhone,
    });
  } catch (err) {
    res.status(500).json({ error: "OTP verification failed", details: (err as Error).message });
  }
};

export const registerPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, fullName, age, sex, bloodGroup, emergencyContact } = req.body;

    if (!phoneNumber || !fullName || !age || !sex) {
      res.status(400).json({ error: "Full name, age, sex, and phone number are required." });
      return;
    }

    const cleanPhone = phoneNumber.trim();
    const existing = await store.findPatientByPhone(cleanPhone);
    if (existing) {
      res.status(400).json({ error: "A patient profile with this phone number already exists.", patient: existing });
      return;
    }

    const newPatient: Patient = {
      _id: generatePatientId(),
      phoneNumber: cleanPhone,
      fullName: fullName.trim(),
      age: Number(age),
      sex,
      bloodGroup: bloodGroup || "Unknown",
      emergencyContact: emergencyContact && emergencyContact.name ? {
        name: emergencyContact.name.trim(),
        relation: emergencyContact.relation || "Other",
        phone: emergencyContact.phone ? emergencyContact.phone.trim() : undefined,
      } : undefined,
      registeredAt: new Date(),
    };

    const saved = await store.createPatient(newPatient);
    res.status(201).json({ success: true, patient: saved });
  } catch (err) {
    res.status(500).json({ error: "Registration failed", details: (err as Error).message });
  }
};

export const staffLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { staffId, pin } = req.body;
    const staff = await store.findStaffById(staffId);

    if (!staffId || !pin) {
      res.status(400).json({ error: "Doctor/Staff ID and PIN/Password are required." });
      return;
    }

    if (!staff) {
      res.status(404).json({ error: "Doctor/Healthcare worker profile not found for this ID." });
      return;
    }

    if (staff.pin !== pin.trim()) {
      res.status(401).json({ error: "Invalid PIN / Password entered." });
      return;
    }

    res.json({ success: true, staff });
  } catch (err) {
    res.status(500).json({ error: "Staff login failed", details: (err as Error).message });
  }
};

export const getDemoStaffProfiles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = await store.getStaffMembers();
    res.json({ success: true, staffProfiles: list });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch staff profiles" });
  }
};
