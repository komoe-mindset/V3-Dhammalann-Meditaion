/**
 * Utility to convert various audio file URLs (e.g. Google Drive share links)
 * into direct streamable/downloadable audio links.
 */
export function formatAudioUrl(inputUrl: string): string {
  if (!inputUrl || typeof inputUrl !== 'string') return '';
  const trimmed = inputUrl.trim();

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileDMatch[1]}`;
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID or https://drive.google.com/uc?id=FILE_ID
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (trimmed.includes('drive.google.com') && idParamMatch && idParamMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${idParamMatch[1]}`;
  }

  return trimmed;
}
