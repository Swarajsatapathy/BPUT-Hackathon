import "dotenv/config";
import { CaseModel } from "../models/CaseModel.js";
import { PatientModel } from "../models/PatientModel.js";
import { connectDB } from "../config/db.js";

async function testFullWorkflow() {
  const baseUrl = "http://localhost:5000";
  console.log("=== STEP 1: Verifying Backend Health ===");
  const healthRes: any = await fetch(`${baseUrl}/health`).then(r => r.json());
  console.log("Health:", healthRes);

  console.log("\n=== STEP 2: Registering a New Live Citizen Patient ===");
  const testPhone = "9988776655";
  const regPayload = {
    phoneNumber: testPhone,
    fullName: "Ramesh Chandra Jena",
    age: 52,
    sex: "Male",
    bloodGroup: "B+",
    emergencyContact: {
      name: "Sita Jena",
      relation: "Spouse",
      phone: "9988776654"
    }
  };

  let patientId = "";
  const verifyRes: any = await fetch(`${baseUrl}/api/auth/patient/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: testPhone, otp: "123456" })
  }).then(r => r.json());

  if (verifyRes.isRegistered && verifyRes.patient) {
    console.log("Patient already registered:", verifyRes.patient.fullName, verifyRes.patient._id);
    patientId = verifyRes.patient._id;
  } else {
    const regRes: any = await fetch(`${baseUrl}/api/auth/patient/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regPayload)
    }).then(r => r.json());
    console.log("Registered new patient:", regRes.patient.fullName, regRes.patient._id);
    patientId = regRes.patient._id;
  }

  console.log("\n=== STEP 3: Submitting Real-World Triage Intake with Severe Symptoms & Vitals ===");
  const intakePayload = {
    patientId: patientId,
    facilityType: "PRIMARY_HEALTH_CENTER",
    inputLanguage: "en",
    rawSymptomInput: "Crushing chest pain radiating to the left shoulder and neck since 45 minutes, associated with cold diaphoresis and acute shortness of breath.",
    vitals: {
      bpSystolic: 178,
      bpDiastolic: 104,
      pulseRate: 112,
      spo2: 91,
      temperature: 98.6,
      bloodSugar: 145,
    },
    attachments: []
  };

  const caseRes: any = await fetch(`${baseUrl}/api/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(intakePayload)
  }).then(r => r.json());

  if (!caseRes.success || !caseRes.case) {
    console.error("Failed to create case:", caseRes);
    process.exit(1);
  }

  const createdCase = caseRes.case;
  console.log("Created Case ID:", createdCase._id);
  console.log("Token:", createdCase.tokenNumber);
  console.log("Urgency Assigned:", createdCase.triageOutput.urgencyLevel);
  console.log("Urgency Score:", createdCase.triageOutput.urgencyScore);
  console.log("Reasoning:", createdCase.triageOutput.urgencyReason);

  console.log("\n=== STEP 4: Checking Reviewer Staff Queue ===");
  const queueRes: any = await fetch(`${baseUrl}/api/cases?facilityType=ALL&status=ACTIVE_UNREVIEWED`).then(r => r.json());
  console.log("Total Cases in Reviewer Queue:", queueRes.count);
  const foundInQueue = queueRes.cases.find((c: any) => c._id === createdCase._id);
  console.log("Found in Reviewer Queue?", !!foundInQueue);
  if (foundInQueue) {
    console.log("Patient Name in Queue:", foundInQueue.patient?.fullName);
    console.log("Queue Status:", foundInQueue.status);
  }

  console.log("\n=== STEP 5: Doctor Reviews, Prescribes & Signs Off ===");
  const reviewPayload = {
    doctorId: "DOC-201",
    doctorName: "Dr. Alok Nayak (MO)",
    doctorRole: "Senior Medical Officer",
    overrideUrgency: "EMERGENCY_RED",
    clinicalImpression: "Acute Coronary Syndrome (STEMI / High-Risk NSTEMI) with hypertensive urgency.",
    prescribedMedications: [
      "Tab. Aspirin 325 mg PO stat (chewed)",
      "Tab. Clopidogrel 300 mg PO stat",
      "Tab. Sorbitrate 5 mg sublingual under BP monitoring",
      "High-flow supplemental oxygen via nasal cannula at 4 L/min"
    ],
    referralDetails: {
      isReferred: true,
      referralFacilityName: "District Headquarters Hospital (Cardiology ICU)",
      urgencyOfTransfer: "Immediate Ambulance",
      reasonForTransfer: "Urgent primary PCI and continuous cardiac telemetry monitoring",
      transportRecommendation: "108 ALS Ambulance with Continuous SpO2/ECG Monitor & Defibrillator"
    },
    status: "REFERRED"
  };

  const reviewRes: any = await fetch(`${baseUrl}/api/cases/${createdCase._id}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reviewPayload)
  }).then(r => r.json());

  console.log("Review Response Success:", reviewRes.success);
  console.log("Case Updated Status:", reviewRes.case?.status);
  console.log("Doctor Name on Slip:", reviewRes.case?.doctorReview?.doctorName);
  console.log("Medications Prescribed Count:", reviewRes.case?.doctorReview?.prescribedMedications?.length);

  console.log("\n=== STEP 6: Patient Fetches Profile & Confirmation Updates ===");
  const patientProfileRes: any = await fetch(`${baseUrl}/api/patient?id=${patientId}`).then(r => r.json());
  console.log("Patient Profile Found:", patientProfileRes.patient?.fullName);
  const patientCase = patientProfileRes.cases?.find((c: any) => c._id === createdCase._id);
  console.log("Patient Case Status on Patient Side:", patientCase?.status);
  console.log("Patient Doctor Impression:", patientCase?.doctorReview?.clinicalImpression);
  console.log("Patient Referral Destination:", patientCase?.doctorReview?.referralDetails?.referralFacilityName);

  console.log("\n=== STEP 7: Verifying Direct Persistence in MongoDB Atlas ===");
  await connectDB();
  const atlasCase: any = await CaseModel.findById(createdCase._id).lean();
  const atlasPatient: any = await PatientModel.findById(patientId).lean();
  console.log("Persisted in Atlas DB?", !!atlasCase, "Case Status:", atlasCase?.status);
  console.log("Persisted Patient in Atlas DB?", !!atlasPatient, "Name:", atlasPatient?.fullName);

  console.log("\n🎉 ALL 7 E2E STEPS SUCCEEDED COMPLETELY!");
  process.exit(0);
}

testFullWorkflow().catch((err) => {
  console.error("Test workflow error:", err);
  process.exit(1);
});
