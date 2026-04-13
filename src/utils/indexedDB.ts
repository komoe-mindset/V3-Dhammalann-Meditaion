import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface AudioMetadata {
  id: string;
  title: string;
  artist?: string;
  duration?: number;
  coverUrl?: string;
  addedAt: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  transcript?: string;
}

export interface OfflineAudio {
  metadata: AudioMetadata;
  blob: Blob;
}

interface AudioDB extends DBSchema {
  'offline-audios': {
    key: string;
    value: OfflineAudio;
  };
}

const DB_NAME = 'audio-offline-db';
const STORE_NAME = 'offline-audios';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AudioDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<AudioDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'metadata.id' });
        }
      },
    });
  }
  return dbPromise;
};

/**
 * Saves an audio file and its metadata to IndexedDB.
 * @param blob The audio file as a Blob.
 * @param metadata Partial metadata (id, title, etc.).
 */
export async function saveOfflineAudio(blob: Blob, metadata: Omit<AudioMetadata, 'addedAt' | 'fileSize' | 'mimeType' | 'fileName'> & { fileName?: string }): Promise<void> {
  try {
    const db = await getDB();
    const fullMetadata: AudioMetadata = {
      ...metadata,
      fileName: metadata.fileName || `${metadata.id}.mp3`,
      fileSize: blob.size,
      mimeType: blob.type,
      addedAt: Date.now(),
      transcript: metadata.transcript,
    };

    await db.put(STORE_NAME, {
      metadata: fullMetadata,
      blob,
    });
  } catch (error) {
    console.error('Failed to save offline audio:', error);
    throw new Error('Could not save audio for offline listening.');
  }
}

/**
 * Retrieves all saved audio metadata.
 */
export async function getAllOfflineMetadata(): Promise<AudioMetadata[]> {
  try {
    const db = await getDB();
    const allItems = await db.getAll(STORE_NAME);
    return allItems.map(item => item.metadata);
  } catch (error) {
    console.error('Failed to retrieve offline metadata:', error);
    return [];
  }
}

/**
 * Retrieves a specific audio Blob by its ID.
 */
export async function getOfflineAudioBlob(id: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    const item = await db.get(STORE_NAME, id);
    return item ? item.blob : null;
  } catch (error) {
    console.error(`Failed to retrieve audio blob for ID ${id}:`, error);
    return null;
  }
}

/**
 * Retrieves specific audio metadata by its ID.
 */
export async function getOfflineMetadata(id: string): Promise<AudioMetadata | null> {
  try {
    const db = await getDB();
    const item = await db.get(STORE_NAME, id);
    return item ? item.metadata : null;
  } catch (error) {
    console.error(`Failed to retrieve metadata for ID ${id}:`, error);
    return null;
  }
}

/**
 * Deletes an offline audio by its ID.
 */
export async function deleteOfflineAudio(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  } catch (error) {
    console.error(`Failed to delete offline audio with ID ${id}:`, error);
    throw new Error('Could not delete offline audio.');
  }
}

/**
 * Checks if an audio is already saved offline.
 */
export async function isAudioOffline(id: string): Promise<boolean> {
  try {
    const db = await getDB();
    const count = await db.count(STORE_NAME, id);
    return count > 0;
  } catch (error) {
    console.error(`Error checking offline status for ID ${id}:`, error);
    return false;
  }
}
