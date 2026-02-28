import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function search() {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: "Search online for the latest information as of Feb 28, 2026 about these AI models: Flux 9B Klein, Flux 4B Klein, Z-Image Turbo, Z-Image base, Wan 2.2, Wan 2.1. Include their huggingface.co repos if available.",
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  console.log(response.text);
}

search().catch(console.error);
