
import React, { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AudioGuide } from '../../types';
import { getOfflineAudioBlob, getAllOfflineMetadata } from '../utils/indexedDB';

interface AudioState {
  activeRecord: AudioGuide | null;
  meditations: AudioGuide[];
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  isBuffering: boolean;
  error: string | null;
  downloadProgress: Record<string, number>;
  offlineIds: Set<string>;
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
}

const AudioStateContext = createContext<AudioState | undefined>(undefined);
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
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [offlineIds, setOfflineIds] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  
  // Use refs to keep track of state for stable callbacks
  const meditationsRef = useRef(meditations);
  const isPlayingRef = useRef(isPlaying);
  const playNextRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    meditationsRef.current = meditations;
  }, [meditations]);

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
        audioRef.current.src = '';
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

        let sourceUrl = activeRecord.audioUrl;

        if (offlineBlob) {
          // Create a new Blob URL for the offline file
          newObjectUrl = URL.createObjectURL(offlineBlob);
          sourceUrl = newObjectUrl;
        }

        if (audioRef.current) {
          if (!sourceUrl) {
            setError("Audio URL is missing");
            setIsPlaying(false);
            return;
          }

          // Revoke the OLD URL before setting the new one
          revokeCurrentObjectUrl();
          
          // Store the NEW URL in the ref so it can be revoked later
          objectUrlRef.current = newObjectUrl;
          
          audioRef.current.src = sourceUrl || '';
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
            }
          }
        }
      } catch (err) {
        console.error("Audio setup error:", err);
        setError("Failed to initialize audio");
      } finally {
        if (!isCancelled) setIsBuffering(false);
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
        audioRef.current?.play().catch(console.error);
        setIsPlaying(true);
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
      audioRef.current.play().catch(console.error);
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
    setActiveRecord(null);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    revokeCurrentObjectUrl();
  }, [revokeCurrentObjectUrl]);

  const seekTo = useCallback((newProgress: number) => {
    if (audioRef.current && audioRef.current.duration) {
      const newTime = (newProgress / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(newProgress);
    }
  }, []);

  const playNext = useCallback(() => {
    const list = meditationsRef.current;
    if (!activeRecord || list.length === 0) return;

    const currentIndex = list.findIndex(m => m.id === activeRecord.id);
    if (currentIndex !== -1 && currentIndex < list.length - 1) {
      const nextRecord = list[currentIndex + 1];
      if (nextRecord.audioUrl) {
        playAudio(nextRecord);
      }
    }
  }, [activeRecord, playAudio]);

  const playPrevious = useCallback(() => {
    const list = meditationsRef.current;
    if (!activeRecord || list.length === 0) return;

    const currentIndex = list.findIndex(m => m.id === activeRecord.id);
    if (currentIndex > 0) {
      const prevRecord = list[currentIndex - 1];
      if (prevRecord.audioUrl) {
        playAudio(prevRecord);
      }
    }
  }, [activeRecord, playAudio]);

  const refreshOfflineStatus = useCallback(async () => {
    const metadata = await getAllOfflineMetadata();
    setOfflineIds(new Set(metadata.map(m => m.id)));
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
    const guideId = String(guide.id);

    try {
      const response = await fetch(guide.audioUrl);
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

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
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
      setProgress(0);
      setCurrentTime(0);
      // Auto-play next
      if (playNextRef.current) {
        playNextRef.current();
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleError = () => {
      setError("Audio error occurred");
      setIsBuffering(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
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
    progress,
    currentTime,
    duration,
    volume,
    isBuffering,
    error,
    downloadProgress,
    offlineIds,
  }), [activeRecord, meditations, isPlaying, progress, currentTime, duration, volume, isBuffering, error, downloadProgress, offlineIds]);

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
  }), [playAudio, pauseAudio, resumeAudio, togglePlay, stopAudio, seekTo, setVolume, playNext, playPrevious, downloadAudio, refreshOfflineStatus]);

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
      <AudioControlContext.Provider value={controlValue}>
        {children}
      </AudioControlContext.Provider>
    </AudioStateContext.Provider>
  );
};

export const useAudio = () => {
  const state = useContext(AudioStateContext);
  const controls = useContext(AudioControlContext);
  
  if (state === undefined || controls === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  
  return { ...state, ...controls };
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
