"use client";

import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { 
  Building2, 
  Globe, 
  LogOut, 
  Stethoscope, 
  User, 
  ShieldCheck,
  Activity
} from "lucide-react";

export const Header: React.FC = () => {
  const { 
    portalMode, 
    setPortalMode, 
    currentPatient, 
    isPatientLoggedIn, 
    logoutPatient, 
    currentStaff, 
    isStaffLoggedIn, 
    logoutStaff 
  } = useAuth();
  
  const { currentLanguage, setLanguageCode, allLanguages, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      {/* Top Official Banner */}
      <div className="bg-[#091424] px-4 py-1.5 text-[11px] text-slate-300 flex justify-between items-center border-b border-slate-800">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-0.5">
              <span className="inline-block w-2.5 h-2 bg-[#ff9933] rounded-xs"></span>
              <span className="inline-block w-2.5 h-2 bg-white rounded-xs"></span>
              <span className="inline-block w-2.5 h-2 bg-[#138808] rounded-xs"></span>
            </div>
            <span className="font-semibold text-slate-200 tracking-wide">
              Ministry of Health & Family Welfare • Government of India
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#5cb4ee]" />
              ABDM Certified Protocol
            </span>
            <span className="text-slate-600">|</span>
            <span>Human-in-the-Loop Triage</span>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="bg-[#0e2439] text-white border-b-2 border-[#5cb4ee]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Brand / Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#5cb4ee] to-[#0284c7] shadow-sm flex items-center justify-center text-slate-950 shrink-0 border border-white/20">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
                  {t("appTitle")}
                </h1>
                <span className="bg-[#5cb4ee]/20 text-[#5cb4ee] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#5cb4ee]/40">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-normal hidden sm:block">
                {t("appSubTitle")}
              </p>
            </div>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Portal Switch Tabs */}
            <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-700/80 flex shadow-inner">
              <button
                onClick={() => setPortalMode("PATIENT")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  portalMode === "PATIENT"
                    ? "bg-[#5cb4ee] text-slate-950 shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{t("portalSelectPatient")}</span>
              </button>
              <button
                onClick={() => setPortalMode("STAFF")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  portalMode === "STAFF"
                    ? "bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{t("portalSelectHealthcare")}</span>
              </button>
            </div>

            {/* Language Selector */}
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 absolute left-2.5 text-[#5cb4ee] pointer-events-none" />
              <select
                value={currentLanguage.code}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="bg-slate-900 text-white text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#5cb4ee] font-medium cursor-pointer shadow-xs"
              >
                {allLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {/* User Session Pill */}
            {portalMode === "PATIENT" && isPatientLoggedIn && currentPatient && (
              <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-[#5cb4ee]/40 text-xs shadow-xs">
                <span className="text-white font-semibold">{currentPatient.fullName}</span>
                <span className="text-[#5cb4ee] font-mono text-[11px] font-bold">({currentPatient._id})</span>
                <button
                  onClick={logoutPatient}
                  title="Logout"
                  className="text-slate-400 hover:text-red-400 ml-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {portalMode === "STAFF" && isStaffLoggedIn && currentStaff && (
              <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-sky-500/40 text-xs shadow-xs">
                <span className="text-[#5cb4ee] font-bold">{currentStaff.name}</span>
                <button
                  onClick={logoutStaff}
                  title="Logout Staff"
                  className="text-slate-400 hover:text-red-400 ml-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
