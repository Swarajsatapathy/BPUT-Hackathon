import { Request, Response } from "express";
import { parseDocumentOCRWithAI, processTriageWithAI, transcribeAudioWithAI, translateClinicalTextWithAI } from "../services/gemini.service.js";
import { evaluateDeterministicSafetyRules } from "../services/ruleEngine.service.js";



export const analyzeTriage = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      rawSymptoms,
      voiceTranscript,
      inputLanguage = "en",
      vitals,
      attachments,
      facilityType = "PRIMARY_HEALTH_CENTER",
      patientDemographics,
    } = req.body;

    if (!rawSymptoms && !voiceTranscript) {
      res.status(400).json({ error: "Symptom description or voice transcript is required." });
      return;
    }

    const result = await processTriageWithAI({
      rawSymptoms: rawSymptoms || "",
      voiceTranscript,
      inputLanguage,
      vitals,
      attachments,
      facilityType,
      patientDemographics,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: "Triage analysis failed", details: (err as Error).message });
  }
};

export const parseDocumentOCR = async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: "Image base64 data is required." });
      return;
    }

    const result = await parseDocumentOCRWithAI(imageBase64, mimeType || "image/jpeg");
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: "OCR parsing failed", details: (err as Error).message });
  }
};

export const transcribeAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioBase64, mimeType, language = "en", interimTextHint } = req.body;
    if (!audioBase64 && !interimTextHint) {
      res.status(400).json({ error: "Audio data or text hint is required." });
      return;
    }

    const result = await transcribeAudioWithAI(
      audioBase64 || "",
      mimeType || "audio/webm",
      language,
      interimTextHint
    );
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: "Audio transcription failed", details: (err as Error).message });
  }
};

export const translateText = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, language = "auto" } = req.body;
    if (!text) {
      res.status(400).json({ error: "Text is required." });
      return;
    }

    const result = await translateClinicalTextWithAI(text, language);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: "Translation failed", details: (err as Error).message });
  }
};


export const runSafetyCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symptoms, vitals, patientDemographics } = req.body;
    const ruleResult = evaluateDeterministicSafetyRules(symptoms || "", vitals, patientDemographics);
    res.json({ success: true, ruleResult });
  } catch (err) {
    res.status(500).json({ error: "Safety check failed", details: (err as Error).message });
  }
};

