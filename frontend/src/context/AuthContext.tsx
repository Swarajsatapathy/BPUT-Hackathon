"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { FacilityType, Patient, StaffMember } from "../types";

export type PortalMode = "PATIENT" | "STAFF";

interface AuthContextType {
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  // Patient State
  currentPatient: Patient | null;
  setCurrentPatient: (patient: Patient | null) => void;
  isPatientLoggedIn: boolean;
  logoutPatient: () => void;
  // Staff State
  currentStaff: StaffMember | null;
  setCurrentStaff: (staff: StaffMember | null) => void;
  isStaffLoggedIn: boolean;
  logoutStaff: () => void;
  // Selected Facility
  selectedFacility: FacilityType;
  setSelectedFacility: (f: FacilityType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [portalMode, setPortalMode] = useState<PortalMode>("PATIENT");
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<FacilityType>("ALL");

  useEffect(() => {
    // Restore session if available
    try {
      const savedPatient = localStorage.getItem("triage_patient_session");
      if (savedPatient) {
        setCurrentPatient(JSON.parse(savedPatient));
      }
      const savedStaff = localStorage.getItem("triage_staff_session");
      if (savedStaff) {
        setCurrentStaff(JSON.parse(savedStaff));
      }
      const savedFacility = localStorage.getItem("triage_selected_facility") as FacilityType;
      if (savedFacility) {
        setSelectedFacility(savedFacility);
      }
      const savedMode = localStorage.getItem("triage_portal_mode");
      if (savedMode === "PATIENT" || savedMode === "STAFF") {
        setPortalMode(savedMode);
      }
    } catch (e) {
      console.warn("Session restore error", e);
    }
  }, []);

  const handleSetPatient = (patient: Patient | null) => {
    setCurrentPatient(patient);
    if (patient) {
      localStorage.setItem("triage_patient_session", JSON.stringify(patient));
    } else {
      localStorage.removeItem("triage_patient_session");
    }
  };

  const handleSetStaff = (staff: StaffMember | null) => {
    setCurrentStaff(staff);
    if (staff) {
      localStorage.setItem("triage_staff_session", JSON.stringify(staff));
    } else {
      localStorage.removeItem("triage_staff_session");
    }
  };

  const handleSetFacility = (facility: FacilityType) => {
    setSelectedFacility(facility);
    localStorage.setItem("triage_selected_facility", facility);
  };

  const handleSetPortalMode = (mode: PortalMode) => {
    setPortalMode(mode);
    localStorage.setItem("triage_portal_mode", mode);
  };

  const logoutPatient = () => {
    setCurrentPatient(null);
    localStorage.removeItem("triage_patient_session");
  };

  const logoutStaff = () => {
    setCurrentStaff(null);
    localStorage.removeItem("triage_staff_session");
  };

  return (
    <AuthContext.Provider
      value={{
        portalMode,
        setPortalMode: handleSetPortalMode,
        currentPatient,
        setCurrentPatient: handleSetPatient,
        isPatientLoggedIn: !!currentPatient,
        logoutPatient,
        currentStaff,
        setCurrentStaff: handleSetStaff,
        isStaffLoggedIn: !!currentStaff,
        logoutStaff,
        selectedFacility,
        setSelectedFacility: handleSetFacility,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
