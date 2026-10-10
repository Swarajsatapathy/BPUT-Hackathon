import { Request, Response } from "express";
import { store } from "../services/mockStore.service.js";

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { facilityType } = req.query;
    const cases = await store.getCases({ facilityType: facilityType as string });

    const total = cases.length;
    // Active unreviewed cases in triage queue
    const activeCases = cases.filter(c => c.status !== "COMPLETED" && c.status !== "REFERRED");
    const redCount = activeCases.filter(c => c.triageOutput.urgencyLevel === "EMERGENCY_RED").length;
    const yellowCount = activeCases.filter(c => c.triageOutput.urgencyLevel === "URGENT_YELLOW").length;
    const greenCount = activeCases.filter(c => c.triageOutput.urgencyLevel === "ROUTINE_GREEN").length;
    
    // Completed & referred cases
    const completedCount = cases.filter(c => c.status === "COMPLETED" || c.status === "REFERRED").length;
    const pendingCount = activeCases.length;

    res.json({
      success: true,
      stats: {
        totalCases: total,
        emergencyRed: redCount,
        urgentYellow: yellowCount,
        routineGreen: greenCount,
        completed: completedCount,
        pendingReview: pendingCount,
        avgTriageTimeMinutes: 2.4,
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute stats", details: (err as Error).message });
  }
};

export const resetAndSeedData = async (_req: Request, res: Response): Promise<void> => {
  try {
    await store.resetAndSeed();
    res.json({ success: true, message: "Database re-seeded with synthetic India-wide triage cases." });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset seed data" });
  }
};
