"use client";

import React from "react";
import { Building2, Factory, GraduationCap, HeartPulse, Hospital, Tent, Baby } from "lucide-react";

const scenarios = [
  { icon: Hospital, title: "Outpatient queue triage", where: "District hospitals, CHCs" },
  { icon: Factory, title: "Occupational screening", where: "Industrial-estate health units" },
  { icon: GraduationCap, title: "Campus fever triage", where: "University health centres" },
  { icon: Baby, title: "Maternal-health follow-up", where: "PHCs, sub-centres, ASHA visits" },
  { icon: HeartPulse, title: "Chronic disease check-ins", where: "NCD clinics, UPHCs" },
  { icon: Tent, title: "Public health camps", where: "Mobile and outreach camps" },
  { icon: Building2, title: "Referral note preparation", where: "PHC to CHC to district hospital" },
];

const tiers = [
  {
    name: "Low connectivity",
    body: "Offline-first capture, local deterministic comparisons, lightweight UI for basic Android phones and 2G networks.",
  },
  {
    name: "Shared device",
    body: "One tablet per facility with quick PIN-based clinician switching and large, accessible touch targets.",
  },
  {
    name: "Fully digital",
    body: "Integrates with ABDM / ABHA health IDs and existing HMIS for complete continuity of care across lifetime visits.",
  },
];

export const Scenarios: React.FC = () => {
  return (
    <section id="scenarios" className="border-b border-slate-200/90 bg-slate-50/70">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">India-wide relevance</p>
          <h2 className="mt-2 text-balance text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
            Built for every kind of public and institutional facility.
          </h2>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {scenarios.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.title}
                className="flex items-start gap-3 rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-teal-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-snug">{s.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{s.where}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-14">
          <h3 className="text-lg font-bold text-slate-900">Adapts to digital maturity</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {tiers.map((t, i) => (
              <div key={t.name} className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs">
                <div className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2].map((bar) => (
                    <span
                      key={bar}
                      className={`h-1.5 w-6 rounded-full ${bar <= i ? "bg-teal-600" : "bg-slate-200"}`}
                    />
                  ))}
                </div>
                <p className="mt-4 font-bold text-slate-900 text-base">{t.name}</p>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
