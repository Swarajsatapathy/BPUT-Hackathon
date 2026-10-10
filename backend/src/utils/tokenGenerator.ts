import { FacilityType, UrgencyLevel } from "../models/types.js";

let counter = Math.floor(Math.random() * 50) + 10;

export function generatePatientId(): string {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `PAT-${rand}`;
}

export function generateCaseId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CASE-${year}-${rand}`;
}

export function generateQueueToken(facility: FacilityType, urgency: UrgencyLevel): string {
  counter++;
  
  let facCode = "PHC";
  if (facility === "PUBLIC_HEALTH_CAMP") facCode = "CAMP";
  else if (facility === "INDUSTRIAL_HEALTH_UNIT") facCode = "IND";
  else if (facility === "CAMPUS_HEALTH_CENTER") facCode = "UNIV";
  else if (facility === "DISTRICT_HOSPITAL") facCode = "DH";

  let urgCode = "GRN";
  if (urgency === "EMERGENCY_RED") urgCode = "RED";
  else if (urgency === "URGENT_YELLOW") urgCode = "YEL";

  const padNum = counter.toString().padStart(3, "0");
  return `${facCode}-${urgCode}-${padNum}`;
}
