"use client";

import React from "react";
import { Ban, Eye, FileLock2, History, Lock, UserCheck } from "lucide-react";

const principles = [
  {
    icon: Ban,
    title: "Never diagnoses or prescribes",
    body: "Assistant output is strictly limited to summaries, urgency signals, and clarifying questions. Treatment and diagnostic assertions are blocked.",
  },
  {
    icon: UserCheck,
    title: "Mandatory human sign-off",
    body: "Every clinical note, escalation, and referral slip requires an authorized clinician with verified ID and PIN before signoff.",
  },
  {
    icon: Eye,
    title: "Source-linked and explainable",
    body: "Each extracted clinical fact points back to the audio recording, report OCR line, or photo it came from, with confidence scoring.",
  },
  {
    icon: Lock,
    title: "Explicit consent first",
    body: "Digital and spoken patient consent captured in the patient's local tongue before any sensitive clinical data is processed.",
  },
  {
    icon: FileLock2,
    title: "DPDP Act aligned",
    body: "Strict data minimization, encryption at rest and in transit, role-based clinician access, and privacy-preserving audit logs.",
  },
  {
    icon: History,
    title: "Full audit trail",
    body: "Every view, review, override, and referral is logged with exact timestamps and staff credentials for complete accountability.",
  },
];

export const SafetyPrivacy: React.FC = () => {
  return (
    <section id="safety" className="border-b border-slate-800 bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-400">Responsible AI controls</p>
          <h2 className="mt-2 text-balance text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            Guardrails that clinicians and patients can trust.
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
            Engineered from the ground up for safety, ethical compliance, and clinical transparency.
          </p>
        </div>

        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="flex gap-4">
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
