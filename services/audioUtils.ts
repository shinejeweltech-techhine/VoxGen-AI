export const downloadAudioBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateFilename = (text: string) => {
  // Take first 20 chars, replace non-alphanumeric with underscore, lowercase
  const slug = text.slice(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `voxgen_${slug}_${Date.now()}.webm`;
};