import { getGeminiClient } from "../config/gemini.js";
import { Attachment, FacilityType, TriageOutput, UrgencyLevel, Vitals } from "../models/types.js";
import { evaluateDeterministicSafetyRules } from "./ruleEngine.service.js";
import { maskPII } from "../utils/piiMasker.js";

export interface TriageInputPayload {
  rawSymptoms: string;
  voiceTranscript?: string;
  inputLanguage: string;
  vitals?: Vitals;
  attachments?: Attachment[];
  facilityType: FacilityType;
  patientDemographics?: {
    age?: number;
    sex?: string;
    bloodGroup?: string;
    isPregnant?: boolean;
  };
}

export async function processTriageWithAI(input: TriageInputPayload): Promise<{
  triageOutput: TriageOutput;
  translatedEnglish: string;
}> {
  const combinedInput = (input.voiceTranscript ? `${input.rawSymptoms} [Voice: ${input.voiceTranscript}]` : input.rawSymptoms).trim();
  const { maskedText } = maskPII(combinedInput);

  // 1. Run deterministic safety rule check
  const ruleResult = evaluateDeterministicSafetyRules(maskedText, input.vitals, input.patientDemographics);

  const gemini = getGeminiClient();

  if (!gemini) {
    // Graceful intelligent fallback when GEMINI_API_KEY is not configured yet
    return fallbackTriageLogic(maskedText, input, ruleResult);
  }

  try {
    const model = gemini.getGenerativeModel({
      model: "gemini-3.8-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1, // Low temperature for factual medical triage
      }
    });

    const prompt = `
You are an expert Clinical Triage AI Assistant for Indian Government and Institutional Health Facilities (PHCs, Health Camps, Industrial Health Units, Campus Clinics, District Hospitals).
Your role is STRICTLY ADVISORY and NON-DIAGNOSTIC. You assist healthcare workers, nurses, and medical officers to organize symptoms, extract clinical timelines, identify red flags, and highlight missing clinical data.

INPUT DATA:
- Patient Demographics: Age ${input.patientDemographics?.age || "Unknown"}, Sex ${input.patientDemographics?.sex || "Unknown"}
- Facility Context: ${input.facilityType}
- Input Language: ${input.inputLanguage}
- Patient Symptom Narrative (PII Masked): "${maskedText}"
- Recorded Vitals: ${JSON.stringify(input.vitals || {})}
- Attached Lab / Image Findings: ${JSON.stringify(input.attachments?.map(a => ({ type: a.type, ocr: a.ocrExtractedText, tags: a.visualObservations })) || [])}
- Deterministic Rule Engine Flags: ${JSON.stringify(ruleResult.redFlagsTriggered)}

OUTPUT REQUIREMENTS (Respond in VALID JSON matching this exact structure):
{
  "translatedEnglish": "Clear English translation and summary of the patient's complaints",
  "urgencyLevel": "EMERGENCY_RED" | "URGENT_YELLOW" | "ROUTINE_GREEN",
  "urgencyScore": 1 to 10 (10 = immediate crash/arrest risk, 1 = minor routine refill),
  "urgencyReason": "Clear clinical justification for this triage urgency level",
  "timelineSummary": "Chronological progression of symptoms (e.g. Day 1: ... -> Day 3: ...)",
  "chiefComplaints": ["List of extracted main symptoms"],
  "aiReasoningNotes": "Key clinical insights and differential safety considerations for the doctor",
  "missingInformationAlerts": ["Crucial vitals or history details that the triage staff should verify"],
  "suggestedFollowUpQuestions": [
    "3 to 4 targeted, high-yield clinical questions for the healthcare worker or doctor to ask the patient"
  ],
  "patientFacingAdvisory": {
    "en": "Empathetic, clear non-prescriptive instructions in English advising the patient on queue priority and emergency warning signs",
    "originalLanguage": "Same advisory translated into patient's native language (${input.inputLanguage})",
    "languageCode": "${input.inputLanguage}"
  }
}

SAFETY CONSTRAINTS:
1. If Deterministic Flags contain RED emergencies, your urgencyLevel MUST be "EMERGENCY_RED" or "URGENT_YELLOW". Never downplay critical vitals.
2. DO NOT prescribe specific drug doses or state definitive medical diagnoses. Keep outputs advisory for the reviewing clinician.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Ensure deterministic rules take priority (Arbitrator logic)
    let finalUrgency: UrgencyLevel = parsed.urgencyLevel || "ROUTINE_GREEN";
    if (ruleResult.ruleUrgencyLevel === "EMERGENCY_RED") {
      finalUrgency = "EMERGENCY_RED";
    } else if (ruleResult.ruleUrgencyLevel === "URGENT_YELLOW" && finalUrgency === "ROUTINE_GREEN") {
      finalUrgency = "URGENT_YELLOW";
    }

    const mergedRedFlags = Array.from(new Set([...ruleResult.redFlagsTriggered, ...(parsed.redFlags || [])]));
    const mergedMissingAlerts = Array.from(new Set([...ruleResult.missingVitalsAlerts, ...(parsed.missingInformationAlerts || [])]));

    const triageOutput: TriageOutput = {
      urgencyLevel: finalUrgency,
      urgencyScore: parsed.urgencyScore || (finalUrgency === "EMERGENCY_RED" ? 9 : finalUrgency === "URGENT_YELLOW" ? 6 : 2),
      urgencyReason: parsed.urgencyReason || (finalUrgency === "EMERGENCY_RED" ? "Triggered critical red flags requiring immediate medical evaluation." : "Stable clinical presentation."),
      timelineSummary: parsed.timelineSummary || "Symptoms reported during intake.",
      chiefComplaints: parsed.chiefComplaints || ["Symptom consultation"],
      deterministicFlags: mergedRedFlags,
      aiReasoningNotes: parsed.aiReasoningNotes || "Automated triage summary generated for qualified medical review.",
      missingInformationAlerts: mergedMissingAlerts,
      suggestedFollowUpQuestions: parsed.suggestedFollowUpQuestions || [
        "How long have you had these symptoms?",
        "Are you taking any ongoing medications?",
        "Do you have any known allergies or prior medical conditions?"
      ],
      patientFacingAdvisory: {
        en: parsed.patientFacingAdvisory?.en || "Please wait for your token to be called. Notify the staff immediately if symptoms worsen.",
        originalLanguage: parsed.patientFacingAdvisory?.originalLanguage || parsed.patientFacingAdvisory?.en,
        languageCode: input.inputLanguage
      },
      generatedAt: new Date(),
    };

    return {
      triageOutput,
      translatedEnglish: parsed.translatedEnglish || maskedText,
    };
  } catch (error) {
    console.warn("⚠️ Gemini AI call failed or timed out. Using deterministic fallback engine.", (error as Error).message);
    return fallbackTriageLogic(maskedText, input, ruleResult);
  }
}

export function getLocalizedPatientAdvisory(urgencyLevel: UrgencyLevel, langCode: string): string {
  const isEmergency = urgencyLevel === "EMERGENCY_RED";
  switch (langCode) {
    case "or":
      return isEmergency 
        ? "🚨 ଜରୁରୀକାଳୀନ: ଆପଣଙ୍କ ଲକ୍ଷଣ ପାଇଁ ତୁରନ୍ତ ଡାକ୍ତରୀ ସହାୟତା ଆବଶ୍ୟକ। ଦୟାକରି ତୁରନ୍ତ ଡ୍ୟୁଟି ନର୍ସ କିମ୍ବା ଡାକ୍ତରଙ୍କୁ ଜଣାନ୍ତୁ।"
        : "ଆପଣଙ୍କ ଟୋକନ୍ କ୍ରମରେ ରଖାଯାଇଛି। ଦୟାକରି ଅପେକ୍ଷା କରନ୍ତୁ ଏବଂ କୌଣସି ଅସୁବିଧା ହେଲେ ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କୁ ଜଣାନ୍ତୁ।";
    case "hi":
      return isEmergency
        ? "🚨 आपातकालीन: आपके लक्षणों के लिए तत्काल डॉक्टर की आवश्यकता है। कृपया तुरंत स्टाफ को सूचित करें।"
        : "आपका टोकन कतार में है। कृपया प्रतीक्षा करें और कोई समस्या होने पर स्वास्थ्य कार्यकर्ता को सूचित करें।";
    case "bn":
      return isEmergency
        ? "🚨 জরুরি: আপনার লক্ষণগুলির জন্য জরুরি চিকিৎসার প্রয়োজন। অবিলম্বে নার্স বা ডাক্তারকে জানান।"
        : "আপনার টোকেন সারিতে রয়েছে। অনুগ্রহ করে অপেক্ষা করুন এবং কোনো অসুবিধা হলে কর্মীদের জানান।";
    case "te":
      return isEmergency
        ? "🚨 అత్యవసరం: మీ లక్షణాలకు తక్షణ వైద్య సహాయం అవసరం. దయచేసి వెంటనే డ్యూటీ నర్సు లేదా వైద్యుడికి తెలియజేయండి."
        : "మీ టోకెన్ వరుసలో ఉంది. దయచేసి వేచి ఉండండి మరియు ఏదైనా అసౌకర్యం ఉంటే సిబ్బందికి తెలియజేయండి.";
    case "ta":
      return isEmergency
        ? "🚨 அவசரநிலை: உங்கள் அறிகுறிகளுக்கு உடனடி மருத்துவ கவனிப்பு தேவை. தயவுசெய்து உடனடியாக மருத்துவருக்கு தெரிவிக்கவும்."
        : "உங்கள் டோக்கன் வரிசையில் உள்ளது. தயவுசெய்து காத்திருக்கவும், ஏதேனும் சிரமம் இருந்தால் பணியாளர்களிடம் தெரிவிக்கவும்.";
    case "mr":
      return isEmergency
        ? "🚨 आणीबाणी: आपल्या लक्षणांसाठी तातडीने वैद्यकीय मदतीची गरज आहे. कृपया त्वरित वैद्यकीय कर्मचाऱ्यांना कळवा."
        : "आपला टोकन रांगेत आहे. कृपया प्रतीक्षा करा आणि काही त्रास झाल्यास आरोग्य कर्मचाऱ्यांना कळवा.";
    case "gu":
      return isEmergency
        ? "🚨 ઇમરજન્સી: તમારા લક્ષણો માટે તાત્કાલિક તબીબી સારવારની જરૂર છે. કૃપા કરીને તરત જ ડૉક્ટરને જાણ કરો."
        : "તમારું ટોકન લાઈનમાં છે. કૃપા કરીને પ્રતીક્ષા કરો અને કોઈ તકલીફ હોય તો સ્ટાફને જાણ કરો.";
    case "kn":
      return isEmergency
        ? "🚨 ತುರ್ತು: ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳಿಗೆ ತಕ್ಷಣದ ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆ ಅಗತ್ಯವಿದೆ. ದಯವಿಟ್ಟು ಕರ್ತವ್ಯದಲ್ಲಿರುವ ಸಿಬ್ಬಂದಿಗೆ ತಿಳಿಸಿ."
        : "ನಿಮ್ಮ ಟೋಕನ್ ಸರದಿಯಲ್ಲಿದೆ. ದಯವಿಟ್ಟು ಕಾಯಿರಿ ಮತ್ತು ಯಾವುದೇ ಅಸ್ವಸ್ಥತೆ ಇದ್ದರೆ ಸಿಬ್ಬಂದಿಗೆ ತಿಳಿಸಿ.";
    case "ml":
      return isEmergency
        ? "🚨 അത്യാഹിതം: നിങ്ങളുടെ ലക്ഷണങ്ങൾക്ക് അടിയന്തര വൈദ്യസഹായം ആവശ്യമാണ്. ഉടൻ ജീവനക്കാരെ അറിയിക്കുക."
        : "നിങ്ങളുടെ ടോക്കൺ ക്യൂവിലാണ്. ദയവായി കാത്തിരിക്കുക, ബുദ്ധിമുട്ടുണ്ടായാൽ ജീവനക്കാരെ അറിയിക്കുക.";
    case "pa":
      return isEmergency
        ? "🚨 ਐਮਰਜੈਂਸੀ: ਤੁਹਾਡੇ ਲੱਛਣਾਂ ਲਈ ਤੁਰੰਤ ਡਾਕਟਰੀ ਸਹਾਇਤਾ ਦੀ ਲੋੜ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਤੁਰੰਤ ਸਟਾਫ ਨੂੰ ਸੂਚਿਤ ਕਰੋ।"
        : "ਤੁਹਾਡਾ ਟੋਕਨ ਕਤਾਰ ਵਿੱਚ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਉਡੀਕ ਕਰੋ ਅਤੇ ਕੋਈ ਸਮੱਸਿਆ ਹੋਣ ਤੇ ਸਟਾਫ ਨੂੰ ਦੱਸੋ।";
    case "as":
      return isEmergency
        ? "🚨 জৰুৰীকালীন: আপোনাৰ লক্ষণসমূহৰ বাবে তৎকালীন চিকিৎসাৰ প্ৰয়োজন। অনুগ্ৰহ কৰি ততালিকে ডাক্তৰক জনাওক।"
        : "আপোনাৰ টোকেন শাৰীত আছে। অনুগ্ৰহ কৰি অপেক্ষা কৰক আৰু কোনো অসুবিধা হ'লে স্বাস্থ্যকৰ্মীক জনাওক।";
    case "en":
    default:
      return isEmergency
        ? "🚨 EMERGENCY: Your symptoms require urgent medical attention. Please notify the nearest nurse or doctor immediately."
        : "Your token has been queued. Please sit in the waiting area and inform the staff if you feel dizzy or breathless.";
  }
}

function fallbackTriageLogic(
  maskedText: string,
  input: TriageInputPayload,
  ruleResult: ReturnType<typeof evaluateDeterministicSafetyRules>
): { triageOutput: TriageOutput; translatedEnglish: string } {
  let urgencyLevel: UrgencyLevel = "ROUTINE_GREEN";
  let score = 3;

  if (ruleResult.ruleUrgencyLevel === "EMERGENCY_RED") {
    urgencyLevel = "EMERGENCY_RED";
    score = 9;
  } else if (ruleResult.ruleUrgencyLevel === "URGENT_YELLOW") {
    urgencyLevel = "URGENT_YELLOW";
    score = 6;
  }

  const complaints: string[] = [];
  if (maskedText.toLowerCase().includes("fever") || maskedText.includes("ଜ୍ୱର") || maskedText.includes("बुखार")) complaints.push("Acute Febrile Illness");
  if (maskedText.toLowerCase().includes("chest pain") || maskedText.includes("ଛାତି")) complaints.push("Chest Pain / Discomfort");
  if (maskedText.toLowerCase().includes("cough") || maskedText.includes("breath") || maskedText.includes("ନିଶ୍ୱାସ")) complaints.push("Respiratory Symptoms");
  if (maskedText.toLowerCase().includes("headache") || maskedText.includes("ମୁଣ୍ଡ")) complaints.push("Cephalea / Headache");
  if (complaints.length === 0) complaints.push("General Health Concern");

  const triageOutput: TriageOutput = {
    urgencyLevel,
    urgencyScore: score,
    urgencyReason: ruleResult.redFlagsTriggered.length > 0 
      ? ruleResult.redFlagsTriggered.join(" | ") 
      : (urgencyLevel === "URGENT_YELLOW" ? "Symptoms warrant timely clinical review within 30-45 minutes." : "Stable presentation suitable for routine OPD triage queue."),
    timelineSummary: "Patient reported acute onset of symptoms. Detailed timeline to be verified during clinical interview.",
    chiefComplaints: complaints,
    deterministicFlags: ruleResult.redFlagsTriggered,
    aiReasoningNotes: "Deterministic clinical safety heuristics applied. Qualified medical officer evaluation recommended.",
    missingInformationAlerts: ruleResult.missingVitalsAlerts,
    suggestedFollowUpQuestions: [
      "When did the symptoms first start and have they progressively worsened?",
      "Do you have a history of diabetes, hypertension, asthma, or cardiac illness?",
      "Are there any associated symptoms such as dizziness, nausea, or sweating?",
      "Have you taken any over-the-counter paracetamol or antibiotics recently?"
    ],
    patientFacingAdvisory: {
      en: getLocalizedPatientAdvisory(urgencyLevel, "en"),
      originalLanguage: getLocalizedPatientAdvisory(urgencyLevel, input.inputLanguage),
      languageCode: input.inputLanguage
    },
    generatedAt: new Date()
  };

  return {
    triageOutput,
    translatedEnglish: maskedText
  };
}


export async function parseDocumentOCRWithAI(imageBase64: string, mimeType: string = "image/jpeg"): Promise<{
  extractedText: string;
  structuredLabValues: Record<string, any>;
  criticalAlerts: string[];
}> {
  const gemini = getGeminiClient();

  if (!gemini) {
    return {
      extractedText: "OCR extraction simulated: CBC Report showing Platelets: 42,000 /µL, Hb: 11.2 g/dL, TLC: 4,500 /cu.mm.",
      structuredLabValues: {
        platelets: "42000 /µL (Low)",
        hemoglobin: "11.2 g/dL",
        totalLeukocyteCount: "4500 /cu.mm"
      },
      criticalAlerts: ["THROMBOCYTOPENIA: Platelet count below 50,000 /µL requires close monitoring for Dengue/Hemorrhagic signs."]
    };
  }

  try {
    const model = gemini.getGenerativeModel({
      model: "gemini-3.8-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
Analyze this uploaded medical document (lab report, prescription, or clinical note).
Extract all visible text and structure key diagnostic parameters (e.g., Platelets, Hemoglobin, TLC, Blood Sugar, SGPT, Creatinine, BP).
Identify if any values are in critical/abnormal danger zones.

Return strictly JSON:
{
  "extractedText": "Full readable transcription of the document text",
  "structuredLabValues": {
    "parameterName": "value with units (Normal/High/Critical)"
  },
  "criticalAlerts": [
    "List any critical/danger-zone findings (e.g. Platelets < 50,000, Hemoglobin < 7 g/dL)"
  ]
}
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.replace(/^data:[^;]+;base64,/, ""),
          mimeType: mimeType
        }
      }
    ]);

    return JSON.parse(result.response.text());
  } catch (err) {
    console.warn("⚠️ Gemini Document OCR error:", (err as Error).message);
    return {
      extractedText: "Document uploaded. OCR text extraction fallback active.",
      structuredLabValues: {},
      criticalAlerts: []
    };
  }
}

export async function transcribeAudioWithAI(
  audioBase64: string,
  mimeType: string = "audio/webm",
  expectedLanguage: string = "en",
  interimTextHint?: string
): Promise<{
  transcript: string;
  transcriptEnglish: string;
  detectedLanguage?: string;
  detectedVitals?: Partial<Vitals>;
}> {
  const gemini = getGeminiClient();

  if (!gemini) {
    return {
      transcript: interimTextHint || "Voice audio received.",
      transcriptEnglish: interimTextHint || "Voice audio received.",
    };
  }

  try {
    const model = gemini.getGenerativeModel({
      model: "gemini-3.8-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, "");

    const prompt = `
You are an expert Clinical Speech Recognition and Multilingual Voice Transcriber for Indian Healthcare contexts (PHCs, Health Camps, District Hospitals, Community Health Clinics).
Listen to the provided voice audio recording carefully. The speaker is describing medical symptoms, complaints, or health issues.

Language Context:
- Target Spoken Language Code: "${expectedLanguage}" (e.g. "or" = Odia, "hi" = Hindi, "bn" = Bengali, "te" = Telugu, "ta" = Tamil, "mr" = Marathi, "gu" = Gujarati, "kn" = Kannada, "ml" = Malayalam, "pa" = Punjabi, "as" = Assamese, "en" = English, "auto" = Auto-detect).
${interimTextHint ? `- Live phonetic/speech hint from browser: "${interimTextHint}"` : ""}

Transcription & Translation Instructions:
1. "transcript": Transcribe the exact words spoken into the original language and script (e.g. for Odia like "moti Jara Haiti / matte jwara heuchi", output proper Odia "ମୋତେ ଜ୍ୱର ହୋଇଛି" and/or Romanized words).
2. "transcriptEnglish": Provide a natural, grammatically correct clinical English translation of the symptom narrative (e.g., "I have a fever / suffering from febrile illness.").
3. "detectedLanguage": Name of the detected spoken language (e.g. "Odia (ଓଡ଼ିଆ)", "Hindi (हिन्दी)", "Bengali (বাংলা)", "Telugu (తెలుగు)", "English", etc.).
4. "detectedVitals": If the patient or healthcare worker mentions any vital signs or measurements in their speech (e.g., blood pressure "150 over 90", pulse "110", oxygen/SpO2 "93%", temperature "102 degrees", sugar "220"), extract the numbers into the detectedVitals object.

Respond strictly in JSON:
{
  "transcript": "Exact spoken words in native script/language",
  "transcriptEnglish": "Accurate clinical English translation",
  "detectedLanguage": "e.g. Odia (ଓଡ଼ିଆ)",
  "detectedVitals": {
    "bpSystolic": number or null,
    "bpDiastolic": number or null,
    "pulseRate": number or null,
    "spo2": number or null,
    "temperature": number or null,
    "bloodSugar": number or null
  }
}
`;

    const parts: any[] = [prompt];
    if (cleanBase64 && cleanBase64.length > 50) {
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType.split(";")[0] || "audio/webm"
        }
      });
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return {
      transcript: parsed.transcript || interimTextHint || "",
      transcriptEnglish: parsed.transcriptEnglish || parsed.transcript || interimTextHint || "",
      detectedLanguage: parsed.detectedLanguage,
      detectedVitals: parsed.detectedVitals || {}
    };
  } catch (err) {
    console.warn("⚠️ Gemini Audio Transcription error:", (err as Error).message);
    if (interimTextHint) {
      // Fallback translate the interim text hint
      return translateClinicalTextWithAI(interimTextHint, expectedLanguage).then(res => ({
        transcript: interimTextHint,
        transcriptEnglish: res.translatedEnglish,
        detectedLanguage: res.detectedLanguage,
        detectedVitals: res.detectedVitals
      }));
    }
    return {
      transcript: "",
      transcriptEnglish: "",
    };
  }
}

export async function translateClinicalTextWithAI(
  text: string,
  sourceLanguageHint: string = "auto"
): Promise<{
  translatedEnglish: string;
  detectedLanguage?: string;
  detectedVitals?: Partial<Vitals>;
}> {
  const gemini = getGeminiClient();
  if (!gemini) {
    return {
      translatedEnglish: fallbackTranslateIndianTerms(text),
      detectedLanguage: sourceLanguageHint,
    };
  }

  const prompt = `
You are a Medical Translation and Clinical Extraction AI for Indian Healthcare contexts (PHCs, Health Camps, District Hospitals).
The patient or healthcare worker entered or spoke symptoms in an Indian language or Romanized dialect (e.g. Odia, Hindi, Bengali, Telugu, Tamil, Marathi, Punjabi, Gujarati, etc., like "moti Jara Haiti" or "ମତେ ଜ୍ୱର ହୋଇଛି" -> "I have a fever").

Input Text: "${text}"
Language Hint: "${sourceLanguageHint}"

Tasks:
1. "translatedEnglish": Translate the symptom statement into clear, grammatically accurate clinical English (e.g. "moti Jara Haiti" -> "I have a fever / feeling feverish").
2. "detectedLanguage": Detect the language / script (e.g. "Odia (ଓଡ଼ିଆ)", "Hindi (हिन्दी)", "Bengali (বাংলা)", "Telugu (తెలుగు)", etc.).
3. "detectedVitals": Extract any vital signs mentioned in the text (BP, pulse, SpO2, temp, blood sugar).

Return strictly JSON:
{
  "translatedEnglish": "Accurate clinical English translation",
  "detectedLanguage": "Name of language",
  "detectedVitals": {
    "bpSystolic": number or null,
    "bpDiastolic": number or null,
    "pulseRate": number or null,
    "spo2": number or null,
    "temperature": number or null,
    "bloodSugar": number or null
  }
}
`;

  // Attempt up to 2 times to handle transient 503s
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const model = gemini.getGenerativeModel({
        model: "gemini-3.8-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      });

      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());
      return {
        translatedEnglish: parsed.translatedEnglish || fallbackTranslateIndianTerms(text),
        detectedLanguage: parsed.detectedLanguage,
        detectedVitals: parsed.detectedVitals || {}
      };
    } catch (err) {
      if (attempt === 1) {
        await new Promise((r) => setTimeout(r, 600));
      } else {
        console.warn("⚠️ Text translation API error after retry:", (err as Error).message);
      }
    }
  }

  return {
    translatedEnglish: fallbackTranslateIndianTerms(text),
    detectedLanguage: sourceLanguageHint
  };
}

function fallbackTranslateIndianTerms(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("jara") || lower.includes("jora") || lower.includes("ଜ୍ୱର") || lower.includes("bukhar") || lower.includes("बुखार")) {
    return "Patient reports suffering from fever.";
  }
  if (lower.includes("chhati") || lower.includes("chati") || lower.includes("ଛାତି") || lower.includes("seena") || lower.includes("chaati")) {
    return "Patient reports severe chest pain / discomfort.";
  }
  if (lower.includes("kasa") || lower.includes("khansi") || lower.includes("କାଶ") || lower.includes("khasi")) {
    return "Patient reports persistent cough and throat irritation.";
  }
  if (lower.includes("munda") || lower.includes("sar dard") || lower.includes("ମୁଣ୍ଡ") || lower.includes("matha")) {
    return "Patient reports acute headache / dizziness.";
  }
  if (lower.includes("peta") || lower.includes("pet dard") || lower.includes("ପେଟ")) {
    return "Patient reports abdominal pain / gastrointestinal upset.";
  }
  if (lower.includes("nishwas") || lower.includes("saans") || lower.includes("ନିଶ୍ୱାସ")) {
    return "Patient reports difficulty breathing / shortness of breath.";
  }
  return raw;
}



