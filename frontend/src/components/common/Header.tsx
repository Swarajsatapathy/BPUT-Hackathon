"use client";

import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  Globe,
  LogOut,
  Stethoscope,
  ShieldCheck,
  Lock,
  User,
  LayoutDashboard,
  ClipboardPenLine,
  Home,
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
    logoutStaff,
    setShowStaffAuthModal,
  } = useAuth();

  const { currentLanguage, setLanguageCode, allLanguages, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs">


      {/* Main Navigation Row */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        
        {/* Brand / Logo */}
        <button
          onClick={() => setPortalMode("OVERVIEW")}
          className="flex items-center gap-3 text-left cursor-pointer group"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs group-hover:bg-teal-800 transition-colors">
            <Stethoscope className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-teal-800 transition-colors">
              Swasthya Sakhi
            </span>
            <span className="text-xs text-slate-500 font-medium">
              स्वास्थ्य सखी • Human-in-the-loop
            </span>
          </span>
        </button>

        {/* Center Desktop Navigation */}
        <nav aria-label="Main" className="hidden items-center gap-1.5 md:flex">
          <button
            onClick={() => setPortalMode("OVERVIEW")}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              portalMode === "OVERVIEW"
                ? "bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Home className="w-4 h-4 text-teal-700" />
            <span>{t("navOverview")}</span>
          </button>

          <button
            onClick={() => setPortalMode("PATIENT")}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              portalMode === "PATIENT"
                ? "bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ClipboardPenLine className="w-4 h-4 text-teal-700" />
            <span>{t("navPatientIntake")}</span>
          </button>

          <button
            onClick={() => {
              if (isStaffLoggedIn) {
                setPortalMode("STAFF");
              } else {
                setShowStaffAuthModal(true);
              }
            }}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              portalMode === "STAFF"
                ? "bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-teal-700" />
            <span>{t("navReviewerDashboard")}</span>
            {!isStaffLoggedIn && (
              <Lock className="w-3.5 h-3.5 text-amber-500 ml-0.5" />
            )}
          </button>
        </nav>

        {/* Right Actions: Non-diagnostic Pill, Language, User State */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Non-diagnostic Badge */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50/70 px-3 py-1 text-xs font-semibold text-teal-800">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
            <span>{t("badgeNonDiagnostic")}</span>
          </div>

          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 absolute left-2.5 text-slate-500 pointer-events-none" />
            <select
              value={currentLanguage.code}
              onChange={(e) => setLanguageCode(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium cursor-pointer shadow-2xs"
            >
              {allLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* Patient Session Pill */}
          {portalMode === "PATIENT" && isPatientLoggedIn && currentPatient && (
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 text-xs shadow-2xs">
              <span className="text-slate-900 font-semibold">{currentPatient.fullName}</span>
              <button
                onClick={logoutPatient}
                title="Logout"
                className="text-slate-400 hover:text-red-500 ml-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Staff Session Pill */}
          {portalMode === "STAFF" && isStaffLoggedIn && currentStaff && (
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 text-xs shadow-2xs">
              <span className="text-slate-900 font-semibold">{currentStaff.name}</span>
              <button
                onClick={logoutStaff}
                title="Logout Staff"
                className="text-slate-400 hover:text-red-500 ml-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <nav aria-label="Main mobile" className="flex gap-1 overflow-x-auto border-t border-slate-200 px-4 py-2 md:hidden bg-slate-50">
        <button
          onClick={() => setPortalMode("OVERVIEW")}
          className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold flex items-center gap-1 ${
            portalMode === "OVERVIEW" ? "bg-teal-700 text-white" : "text-slate-600"
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>{t("navOverview")}</span>
        </button>
        <button
          onClick={() => setPortalMode("PATIENT")}
          className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold ${
            portalMode === "PATIENT" ? "bg-teal-700 text-white" : "text-slate-600"
          }`}
        >
          {t("navPatientIntake")}
        </button>
        <button
          onClick={() => {
            if (isStaffLoggedIn) {
              setPortalMode("STAFF");
            } else {
              setShowStaffAuthModal(true);
            }
          }}
          className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold flex items-center gap-1 ${
            portalMode === "STAFF" ? "bg-teal-700 text-white" : "text-slate-600"
          }`}
        >
          {t("navReviewerDashboard")}
          {!isStaffLoggedIn && <Lock className="w-3 h-3 text-amber-500" />}
        </button>
      </nav>
    </header>
  );
};
