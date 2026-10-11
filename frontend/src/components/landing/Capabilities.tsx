"use client";

import React from "react";
import { Camera, FileText, Languages, ListOrdered, Mic, Send } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export const Capabilities: React.FC = () => {
  const { t } = useLanguage();

  const capabilities = [
    {
      icon: Mic,
      title: t("capVoiceTitle"),
      body: t("capVoiceBody"),
    },
    {
      icon: FileText,
      title: t("capOcrTitle"),
      body: t("capOcrBody"),
    },
    {
      icon: Camera,
      title: t("capVisualTitle"),
      body: t("capVisualBody"),
    },
    {
      icon: Languages,
      title: t("capTranslationTitle"),
      body: t("capTranslationBody"),
    },
    {
      icon: ListOrdered,
      title: t("capQueueTitle"),
      body: t("capQueueBody"),
    },
    {
      icon: Send,
      title: t("capReferralTitle"),
      body: t("capReferralBody"),
    },
  ];

  return (
    <section id="capabilities" className="border-b border-slate-200/90 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">{t("capabilitiesBadge")}</p>
            <h2 className="mt-2 text-balance text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
              {t("capabilitiesTitle")}
            </h2>
            <p className="mt-4 text-pretty text-sm sm:text-base leading-relaxed text-slate-600">
              {t("capabilitiesDesc")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((item, idx) => {
              const Icon = item.icon;
              return (
                <article
                  key={idx}
                  className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-5 hover:bg-white hover:border-teal-300 hover:shadow-xs transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900 text-sm sm:text-base">{item.title}</h3>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
