"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { getDemoStaffProfiles, staffLoginApi } from "../../services/api";
import { StaffMember } from "../../types";
import { 
  Building2, 
  KeyRound, 
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
  const { setCurrentStaff, setSelectedFacility } = useAuth();
  const { t } = useLanguage();
  const [demoProfiles, setDemoProfiles] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [pin, setPin] = useState("1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDemoStaffProfiles().then((res) => {
      if (res.success && res.staffProfiles) {
        setDemoProfiles(res.staffProfiles);
        if (res.staffProfiles.length > 0) {
          setSelectedStaffId(res.staffProfiles[0]._id);
        }
      }
    }).catch(console.warn);
  }, []);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await staffLoginApi(selectedStaffId, pin);
      if (res.success && res.staff) {
        setCurrentStaff(res.staff);
        setSelectedFacility(res.staff.facilityType);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid PIN (Demo PIN: 1234)");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (staff: StaffMember) => {
    setSelectedStaffId(staff._id);
    setCurrentStaff(staff);
    setSelectedFacility(staff.facilityType);
    if (onSuccess) onSuccess();
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
              <Stethoscope className="w-4 h-4 text-slate-950" />
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
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Clinician Profiles list */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Select Duty Clinician Profile
            </label>
            <div className="space-y-2">
              {demoProfiles.map((staff) => (
                <div
                  key={staff._id}
                  onClick={() => handleQuickSelect(staff)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    selectedStaffId === staff._id
                      ? "bg-brand-50 border-brand-400 shadow-2xs"
                      : "bg-white border-slate-200 hover:bg-slate-50 hover:border-brand-200"
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">{staff.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{staff.role} • {staff.facilityName}</p>
                  </div>
                  <UserCheck className="w-4 h-4 text-brand-700 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="pt-3 border-t border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                PIN Verification (Demo PIN: 1234)
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center text-base font-mono tracking-widest font-bold py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-maya-primary text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-950" />
              <span>{loading ? "Authenticating..." : t("clinicalLoginBtn")}</span>
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
