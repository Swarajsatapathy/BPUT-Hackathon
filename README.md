# Multimodal Healthcare Triage Assistant for Government and Institutional Health Facilities

An AI-powered, human-in-the-loop clinical triage support platform built for **Primary Health Centers (PHCs), Public Health Outreach Camps, Industrial Health Units, Campus Health Centers, and District Hospitals** across India.

---

## 🏛️ System Architecture

- **Frontend**: Next.js 14 (React 18 + TypeScript + Tailwind CSS + Lucide Icons + Web Speech API + QR Code Generator)
- **Backend**: Node.js + Express (TypeScript + Multer + Zod + Mongoose)
- **Database**: MongoDB Atlas (with seamless high-speed in-memory fallback for immediate offline demonstration)
- **AI & Multimodal**: Google Gemini 2.5 / 1.5 Flash (Clinical S-O-A-P Summarization, Multilingual Translation, Document OCR, Visual Inspection)
- **Safety Engine**: Deterministic Dual-Layer Medical Red-Flag Rule Engine (Vital threshold monitoring + Red-flag keyword detector)

---

## 📁 Project Structure

```
Health-Care-Triage-Assistant/
├── backend/
│   ├── src/
│   │   ├── config/             # DB connection & Gemini Client setup
│   │   ├── controllers/        # Auth, Patient, Case, Triage, Stats controllers
│   │   ├── data/               # Preloaded India-wide synthetic clinical seeds
│   │   ├── models/             # Patient, Case, Staff, Audit models & types
│   │   ├── routes/             # Express API route declarations
│   │   ├── services/           # Rule Engine, Gemini AI, OCR, and Repository store
│   │   ├── utils/              # PII Masker (Aadhaar/Phone) & Queue Token generator
│   │   └── index.ts            # Server entrypoint
│   ├── .env.example            # Environment variables template
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/                # Next.js App Router (layout.tsx, page.tsx, globals.css)
    │   ├── components/
    │   │   ├── common/         # Header, DisclaimerBanner, StatusBadge, ConsentModal
    │   │   ├── patient/        # PatientAuthModal, SymptomIntakeWizard, PatientDashboard, Slip
    │   │   └── healthcare/     # StaffLoginModal, StaffDashboard, CaseReviewDrawer, ReferralModal
    │   ├── context/            # AuthContext (Patient/Doctor session) & LanguageContext
    │   ├── i18n/               # 12 Indian Languages Translation dictionary (Odia, Hindi, etc.)
    │   ├── services/           # Axios API client & Web Speech recognizer/synthesizer
    │   └── types/              # TypeScript clinical data definitions
    ├── package.json
    ├── tailwind.config.ts
    └── next.config.mjs
```

---

## 🔑 Environment Variables Setup

Create/Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# 1. MongoDB Atlas Connection URI (Optional - defaults to high-speed in-memory fallback)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/healthcare_triage?retryWrites=true&w=majority

# 2. Google Gemini API Key (Required for live Gemini AI clinical summarization & OCR)
GEMINI_API_KEY=your_gemini_api_key_here
```

Create/Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🚀 Running Locally

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
Backend runs on: `http://localhost:5000`  
Health check: `http://localhost:5000/health`

### 2. Start Frontend App
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:3000`

---

## 🧪 Demo Test Credentials & Scenarios

### A. Patient Portal
- **Demo Mobile**: `9876543210` (Ramesh Chandra Sahoo) or `9812345678` (Priyanka Jena)
- **Demo OTP**: `123456` (or any 6-digit OTP in demo mode)

### B. Healthcare Worker / Doctor Portal
- **Dr. Alok Nayak (MD)** — Medical Officer, PHC Khurda (PIN: `1234`)
- **Sister Sunita Mohanty (RN)** — Staff Nurse, Industrial Health Unit (PIN: `1234`)
- **Meenakshi Das** — ASHA Community Lead, Mobile Health Camp (PIN: `1234`)

### C. Preloaded India-Wide Clinical Scenarios
1. **PHC Cardiac Emergency (Red)**: 52yo farmer with acute crushing chest pain, cold sweating, and BP 184/112 mmHg.
2. **Campus Dengue Outbreak (Yellow)**: 21yo student with 4-day fever, retro-orbital eye ache, rash, and CBC platelets 48,000 /µL.
3. **Maternal Preeclampsia (Red)**: 27yo pregnant woman at 34 weeks with severe continuous headache, blurred vision, and BP 168/106 mmHg.
4. **Industrial Toxic Inhalation (Yellow)**: 38yo factory technician with solvent vapor inhalation, throat burning, and borderline SpO2 94%.
5. **Routine Diabetic Check-in (Green)**: 64yo female with stable vitals for monthly Metformin refill.
