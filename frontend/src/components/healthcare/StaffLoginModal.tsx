"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { getDemoStaffProfiles, staffLoginApi } from "../../services/api";
import { StaffMember } from "../../types";
import {
  Building2,
  KeyRound,
  Lock,
  Stethoscope,
  UserCheck,
  X
} from "lucide-react";

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { setCurrentStaff, setSelectedFacility, setPortalMode } = useAuth();
  const { t } = useLanguage();
  const [demoProfiles, setDemoProfiles] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDemoStaffProfiles().then((res) => {
      if (res.success && res.staffProfiles) {
        setDemoProfiles(res.staffProfiles);
        if (res.staffProfiles.length > 0 && !selectedStaffId) {
          setSelectedStaffId(res.staffProfiles[0]._id);
        }
      }
    }).catch(console.warn);
  }, []);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedStaffId.trim()) {
      setError("Please select or enter Doctor / Healthcare Worker ID.");
      return;
    }
    if (!pin.trim()) {
      setError("Please enter your security PIN / Password (Demo PIN: 1234).");
      return;
    }
    try {
      setLoading(true);
      const res = await staffLoginApi(selectedStaffId.trim(), pin.trim());
      if (res.success && res.staff) {
        setCurrentStaff(res.staff);
        setSelectedFacility("ALL");
        setPortalMode("STAFF");
        if (onClose) onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid PIN / Password. (Demo PIN: 1234)");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStaff = (staff: StaffMember) => {
    setSelectedStaffId(staff._id);
    setError(null);
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
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-white/60 overflow-hidden shadow-2xs shrink-0">
              <img
                src="/images/swasthya-sakhi-doctor.png"
                alt="Swasthya Sakhi"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-950">{t("staffHeroTitle")}</h3>
              <p className="text-[11px] text-slate-900 font-medium">Doctor & Medical Officer Authentication</p>
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

        <div className="p-6 space-y-4">
          {/* Security Notice */}
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-lg text-[11px] flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Restricted Clinical Zone:</strong>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Patients cannot access the healthcare portal. Authorized doctors and health workers must authenticate using their Clinician ID and Security PIN.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Clinician Profiles list */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Select or Verify Duty Clinician Profile:
            </label>
            <div className="space-y-2">
              {demoProfiles.map((staff) => (
                <div
                  key={staff._id}
                  onClick={() => handleSelectStaff(staff)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedStaffId === staff._id
                    ? "bg-brand-50 border-brand-500 ring-2 ring-brand-300 shadow-2xs"
                    : "bg-white border-slate-200 hover:bg-slate-50 hover:border-brand-200"
                    }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-extrabold text-slate-900">{staff.name}</h4>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                        {staff._id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">{staff.role} • {staff.facilityName}</p>
                  </div>
                  <UserCheck className={`w-4 h-4 shrink-0 ${selectedStaffId === staff._id ? "text-brand-700 font-bold" : "text-slate-400"}`} />
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="pt-3 border-t border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Clinician ID:
              </label>
              <input
                type="text"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                placeholder="e.g. DOC-201, NURSE-105"
                className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5cb4ee]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  Doctor / Staff Security PIN:
                </label>
                <span className="text-[10px] text-slate-500 font-mono">(Demo PIN: 1234)</span>
              </div>
              <input
                type="password"
                maxLength={4}
                value={pin}
                placeholder="••••"
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center text-base font-mono tracking-widest font-bold py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5cb4ee]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-maya-primary text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-950" />
              <span>{loading ? "Authenticating Clinician..." : "Verify PIN & Access Portal"}</span>
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
