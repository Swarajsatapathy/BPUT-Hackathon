"use client";

import React from "react";
import { Ban, Eye, FileLock2, History, Lock, UserCheck } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export const SafetyPrivacy: React.FC = () => {
  const { t } = useLanguage();

  const principles = [
    {
      icon: Ban,
      title: t("safetyRule1Title"),
      body: t("safetyRule1Body"),
    },
    {
      icon: UserCheck,
      title: t("safetyRule2Title"),
      body: t("safetyRule2Body"),
    },
    {
      icon: Eye,
      title: t("safetyRule3Title"),
      body: t("safetyRule3Body"),
    },
    {
      icon: Lock,
      title: t("safetyRule4Title"),
      body: t("safetyRule4Body"),
    },
    {
      icon: FileLock2,
      title: t("safetyRule5Title"),
      body: t("safetyRule5Body"),
    },
    {
      icon: History,
      title: t("safetyRule6Title"),
      body: t("safetyRule6Body"),
    },
  ];

  return (
    <section id="safety" className="border-b border-slate-800 bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-400">{t("safetyBadge")}</p>
          <h2 className="mt-2 text-balance text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            {t("safetyTitle")}
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
            {t("safetyDesc")}
          </p>
        </div>

        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="flex gap-4">
                <div className="w-9 h-9 rounded-lg bg-teal-950/80 border border-teal-800/80 text-teal-400 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{p.title}</h3>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-400">{p.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
