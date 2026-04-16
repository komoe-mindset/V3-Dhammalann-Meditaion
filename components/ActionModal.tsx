import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileAudio, Play, Download, X, Loader2, Check, BookOpen } from 'lucide-react';
import { AudioGuide } from '../types';
import { isAudioOffline, saveOfflineAudio } from '../src/utils/indexedDB';
import { useStorageManager } from '../src/hooks/useStorageManager';
import { useAudioState, useAudioControls } from '../src/context/AudioContext';

const TranscriptModal = lazy(() => import('./TranscriptModal'));
const DownloadOptionsModal = lazy(() => import('./DownloadOptionsModal'));

interface ActionModalProps {
  guide: AudioGuide;
  t: any;
  onClose: () => void;
  onPlay: (guide: AudioGuide) => void;
}

const ActionModal: React.FC<ActionModalProps> = ({ guide, t, onClose, onPlay }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingToDevice, setIsSavingToDevice] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const { storageEstimate, formatBytes, getStorageEstimate } = useStorageManager();
  const { downloadProgress } = useAudioState();
  const { downloadAudio, refreshOfflineStatus, showNotification } = useAudioControls();

  const guideId = String(guide.id);
  const currentProgress = downloadProgress[guideId] || 0;

  useEffect(() => {
    const checkOfflineStatus = async () => {
      const offline = await isAudioOffline(String(guide.id));
      setIsOffline(offline);
    };
    checkOfflineStatus();
  }, [guide.id]);

  const handleOfflineDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOffline || isDownloading || !guide.audioUrl) return;

    setIsDownloading(true);
    try {
      const blob = await downloadAudio(guide);
      if (!blob) throw new Error('Download failed');
      
      await saveOfflineAudio(blob, {
        id: String(guide.id),
        title: guide.title || `Day ${guide.id}`,
        fileName: guide.fileName || `Day_${guide.id}.mp3`,
        transcript: guide.transcript || undefined,
      });
      setIsOffline(true);
      // Update global offline status
      await refreshOfflineStatus();
      // Update storage estimate after download
      await getStorageEstimate();
    } catch (error: any) {
      console.error('Offline download failed:', error);
      if (error.message === 'STORAGE_FULL') {
        showNotification(t.storageFull || "Storage is full", 'error');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToDevice = async (type: 'mp3' | 'html' | 'both') => {
    if (isSavingToDevice || !guide.audioUrl) return;

    setIsSavingToDevice(true);
    setShowDownloadOptions(false);
    try {
      const title = guide.title || `Day_${guide.id}`;

      // 1. MP3 Download
      if (type === 'mp3' || type === 'both') {
        const blob = await downloadAudio(guide);
        if (!blob) throw new Error('Audio download failed');
        
        const audioUrl = window.URL.createObjectURL(blob);
        const audioLink = document.createElement('a');
        audioLink.href = audioUrl;
        audioLink.download = `${title}.mp3`;
        document.body.appendChild(audioLink);
        audioLink.click();
        document.body.removeChild(audioLink);
        window.URL.revokeObjectURL(audioUrl);
      }

      // 2. Delay to prevent browser blocking sequential downloads
      if ((type === 'html' || type === 'both') && guide.transcript) {
        if (type === 'both') await new Promise(r => setTimeout(r, 500));

        // 3. Transcript Download (as HTML)
        const transcriptBlob = new Blob([guide.transcript], { type: 'text/html;charset=utf-8' });
        const transcriptUrl = window.URL.createObjectURL(transcriptBlob);
        const transcriptLink = document.createElement('a');
        transcriptLink.href = transcriptUrl;
        transcriptLink.download = `${title}.html`;
        document.body.appendChild(transcriptLink);
        transcriptLink.click();
        document.body.removeChild(transcriptLink);
        window.URL.revokeObjectURL(transcriptUrl);
      }

      onClose();
    } catch (error) {
      console.error('Save to device failed:', error);
      const fallback = window.confirm(
        t.downloadError || 'Download failed. Would you like to try opening the file in a new tab instead?'
      );
      if (fallback) {
        window.open(guide.audioUrl, '_blank');
        onClose();
      }
    } finally {
      setIsSavingToDevice(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass-card w-full max-w-sm p-8 rounded-[2.5rem] border-2 border-[#D4AF37]/40 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#B8860B] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/20">
            <FileAudio className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {guide.fileName || `${t.dayLabel} ${guide.id}`}
          </h3>
          <p className="text-teal-100/60 text-xs uppercase tracking-widest font-bold">
            {t.dayLabel} {guide.id}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <motion.button
            whileHover={guide.audioUrl ? { scale: 1.02 } : {}}
            whileTap={guide.audioUrl ? { scale: 0.98 } : {}}
            onClick={(e) => {
              e.stopPropagation();
              if (guide.audioUrl) {
                onPlay(guide);
                onClose();
              }
            }}
            disabled={!guide.audioUrl}
            className={`flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold shadow-lg transition-all focus-ring ${
              guide.audioUrl 
                ? 'bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-white hover:shadow-[#D4AF37]/20' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
            aria-label={!guide.audioUrl ? t.audioUnavailable : `Play ${guide.title || `${t.dayLabel} ${guide.id}`}`}
          >
            <Play className={`w-5 h-5 fill-current ${!guide.audioUrl ? 'opacity-20' : ''}`} />
            {guide.audioUrl ? t.play : t.audioUnavailable}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowTranscript(true);
            }}
            className="flex items-center justify-center gap-3 w-full py-4 bg-white/10 text-white border border-[#D4AF37]/30 rounded-2xl font-bold hover:bg-white/20 transition-all focus-ring"
            aria-label={`Read transcript for ${guide.title || `${t.dayLabel} ${guide.id}`}`}
          >
            <BookOpen className="w-5 h-5" />
            {t.readAudioBook}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOfflineDownload}
            disabled={isDownloading || isOffline}
            className={`flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold transition-all focus-ring ${
              isOffline 
                ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                : 'bg-[#B8860B]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#B8860B]/20'
            } ${isDownloading ? 'opacity-70 cursor-not-allowed' : ''}`}
            aria-label={isOffline ? `${guide.title || `${t.dayLabel} ${guide.id}`} is available offline` : `Download ${guide.title || `${t.dayLabel} ${guide.id}`} for offline listening`}
          >
            {isDownloading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{currentProgress > 0 ? `${currentProgress}%` : 'Starting...'}</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                  <motion.div 
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentProgress}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                  />
                </div>
              </div>
            ) : isOffline ? (
              <Check className="w-5 h-5 stroke-[3]" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {isDownloading ? '' : isOffline ? t.availableOffline : t.downloadForOffline}
          </motion.button>

          {storageEstimate && !isOffline && (
            <p className="text-[10px] text-teal-100/40 text-center mt-[-8px]">
              Available space: {formatBytes(storageEstimate.remaining)}
            </p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowDownloadOptions(true);
            }}
            disabled={isSavingToDevice}
            className={`flex items-center justify-center gap-3 w-full py-4 bg-white/5 text-white/60 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all focus-ring ${isSavingToDevice ? 'opacity-70 cursor-not-allowed' : ''}`}
            aria-label={`Save ${guide.title || `${t.dayLabel} ${guide.id}`} to device`}
          >
            {isSavingToDevice ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{currentProgress > 0 ? `${currentProgress}%` : 'Starting...'}</span>
                </div>
              </div>
            ) : (
              <Download className="w-5 h-5" />
            )}
            {isSavingToDevice ? '' : t.saveToDevice}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex items-center justify-center gap-3 w-full py-4 text-white/40 font-bold hover:text-white transition-all focus-ring"
            aria-label="Close action menu"
          >
            <X className="w-5 h-5" />
            {t.close}
          </motion.button>
        </div>

        <Suspense fallback={null}>
          <TranscriptModal 
            isOpen={showTranscript} 
            onClose={() => setShowTranscript(false)} 
            guide={guide}
            lang="my" // Defaulting to 'my', but this could be dynamic if needed
          />
          <DownloadOptionsModal
            isOpen={showDownloadOptions}
            onClose={() => setShowDownloadOptions(false)}
            onDownload={handleSaveToDevice}
            guide={guide}
            t={t}
          />
        </Suspense>
      </motion.div>
    </motion.div>
  );
};

export default ActionModal;
