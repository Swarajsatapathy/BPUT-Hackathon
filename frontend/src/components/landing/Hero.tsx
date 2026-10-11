"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export const Hero: React.FC<{
  onStartIntake: () => void;
  onOpenDashboard: () => void;
}> = ({ onStartIntake, onOpenDashboard }) => {
  const { isStaffLoggedIn } = useAuth();
  const { t } = useLanguage();

  return (
    <section className="border-b border-slate-200/90 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div className="flex flex-col gap-6">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50/80 px-3 py-1 text-xs font-semibold text-teal-800">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" aria-hidden="true" />
            {t("heroFacilityBadge")}
          </p>

          <h1 className="text-balance text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.15] tracking-tight text-slate-900">
            {t("heroHeadline")}
          </h1>

          <p className="max-w-xl text-pretty text-base sm:text-lg leading-relaxed text-slate-600">
            {t("heroDescription")}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onStartIntake}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow cursor-pointer"
            >
              {t("btnStartIntake")}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={onOpenDashboard}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-5 text-sm font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-teal-700" aria-hidden="true" />
              {t("btnOpenReviewer")}
            </button>
          </div>

          <dl className="mt-2 grid max-w-lg grid-cols-3 gap-4 border-t border-slate-200 pt-6">
            <div>
              <dt className="text-xs text-slate-500 font-medium">{t("statLanguages")}</dt>
              <dd className="font-mono text-2xl font-bold text-slate-900">12+</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 font-medium">{t("statInputModes")}</dt>
              <dd className="font-mono text-2xl font-bold text-slate-900">4</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 font-medium">{t("statAutoDecisions")}</dt>
              <dd className="font-mono text-2xl font-bold text-teal-700">0</dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg bg-slate-100">
            <Image
              src="/images/phc-triage.png"
              alt="A nurse at a primary health centre using a tablet while speaking with a patient"
              width={1024}
              height={1024}
              priority
              className="aspect-[4/3] h-auto w-full object-cover lg:aspect-square"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
