import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import caseRoutes from "./routes/case.routes.js";
import triageRoutes from "./routes/triage.routes.js";
import statsRoutes from "./routes/stats.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "Multimodal Healthcare Triage Assistant API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/triage", triageRoutes);
app.use("/api/stats", statsRoutes);

// Start Server
async function bootstrap() {
  const connected = await connectDB();
  if (connected) {
    const { store } = await import("./services/mockStore.service.js");
    const { PatientModel } = await import("./models/PatientModel.js");
    const count = await PatientModel.countDocuments();
    if (count === 0) {
      console.log("🌱 Fresh MongoDB Atlas instance detected. Seeding initial clinical records...");
      await store.resetAndSeed();
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Healthcare Triage Backend running on http://localhost:${PORT}`);
    console.log(`📋 Health Check: http://localhost:${PORT}/health`);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
});
