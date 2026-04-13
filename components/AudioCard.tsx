import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Check, Download, Loader2, Pause } from 'lucide-react';
import { AudioGuide } from '../types';
import { useAudio } from '../src/context/AudioContext';
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
  };
}

const AudioCard = React.memo(React.forwardRef<HTMLDivElement, AudioCardProps>(({ 
  guide, 
  onToggleDone, 
  onOpenAction,
  isHighlighted,
  t 
}, ref) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { activeRecord, isPlaying, togglePlay, playAudio, offlineIds, refreshOfflineStatus, downloadAudio, downloadProgress } = useAudio();
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
    } catch (error) {
      console.error('Offline download failed:', error);
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
      className={`relative bg-white/5 hover:bg-white/10 rounded-xl p-2 sm:p-3 gap-2 sm:gap-4 transition-colors border flex items-center cursor-pointer ${
        isActive
          ? 'border-[#D4AF37] bg-white/10 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
          : 'border-white/5'
      } ${isHighlighted ? 'ring-1 ring-[#D4AF37]' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpenAction(guide)}
    >
      {/* Day Number Indicator - Shrunk for Mobile */}
      <div className={`flex-shrink-0 w-6 sm:w-10 text-center transition-colors ${
        isActive ? 'text-[#D4AF37]' : 'text-gray-500'
      }`}>
        <span className="text-xs sm:text-base font-bold">{guide.id}</span>
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className={`text-sm sm:text-base font-semibold line-clamp-2 text-wrap leading-snug transition-colors ${
          isActive ? 'text-[#D4AF37]' : 'text-gray-100'
        }`}>
          {titleDisplay}
        </h3>
        {guide.date && (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-400 font-medium">
              {guide.date}
            </p>
            {isOffline && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                Offline
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons - Compact for Mobile */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Download Button */}
        {guide.audioUrl && (
          <motion.button
            onClick={handleDownload}
            whileTap={{ scale: 0.9 }}
            disabled={isDownloading}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative ${
              isOffline 
                ? 'text-green-400 bg-green-500/10 border border-green-500/20' 
                : 'text-white/30 hover:text-white hover:bg-white/10'
            }`}
            aria-label={isOffline ? `${titleDisplay} is available offline` : `Download ${titleDisplay} for offline listening`}
          >
            {isDownloading ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                {currentProgress > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-white text-[8px] px-1 rounded-full font-bold">
                    {currentProgress}%
                  </span>
                )}
              </div>
            ) : isOffline ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </motion.button>
        )}

        {/* Play/Pause Button */}
        <motion.button
          onClick={handlePlay}
          whileTap={guide.audioUrl ? { scale: 0.9 } : {}}
          disabled={!guide.audioUrl}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg active-scale ${
            isActive
              ? 'bg-[#D4AF37] text-white'
              : guide.audioUrl 
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
          aria-label={!guide.audioUrl ? "Audio not available" : isActive && isPlaying ? `Pause ${titleDisplay}` : `Play ${titleDisplay}`}
        >
          {isActive && isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className={`w-5 h-5 fill-current ml-0.5 ${!guide.audioUrl ? 'opacity-20' : ''}`} />
          )}
        </motion.button>

        {/* Done Toggle Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone(guide.id);
          }}
          whileTap={{ scale: 0.9 }}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active-scale ${
            guide.isCompleted ? 'text-[#D4AF37]' : 'text-white/10 hover:text-white/30'
          }`}
          aria-label={guide.isCompleted ? `Mark ${titleDisplay} as unfinished` : `Mark ${titleDisplay} as completed`}
        >
          <Check className={`w-5 h-5 ${guide.isCompleted ? 'stroke-[3]' : 'stroke-[2]'}`} />
        </motion.button>
      </div>

      {/* Active Indicator Line */}
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#D4AF37] rounded-r-full"
        />
      )}
    </motion.div>
  );
}));

export default AudioCard;
