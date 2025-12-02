// This service now handles Browser Native TTS instead of Gemini API

export const getAvailableVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    
    // Voices load asynchronously in some browsers (like Chrome)
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
      resolve(voices);
    };
  });
};

export const speakText = (text: string, voice: SpeechSynthesisVoice | null, onEnd?: () => void, onError?: (e: any) => void) => {
  // Cancel any current speaking
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.error("Speech synthesis error:", e);
    if (onError) onError(e);
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
};

export const stopSpeaking = () => {
  window.speechSynthesis.cancel();
};
