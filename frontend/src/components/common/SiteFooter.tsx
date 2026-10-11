"use client";

import React from "react";
import { Phone, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export const SiteFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="space-y-1">
          <p className="font-medium text-slate-700">
            {t("footerPlatform")}
          </p>
          <p className="text-xs text-slate-400">
            {t("footerFacilityDesc")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            {t("footerNonDiag")}
          </span>
          <p className="text-slate-600">
            {t("footerEmergency")} <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">108</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
