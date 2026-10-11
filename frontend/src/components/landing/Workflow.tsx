"use client";

import React from "react";
import { ClipboardList, FileSearch, Mic, Send, UserCheck } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export const Workflow: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: Mic,
      title: t("workflowStep1Title"),
      body: t("workflowStep1Body"),
    },
    {
      icon: FileSearch,
      title: t("workflowStep2Title"),
      body: t("workflowStep2Body"),
    },
    {
      icon: ClipboardList,
      title: t("workflowStep3Title"),
      body: t("workflowStep3Body"),
    },
    {
      icon: UserCheck,
      title: t("workflowStep4Title"),
      body: t("workflowStep4Body"),
    },
    {
      icon: Send,
      title: t("workflowStep5Title"),
      body: t("workflowStep5Body"),
    },
  ];

  return (
    <section id="workflow" className="border-b border-slate-200/90 bg-slate-50/70">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">{t("workflowBadge")}</p>
          <h2 className="mt-2 text-balance text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
            {t("workflowTitle")}
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            {t("workflowDesc")}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-teal-300 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4 border border-teal-100">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
