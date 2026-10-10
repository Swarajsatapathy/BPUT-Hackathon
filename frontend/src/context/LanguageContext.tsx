"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getTranslation, LanguageConfig, SUPPORTED_LANGUAGES } from "../i18n/translations";

interface LanguageContextType {
  currentLanguage: LanguageConfig;
  setLanguageCode: (code: string) => void;
  t: (key: string) => string;
  allLanguages: LanguageConfig[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageConfig>(SUPPORTED_LANGUAGES[0]);

  useEffect(() => {
    const saved = localStorage.getItem("triage_lang");
    if (saved) {
      const found = SUPPORTED_LANGUAGES.find((l) => l.code === saved);
      if (found) setCurrentLanguage(found);
    }
  }, []);

  const setLanguageCode = (code: string) => {
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
    setCurrentLanguage(found);
    localStorage.setItem("triage_lang", found.code);
  };

  const t = (key: string) => {
    return getTranslation(currentLanguage.code, key);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguageCode,
        t,
        allLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
