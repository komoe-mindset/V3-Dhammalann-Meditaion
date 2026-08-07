
import React, { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AudioGuide } from '../../types';
import { getOfflineAudioBlob, getAllOfflineMetadata } from '../utils/indexedDB';
import { meditationItems as meditationData } from '../../data/meditationData';
import { normalizeAudioUrl } from '../utils/urlHelper';

export { normalizeAudioUrl };

interface AudioState {
  activeRecord: AudioGuide | null;
  meditations: AudioGuide[];
  isPlaying: boolean;
  volume: number;
  isBuffering: boolean;
  error: string | null;
  notification: { message: string; type: 'success' | 'error' } | null;
  downloadProgress: Record<string, number>;
  offlineIds: Set<string>;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface AudioProgress {
  currentTime: number;
  duration: number;
  progress: number;
}

interface AudioControls {
  playAudio: (guide: AudioGuide) => void;
  pauseAudio: () => void;
  resumeAudio: () => void;
  togglePlay: () => void;
  stopAudio: () => void;
  seekTo: (progress: number) => void;
  setVolume: (volume: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setMeditations: (meditations: AudioGuide[]) => void;
  downloadAudio: (guide: AudioGuide) => Promise<Blob | undefined>;
  refreshOfflineStatus: () => Promise<void>;
  showNotification: (message: string, type: 'success' | 'error') => void;
  clearNotification: () => void;
}

const AudioStateContext = createContext<AudioState | undefined>(undefined);
const AudioProgressContext = createContext<AudioProgress | undefined>(undefined);
const AudioControlContext = createContext<AudioControls | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRecord, setActiveRecord] = useState<AudioGuide | null>(null);
  const [meditations, setMeditations] = useState<AudioGuide[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [offlineIds, setOfflineIds] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  
  // Use refs to keep track of state for stable callbacks
  const meditationsRef = useRef(meditations);
  const isPlayingRef = useRef(isPlaying);
  const activeRecordRef = useRef<AudioGuide | null>(activeRecord);
  const isStoppingRef = useRef(false);
  const playNextRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    activeRecordRef.current = activeRecord;
  }, [activeRecord]);

  useEffect(() => {
    meditationsRef.current = meditations;
    // Sync activeRecord with meditations to pick up changes (like isCompleted)
    if (activeRecord) {
      const updated = meditations.find(m => m.id === activeRecord.id);
      if (updated && (
        updated.isCompleted !== activeRecord.isCompleted || 
        updated.title !== activeRecord.title ||
        updated.audioUrl !== activeRecord.audioUrl
      )) {
        setActiveRecord(updated);
      }
    }
  }, [meditations, activeRecord]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  /**
   * MEMORY MANAGEMENT: URL.revokeObjectURL()
   * We must explicitly revoke blob URLs to prevent memory leaks.
   * This function ensures the current objectUrlRef is cleaned up.
   */
  const revokeCurrentObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  /**
   * Audio Source Management Effect
   * This effect handles the lifecycle of the audio source, including:
   * 1. Checking for offline availability
   * 2. Creating and revoking Blob URLs
   * 3. Handling race conditions via a cancellation token
   */
  useEffect(() => {
    if (!activeRecord || !audioRef.current) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
      revokeCurrentObjectUrl();
      return;
    }

    let isCancelled = false;
    let newObjectUrl: string | null = null;

    const loadAndPlay = async () => {
      setError(null);
      setIsBuffering(true);

      try {
        // Check for offline version in IndexedDB
        const offlineBlob = await getOfflineAudioBlob(String(activeRecord.id));
        
        if (isCancelled) return;

        let sourceUrl = activeRecord.audioUrl ? normalizeAudioUrl(activeRecord.audioUrl) : '';

        if (offlineBlob) {
          // Create a new Blob URL for the offline file
          newObjectUrl = URL.createObjectURL(offlineBlob);
          sourceUrl = newObjectUrl;
        }

        if (audioRef.current) {
          if (!sourceUrl) {
            setError("Audio URL is missing");
            setIsPlaying(false);
            setIsBuffering(false);
            return;
          }

          // Revoke the OLD URL before setting the new one
          revokeCurrentObjectUrl();
          
          // Store the NEW URL in the ref so it can be revoked later
          objectUrlRef.current = newObjectUrl;
          
          audioRef.current.src = sourceUrl;
          audioRef.current.preload = 'metadata';
          audioRef.current.load();
          
          try {
            await audioRef.current.play();
            setIsPlaying(true);
          } catch (playError: any) {
            // Ignore AbortError (caused by rapid switching)
            if (playError.name !== 'AbortError') {
              console.error("Playback error:", playError);
              setError("Failed to play audio");
              setIsPlaying(false);
              setIsBuffering(false);
            }
          }
        }
      } catch (err) {
        console.error("Audio setup error:", err);
        setError("Failed to initialize audio");
        setIsPlaying(false);
        setIsBuffering(false);
      } finally {
        if (isCancelled) setIsBuffering(false);
      }
    };

    loadAndPlay();

    return () => {
      isCancelled = true;
      // We don't revoke here immediately because the next effect run 
      // or the stopAudio call will handle it. 
      // This prevents audio cutting out during rapid state transitions
      // until the next source is ready.
    };
  }, [activeRecord, revokeCurrentObjectUrl]);

  const playAudio = useCallback((guide: AudioGuide) => {
    if (activeRecord?.id === guide.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        setError(null);
        setIsBuffering(true);
        if (audioRef.current) {
          if (audioRef.current.error || !audioRef.current.src) {
            audioRef.current.load();
          }
          audioRef.current.play().catch((err) => {
            if (err.name !== 'AbortError') {
              console.error("Error starting playback:", err);
              setError("Failed to play audio");
              setIsPlaying(false);
              setIsBuffering(false);
            }
          });
          setIsPlaying(true);
        }
      }
      return;
    }

    setActiveRecord(guide);
  }, [activeRecord, isPlaying]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resumeAudio = useCallback(() => {
    if (audioRef.current && activeRecord) {
      setError(null);
      setIsBuffering(true);
      if (audioRef.current.error || !audioRef.current.src) {
        audioRef.current.load();
      }
      audioRef.current.play().catch((err) => {
        if (err.name !== 'AbortError') {
          console.error("Error resuming playback:", err);
          setError("Failed to play audio");
          setIsPlaying(false);
          setIsBuffering(false);
        }
      });
      setIsPlaying(true);
    }
  }, [activeRecord]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pauseAudio();
    } else {
      resumeAudio();
    }
  }, [pauseAudio, resumeAudio]);

  const stopAudio = useCallback(() => {
    isStoppingRef.current = true;
    setActiveRecord(null);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setError(null);
    setNotification(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    revokeCurrentObjectUrl();
    setTimeout(() => {
      isStoppingRef.current = false;
    }, 200);
  }, [revokeCurrentObjectUrl]);

  const seekTo = useCallback((newProgress: number) => {
    if (audioRef.current && audioRef.current.duration) {
      const newTime = (newProgress / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(newProgress);
    }
  }, []);

  const { hasNext, hasPrevious } = useMemo(() => {
    if (!activeRecord) return { hasNext: false, hasPrevious: false };
    const currentIndex = meditationData.findIndex(m => m.id === activeRecord.id);
    return {
      hasNext: currentIndex !== -1 && currentIndex < meditationData.length - 1,
      hasPrevious: currentIndex > 0
    };
  }, [activeRecord]);

  const playNext = useCallback(() => {
    if (!activeRecord) return;
    const currentIndex = meditationData.findIndex(m => m.id === activeRecord.id);
    if (currentIndex !== -1 && currentIndex < meditationData.length - 1) {
      const nextItem = meditationData[currentIndex + 1];
      const nextRecord = meditations.find(m => m.id === nextItem.id);
      if (nextRecord) {
        playAudio(nextRecord);
      }
    }
  }, [activeRecord, meditations, playAudio]);

  const playPrevious = useCallback(() => {
    if (!activeRecord) return;
    const currentIndex = meditationData.findIndex(m => m.id === activeRecord.id);
    if (currentIndex > 0) {
      const prevItem = meditationData[currentIndex - 1];
      const prevRecord = meditations.find(m => m.id === prevItem.id);
      if (prevRecord) {
        playAudio(prevRecord);
      }
    }
  }, [activeRecord, meditations, playAudio]);

  const refreshOfflineStatus = useCallback(async () => {
    const metadata = await getAllOfflineMetadata();
    setOfflineIds(new Set(metadata.map(m => m.id)));
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    // Auto-clear after 5 seconds
    setTimeout(() => {
      setNotification(prev => prev?.message === message ? null : prev);
    }, 5000);
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Initial load of offline status
  useEffect(() => {
    refreshOfflineStatus();
  }, [refreshOfflineStatus]);

  /**
   * DOWNLOAD WITH PROGRESS TRACKING
   * Uses Streams API to read response body in chunks and calculate percentage.
   */
  const downloadAudio = useCallback(async (guide: AudioGuide) => {
    if (!guide.audioUrl) return;
    const targetUrl = normalizeAudioUrl(guide.audioUrl);
    const guideId = String(guide.id);

    try {
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      if (!response.body) throw new Error('Response body is null');

      const reader = response.body.getReader();
      let loaded = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (total > 0) {
          const progressPercent = Math.round((loaded / total) * 100);
          setDownloadProgress(prev => ({
            ...prev,
            [guideId]: progressPercent
          }));
        }
      }

      // Combine chunks into a single Blob
      const blob = new Blob(chunks);
      
      // Save to IndexedDB (assuming saveOfflineAudio is available or we import it)
      // For now, we'll just return the blob or handle it as needed.
      // The user specifically asked for the progress tracking logic.
      
      // We need to import saveOfflineAudio if we want to complete the flow here
      // but the request was specifically about the downloadAudio function logic.
      
      // Clear progress after a short delay
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newState = { ...prev };
          delete newState[guideId];
          return newState;
        });
      }, 2000);

      return blob;
    } catch (err) {
      console.error("Download failed:", err);
      setDownloadProgress(prev => {
        const newState = { ...prev };
        delete newState[guideId];
        return newState;
      });
      throw err;
    }
  }, []);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  // MediaSession API Integration
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (!activeRecord) {
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    const title = activeRecord.title || `Day ${activeRecord.day_number || activeRecord.id} Meditation`;
    const artist = 'Dhammalann Meditation';

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title,
      artist: artist,
      album: 'Dhammalann 365 Days Meditation',
      artwork: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
  }, [activeRecord]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration || isNaN(duration) || duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: audioRef.current?.playbackRate || 1,
        position: Math.min(Math.max(0, currentTime), duration),
      });
    } catch (e) {
      // Ignore position state sync error
    }
  }, [currentTime, duration]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ['play', () => resumeAudio()],
      ['pause', () => pauseAudio()],
      ['previoustrack', () => playPrevious()],
      ['nexttrack', () => playNext()],
      ['stop', () => stopAudio()],
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {
        // Action not supported in browser
      }
    }

    return () => {
      for (const [action] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [resumeAudio, pauseAudio, playPrevious, playNext, stopAudio]);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setIsBuffering(false);
      setProgress(0);
      setCurrentTime(0);
      // Auto-play next
      if (playNextRef.current) {
        playNextRef.current();
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };

    const handleStalled = () => {
      if (
        isStoppingRef.current || 
        !activeRecordRef.current || 
        !audio.src || 
        audio.src === '' || 
        audio.src === window.location.href
      ) {
        setIsBuffering(false);
        return;
      }
      console.warn('Audio stream stalled:', audio.src, 'Network connectivity issue or stream cut off.');
      setError("Audio stream stalled");
      setNotification({
        message: "တရားတော် အသံဖိုင်ရယူ၍ မရနိုင်ပါ။ လိုင်းစစ်ဆေးပါ",
        type: "error"
      });
      setIsBuffering(false);
      setIsPlaying(false);
    };

    const handleError = () => {
      // Do not trigger error notification if player is stopping, activeRecord is null, or src is empty/aborted
      if (
        isStoppingRef.current || 
        !activeRecordRef.current || 
        !audio.src || 
        audio.src === '' || 
        audio.src === window.location.href || 
        audio.error?.code === 1
      ) {
        setIsBuffering(false);
        return;
      }

      let message = "Unable to load audio file";
      if (audio.error) {
        switch (audio.error.code) {
          case 1:
            // Aborted loading by user action or closing player
            setIsBuffering(false);
            return;
          case 2: message = "Network error loading audio"; break;
          case 3: message = "Audio decoding failed"; break;
          case 4: message = "Audio source unavailable or URL format invalid"; break;
        }
      }
      console.warn('Audio playback error:', audio.error, 'URL:', audio.src, 'The audio URL may be invalid, missing, or blocked by CORS settings.');
      setError(message);
      setNotification({
        message: "တရားတော် အသံဖိုင်ရယူ၍ မရနိုင်ပါ။ လိုင်းစစ်ဆေးပါ",
        type: "error"
      });
      setIsBuffering(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.removeAttribute('src');
      revokeCurrentObjectUrl();
    };
  }, [revokeCurrentObjectUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const stateValue = useMemo(() => ({
    activeRecord,
    meditations,
    isPlaying,
    volume,
    isBuffering,
    error,
    notification,
    downloadProgress,
    offlineIds,
    hasNext,
    hasPrevious,
  }), [activeRecord, meditations, isPlaying, volume, isBuffering, error, downloadProgress, offlineIds, hasNext, hasPrevious]);

  const progressValue = useMemo(() => ({
    currentTime,
    duration,
    progress,
  }), [currentTime, duration, progress]);

  const controlValue = useMemo(() => ({
    playAudio,
    pauseAudio,
    resumeAudio,
    togglePlay,
    stopAudio,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
    setMeditations,
    downloadAudio,
    refreshOfflineStatus,
    showNotification,
    clearNotification,
  }), [playAudio, pauseAudio, resumeAudio, togglePlay, stopAudio, seekTo, setVolume, playNext, playPrevious, downloadAudio, refreshOfflineStatus, showNotification, clearNotification]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if Space is pressed and user is not typing in an input field
      if (event.code === 'Space') {
        const target = event.target as HTMLElement;
        const isTyping = target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.isContentEditable ||
                         target.tagName === 'SELECT';
        
        if (!isTyping && activeRecord) {
          event.preventDefault(); // Prevent page scrolling
          togglePlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRecord, togglePlay]);

  return (
    <AudioStateContext.Provider value={stateValue}>
      <AudioProgressContext.Provider value={progressValue}>
        <AudioControlContext.Provider value={controlValue}>
          {children}
        </AudioControlContext.Provider>
      </AudioProgressContext.Provider>
    </AudioStateContext.Provider>
  );
};

export const useAudio = () => {
  const state = useContext(AudioStateContext);
  const progress = useContext(AudioProgressContext);
  const controls = useContext(AudioControlContext);
  
  if (state === undefined || progress === undefined || controls === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  
  return { ...state, ...progress, ...controls };
};

export const useAudioControls = () => {
  const context = useContext(AudioControlContext);
  if (context === undefined) {
    throw new Error('useAudioControls must be used within an AudioProvider');
  }
  return context;
};

export const useAudioState = () => {
  const context = useContext(AudioStateContext);
  if (context === undefined) {
    throw new Error('useAudioState must be used within an AudioProvider');
  }
  return context;
};

export const useAudioProgress = () => {
  const context = useContext(AudioProgressContext);
  if (context === undefined) {
    throw new Error('useAudioProgress must be used within an AudioProvider');
  }
  return context;
};
