import { Router } from "express";
import { getDemoStaffProfiles, registerPatient, sendOtp, staffLogin, verifyOtp } from "../controllers/auth.controller.js";

const router = Router();

router.post("/patient/send-otp", sendOtp);
router.post("/patient/verify-otp", verifyOtp);
router.post("/patient/register", registerPatient);
router.post("/staff/login", staffLogin);
router.get("/staff/demo-profiles", getDemoStaffProfiles);

export default router;
