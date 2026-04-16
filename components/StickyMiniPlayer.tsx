import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Play, Pause, X, RefreshCw, SkipBack, SkipForward } from 'lucide-react';

import { useAudioState, useAudioProgress, useAudioControls } from '../src/context/AudioContext';

interface StickyMiniPlayerProps {
  lang: 'my' | 'en';
}

const StickyMiniPlayer: React.FC<StickyMiniPlayerProps> = ({ 
  lang 
}) => {
  const { 
    activeRecord, 
    isPlaying, 
    isBuffering, 
    error, 
    hasNext,
    hasPrevious,
  } = useAudioState();

  const {
    progress,
    currentTime,
    duration,
  } = useAudioProgress();

  const {
    togglePlay, 
    stopAudio,
    playAudio,
    playNext,
    playPrevious,
    seekTo
  } = useAudioControls();

  if (!activeRecord) return null;

  const toMyanmarDigits = (num: number) => {
    const myDigits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
    return num.toString().split('').map(d => myDigits[parseInt(d)] || d).join('');
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dayDisplay = lang === 'my' ? toMyanmarDigits(activeRecord.day_number || activeRecord.id) : (activeRecord.day_number || activeRecord.id);
  const dayLabel = lang === 'my' ? 'နေ့ရက်' : 'Day';
  const titleDisplay = activeRecord.title || (lang === 'my' ? activeRecord.titleMy : activeRecord.titleEn || activeRecord.fileName);

  return (
    <AnimatePresence>
      {activeRecord && (
        <motion.section
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 25 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] w-full max-w-lg px-4 pb-[env(safe-area-inset-bottom)]"
          aria-label="Premium audio player"
        >
          <div className="glass-card rounded-3xl p-4 md:p-5 border border-[#D4AF37]/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-[#051a12]/90 flex flex-col gap-2">
            
            {/* Title Section: Above Controls */}
            <div className="flex flex-col items-center text-center mb-2 max-w-[80%] mx-auto min-w-0 w-full">
              <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.2em] mb-0.5">
                {dayLabel} {dayDisplay}
              </p>
              <h4 className="text-white text-sm md:text-base font-bold truncate w-full leading-tight">
                {titleDisplay}
              </h4>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-center gap-4 md:gap-8">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={hasPrevious ? { scale: 1.1 } : {}}
                  whileTap={hasPrevious ? { scale: 0.9 } : {}}
                  onClick={playPrevious}
                  disabled={!hasPrevious}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    hasPrevious 
                      ? 'text-white/70 hover:text-white hover:bg-white/10' 
                      : 'text-white/10 cursor-not-allowed'
                  }`}
                  aria-label="Play Previous"
                >
                  <SkipBack className="w-5 h-5 fill-current" aria-hidden="true" />
                </motion.button>

                <div className="relative">
                  {isBuffering && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute -inset-1 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin"
                    />
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={error ? () => playAudio(activeRecord) : togglePlay}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_rgba(184,134,11,0.3)] relative z-10 ${
                      error 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                        : 'bg-gradient-to-br from-[#B8860B] to-[#D4AF37] text-white'
                    }`}
                    aria-label={error ? `Retry loading ${titleDisplay}` : isPlaying ? `Pause ${titleDisplay}` : `Play ${titleDisplay}`}
                    disabled={isBuffering && !error}
                  >
                    {error ? (
                      <RefreshCw className="w-6 h-6" aria-hidden="true" />
                    ) : isBuffering ? (
                      <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                    ) : isPlaying ? (
                      <Pause className="w-6 h-6 fill-current" aria-hidden="true" />
                    ) : (
                      <Play className="w-6 h-6 fill-current ml-0.5" aria-hidden="true" />
                    )}
                  </motion.button>
                </div>

                <motion.button
                  whileHover={hasNext ? { scale: 1.1 } : {}}
                  whileTap={hasNext ? { scale: 0.9 } : {}}
                  onClick={playNext}
                  disabled={!hasNext}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    hasNext 
                      ? 'text-white/70 hover:text-white hover:bg-white/10' 
                      : 'text-white/10 cursor-not-allowed'
                  }`}
                  aria-label="Play Next"
                >
                  <SkipForward className="w-5 h-5 fill-current" aria-hidden="true" />
                </motion.button>
              </div>

              <button
                onClick={stopAudio}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all ml-2"
                aria-label={`Close audio player for ${titleDisplay}`}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Progress Bar Row */}
            <div className="space-y-1">
              <div className="relative group px-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progress}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#D4AF37] hover:accent-[#FCF6BA] transition-all"
                  aria-label="Seek audio position"
                />
                {/* Visual Progress Fill */}
                <div 
                  className="absolute left-1 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#B8860B] to-[#D4AF37] rounded-full pointer-events-none"
                  style={{ width: `calc(${progress}% - 8px)` }}
                />
              </div>
              <div className="flex justify-between px-1">
                <span className="text-[9px] font-mono text-white/40">{formatTime(currentTime)}</span>
                <span className="text-[9px] font-mono text-white/40">{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default StickyMiniPlayer;
