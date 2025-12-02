export interface GeneratedAudio {
  id: string;
  text: string;
  voiceName: string;
  timestamp: number;
}

// Helper to categorize voices roughly if needed, though we will mostly use raw SpeechSynthesisVoice
export interface VoiceGroup {
  lang: string;
  voices: SpeechSynthesisVoice[];
}
