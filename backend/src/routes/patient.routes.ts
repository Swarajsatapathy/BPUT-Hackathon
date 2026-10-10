import { Router } from "express";
import { getPatientProfile } from "../controllers/patient.controller.js";

const router = Router();

router.get("/profile", getPatientProfile);

export default router;
