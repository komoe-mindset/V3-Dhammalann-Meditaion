import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage browser storage persistence and estimates.
 * This ensures offline audio data is reliable and provides feedback on available space.
 */
export const useStorageManager = () => {
  const [isPersistent, setIsPersistent] = useState<boolean | null>(null);
  const [storageEstimate, setStorageEstimate] = useState<{
    quota: number;
    usage: number;
    remaining: number;
  } | null>(null);

  /**
   * Checks if the storage is already persistent.
   */
  const checkPersistence = useCallback(async () => {
    if (navigator.storage && navigator.storage.persisted) {
      try {
        const persisted = await navigator.storage.persisted();
        setIsPersistent(persisted);
        return persisted;
      } catch (error) {
        console.error('Error checking storage persistence:', error);
      }
    }
    return false;
  }, []);

  /**
   * Requests persistent storage from the browser.
   * This helps prevent the browser from clearing IndexedDB data when disk space is low.
   */
  const requestPersistence = useCallback(async () => {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const persisted = await navigator.storage.persist();
        setIsPersistent(persisted);
        if (persisted) {
          console.log('Storage is now persistent.');
        } else {
          console.log('Storage persistence denied by browser.');
        }
        return persisted;
      } catch (error) {
        console.error('Error requesting storage persistence:', error);
      }
    }
    return false;
  }, []);

  /**
   * Gets an estimate of the storage quota and current usage.
   */
  const getStorageEstimate = useCallback(async () => {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;
        const remaining = Math.max(0, quota - usage);
        
        const stats = {
          quota,
          usage,
          remaining
        };
        setStorageEstimate(stats);
        return stats;
      } catch (error) {
        console.error('Error getting storage estimate:', error);
      }
    }
    return null;
  }, []);

  /**
   * Automatically check and request persistence on mount.
   */
  useEffect(() => {
    const init = async () => {
      await checkPersistence();
      await getStorageEstimate();
      // Attempt to request persistence if not already granted
      await requestPersistence();
    };
    init();
  }, [checkPersistence, getStorageEstimate, requestPersistence]);

  /**
   * Helper to format bytes into human-readable strings (MB, GB).
   */
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    isPersistent,
    storageEstimate,
    getStorageEstimate,
    requestPersistence,
    formatBytes
  };
};
