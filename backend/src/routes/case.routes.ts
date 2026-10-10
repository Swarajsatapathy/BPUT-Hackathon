import { Router } from "express";
import { createCase, getCaseById, getCasesQueue, reviewCase } from "../controllers/case.controller.js";

const router = Router();

router.post("/", createCase);
router.get("/queue", getCasesQueue);
router.get("/:id", getCaseById);
router.patch("/:id/review", reviewCase);

export default router;
