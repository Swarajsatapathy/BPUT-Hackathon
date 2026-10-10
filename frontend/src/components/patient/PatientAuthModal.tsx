"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { registerPatientProfile, sendPatientOtp, verifyPatientOtp } from "../../services/api";
import {
  KeyRound,
  Phone,
  User,
  UserPlus,
  AlertCircle,
  X
} from "lucide-react";

interface PatientAuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const PatientAuthModal: React.FC<PatientAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { setCurrentPatient } = useAuth();
  const { t } = useLanguage();

  const [step, setStep] = useState<"PHONE" | "OTP" | "REGISTER">("PHONE");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration fields
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"Male" | "Female" | "Other" | "Prefer not to say">("Male");
  const [bloodGroup, setBloodGroup] = useState("");

  // Optional Emergency contact
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("Spouse");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[6-9]\d{9}$/.test(phoneNumber.trim())) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      setLoading(true);
      await sendPatientOtp(phoneNumber.trim());
      setStep("OTP");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp.trim()) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyPatientOtp(phoneNumber.trim(), otp.trim());

      if (res.isRegistered && res.patient) {
        setCurrentPatient(res.patient);
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        setStep("REGISTER");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid OTP. Use demo OTP: 123456.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !age.trim()) {
      setError("Full name and age are required.");
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        phoneNumber: phoneNumber.trim(),
        fullName: fullName.trim(),
        age: Number(age),
        sex,
        bloodGroup: bloodGroup || "Unknown",
      };

      if (emergencyName.trim()) {
        payload.emergencyContact = {
          name: emergencyName.trim(),
          relation: emergencyRelation,
          phone: emergencyPhone.trim() || undefined,
        };
      }

      const res = await registerPatientProfile(payload);
      if (res.success && res.patient) {
        setCurrentPatient(res.patient);
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#5cb4ee] via-[#48aae9] to-[#389ad8] text-slate-950 px-6 py-4 flex items-center justify-between border-b border-[#3b93ce]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/40 flex items-center justify-center border border-white/40">
              <User className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-950">
                {step === "REGISTER" ? t("submitRegistration") : t("authModalTitle")}
              </h3>
              <p className="text-[11px] text-slate-900 font-medium">Mobile OTP Authentication</p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-950 hover:bg-white/40 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Enter Phone Number */}
          {step === "PHONE" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t("phoneNumber")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs font-bold">
                    +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="w-full pl-11 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Demo records available: <strong className="text-slate-800 font-mono">9876543210</strong> (Ramesh) or <strong className="text-slate-800 font-mono">9812345678</strong> (Priyanka)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.length < 10}
                className="w-full btn-maya-primary text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50"
              >
                <Phone className="w-3.5 h-3.5 text-slate-950" />
                <span>{loading ? "Sending..." : "Request Verification OTP"}</span>
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-brand-50/50 border border-brand-200/80 p-3 rounded-lg text-xs text-slate-800 flex items-center justify-between">
                <span>Demo OTP: <strong className="font-mono text-brand-900 font-bold">123456</strong></span>
                <button
                  type="button"
                  onClick={() => setOtp("123456")}
                  className="text-brand-800 hover:text-brand-900 hover:underline text-xs font-bold cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t("enterOtp")} (+91 {phoneNumber})
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center text-base font-mono tracking-widest font-bold py-2 border border-slate-300 rounded-lg focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("PHONE")}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Edit Number
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-2/3 btn-maya-primary text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 font-bold cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-950" />
                  <span>{loading ? "Verifying..." : t("verifyOtp")}</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Complete Registration Form */}
          {step === "REGISTER" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-600">
                New user for +91 {phoneNumber}. Complete details to register:
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                  {t("fullName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra Sahoo"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-[#5cb4ee] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                    {t("age")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-[#5cb4ee] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                    {t("sex")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-[#5cb4ee] focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                  {t("bloodGroup")}
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-[#5cb4ee] focus:outline-none"
                >
                  <option value="">Unknown / Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              {/* Optional Emergency Contact Section */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="block text-xs font-semibold text-slate-800">
                  {t("emergencyContact")}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder={t("emergencyName")}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-[#5cb4ee] focus:outline-none"
                  />
                  <select
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-[#5cb4ee] focus:outline-none"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder={t("emergencyPhone")}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-[#5cb4ee] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !fullName || !age}
                className="w-full mt-2 btn-maya-primary text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>{loading ? "Registering..." : t("submitRegistration")}</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
