import { Router } from "express";
import { analyzeTriage, parseDocumentOCR, runSafetyCheck, transcribeAudio, translateText } from "../controllers/triage.controller.js";

const router = Router();

router.post("/analyze", analyzeTriage);
router.post("/ocr", parseDocumentOCR);
router.post("/transcribe-audio", transcribeAudio);
router.post("/translate", translateText);
router.post("/safety-check", runSafetyCheck);

export default router;


