import { Router } from "express";
import { getDashboardStats, resetAndSeedData } from "../controllers/stats.controller.js";

const router = Router();

router.get("/dashboard", getDashboardStats);
router.post("/seed", resetAndSeedData);

export default router;
