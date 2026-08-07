import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Check, Download, Loader2, Pause } from 'lucide-react';
import { AudioGuide } from '../types';
import { useAudioState, useAudioControls } from '../src/context/AudioContext';
import { isAudioOffline, saveOfflineAudio } from '../src/utils/indexedDB';

interface AudioCardProps {
  guide: AudioGuide;
  onToggleDone: (id: number) => void;
  onOpenAction: (guide: AudioGuide) => void;
  isHighlighted: boolean;
  t: {
    play: string;
    dayLabel: string;
    download?: string;
    storageFull?: string;
  };
}

export const AudioCardSkeleton: React.FC = () => (
  <div className="relative bg-white/5 rounded-xl p-2 sm:p-3 gap-2 sm:gap-4 border border-white/5 flex items-center animate-pulse">
    <div className="flex-shrink-0 w-6 sm:w-10 flex justify-center">
      <div className="w-4 h-4 bg-white/10 rounded"></div>
    </div>
    <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
      <div className="h-4 w-3/4 bg-white/10 rounded"></div>
      <div className="h-3 w-1/4 bg-white/5 rounded"></div>
    </div>
    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
      <div className="w-9 h-9 rounded-full bg-white/10"></div>
      <div className="w-10 h-10 rounded-full bg-white/10"></div>
      <div className="w-9 h-9 rounded-full bg-white/10"></div>
    </div>
  </div>
);

const AudioCard = React.memo(React.forwardRef<HTMLDivElement, AudioCardProps>(({ 
  guide, 
  onToggleDone, 
  onOpenAction,
  isHighlighted,
  t 
}, ref) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { activeRecord, isPlaying, offlineIds, downloadProgress } = useAudioState();
  const { togglePlay, playAudio, refreshOfflineStatus, downloadAudio, showNotification } = useAudioControls();
  const isActive = activeRecord?.id === guide.id;
  const isOffline = offlineIds.has(String(guide.id));
  const guideId = String(guide.id);
  const currentProgress = downloadProgress[guideId] || 0;

  const handleDownload = async (e: React.MouseEvent) => {
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
      await refreshOfflineStatus();
    } catch (error: any) {
      console.error('Offline download failed:', error);
      if (error.message === 'STORAGE_FULL') {
        showNotification(t.storageFull || "Storage is full", 'error');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      togglePlay();
    } else {
      playAudio(guide);
    }
  };

  const titleDisplay = guide.title || (t.dayLabel + " " + guide.id);

  return (
    <motion.div 
      ref={ref}
      role="button"
      aria-label={`${titleDisplay}, ${t.dayLabel} ${guide.id}`}
      className={`relative bg-white/5 hover:bg-white/10 rounded-xl p-2 sm:p-3 gap-2 sm:gap-4 transition-colors border flex items-center cursor-pointer focus:ring-2 focus:ring-amber-500 focus:outline-none ${
        isActive
          ? 'border-[#D4AF37] bg-white/15 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
          : 'border-white/10'
      } ${isHighlighted ? 'ring-2 ring-amber-500' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpenAction(guide)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenAction(guide);
        }
      }}
    >
      {/* Day Number Indicator */}
      <div className={`flex-shrink-0 w-6 sm:w-10 text-center transition-colors ${
        isActive ? 'text-amber-400 font-black' : 'text-gray-300 font-bold'
      }`}>
        <span className="text-xs sm:text-base">{guide.id}</span>
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className={`text-sm sm:text-base font-semibold line-clamp-2 text-wrap leading-snug transition-colors ${
          isActive ? 'text-amber-300' : 'text-white'
        }`}>
          {titleDisplay}
        </h3>
        {guide.date && (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-200 font-medium">
              {guide.date}
            </p>
            {isOffline && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-950/80 text-green-300 text-[10px] font-bold uppercase tracking-wider border border-green-500/40">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Offline
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Download Button */}
        {guide.audioUrl && (
          <motion.button
            onClick={handleDownload}
            whileTap={{ scale: 0.9 }}
            disabled={isDownloading}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative focus:ring-2 focus:ring-amber-500 focus:outline-none ${
              isOffline 
                ? 'text-green-300 bg-green-900/40 border border-green-500/40' 
                : 'text-gray-200 hover:text-white hover:bg-white/20'
            }`}
            aria-label={isOffline ? `${titleDisplay} is available offline` : `Download ${titleDisplay} for offline listening`}
            aria-busy={isDownloading}
          >
            {isDownloading ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" aria-hidden="true" />
                {currentProgress > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[8px] px-1 rounded-full font-bold">
                    {currentProgress}%
                  </span>
                )}
              </div>
            ) : isOffline ? (
              <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
            ) : (
              <Download className="w-4 h-4" aria-hidden="true" />
            )}
          </motion.button>
        )}

        {/* Play/Pause Button */}
        <motion.button
          onClick={handlePlay}
          whileTap={guide.audioUrl ? { scale: 0.9 } : {}}
          disabled={!guide.audioUrl}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg focus:ring-2 focus:ring-amber-500 focus:outline-none ${
            isActive
              ? 'bg-amber-500 text-slate-950 font-bold'
              : guide.audioUrl 
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
          }`}
          aria-label={!guide.audioUrl ? `Audio not available for ${titleDisplay}` : isActive && isPlaying ? `Pause ${titleDisplay}` : `Play ${titleDisplay}`}
          aria-pressed={isActive && isPlaying}
        >
          {isActive && isPlaying ? (
            <Pause className="w-5 h-5 fill-current" aria-hidden="true" />
          ) : (
            <Play className={`w-5 h-5 fill-current ml-0.5 ${!guide.audioUrl ? 'opacity-30' : ''}`} aria-hidden="true" />
          )}
        </motion.button>

        {/* Done Toggle Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone(guide.id);
          }}
          whileTap={{ scale: 0.9 }}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none ${
            guide.isCompleted ? 'text-amber-400 bg-amber-500/10' : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
          aria-label={guide.isCompleted ? `Mark ${titleDisplay} as unfinished` : `Mark ${titleDisplay} as completed`}
          aria-pressed={guide.isCompleted}
        >
          <Check className={`w-5 h-5 ${guide.isCompleted ? 'stroke-[3]' : 'stroke-[2]'}`} aria-hidden="true" />
        </motion.button>
      </div>

      {/* Active Indicator Line */}
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-amber-400 rounded-r-full"
        />
      )}
    </motion.div>
  );
}));

export default AudioCard;
