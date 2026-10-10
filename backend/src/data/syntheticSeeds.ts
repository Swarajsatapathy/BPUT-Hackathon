import { CaseRecord, Patient, StaffMember } from "../models/types.js";

export const initialStaffMembers: StaffMember[] = [
  {
    _id: "DOC-201",
    name: "Dr. Alok Nayak (MD, Medicine)",
    role: "Medical Officer",
    facilityName: "Khurda Community Health Centre / PHC",
    facilityType: "PRIMARY_HEALTH_CENTER",
    pin: "1234",
  },
  {
    _id: "NURSE-105",
    name: "Sister Sunita Mohanty (B.Sc Nursing)",
    role: "Staff Nurse",
    facilityName: "Paradip Industrial Estate Health Unit",
    facilityType: "INDUSTRIAL_HEALTH_UNIT",
    pin: "1234",
  },
  {
    _id: "ASHA-302",
    name: "Meenakshi Das (ASHA Community Lead)",
    role: "ASHA Worker",
    facilityName: "Mobile Tribal Health Camp - Koraput",
    facilityType: "PUBLIC_HEALTH_CAMP",
    pin: "1234",
  }
];

export const seedPatients: Patient[] = [
  {
    _id: "PAT-10821",
    phoneNumber: "9876543210",
    fullName: "Ramesh Chandra Sahoo",
    age: 52,
    sex: "Male",
    bloodGroup: "B+",
    emergencyContact: {
      name: "Pravat Sahoo",
      relation: "Child",
      phone: "9876543211",
    },
    registeredAt: new Date(Date.now() - 3600000 * 24 * 3),
  },
  {
    _id: "PAT-10822",
    phoneNumber: "9812345678",
    fullName: "Priyanka Jena",
    age: 21,
    sex: "Female",
    bloodGroup: "O+",
    emergencyContact: {
      name: "Suresh Jena",
      relation: "Parent",
      phone: "9812345679",
    },
    registeredAt: new Date(Date.now() - 3600000 * 24 * 1),
  },
  {
    _id: "PAT-10823",
    phoneNumber: "9734567890",
    fullName: "Sunita Devi",
    age: 27,
    sex: "Female",
    bloodGroup: "A+",
    emergencyContact: {
      name: "Manoj Kumar",
      relation: "Spouse",
      phone: "9734567891",
    },
    registeredAt: new Date(Date.now() - 3600000 * 12),
  },
  {
    _id: "PAT-10824",
    phoneNumber: "9654321098",
    fullName: "Bikramjeet Singh",
    age: 38,
    sex: "Male",
    bloodGroup: "O-",
    emergencyContact: {
      name: "Harpreet Kaur",
      relation: "Spouse",
      phone: "9654321099",
    },
    registeredAt: new Date(Date.now() - 3600000 * 4),
  },
  {
    _id: "PAT-10825",
    phoneNumber: "9543210987",
    fullName: "Basanti Mohapatra",
    age: 64,
    sex: "Female",
    bloodGroup: "AB+",
    emergencyContact: {
      name: "Debasish Mohapatra",
      relation: "Child",
      phone: "9543210988",
    },
    registeredAt: new Date(Date.now() - 3600000 * 24 * 10),
  }
];

export const seedCases: CaseRecord[] = [
  // 1. Emergency Red: Acute Coronary Syndrome (PHC Outpatient)
  {
    _id: "CASE-2026-1001",
    patientId: "PAT-10821",
    tokenNumber: "PHC-RED-01",
    facilityType: "PRIMARY_HEALTH_CENTER",
    status: "PENDING_REVIEW",
    inputLanguage: "or",
    rawSymptomInput: "ମୋ ଛାତି ମଝିରେ ବହୁତ ଜୋର ଚାପ ଏବଂ ଯନ୍ତ୍ରଣା ହେଉଛି। ଯନ୍ତ୍ରଣା ବାମ ହାତ ଏବଂ କାନ୍ଧକୁ ଯାଉଛି। ବହୁତ ଥଣ୍ଡା ଝାଳ ବୋହୁଛି ଏବଂ ନିଶ୍ୱାସ ନେବାରେ କଷ୍ଟ ହେଉଛି। (Severe crushing central chest pain radiating to left arm with cold diaphoresis).",
    voiceTranscript: "ମୋ ଛାତି ଫାଟିଯିବା ପରି ଲାଗୁଛି, ବାମ ବାହୁକୁ ଯନ୍ତ୍ରଣା ଯାଉଛି।",
    translatedEnglishInput: "52-year-old male presenting with severe crushing retrosternal chest pain radiating to the left shoulder and arm for the past 45 minutes, accompanied by profuse diaphoresis and acute shortness of breath.",
    vitals: {
      bpSystolic: 184,
      bpDiastolic: 112,
      pulseRate: 118,
      spo2: 91,
      temperature: 98.4,
      bloodSugar: 210,
      respiratoryRate: 26,
    },
    attachments: [
      {
        id: "att-1",
        type: "prescription",
        fileName: "Previous_Hypertension_Rx.jpg",
        ocrExtractedText: "Rx: Tab Telmisartan 40mg OD, Tab Amlodipine 5mg. Irregular compliance noted.",
        parsedValues: { medication: "Telmisartan 40mg", compliance: "Irregular" }
      }
    ],
    triageOutput: {
      urgencyLevel: "EMERGENCY_RED",
      urgencyScore: 10,
      urgencyReason: "CRITICAL: Suspected Acute Coronary Syndrome / Hypertensive Crisis (BP 184/112 mmHg, chest pain with left arm radiation and diaphoresis).",
      timelineSummary: "Onset 45 mins ago while working in the field; progressively severe, unresponsive to rest.",
      chiefComplaints: ["Severe crushing chest pain", "Left arm radiation", "Profuse cold diaphoresis", "Dyspnea"],
      deterministicFlags: [
        "HYPERTENSIVE CRISIS: BP 184/112 mmHg",
        "ACUTE CORONARY SYNDROME RED FLAG: Anginal chest pain with radiation & vegetative sweating"
      ],
      aiReasoningNotes: "High probability of STEMI/NSTEMI. Immediate 12-lead ECG, oxygen, chewable Aspirin/Clopidogrel loading if per protocol, and immediate transfer preparation to tertiary cardiology facility.",
      missingInformationAlerts: [
        "Immediate 12-lead ECG not yet recorded.",
        "Verify time of last meal/aspirin contraindications."
      ],
      suggestedFollowUpQuestions: [
        "Did the chest pain start suddenly or build up gradually?",
        "Do you have previous history of heart attacks or stenting?",
        "Are you experiencing any nausea, vomiting, or dizziness?"
      ],
      patientFacingAdvisory: {
        en: "🚨 CRITICAL PRIORITY: Please remain seated and rest. Our medical officer and emergency nurse are attending to you immediately.",
        originalLanguage: "🚨 ଜରୁରୀକାଳୀନ ପ୍ରାଥମିକତା: ଦୟାକରି ଶାନ୍ତ ରୁହନ୍ତୁ ଏବଂ ବସନ୍ତୁ। ଡାକ୍ତର ଏବଂ ନର୍ସ ତୁରନ୍ତ ଆପଣଙ୍କୁ ଚିକିତ୍ସା କରିବାକୁ ଆସୁଛନ୍ତି।",
        languageCode: "or"
      },
      generatedAt: new Date(Date.now() - 3600000 * 0.2)
    },
    auditTrail: [
      {
        action: "CASE_CREATED",
        actor: "ASHA Intake Desk",
        timestamp: new Date(Date.now() - 3600000 * 0.2),
        details: "Triage ticket issued with Emergency Red Flag."
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 0.2),
    updatedAt: new Date(Date.now() - 3600000 * 0.2)
  },

  // 2. Urgent Yellow: Campus Fever & Thrombocytopenia (Campus Health Center)
  {
    _id: "CASE-2026-1002",
    patientId: "PAT-10822",
    tokenNumber: "UNIV-YEL-04",
    facilityType: "CAMPUS_HEALTH_CENTER",
    status: "PENDING_REVIEW",
    inputLanguage: "en",
    rawSymptomInput: "High fever (102.8°F) for 4 days, severe retro-orbital eye pain, joint ache, nausea, and mild rash over both forearms. Hostel roommate also had dengue recently.",
    voiceTranscript: "I have had severe eye pain and fever for four days. CBC report shows low platelets.",
    translatedEnglishInput: "21-year-old student presenting with 4-day high-grade fever, retro-orbital headache, severe arthralgia/myalgia ('break-bone pain'), and maculopapular forearm rash with epidemiological dengue cluster exposure.",
    vitals: {
      bpSystolic: 110,
      bpDiastolic: 74,
      pulseRate: 98,
      spo2: 98,
      temperature: 102.8,
      bloodSugar: 92,
      respiratoryRate: 18,
    },
    attachments: [
      {
        id: "att-2",
        type: "lab_report",
        fileName: "Campus_CBC_Lab_Report.png",
        ocrExtractedText: "CBC Report: Hemoglobin: 13.5 g/dL, Total Leukocyte Count: 3,200 /cumm, Platelet Count: 48,000 /cumm [LOW], Hematocrit: 44%.",
        parsedValues: {
          platelets: "48,000 /µL (Thrombocytopenia)",
          tlc: "3,200 /cu.mm (Leukopenia)",
          hematocrit: "44%"
        },
        visualObservations: ["Macular petechial rash on distal forearms"]
      }
    ],
    triageOutput: {
      urgencyLevel: "URGENT_YELLOW",
      urgencyScore: 7,
      urgencyReason: "Dengue with warning signs / Moderate Thrombocytopenia (Platelets 48,000 /µL, 4-day fever, retro-orbital pain). Requires review within 30 minutes.",
      timelineSummary: "Day 1: Chills & high fever -> Day 2-3: Severe retro-orbital & joint pain -> Day 4: Rash & thrombocytopenia on lab.",
      chiefComplaints: ["High-grade fever (102.8°F)", "Retro-orbital headache", "Severe joint pain", "Thrombocytopenia"],
      deterministicFlags: [
        "THROMBOCYTOPENIA ALERT: Platelets 48,000 /µL (< 50,000 /µL threshold for strict fluid monitoring)",
        "High Grade Fever: 102.8°F"
      ],
      aiReasoningNotes: "Suspected Dengue Fever in critical phase (transition from febrile to afebrile stage). Must monitor hematocrit rise, warning signs (abdominal pain, mucosal bleeding, persistent vomiting), and ensure oral rehydration/IV fluid protocol.",
      missingInformationAlerts: [
        "Check for postural giddiness / capillary refill time.",
        "Verify Dengue NS1 / IgM serology test status."
      ],
      suggestedFollowUpQuestions: [
        "Are you experiencing any gum bleeding, nosebleeds, or black stools?",
        "Have you had persistent vomiting or severe abdominal pain?",
        "How many glasses of ORS/water have you managed to drink today?"
      ],
      patientFacingAdvisory: {
        en: "🟡 URGENT: Your token is in the priority triage queue. Please drink plenty of fluids (ORS/coconut water) and report immediately if you notice bleeding or severe stomach pain.",
        originalLanguage: "🟡 URGENT: Your token is in the priority triage queue. Please drink fluids and report any bleeding signs.",
        languageCode: "en"
      },
      generatedAt: new Date(Date.now() - 3600000 * 1.5)
    },
    auditTrail: [
      {
        action: "CASE_CREATED",
        actor: "Campus Health Nurse",
        timestamp: new Date(Date.now() - 3600000 * 1.5),
        details: "Assigned Urgent Yellow queue status."
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 1.5),
    updatedAt: new Date(Date.now() - 3600000 * 1.5)
  },

  // 3. Emergency Red: Obstetric / Preeclampsia Screen (Mobile Tribal Camp)
  {
    _id: "CASE-2026-1003",
    patientId: "PAT-10823",
    tokenNumber: "CAMP-RED-02",
    facilityType: "PUBLIC_HEALTH_CAMP",
    status: "PENDING_REVIEW",
    inputLanguage: "hi",
    rawSymptomInput: "8 महीने की गर्भवती हूँ। पिछले 2 दिन से बहुत तेज सिरदर्द, आंखों के आगे अंधेरा छाना और दोनों पैरों में बहुत ज्यादा सूजन है। उल्टी जैसा लग रहा है। (8 months pregnant with severe continuous headache, blurred vision, bilateral pedal edema, and nausea).",
    voiceTranscript: "मुझे सिर में बहुत दर्द हो रहा है और देखने में धुंधलापन लग रहा है।",
    translatedEnglishInput: "27-year-old primigravida (34 weeks gestation) presenting with acute severe persistent headache, scotoma/blurred vision, severe bilateral lower extremity edema, and epigastric nausea.",
    vitals: {
      bpSystolic: 168,
      bpDiastolic: 106,
      pulseRate: 94,
      spo2: 97,
      temperature: 98.6,
      bloodSugar: 104,
      respiratoryRate: 20,
    },
    attachments: [
      {
        id: "att-3",
        type: "lab_report",
        fileName: "MCH_Urine_Dipstick.jpg",
        ocrExtractedText: "Urine Protein Dipstick: 3+ Proteinuria. Albumin present in high concentration.",
        parsedValues: { urineProtein: "3+ (Severe Proteinuria)", gestationalAge: "34 weeks" }
      }
    ],
    triageOutput: {
      urgencyLevel: "EMERGENCY_RED",
      urgencyScore: 10,
      urgencyReason: "CRITICAL OBSTETRIC EMERGENCY: Severe Preeclampsia with Impending Eclampsia signs (BP 168/106 mmHg, 3+ Proteinuria, severe headache, blurred vision).",
      timelineSummary: "Gradual pedal edema over 1 week, acute severe headache and visual disturbance since yesterday evening.",
      chiefComplaints: ["Severe persistent frontal headache", "Blurred vision / Scotoma", "Marked pedal edema", "Gestational Hypertension (168/106 mmHg)"],
      deterministicFlags: [
        "OBSTETRIC RED FLAG: 3rd trimester pregnancy + High BP (168/106) + Neurological/Visual signs",
        "SEVERE PROTEINURIA: 3+ on dipstick"
      ],
      aiReasoningNotes: "Imminent risk of eclamptic seizures, placental abruption, or maternal organ compromise. Immediate Magnesium Sulfate loading per protocol, anti-hypertensive control (Labetalol/Nifedipine), and immediate 108 Ambulance referral to District Hospital Maternity ICU.",
      missingInformationAlerts: [
        "Assess deep tendon reflexes (patellar hyperreflexia/clonus).",
        "Auscultate fetal heart sounds (FHS) immediately."
      ],
      suggestedFollowUpQuestions: [
        "Are you feeling normal fetal movements today?",
        "Do you have any severe pain right under your ribs (epigastric/right upper quadrant)?",
        "Have you had any history of convulsions or fainting spells?"
      ],
      patientFacingAdvisory: {
        en: "🚨 IMMEDIATE EMERGENCY: Please rest on your left side. Emergency doctor is preparing immediate care and referral transport.",
        originalLanguage: "🚨 तत्काल आपातकालीन: कृपया बाईं करवट लेकर लेटें। डॉक्टर तुरंत आपको देख रहे हैं और आवश्यक व्यवस्था कर रहे हैं।",
        languageCode: "hi"
      },
      generatedAt: new Date(Date.now() - 3600000 * 0.8)
    },
    auditTrail: [
      {
        action: "CASE_CREATED",
        actor: "ASHA Worker Meena",
        timestamp: new Date(Date.now() - 3600000 * 0.8),
        details: "Obstetric emergency flag raised at outreach camp."
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 0.8),
    updatedAt: new Date(Date.now() - 3600000 * 0.8)
  },

  // 4. Urgent Yellow: Industrial Toxic Inhalation & Dermatitis (Industrial Estate Health Unit)
  {
    _id: "CASE-2026-1004",
    patientId: "PAT-10824",
    tokenNumber: "IND-YEL-08",
    facilityType: "INDUSTRIAL_HEALTH_UNIT",
    status: "PENDING_REVIEW",
    inputLanguage: "en",
    rawSymptomInput: "Accidental chemical vapor inhalation (Ammonia/Solvent fumes) in manufacturing plant 2 hours ago. Persistent dry hacking cough, burning sensation in throat and eyes, and skin redness across forearms.",
    voiceTranscript: "Inhaled chemical fumes at the factory, burning throat and chest.",
    translatedEnglishInput: "38-year-old chemical factory technician with acute inhalational exposure to alkaline/solvent industrial vapors. Reports throat burning, dyspneic coughing spasms, conjunctival erythema, and localized contact dermatitis.",
    vitals: {
      bpSystolic: 132,
      bpDiastolic: 86,
      pulseRate: 104,
      spo2: 94,
      temperature: 99.1,
      bloodSugar: 110,
      respiratoryRate: 24,
    },
    attachments: [
      {
        id: "att-4",
        type: "symptom_photo",
        fileName: "Arm_Chemical_Erythema.jpg",
        ocrExtractedText: "MSDS Tag: Industrial Solvent - Irritant Class 2.",
        visualObservations: ["Bilateral forearm erythematous patch without blistering", "Mild conjunctival injection"]
      }
    ],
    triageOutput: {
      urgencyLevel: "URGENT_YELLOW",
      urgencyScore: 7,
      urgencyReason: "Occupational Inhalational & Dermal Chemical Exposure. SpO2 borderline (94%), risk of delayed chemical pneumonitis / bronchospasm.",
      timelineSummary: "Exposure occurred 2 hours ago during reactor vat cleaning. Symptoms immediate and persistent.",
      chiefComplaints: ["Chemical vapor inhalation", "Throat & eye irritation", "Coughing spasms", "Contact skin erythema"],
      deterministicFlags: [
        "Borderline Hypoxia: SpO2 94%",
        "Tachypnea: Respiratory Rate 24/min"
      ],
      aiReasoningNotes: "Requires humidified oxygen, bronchodilator nebulization (Salbutamol/Ipratropium), copious eye/skin saline irrigation, and observation for 4-6 hours to rule out non-cardiogenic pulmonary edema.",
      missingInformationAlerts: [
        "Identify specific Chemical Material Safety Data Sheet (MSDS).",
        "Auscultate for wheezing / crackles in lung fields."
      ],
      suggestedFollowUpQuestions: [
        "What specific chemical compound was in the tank (acid, ammonia, chlorine, or solvent)?",
        "Was the exposure in a confined space without a respirator?",
        "Have you thoroughly washed your eyes and skin with running water?"
      ],
      patientFacingAdvisory: {
        en: "🟡 URGENT: Please rinse exposed skin with cool running water and sit upright with oxygen mask in the observation room.",
        originalLanguage: "🟡 URGENT: Rinse skin with cool water and remain in the observation bay.",
        languageCode: "en"
      },
      generatedAt: new Date(Date.now() - 3600000 * 2)
    },
    auditTrail: [
      {
        action: "CASE_CREATED",
        actor: "Sister Sunita (Occupational Nurse)",
        timestamp: new Date(Date.now() - 3600000 * 2),
        details: "Industrial clinic triage intake completed."
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 2),
    updatedAt: new Date(Date.now() - 3600000 * 2)
  },

  // 5. Routine Green: Elderly Chronic Diabetic Check-in (PHC Routine)
  {
    _id: "CASE-2026-1005",
    patientId: "PAT-10825",
    tokenNumber: "PHC-GRN-12",
    facilityType: "PRIMARY_HEALTH_CENTER",
    status: "PENDING_REVIEW",
    inputLanguage: "or",
    rawSymptomInput: "ମୋର ନିୟମିତ ମଧୁମେହ (Diabetes) ଯାଞ୍ଚ ଏବଂ ଔଷଧ ନେବା ପାଇଁ ଆସିଛି। କିଛି ଦିନ ହେବ ସାମାନ୍ୟ ଆଣ୍ଠୁ ଯନ୍ତ୍ରଣା ହେଉଛି, କିନ୍ତୁ ଅନ୍ୟ କୌଣସି ବଡ଼ ସମସ୍ୟା ନାହିଁ। (Routine diabetes medication refill and mild bilateral knee joint discomfort on walking).",
    voiceTranscript: "ମଧୁମେହ ଔଷଧ ସରିଯାଇଛି, ନୂଆ ଔଷଧ ଲେଖାଇବା ପାଇଁ ଆସିଛି।",
    translatedEnglishInput: "64-year-old female known type 2 diabetic for 8 years presenting for routine monthly prescription refill and mild bilateral knee osteoarthritis discomfort on prolonged walking. No acute complaints.",
    vitals: {
      bpSystolic: 124,
      bpDiastolic: 80,
      pulseRate: 74,
      spo2: 99,
      temperature: 98.2,
      bloodSugar: 138,
      respiratoryRate: 16,
    },
    attachments: [
      {
        id: "att-5",
        type: "prescription",
        fileName: "Previous_Diabetes_Booklet.jpg",
        ocrExtractedText: "Rx: Tab Metformin 500mg BD after food. Last Fasting Blood Sugar: 126 mg/dL.",
        parsedValues: { medication: "Metformin 500mg BD", fbs: "126 mg/dL" }
      }
    ],
    triageOutput: {
      urgencyLevel: "ROUTINE_GREEN",
      urgencyScore: 2,
      urgencyReason: "Routine chronic disease management and medication refill with stable vitals (BP 124/80, RBS 138 mg/dL).",
      timelineSummary: "Long-standing diabetes with good medication adherence. Mild degenerative joint ache on exertion.",
      chiefComplaints: ["Routine diabetic follow-up", "Prescription refill", "Mild knee ache"],
      deterministicFlags: [],
      aiReasoningNotes: "Stable clinical parameters. Suitable for regular doctor consultation queue. Verify annual diabetic foot examination and HbA1c test schedule.",
      missingInformationAlerts: [
        "HbA1c test due (last tested 6 months ago).",
        "Perform visual foot inspection for calluses/neuropathy."
      ],
      suggestedFollowUpQuestions: [
        "Are you taking your Metformin tablets regularly twice a day after meals?",
        "Have you felt any tingling or numbness in your feet?",
        "Any increased thirst or frequent urination at night?"
      ],
      patientFacingAdvisory: {
        en: "🟢 ROUTINE: Your vitals are normal. Please take a seat in the general OPD queue. The doctor will review your refill shortly.",
        originalLanguage: "🟢 ସାଧାରଣ: ଆପଣଙ୍କ ସମସ୍ତ ସ୍ୱାସ୍ଥ୍ୟ ସୂଚକ ସ୍ଥିର ଅଛି। ଦୟାକରି ସାଧାରଣ ଧାଡ଼ିରେ ଅପେକ୍ଷା କରନ୍ତୁ, ଡାକ୍ତର ଖୁବ୍ ଶୀଘ୍ର ଔଷଧ ଲେଖିଦେବେ।",
        languageCode: "or"
      },
      generatedAt: new Date(Date.now() - 3600000 * 3)
    },
    auditTrail: [
      {
        action: "CASE_CREATED",
        actor: "PHC Registration Clerk",
        timestamp: new Date(Date.now() - 3600000 * 3),
        details: "Routine OPD token issued."
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 3),
    updatedAt: new Date(Date.now() - 3600000 * 3)
  }
];
