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
    return `https://docs.google.com/uc?export=open&id=${fileDMatch[1]}`;
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID or https://drive.google.com/uc?id=FILE_ID or docs.google.com
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if ((trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) && idParamMatch && idParamMatch[1]) {
    return `https://docs.google.com/uc?export=open&id=${idParamMatch[1]}`;
  }

  return trimmed;
}
