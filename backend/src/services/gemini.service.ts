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
      model: "gemini-3.5-flash",
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
      model: "gemini-3.5-flash",
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

const CANDIDATE_GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
];

export function extractRawBase64(dataUriOrBase64: string): string {
  if (!dataUriOrBase64) return "";
  const commaIdx = dataUriOrBase64.indexOf(",");
  return commaIdx !== -1 ? dataUriOrBase64.slice(commaIdx + 1).trim() : dataUriOrBase64.trim();
}

export async function callGeminiWithFallback(
  parts: any[],
  generationConfig?: any
): Promise<string> {
  const gemini = getGeminiClient();
  if (!gemini) throw new Error("Gemini client not initialized");

  let lastError: any = null;
  for (const modelName of CANDIDATE_GEMINI_MODELS) {
    try {
      const model = gemini.getGenerativeModel({
        model: modelName,
        generationConfig: generationConfig,
      });
      const response = await model.generateContent(parts);
      return response.response.text();
    } catch (err: any) {
      lastError = err;
      console.warn(`⚠️ Model ${modelName} returned error: ${err.message}. Trying next candidate...`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw lastError;
}

export async function transcribeAudioWithAI(
  audioBase64: string,
  mimeType: string = "audio/webm",
  expectedLanguage: string = "en",
  interimTextHint?: string,
  isLiveStream: boolean = false
): Promise<{
  transcript: string;
  transcriptEnglish: string;
  detectedLanguage?: string;
  detectedVitals?: Partial<Vitals>;
  isLiveStream?: boolean;
}> {
  const gemini = getGeminiClient();

  if (!gemini) {
    return {
      transcript: interimTextHint || "Voice audio received.",
      transcriptEnglish: interimTextHint || "Voice audio received.",
    };
  }

  // Filter out browser WebSpeech English gibberish and UI placeholders
  const isInvalidHint = Boolean(
    !interimTextHint ||
    interimTextHint.includes("ରେକର୍ଡ") ||
    interimTextHint.includes("ବିଶ୍ଳେଷଣ") ||
    interimTextHint.includes("Transcribing") ||
    interimTextHint.includes("Listening") ||
    interimTextHint.includes("🎙️") ||
    interimTextHint.includes("⏳") ||
    (expectedLanguage !== "en" &&
      /^[a-zA-Z\s,.'"-]+$/.test(interimTextHint) &&
      (expectedLanguage === "or" || expectedLanguage === "as"))
  );
  const safeInterimHint = isInvalidHint ? "" : (interimTextHint || "").trim();

  try {
    const cleanBase64 = extractRawBase64(audioBase64);
    const cleanMimeType = mimeType ? mimeType.split(";")[0].trim() : "audio/webm";

    // Guard: If audio is completely missing or under 150 chars, do not send to Gemini to hallucinate
    if (!cleanBase64 || cleanBase64.length < 150) {
      if (safeInterimHint) {
        return translateClinicalTextWithAI(safeInterimHint, expectedLanguage).then((res) => ({
          transcript: safeInterimHint,
          transcriptEnglish: res.translatedEnglish,
          detectedLanguage: res.detectedLanguage || (expectedLanguage === "or" ? "Odia (ଓଡ଼ିଆ)" : undefined),
          detectedVitals: res.detectedVitals,
          isLiveStream,
        }));
      }
      return {
        transcript: expectedLanguage === "or"
          ? "ସ୍ୱର ଶୁଣାଗଲା ନାହିଁ, ଦୟାକରି ମାଇକ୍ ପାଖରେ ପୁଣି କୁହନ୍ତୁ (No audio detected, please speak again)"
          : "Audio recording was empty or silent. Please speak into the microphone.",
        transcriptEnglish: "No audio detected. Please check microphone and speak clearly.",
        detectedLanguage: expectedLanguage === "or" ? "Odia (ଓଡ଼ିଆ)" : undefined,
        isLiveStream,
      };
    }

    const fullPrompt = `
You are an expert Clinical Speech Recognition and Multilingual Voice Transcriber for Indian Healthcare contexts (PHCs, Health Camps, District Hospitals, Community Health Clinics).
Listen to the provided voice audio recording carefully. The speaker is describing medical symptoms, complaints, or health issues.

Language Context:
- Target Spoken Language Code: "${expectedLanguage}" (e.g. "or" = Odia, "hi" = Hindi, "bn" = Bengali, "te" = Telugu, "ta" = Tamil, "mr" = Marathi, "gu" = Gujarati, "kn" = Kannada, "ml" = Malayalam, "pa" = Punjabi, "as" = Assamese, "en" = English, "auto" = Auto-detect).
${safeInterimHint ? `- Live phonetic/speech hint from browser: "${safeInterimHint}"` : ""}

CRITICAL INSTRUCTIONS FOR ODIA (language code "or"):
If the target language is "or" (Odia):
- The user is speaking in Odia language. Listen to the actual audio phonetics carefully.
- Transcribe the spoken symptoms in native Odia script (ଓଡ଼ିଆ ଲିପି), for example: "ମୋର ଜର ହେଇଛି" / "ମୋର ଜ୍ୱର ହୋଇଛି", "ମୋର ଝାଡ଼ା ଓ ବାନ୍ତି ହେଉଛି", "ମୁଣ୍ଡ ବିନ୍ଧୁଛି", "ଛାତିରେ କଷ୍ଟ ହେଉଛି", "କାଶ ହେଉଛି", "ପେଟ କାଟୁଛି", etc.
- In "transcript": provide the text in authentic Odia script (ଓଡ଼ିଆ ଲିପି). Do NOT return English words or English gibberish.
- In "transcriptEnglish": provide an accurate, natural clinical English translation (e.g., "I have a fever" or "I have diarrhea and vomiting").
- In "detectedLanguage": set to "Odia (ଓଡ଼ିଆ)".

STRICT ANTI-HALLUCINATION RULES:
- Listen to what was ACTUALLY pronounced in the audio.
- NEVER return generic placeholders like "ମୋର ସ୍ୱାସ୍ଥ୍ୟ ସମସ୍ୟା ହୋଇଛି (ଓଡ଼ିଆ ସ୍ୱର ଗ୍ରହଣ କରାଗଲା)" or "Patient described symptoms in Odia".
- If the patient says "moro jara heichi" or "mate jwara heichi", transcribe "ମୋର ଜର ହେଇଛି" / "ମତେ ଜ୍ୱର ହୋଇଛି" and translate as "I have a fever".

General Instructions:
1. "transcript": Transcribe the exact words spoken into the original native language and script (e.g. Odia script for Odia, Devanagari script for Hindi, Bengali script for Bengali, etc.).
2. "transcriptEnglish": Provide a natural, grammatically correct clinical English translation of the symptom narrative.
3. "detectedLanguage": Name of the detected spoken language (e.g. "Odia (ଓଡ଼ିଆ)", "Hindi (हिन्दी)", "Bengali (বাংলা)", etc.).
4. "detectedVitals": Extract any vital signs mentioned in speech (BP, pulse, SpO2, temp, blood sugar).

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

    const liveStreamPrompt = `
You are an ultra-fast Real-Time Speech Recognizer for Indian Healthcare. Target Language Code: "${expectedLanguage}".
Listen to the audio and transcribe what has been spoken so far immediately into native script (for Odia "or", use authentic Odia script ଓଡ଼ିଆ ଲିପି like "ମୋର ଜର ହେଇଛି").
Also provide a quick clinical English translation.
Return strictly JSON:
{
  "transcript": "Words spoken so far in native script",
  "transcriptEnglish": "English translation so far",
  "detectedLanguage": "${expectedLanguage === 'or' ? 'Odia (ଓଡ଼ିଆ)' : 'Detected Language'}"
}
`;

    const prompt = isLiveStream ? liveStreamPrompt : fullPrompt;

    // Multi-modal parts: Media part MUST be placed first, followed by prompt
    const parts: any[] = [
      {
        inlineData: {
          data: cleanBase64,
          mimeType: cleanMimeType,
        },
      },
      prompt,
    ];

    const text = await callGeminiWithFallback(parts, {
      responseMimeType: "application/json",
      temperature: 0.1,
    });

    const parsed = JSON.parse(text);
    return {
      transcript: parsed.transcript || safeInterimHint || "",
      transcriptEnglish: parsed.transcriptEnglish || parsed.transcript || safeInterimHint || "",
      detectedLanguage: parsed.detectedLanguage || (expectedLanguage === "or" ? "Odia (ଓଡ଼ିଆ)" : undefined),
      detectedVitals: parsed.detectedVitals || {}
    };
  } catch (err) {
    console.warn("⚠️ Gemini Audio Transcription error:", (err as Error).message);
    if (safeInterimHint) {
      // Fallback translate the interim text hint
      return translateClinicalTextWithAI(safeInterimHint, expectedLanguage).then(res => ({
        transcript: safeInterimHint,
        transcriptEnglish: res.translatedEnglish,
        detectedLanguage: res.detectedLanguage,
        detectedVitals: res.detectedVitals
      }));
    }
    return {
      transcript: "ଅଡିଓ ସ୍ପଷ୍ଟ ଶୁଣାଗଲା ନାହିଁ, ଦୟାକରି ପୁଣି କୁହନ୍ତୁ (Audio unclear, please repeat)",
      transcriptEnglish: "Audio unclear or not detected, please speak again.",
      detectedLanguage: expectedLanguage === "or" ? "Odia (ଓଡ଼ିଆ)" : undefined
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
        model: "gemini-3.5-flash",
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



