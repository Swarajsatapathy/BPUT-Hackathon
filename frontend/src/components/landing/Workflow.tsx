"use client";

import React from "react";
import { ClipboardList, FileSearch, Mic, Send, UserCheck } from "lucide-react";

const steps = [
  {
    icon: Mic,
    title: "1. Capture",
    body: "Patient or ASHA/ANM speaks or types symptoms in their own language. Reports and photos are uploaded from any phone.",
  },
  {
    icon: FileSearch,
    title: "2. Extract",
    body: "OCR reads lab values, voice is transcribed and translated, and every extracted field keeps a verifiable link to its source.",
  },
  {
    icon: ClipboardList,
    title: "3. Organize",
    body: "A structured note with health timeline, urgency signals, missing information, and suggested follow-up questions.",
  },
  {
    icon: UserCheck,
    title: "4. Human review",
    body: "A nurse, doctor, or medical officer verifies, edits, and signs off. Nothing is final until a human clinician approves it.",
  },
  {
    icon: Send,
    title: "5. Escalate or refer",
    body: "Red-flag cases jump the queue. Referral notes for higher facilities are drafted and verified for the clinician to confirm.",
  },
];

export const Workflow: React.FC = () => {
  return (
    <section id="workflow" className="border-b border-slate-200/90 bg-slate-50/70">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Safety-first workflow</p>
          <h2 className="mt-2 text-balance text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
            The assistant prepares. A qualified professional decides.
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Every step is designed to save clinical minutes while ensuring complete traceability and doctor-in-the-loop signoff.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
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
