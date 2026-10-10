import { Request, Response } from "express";
import { store } from "../services/mockStore.service.js";

export const getPatientProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, phone } = req.query;

    let patient = null;
    if (id) {
      patient = await store.findPatientById(id as string);
    } else if (phone) {
      patient = await store.findPatientByPhone(phone as string);
    }

    if (!patient) {
      res.status(404).json({ error: "Patient not found." });
      return;
    }

    // Also get patient cases
    const cases = await store.getCasesByPatientId(patient._id);

    res.json({
      success: true,
      patient,
      casesCount: cases.length,
      cases,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patient profile", details: (err as Error).message });
  }
};
