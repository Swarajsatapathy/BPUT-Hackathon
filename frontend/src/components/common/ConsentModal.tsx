"use client";

import React, { useState } from "react";
import { Shield, Check } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose?: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onAccept }) => {
  const { t } = useLanguage();
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(true);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(true);

  if (!isOpen) return null;

  const canProceed = agreedToDisclaimer && agreedToPrivacy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#5cb4ee] text-slate-950 px-5 py-3.5 flex items-center justify-between border-b border-[#47a2dc]">
          <div className="flex items-center space-x-2.5">
            <Shield className="w-4 h-4 text-slate-900" />
            <div>
              <h3 className="font-bold text-sm text-slate-950">{t("consentTitle")}</h3>
              <p className="text-[11px] text-slate-800 font-medium">{t("consentSubTitle")}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700 leading-relaxed">
          
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-slate-600">
            {t("consentIntro")}
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-start space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToDisclaimer}
                onChange={(e) => setAgreedToDisclaimer(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#5cb4ee] focus:ring-0"
              />
              <span className="text-xs text-slate-600">
                <strong className="text-slate-900">{t("consentDisclaimerHeading")} </strong>
                {t("consentDisclaimerText")}
              </span>
            </label>

            <label className="flex items-start space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#5cb4ee] focus:ring-0"
              />
              <span className="text-xs text-slate-600">
                <strong className="text-slate-900">{t("consentPrivacyHeading")} </strong>
                {t("consentPrivacyText")}
              </span>
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onAccept}
            disabled={!canProceed}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              canProceed
                ? "bg-[#5cb4ee] hover:bg-[#4aa4de] text-slate-950 shadow-2xs"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Check className="w-3.5 h-3.5 text-slate-950" />
            <span>{t("consentAcceptBtn")}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
