"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { FacilityType, Patient, StaffMember } from "../types";

export type PortalMode = "OVERVIEW" | "PATIENT" | "STAFF";

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
  // Staff Auth Modal Control
  showStaffAuthModal: boolean;
  setShowStaffAuthModal: (show: boolean) => void;
  // Selected Facility
  selectedFacility: FacilityType;
  setSelectedFacility: (f: FacilityType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [portalMode, setPortalMode] = useState<PortalMode>("OVERVIEW");
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<FacilityType>("ALL");
  const [showStaffAuthModal, setShowStaffAuthModal] = useState<boolean>(false);

  useEffect(() => {
    // Restore session if available
    try {
      let restoredStaff: StaffMember | null = null;
      let restoredPatient: Patient | null = null;
      const savedPatient = localStorage.getItem("triage_patient_session");
      if (savedPatient) {
        restoredPatient = JSON.parse(savedPatient);
        setCurrentPatient(restoredPatient);
      }
      const savedStaff = localStorage.getItem("triage_staff_session");
      if (savedStaff) {
        restoredStaff = JSON.parse(savedStaff);
        setCurrentStaff(restoredStaff);
      }
      const savedFacility = localStorage.getItem("triage_selected_facility") as FacilityType;
      if (savedFacility) {
        setSelectedFacility(savedFacility);
      }
      const savedMode = localStorage.getItem("triage_portal_mode") as PortalMode | null;
      // Only permit STAFF mode if an authenticated staff session is actively restored
      if (savedMode === "STAFF" && restoredStaff) {
        setPortalMode("STAFF");
      } else if (savedMode === "PATIENT" && restoredPatient) {
        setPortalMode("PATIENT");
      } else if (savedMode === "OVERVIEW" || savedMode === "PATIENT") {
        setPortalMode(savedMode);
      } else {
        setPortalMode("OVERVIEW");
      }
    } catch (e) {
      console.warn("Session restore error", e);
    }
  }, []);

  const handleSetPatient = (patient: Patient | null) => {
    setCurrentPatient(patient);
    if (patient) {
      localStorage.setItem("triage_patient_session", JSON.stringify(patient));
      // Security: Clear any staff session when patient logs in
      setCurrentStaff(null);
      localStorage.removeItem("triage_staff_session");
      setPortalMode("PATIENT");
    } else {
      localStorage.removeItem("triage_patient_session");
    }
  };

  const handleSetStaff = (staff: StaffMember | null) => {
    setCurrentStaff(staff);
    if (staff) {
      localStorage.setItem("triage_staff_session", JSON.stringify(staff));
      setPortalMode("STAFF");
      localStorage.setItem("triage_portal_mode", "STAFF");
      setShowStaffAuthModal(false);
    } else {
      localStorage.removeItem("triage_staff_session");
    }
  };

  const handleSetFacility = (facility: FacilityType) => {
    setSelectedFacility(facility);
    localStorage.setItem("triage_selected_facility", facility);
  };

  const handleSetPortalMode = (mode: PortalMode) => {
    const savedStaff = localStorage.getItem("triage_staff_session");
    if (mode === "STAFF" && !currentStaff && !savedStaff) {
      // Must authenticate as Doctor / Staff first!
      setShowStaffAuthModal(true);
      return;
    }
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
    setPortalMode("PATIENT");
    localStorage.setItem("triage_portal_mode", "PATIENT");
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
        showStaffAuthModal,
        setShowStaffAuthModal,
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
