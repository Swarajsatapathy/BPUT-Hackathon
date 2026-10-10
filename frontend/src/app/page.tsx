"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Header } from "../components/common/Header";
import { DisclaimerBanner } from "../components/common/DisclaimerBanner";
import { ConsentModal } from "../components/common/ConsentModal";
import { PatientAuthModal } from "../components/patient/PatientAuthModal";
import { PatientDashboard } from "../components/patient/PatientDashboard";
import { StaffLoginModal } from "../components/healthcare/StaffLoginModal";
import { StaffDashboard } from "../components/healthcare/StaffDashboard";
import { 
  Building2, 
  Phone, 
  Stethoscope, 
} from "lucide-react";

export default function Home() {
  const { 
    portalMode, 
    setPortalMode,
    isPatientLoggedIn, 
    isStaffLoggedIn, 
    showStaffAuthModal, 
    setShowStaffAuthModal 
  } = useAuth();
  const { t, currentLanguage } = useLanguage();

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      
      {/* Header */}
      <Header />

      {/* Statutory Disclaimer */}
      <DisclaimerBanner />

      {/* Consent Modal */}
      <ConsentModal
        isOpen={showConsentModal}
        onAccept={handleConsentAccept}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">
        
        {/* PATIENT PORTAL */}
        {portalMode === "PATIENT" && (
          <div>
            {!isPatientLoggedIn ? (
              <div className="max-w-2xl mx-auto my-6 space-y-4">
                
                {/* Clean Hero Panel */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-7 space-y-5 shadow-card hover:shadow-card-hover transition-all duration-200">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-800 text-[11px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#5cb4ee] animate-pulse"></span>
                      <span>{t("heroBadge")}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      {t("heroTitle")}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {t("heroDesc")}
                    </p>
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => setShowPatientAuth(true)}
                      className="w-full sm:w-auto btn-maya-primary text-xs px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-slate-950" />
                      <span>{t("loginRegister")}</span>
                    </button>
                  </div>

                  {/* Feature Highlights Grid */}
                  <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                    <div className="p-3.5 bg-slate-50/80 hover:bg-brand-50/40 rounded-lg border border-slate-200/90 transition-colors">
                      <span className="font-bold text-xs text-slate-900 block mb-0.5">
                        {t("featureVoiceTitle")}
                      </span>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {t("featureVoiceDesc")}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50/80 hover:bg-brand-50/40 rounded-lg border border-slate-200/90 transition-colors">
                      <span className="font-bold text-xs text-slate-900 block mb-0.5">
                        {t("featureOcrTitle")}
                      </span>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {t("featureOcrDesc")}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50/80 hover:bg-brand-50/40 rounded-lg border border-slate-200/90 transition-colors">
                      <span className="font-bold text-xs text-slate-900 block mb-0.5">
                        {t("featureSafetyTitle")}
                      </span>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {t("featureSafetyDesc")}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Demo Evaluation Strip */}
                <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs">
                  <span>{t("demoMobileHint")} <strong className="text-slate-900 font-mono font-bold">9876543210</strong> (OTP: <strong className="text-slate-900 font-mono font-bold">123456</strong>)</span>
                  <button
                    onClick={() => setShowPatientAuth(true)}
                    className="text-brand-700 hover:text-brand-800 font-bold text-xs hover:underline cursor-pointer"
                  >
                    {t("quickSignIn")}
                  </button>
                </div>

              </div>
            ) : (
              <PatientDashboard />
            )}
          </div>
        )}

        {/* STAFF PORTAL */}
        {portalMode === "STAFF" && (
          <div>
            {!isStaffLoggedIn ? (
              <div className="max-w-md mx-auto my-10 bg-white border border-slate-200/90 rounded-xl p-7 text-center space-y-4 shadow-card hover:shadow-card-hover transition-all">
                <div className="w-12 h-12 bg-brand-50 text-brand-700 rounded-xl flex items-center justify-center mx-auto border border-brand-200/80 shadow-2xs">
                  <Stethoscope className="w-6 h-6 text-brand-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t("staffHeroTitle")}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {t("staffHeroDesc")}
                  </p>
                </div>
                <button
                  onClick={() => setShowStaffAuthModal(true)}
                  className="w-full btn-maya-primary text-xs px-5 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer font-bold"
                >
                  <Stethoscope className="w-4 h-4 text-slate-950" />
                  <span>{t("clinicalLoginBtn")}</span>
                </button>
              </div>
            ) : (
              <StaffDashboard />
            )}
          </div>
        )}

      </main>

      {/* Modals */}
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span>{t("footerPortal")}</span>
          <span className="text-[11px] text-slate-400">{t("footerCompliance")}</span>
        </div>
      </footer>

    </div>
  );
}
