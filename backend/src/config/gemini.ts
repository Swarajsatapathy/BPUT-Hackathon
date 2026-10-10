import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}
