// Utility to convert raw PCM data to a WAV blob for playback and download

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function createWavBlob(audioData: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + audioData.length * 2);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + audioData.length * 2, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16-bit

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, audioData.length * 2, true);

  // Write PCM samples
  const length = audioData.length;
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export async function decodeAudioData(
  data: Uint8Array,
  sampleRate: number = 24000
): Promise<Float32Array> {
  // The Gemini API returns raw PCM 16-bit little-endian audio at 24kHz (usually).
  // We need to convert this to Float32 for Web Audio API or processing.
  const dataInt16 = new Int16Array(data.buffer);
  const float32 = new Float32Array(dataInt16.length);
  
  for (let i = 0; i < dataInt16.length; i++) {
    // Convert int16 to float range -1.0 to 1.0
    float32[i] = dataInt16[i] / 32768.0;
  }
  
  return float32;
}
