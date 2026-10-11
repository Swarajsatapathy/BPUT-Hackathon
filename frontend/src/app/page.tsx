"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Header } from "../components/common/Header";
import { ConsentModal } from "../components/common/ConsentModal";
import { PatientAuthModal } from "../components/patient/PatientAuthModal";
import { PatientDashboard } from "../components/patient/PatientDashboard";
import { StaffLoginModal } from "../components/healthcare/StaffLoginModal";
import { StaffDashboard } from "../components/healthcare/StaffDashboard";
import { SiteFooter } from "../components/common/SiteFooter";
import { SafetyNotice } from "../components/common/SafetyNotice";
import { Hero } from "../components/landing/Hero";
import { Workflow } from "../components/landing/Workflow";
import { Capabilities } from "../components/landing/Capabilities";
import { Scenarios } from "../components/landing/Scenarios";
import { SafetyPrivacy } from "../components/landing/SafetyPrivacy";
import {
  Phone,
  Stethoscope,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const {
    portalMode,
    setPortalMode,
    isPatientLoggedIn,
    isStaffLoggedIn,
    showStaffAuthModal,
    setShowStaffAuthModal,
    currentStaff,
  } = useAuth();
  const { t } = useLanguage();

  const [hasConsented, setHasConsented] = useState<boolean>(true);
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [showPatientAuth, setShowPatientAuth] = useState<boolean>(false);

  useEffect(() => {
    const consentStored = localStorage.getItem("triage_consent_accepted");
    if (!consentStored) {
      setShowConsentModal(true);
      setHasConsented(false);
    }
  }, []);

  const handleConsentAccept = () => {
    localStorage.setItem("triage_consent_accepted", "true");
    setHasConsented(true);
    setShowConsentModal(false);
  };

  const handleOpenReviewer = () => {
    if (isStaffLoggedIn) {
      setPortalMode("STAFF");
    } else {
      setShowStaffAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      
      {/* High-End Clinical Header */}
      <Header />

      {/* Consent Modal for First-time visitors */}
      <ConsentModal
        isOpen={showConsentModal}
        onAccept={handleConsentAccept}
      />

      {/* OVERVIEW LANDING PAGE */}
      {portalMode === "OVERVIEW" && (
        <main className="flex-1 home-times-theme">
          <Hero
            onStartIntake={() => setPortalMode("PATIENT")}
            onOpenDashboard={handleOpenReviewer}
          />
          <Workflow />
          <Capabilities />
          <Scenarios />
          <SafetyPrivacy />
        </main>
      )}

      {/* PATIENT INTAKE & DASHBOARD PORTAL */}
      {portalMode === "PATIENT" && (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Patient & Community Health Worker View
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Patient Intake & Health Records
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPortalMode("OVERVIEW")}
                className="text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>

          <div className="mb-6">
            <SafetyNotice compact />
          </div>

          {!isPatientLoggedIn ? (
            <div className="max-w-2xl mx-auto my-6 space-y-5">
              
              {/* Login / Registration Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                    <span>{t("heroBadge")}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {t("heroTitle")}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t("heroDesc")}
                  </p>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => setShowPatientAuth(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm px-6 py-3 transition-all shadow-sm cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-white" />
                    <span>{t("loginRegister")}</span>
                  </button>
                </div>

                {/* Feature Highlights Grid */}
                <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                    <span className="font-bold text-xs text-slate-900 block mb-1">
                      {t("featureVoiceTitle")}
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {t("featureVoiceDesc")}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                    <span className="font-bold text-xs text-slate-900 block mb-1">
                      {t("featureOcrTitle")}
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {t("featureOcrDesc")}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                    <span className="font-bold text-xs text-slate-900 block mb-1">
                      {t("featureSafetyTitle")}
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {t("featureSafetyDesc")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Demo Evaluation Hint */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs">
                <span>
                  {t("demoMobileHint")} <strong className="text-slate-900 font-mono font-bold">9876543210</strong> (OTP: <strong className="text-slate-900 font-mono font-bold">123456</strong>)
                </span>
                <button
                  onClick={() => setShowPatientAuth(true)}
                  className="text-teal-700 hover:text-teal-800 font-bold text-xs hover:underline cursor-pointer"
                >
                  {t("quickSignIn")}
                </button>
              </div>

            </div>
          ) : (
            <PatientDashboard />
          )}
        </main>
      )}

      {/* STAFF / CLINICIAN REVIEWER PORTAL */}
      {portalMode === "STAFF" && (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-slate-500 uppercase tracking-wider font-semibold">
                {currentStaff ? `Signed in as ${currentStaff.name} • ${currentStaff.role}` : "Clinician View"}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Reviewer Dashboard & Triage Queue
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPortalMode("OVERVIEW")}
                className="text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>

          <div className="mb-6">
            <SafetyNotice compact />
          </div>

          {!isStaffLoggedIn ? (
            <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-5 shadow-sm">
              <div className="w-14 h-14 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto border border-teal-200 shadow-2xs">
                <Stethoscope className="w-7 h-7 text-teal-700" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">
                  {t("staffHeroTitle")}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t("staffHeroDesc")}
                </p>
              </div>
              <button
                onClick={() => setShowStaffAuthModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm px-5 py-3 transition-all shadow-sm cursor-pointer"
              >
                <Stethoscope className="w-4 h-4 text-white" />
                <span>{t("clinicalLoginBtn")}</span>
              </button>
            </div>
          ) : (
            <StaffDashboard />
          )}
        </main>
      )}

      {/* Global Modals */}
      <PatientAuthModal
        isOpen={showPatientAuth}
        onClose={() => setShowPatientAuth(false)}
        onSuccess={() => setShowPatientAuth(false)}
      />

      <StaffLoginModal
        isOpen={showStaffAuthModal}
        onClose={() => setShowStaffAuthModal(false)}
        onSuccess={() => {
          setShowStaffAuthModal(false);
          setPortalMode("STAFF");
        }}
      />

      {/* Clinical Site Footer */}
      <SiteFooter />

    </div>
  );
}
