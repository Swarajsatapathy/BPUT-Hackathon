import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";

export const metadata: Metadata = {
  title: "National Healthcare Triage Assistant | Ministry of Health & Family Welfare",
  description: "AI-Powered Multimodal Clinical Triage Assistant for Government and Institutional Health Facilities in India.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
