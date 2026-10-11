import { UrgencyLevel, Vitals } from "../models/types.js";

export interface RuleEvaluationResult {
  ruleUrgencyLevel: UrgencyLevel | "NONE";
  redFlagsTriggered: string[];
  missingVitalsAlerts: string[];
  safetyWarnings: string[];
}

export function evaluateDeterministicSafetyRules(
  symptomText: string,
  vitals?: Vitals,
  patientDemographics?: { age?: number; sex?: string; isPregnant?: boolean },
  attachments?: any[]
): RuleEvaluationResult {
  const redFlags: string[] = [];
  const warnings: string[] = [];
  const missingVitals: string[] = [];
  let highestUrgency: UrgencyLevel | "NONE" = "NONE";

  const lowerText = (symptomText || "").toLowerCase();

  // 1. Vital Signs Hard Thresholds (Deterministic Medical Standards)
  if (vitals) {
    // SpO2
    if (vitals.spo2 !== undefined && vitals.spo2 !== null) {
      if (vitals.spo2 < 90) {
        redFlags.push(`CRITICAL HYPOXEMIA: SpO2 is ${vitals.spo2}% (< 90%). Immediate high-flow oxygen required.`);
        highestUrgency = "EMERGENCY_RED";
      } else if (vitals.spo2 <= 94) {
        warnings.push(`Borderline Hypoxia: SpO2 is ${vitals.spo2}% (90-94%). Monitor closely.`);
        if (highestUrgency === "NONE" || highestUrgency === "ROUTINE_GREEN") highestUrgency = "URGENT_YELLOW";
      }
    }

    // Blood Pressure
    if (vitals.bpSystolic !== undefined && vitals.bpSystolic !== null) {
      if (vitals.bpSystolic >= 180 || (vitals.bpDiastolic && vitals.bpDiastolic >= 120)) {
        redFlags.push(`HYPERTENSIVE CRISIS: BP ${vitals.bpSystolic}/${vitals.bpDiastolic || "-"} mmHg. Risk of acute organ damage.`);
        highestUrgency = "EMERGENCY_RED";
      } else if (vitals.bpSystolic < 85) {
        redFlags.push(`CRITICAL HYPOTENSION / SHOCK: Systolic BP ${vitals.bpSystolic} mmHg (< 85 mmHg). Risk of circulatory collapse.`);
        highestUrgency = "EMERGENCY_RED";
      } else if (vitals.bpSystolic >= 140 || (vitals.bpDiastolic && vitals.bpDiastolic >= 90)) {
        warnings.push(`Elevated Blood Pressure: ${vitals.bpSystolic}/${vitals.bpDiastolic || "-"} mmHg.`);
        if (highestUrgency === "NONE") highestUrgency = "URGENT_YELLOW";
      }
    }

    // Pulse Rate
    if (vitals.pulseRate !== undefined && vitals.pulseRate !== null) {
      if (vitals.pulseRate >= 140) {
        redFlags.push(`SEVERE TACHYCARDIA: Pulse ${vitals.pulseRate} bpm (>= 140 bpm). Risk of cardiac decompensation.`);
        highestUrgency = "EMERGENCY_RED";
      } else if (vitals.pulseRate < 40) {
        redFlags.push(`SEVERE BRADYCARDIA: Pulse ${vitals.pulseRate} bpm (< 40 bpm). Risk of syncope/arrest.`);
        highestUrgency = "EMERGENCY_RED";
      } else if (vitals.pulseRate > 110) {
        warnings.push(`Tachycardia: Pulse ${vitals.pulseRate} bpm.`);
        if (highestUrgency === "NONE") highestUrgency = "URGENT_YELLOW";
      }
    }

    // Body Temperature
    if (vitals.temperature !== undefined && vitals.temperature !== null) {
      if (vitals.temperature >= 104) {
        redFlags.push(`HYPERPYREXIA: Body temperature ${vitals.temperature}°F (>= 104°F). Risk of febrile encephalopathy/convulsion.`);
        highestUrgency = "EMERGENCY_RED";
      } else if (vitals.temperature >= 101) {
        warnings.push(`High Grade Fever: ${vitals.temperature}°F.`);
        if (highestUrgency === "NONE") highestUrgency = "URGENT_YELLOW";
      }
    }

    // Blood Sugar
    if (vitals.bloodSugar !== undefined && vitals.bloodSugar !== null) {
      if (vitals.bloodSugar < 54) {
        redFlags.push(`SEVERE HYPOGLYCEMIA: Blood glucose ${vitals.bloodSugar} mg/dL (< 54 mg/dL). Immediate IV dextrose/oral glucose needed.`);
        highestUrgency = "EMERGENCY_RED";
      } else if (vitals.bloodSugar >= 400) {
        redFlags.push(`SEVERE HYPERGLYCEMIA: Blood glucose ${vitals.bloodSugar} mg/dL (>= 400 mg/dL). Risk of DKA/HHS.`);
        highestUrgency = "EMERGENCY_RED";
      }
    }
  }

  // 2. Multilingual Keyword & Symptom Heuristics (English, Hindi, Odia)
  
  // A. Suspected Acute Coronary Syndrome (Chest pain + diaphoresis / radiating)
  const chestPainKeywords = ["chest pain", "crushing pain", "radiating to jaw", "radiating to left arm", "heavy pressure in chest", "छाती में दर्द", "छाती में भारीपन", "ବାମ ହାତ ଯନ୍ତ୍ରଣା", "ଛାତି ଯନ୍ତ୍ରଣା", "ଛାତି ଧଡ଼ଧଡ଼"];
  const diaphoresisKeywords = ["profuse sweating", "sweating", "cold sweat", "पसीना", "ଝାଳ ବୋହିବା", "ଝାଳ"];
  
  const hasChestPain = chestPainKeywords.some(kw => lowerText.includes(kw.toLowerCase()));
  const hasDiaphoresis = diaphoresisKeywords.some(kw => lowerText.includes(kw.toLowerCase()));

  if (hasChestPain && (hasDiaphoresis || (vitals?.bpSystolic && vitals.bpSystolic > 150) || (patientDemographics?.age && patientDemographics.age > 40))) {
    redFlags.push("ACUTE CORONARY SYNDROME RED FLAG: Suspected cardiac chest pain with vegetative/hemodynamic signs. Immediate ECG & Doctor review required.");
    highestUrgency = "EMERGENCY_RED";
  } else if (hasChestPain) {
    warnings.push("Chest pain reported: Requires priority ECG and vital monitoring.");
    if (highestUrgency !== "EMERGENCY_RED") highestUrgency = "URGENT_YELLOW";
  }

  // B. Stroke / Neurological Red Flags (FAST)
  const strokeKeywords = ["slurred speech", "facial droop", "face drooping", "one side weak", "paralysis", "sudden confusion", "mouth drooping", "बोलने में दिक्कत", "लकवा", "ମୁହଁ ବଙ୍କା", "ଗୋଟିଏ ପାର୍ଶ୍ୱ ଦୁର୍ବଳ", "ଅଚେତ"];
  if (strokeKeywords.some(kw => lowerText.includes(kw.toLowerCase()))) {
    redFlags.push("ACUTE NEUROLOGICAL RED FLAG: Suspected Stroke / Focal Neurological Deficit (FAST signs). Immediate neuro-triage required.");
    highestUrgency = "EMERGENCY_RED";
  }

  // C. Respiratory Distress Signs
  const respKeywords = ["gasping for air", "cannot breathe", "stridor", "blue lips", "cyanosis", "severe breathlessness", "सांस फूलना", "दम घुटना", "ନିଶ୍ୱାସ ବନ୍ଦ", "ନିଶ୍ୱାସ ନେବାରେ ତୀବ୍ର କଷ୍ଟ"];
  if (respKeywords.some(kw => lowerText.includes(kw.toLowerCase()))) {
    redFlags.push("ACUTE RESPIRATORY COMPROMISE: Severe breathing difficulty reported. High risk of airway compromise.");
    highestUrgency = "EMERGENCY_RED";
  }

  // D. Maternal Red Flags (Pregnancy + High BP + Headache/Vision)
  const maternalKeywords = ["pregnant", "pregnancy", "3rd trimester", "ଗର୍ଭବତୀ", "गर्भवती"];
  const preeclampsiaKeywords = ["severe headache", "blurred vision", "swollen feet", "epigastric pain", "धुंधला दिखाई", "ମୁଣ୍ଡ ବୁଲାଇବା", "ପାଦ ଫୁଲିବା"];
  
  const isMaternalContext = maternalKeywords.some(kw => lowerText.includes(kw.toLowerCase())) || patientDemographics?.isPregnant;
  const hasPreeclampsiaSigns = preeclampsiaKeywords.some(kw => lowerText.includes(kw.toLowerCase()));

  if (isMaternalContext && (hasPreeclampsiaSigns || (vitals?.bpSystolic && vitals.bpSystolic >= 140))) {
    redFlags.push("OBSTETRIC RED FLAG: Suspected Preeclampsia/Eclampsia in pregnancy (High BP + cerebral/visual warning signs). Urgent specialist assessment needed.");
    highestUrgency = "EMERGENCY_RED";
  }

  // E. Severe Bleeding / Dengue Warning Signs
  const bleedingKeywords = ["blood in vomit", "black stool", "bleeding from gums", "petechiae", "खून की उल्टी", "କଳା ଝାଡ଼ା", "ରକ୍ତ ବାନ୍ତି", "ରକ୍ତସ୍ରାବ"];
  if (bleedingKeywords.some(kw => lowerText.includes(kw.toLowerCase()))) {
    redFlags.push("HEMORRHAGIC RED FLAG: Active gastrointestinal or mucosal bleeding detected. Risk of hypovolemic shock / Severe Dengue.");
    highestUrgency = "EMERGENCY_RED";
  }

  // 3. Laboratory / Diagnostic Report Red Flags (CBC, Platelets, Hemoglobin, Dengue)
  if (Array.isArray(attachments) && attachments.length > 0) {
    for (const att of attachments) {
      const ocrText = (att.ocrExtractedText || "").toLowerCase();
      const fileName = (att.fileName || "").toLowerCase();
      const parsed = att.parsedValues || {};

      // A. Platelet Count Evaluation
      let plateletVal: number | null = null;
      if (typeof parsed.plateletCount === "number") {
        plateletVal = parsed.plateletCount;
      } else if (typeof parsed.platelets === "number") {
        plateletVal = parsed.platelets;
      } else if (typeof parsed.platelets === "string") {
        const match = parsed.platelets.replace(/,/g, "").match(/\d+/);
        if (match) plateletVal = parseInt(match[0], 10);
      }

      // Check OCR text regex if not parsed numerically
      if (plateletVal === null) {
        const platMatch = ocrText.replace(/,/g, "").match(/platelet(?:s|\s+count)?[:\s]+(\d+)/i);
        if (platMatch) {
          plateletVal = parseInt(platMatch[1], 10);
        }
      }

      if (plateletVal !== null) {
        if (plateletVal < 20000) {
          redFlags.push(`CRITICAL THROMBOCYTOPENIA: Platelet count ${plateletVal.toLocaleString()} /µL (< 20,000 /µL). Severe spontaneous hemorrhage risk. Immediate transfusion/doctor review.`);
          highestUrgency = "EMERGENCY_RED";
        } else if (plateletVal < 100000) {
          warnings.push(`SIGNIFICANT THROMBOCYTOPENIA: Platelet count ${plateletVal.toLocaleString()} /µL (< 100,000 /µL). Suspected Dengue / hemorrhagic warning sign.`);
          if (highestUrgency !== "EMERGENCY_RED") {
            highestUrgency = "URGENT_YELLOW";
          }
        }
      }

      // B. Hemoglobin Evaluation
      let hbVal: number | null = null;
      if (typeof parsed.hemoglobin === "number") hbVal = parsed.hemoglobin;
      else if (typeof parsed.hemoglobin === "string") {
        const m = parsed.hemoglobin.match(/(\d+(?:\.\d+)?)/);
        if (m) hbVal = parseFloat(m[1]);
      }
      if (hbVal === null) {
        const hbMatch = ocrText.match(/(?:hemoglobin|hb)[:\s]+(\d+(?:\.\d+)?)/i);
        if (hbMatch) hbVal = parseFloat(hbMatch[1]);
      }

      if (hbVal !== null) {
        if (hbVal < 7.0) {
          redFlags.push(`CRITICAL ANEMIA: Hemoglobin ${hbVal} g/dL (< 7.0 g/dL). High risk of tissue hypoxia / cardiac failure.`);
          highestUrgency = "EMERGENCY_RED";
        } else if (hbVal < 9.0) {
          warnings.push(`Moderate/Severe Anemia: Hemoglobin ${hbVal} g/dL (< 9.0 g/dL).`);
          if (highestUrgency !== "EMERGENCY_RED") {
            highestUrgency = "URGENT_YELLOW";
          }
        }
      }

      // C. Keyword Heuristics in Lab Report
      const dengueLabKeywords = ["thrombocytopenia", "dengue hemorrhagic", "severe thrombocytopenia", "hemoconcentration", "platelet count low", "low platelets", "cbc report"];
      if (dengueLabKeywords.some(kw => ocrText.includes(kw) || fileName.includes(kw))) {
        if (ocrText.includes("severe") || ocrText.includes("hemorrhagic") || ocrText.includes("critical")) {
          warnings.push("CBC / Diagnostic Report reveals critical hematological anomaly requiring priority physician review.");
          if (highestUrgency !== "EMERGENCY_RED") {
            highestUrgency = "URGENT_YELLOW";
          }
        } else if (highestUrgency !== "EMERGENCY_RED") {
          warnings.push("Uploaded CBC / Lab Investigation requires prompt clinical evaluation.");
          highestUrgency = "URGENT_YELLOW";
        }
      }
    }
  }

  // 4. Missing Clinical Vitals Checks
  if (!vitals || vitals.bpSystolic === undefined) {
    missingVitals.push("Blood Pressure (BP) has not been recorded.");
  }
  if (!vitals || vitals.spo2 === undefined) {
    if (hasChestPain || respKeywords.some(kw => lowerText.includes(kw.toLowerCase()))) {
      missingVitals.push("CRITICAL: Oxygen Saturation (SpO2) is missing for a patient with cardiopulmonary complaints.");
    } else {
      missingVitals.push("Oxygen Saturation (SpO2) is not recorded.");
    }
  }
  if (!vitals || vitals.temperature === undefined) {
    missingVitals.push("Body Temperature is not recorded.");
  }
  if (!vitals || vitals.pulseRate === undefined) {
    missingVitals.push("Pulse / Heart Rate is not recorded.");
  }

  return {
    ruleUrgencyLevel: highestUrgency,
    redFlagsTriggered: redFlags,
    missingVitalsAlerts: missingVitals,
    safetyWarnings: warnings
  };
}
