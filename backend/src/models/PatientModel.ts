import mongoose, { Schema, Document } from "mongoose";
import { Patient } from "./types.js";

const PatientSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    phoneNumber: { type: String, required: true, index: true },
    fullName: { type: String, required: true },
    age: { type: Number, required: true },
    sex: { type: String, enum: ["Male", "Female", "Other", "Prefer not to say"], required: true },
    bloodGroup: { type: String, default: "Unknown" },
    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: { type: String },
    },
    registeredAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: true }
);

export const PatientModel = mongoose.models.Patient || mongoose.model<Patient & Document>("Patient", PatientSchema);
