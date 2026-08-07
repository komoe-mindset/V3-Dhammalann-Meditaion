import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import { AudioGuide } from '../../types';
import { meditationItems } from '../../data/meditationData';
import { formatAudioUrl } from '../utils/urlHelper';

export const R2_BASE_URL = "https://pub-898018dc57db4d3995708cca93b25c23.r2.dev";

const COLLECTION_NAME = 'meditations';

/**
 * Fetch all meditation audio records from Firestore.
 * Merges Firestore records with default metadata.
 * Includes network fallback and timeout protection for offline resilience.
 */
export async function fetchMeditations(): Promise<AudioGuide[]> {
  try {
    const fetchPromise = (async () => {
      const q = query(collection(db, COLLECTION_NAME), orderBy('day_number', 'asc'));
      return await getDocs(q);
    })();

    // 5-second timeout safeguard for network or offline delays
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore fetch timeout')), 5000)
    );

    const snapshot = await Promise.race([fetchPromise, timeoutPromise]);

    if (snapshot.empty) {
      console.log('Firestore meditations collection is empty, returning initial dataset.');
      return meditationItems;
    }

    const firestoreMap = new Map<number, any>();
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const dayNum = data.day_number || parseInt(docSnap.id, 10);
      if (dayNum) {
        firestoreMap.set(dayNum, data);
      }
    });

    const mergedList: AudioGuide[] = meditationItems.map((defaultItem) => {
      const remoteData = firestoreMap.get(defaultItem.id);
      if (!remoteData) return defaultItem;

      return {
        ...defaultItem,
        audioUrl: remoteData.audio_url || defaultItem.audioUrl,
        downloadUrl: remoteData.download_url || remoteData.audio_url || defaultItem.downloadUrl || defaultItem.audioUrl,
        date: remoteData.date || defaultItem.date,
        title: remoteData.title || defaultItem.title,
        fileName: remoteData.file_name || defaultItem.fileName,
        explanation: remoteData.explanation || defaultItem.explanation,
        transcript: remoteData.transcript || defaultItem.transcript,
      };
    });

    return mergedList;
  } catch (error: any) {
    console.warn('Firestore fetch unavailable or offline, falling back to local meditation dataset:', error?.message || error);
    // Return default meditation items so app operates uninterrupted offline
    return meditationItems;
  }
}

/**
 * Update a single meditation record in Firestore by day_number
 */
export async function updateMeditation(guideId: number, data: Partial<AudioGuide>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, String(guideId));
  const payload: Record<string, any> = {
    day_number: guideId,
    updated_at: new Date().toISOString(),
  };

  let formattedUrl = data.audioUrl ? formatAudioUrl(data.audioUrl) : '';
  if (!formattedUrl || formattedUrl.trim() === '') {
    // Single Record Auto-Construct Logic: if audioUrl is empty, default to Cloudflare R2 URL
    formattedUrl = `${R2_BASE_URL}/day_${guideId}.mp3`;
  }

  payload.audio_url = formattedUrl;
  payload.download_url = data.downloadUrl ? formatAudioUrl(data.downloadUrl) : formattedUrl;

  if (data.date !== undefined) payload.date = data.date;
  if (data.title !== undefined) payload.title = data.title;
  if (data.fileName !== undefined) payload.file_name = data.fileName;
  if (data.explanation !== undefined) payload.explanation = data.explanation;
  if (data.transcript !== undefined) payload.transcript = data.transcript;

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Auto-Generate and seed R2 audio links for Days 1 through 365 in Firestore.
 * Preserves 100% of existing titles, dates, transcripts, and metadata in Firestore.
 */
export async function seedAll365R2Links(): Promise<void> {
  // 1. Check existing Firestore docs to preserve 100% of existing titles and metadata
  const existingDocIds = new Set<number>();
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const dayNum = data.day_number || parseInt(docSnap.id, 10);
      if (dayNum) {
        existingDocIds.add(dayNum);
      }
    });
  } catch (err) {
    console.warn('Could not query existing Firestore docs prior to seeding:', err);
  }

  // 2. Map default items from static meditationData.ts
  const defaultItemsMap = new Map<number, AudioGuide>();
  meditationItems.forEach((item) => defaultItemsMap.set(item.id, item));

  const CHUNK_SIZE = 200;
  const days = Array.from({ length: 365 }, (_, i) => i + 1);

  for (let i = 0; i < days.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    const chunk = days.slice(i, i + CHUNK_SIZE);

    chunk.forEach((day) => {
      const docRef = doc(db, COLLECTION_NAME, String(day));
      const r2Url = `${R2_BASE_URL}/day_${day}.mp3`;

      // Base payload ONLY includes audio_url, download_url, and updated_at
      const payload: Record<string, any> = {
        day_number: day,
        audio_url: r2Url,
        download_url: r2Url,
        updated_at: new Date().toISOString(),
      };

      // Only set initial metadata if document does NOT exist in Firestore yet
      if (!existingDocIds.has(day)) {
        const defaultItem = defaultItemsMap.get(day);
        if (defaultItem) {
          if (defaultItem.title) payload.title = defaultItem.title;
          if (defaultItem.date) payload.date = defaultItem.date;
          if (defaultItem.fileName) payload.file_name = defaultItem.fileName;
          if (defaultItem.explanation) payload.explanation = defaultItem.explanation;
          if (defaultItem.transcript) payload.transcript = defaultItem.transcript;
        }
      }

      batch.set(docRef, payload, { merge: true });
    });

    await batch.commit();
  }
}

/**
 * Batch update multiple meditation records
 */
export async function batchUpdateMeditations(guides: Partial<AudioGuide>[]): Promise<void> {
  const batch = writeBatch(db);

  guides.forEach((guide) => {
    if (!guide.id) return;
    const docRef = doc(db, COLLECTION_NAME, String(guide.id));
    const formattedAudio = guide.audioUrl ? formatAudioUrl(guide.audioUrl) : '';
    const formattedDownload = guide.downloadUrl ? formatAudioUrl(guide.downloadUrl) : formattedAudio;

    const payload = {
      day_number: guide.id,
      audio_url: formattedAudio,
      download_url: formattedDownload,
      date: guide.date || '',
      title: guide.title || '',
      file_name: guide.fileName || '',
      explanation: guide.explanation || '',
      transcript: guide.transcript || '',
      updated_at: new Date().toISOString(),
    };
    batch.set(docRef, payload, { merge: true });
  });

  await batch.commit();
}

/**
 * Seed initial meditation records into Firestore
 */
export async function seedInitialMeditations(guides: AudioGuide[] = meditationItems): Promise<void> {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < guides.length; i += CHUNK_SIZE) {
    const chunk = guides.slice(i, i + CHUNK_SIZE);
    await batchUpdateMeditations(chunk);
  }
}

/**
 * Delete a meditation record by day_number
 */
export async function deleteMeditation(guideId: number): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, String(guideId));
  await deleteDoc(docRef);
}
