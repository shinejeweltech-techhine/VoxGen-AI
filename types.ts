export enum VoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export interface GeneratedAudio {
  id: string;
  text: string;
  voice: VoiceName;
  blobUrl: string;
  timestamp: number;
  duration?: number;
}

export interface VoiceOption {
  name: VoiceName;
  gender: 'Male' | 'Female';
  description: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { name: VoiceName.Puck, gender: 'Male', description: 'Deep, resonant, and authoritative.' },
  { name: VoiceName.Charon, gender: 'Male', description: 'Calm, steady, and trustworthy.' },
  { name: VoiceName.Kore, gender: 'Female', description: 'Clear, warm, and engaging.' },
  { name: VoiceName.Fenrir, gender: 'Male', description: 'Energetic, fast-paced, and intense.' },
  { name: VoiceName.Zephyr, gender: 'Female', description: 'Soft, soothing, and gentle.' },
];
