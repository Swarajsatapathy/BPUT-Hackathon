import { Router } from "express";
import { createCase, getCaseById, getCasesQueue, getCaseTimeline, reviewCase } from "../controllers/case.controller.js";

const router = Router();

router.post("/", createCase);
router.get("/", getCasesQueue);
router.get("/queue", getCasesQueue);
router.get("/:id", getCaseById);
router.get("/:id/timeline", getCaseTimeline);
router.patch("/:id/review", reviewCase);
router.post("/:id/review", reviewCase);

export default router;
