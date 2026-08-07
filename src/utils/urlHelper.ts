/**
 * Utility to convert various audio file URLs and normalize them
 * to streamable audio links on https://mp3.dhammalann.org/.
 */
export function normalizeAudioUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Preserve blob: URLs (used for offline IndexedDB playback)
  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (trimmed.includes('mp3.dhammalann.org')) {
    return trimmed.replace(/^http:/i, 'https:');
  }

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const parsed = new URL(trimmed);
      return `https://mp3.dhammalann.org${parsed.pathname}${parsed.search}`;
    }
  } catch (e) {
    // Fallback if URL parsing fails
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `https://mp3.dhammalann.org${path}`;
}

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

  return normalizeAudioUrl(trimmed);
}

