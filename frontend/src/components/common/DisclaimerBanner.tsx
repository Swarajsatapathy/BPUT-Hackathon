"use client";

import React from "react";
import { Info, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export const DisclaimerBanner: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 text-xs text-slate-700">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <p className="leading-normal text-slate-600">
            <strong className="font-semibold text-slate-900">Clinical Protocol Notice: </strong>
            {t("disclaimerText")}
          </p>
        </div>
        <div className="hidden md:flex items-center space-x-1 text-slate-600 bg-white px-2 py-0.5 rounded text-[11px] font-medium shrink-0 border border-slate-200">
          <ShieldCheck className="w-3 h-3 text-slate-500" />
          <span>Anonymized Session</span>
        </div>
      </div>
    </div>
  );
};
