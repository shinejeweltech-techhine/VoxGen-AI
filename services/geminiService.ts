import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from "../types";
import { base64ToUint8Array, createWavBlob, decodeAudioData } from "./audioUtils";

const API_KEY = process.env.API_KEY || '';

if (!API_KEY) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generateSpeech(text: string, voice: VoiceName): Promise<{ blob: Blob; url: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts;
    
    // Check if we have audio data
    const inlineData = parts?.[0]?.inlineData;
    
    if (!inlineData || !inlineData.data) {
       throw new Error("No audio data received from Gemini API.");
    }

    const base64Audio = inlineData.data;
    const uint8Array = base64ToUint8Array(base64Audio);
    
    // Decode PCM to Float32 to create a proper WAV file
    // Gemini TTS typically returns 24000Hz sample rate for these models
    const audioData = await decodeAudioData(uint8Array, 24000);
    const wavBlob = createWavBlob(audioData, 24000);
    const url = URL.createObjectURL(wavBlob);

    return { blob: wavBlob, url };

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
}
