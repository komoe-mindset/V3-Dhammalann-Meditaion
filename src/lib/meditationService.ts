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

  if (data.audioUrl !== undefined) {
    const formattedUrl = formatAudioUrl(data.audioUrl);
    payload.audio_url = formattedUrl;
    payload.download_url = data.downloadUrl ? formatAudioUrl(data.downloadUrl) : formattedUrl;
  } else if (data.downloadUrl !== undefined) {
    payload.download_url = formatAudioUrl(data.downloadUrl);
  }

  if (data.date !== undefined) payload.date = data.date;
  if (data.title !== undefined) payload.title = data.title;
  if (data.fileName !== undefined) payload.file_name = data.fileName;
  if (data.explanation !== undefined) payload.explanation = data.explanation;
  if (data.transcript !== undefined) payload.transcript = data.transcript;

  await setDoc(docRef, payload, { merge: true });
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
