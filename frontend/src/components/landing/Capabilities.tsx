"use client";

import React from "react";
import { Camera, FileText, Languages, ListOrdered, Mic, Send } from "lucide-react";

const capabilities = [
  {
    icon: Mic,
    title: "Voice intake",
    body: "Record symptoms in Hindi, Odia, Bengali, Tamil, Telugu, and more. Transcribed with original-language audio and text kept for verification.",
  },
  {
    icon: FileText,
    title: "Lab report OCR",
    body: "Extracts test names, numeric values, and reference ranges from printed or photographed reports, with confidence scores.",
  },
  {
    icon: Camera,
    title: "Visual inputs",
    body: "Photos of rashes, swelling, or wounds are described objectively and attached to the clinical note — never diagnosed.",
  },
  {
    icon: Languages,
    title: "Two-way translation",
    body: "Clinician follow-up questions are generated in both English and the patient's local tongue, ready to read aloud.",
  },
  {
    icon: ListOrdered,
    title: "Queue prioritization",
    body: "Urgent, Priority, and Routine tags with transparent clinical justifications so the sickest patients are seen first.",
  },
  {
    icon: Send,
    title: "Referral preparation",
    body: "Pre-filled referral notes and physician slips for higher centers (CHC, District Hospital) — editable and signed by the doctor.",
  },
];

export const Capabilities: React.FC = () => {
  return (
    <section id="capabilities" className="border-b border-slate-200/90 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Multimodal by design</p>
            <h2 className="mt-2 text-balance text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
              Works with whatever the patient brings.
            </h2>
            <p className="mt-4 text-pretty text-sm sm:text-base leading-relaxed text-slate-600">
              A crumpled lab printout, a voice note in Odia or Hindi, a photo from a family member&apos;s phone. Swasthya Sakhi
              synthesizes it into one clear note that a clinician can review in under a minute.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
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
