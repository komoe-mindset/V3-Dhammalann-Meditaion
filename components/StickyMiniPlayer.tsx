import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Play, Pause, X, RefreshCw, SkipBack, SkipForward, Check, Volume2, VolumeX } from 'lucide-react';

import { useAudioState, useAudioProgress, useAudioControls } from '../src/context/AudioContext';

interface StickyMiniPlayerProps {
  lang: 'my' | 'en';
  onToggleDone: (id: number) => void;
}

const StickyMiniPlayer: React.FC<StickyMiniPlayerProps> = ({ 
  lang,
  onToggleDone
}) => {
  const { 
    activeRecord, 
    isPlaying, 
    isBuffering, 
    error, 
    hasNext,
    hasPrevious,
    volume
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
    seekTo,
    setVolume
  } = useAudioControls();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);

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

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 1);
    }
  };

  return (
    <AnimatePresence>
      {activeRecord && (
        <motion.section
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 25 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] w-full max-w-lg px-4 pb-[env(safe-area-inset-bottom)]"
          aria-label={lang === 'my' ? 'တရားတော် ဖွင့်စက်' : 'Audio player controls'}
        >
          <div className="glass-card rounded-3xl p-4 md:p-5 border border-amber-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.7)] !bg-[#051a12]/95 flex flex-col gap-2">
            
            {/* Title Section: Above Controls */}
            <div className="flex flex-col items-center text-center mb-1 max-w-[85%] mx-auto min-w-0 w-full">
              <p className="text-xs text-amber-300 font-bold uppercase tracking-wider mb-0.5">
                {dayLabel} {dayDisplay}
              </p>
              <h4 className="text-white text-sm md:text-base font-bold truncate w-full leading-tight">
                {titleDisplay}
              </h4>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between gap-2 md:gap-4 px-1">
              {/* Left: Volume Control Toggle */}
              <div className="flex items-center gap-1.5 relative">
                <button
                  onClick={toggleMute}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-200 hover:text-white hover:bg-white/10 transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  aria-label={volume === 0 ? "Unmute volume" : "Mute volume"}
                >
                  {volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-red-400" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-amber-300" aria-hidden="true" />
                  )}
                </button>

                {/* Inline Volume Slider */}
                <div className="hidden sm:flex items-center w-20">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    aria-label="Volume control"
                    aria-valuenow={Math.round(volume * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuetext={`${Math.round(volume * 100)}% volume`}
                  />
                </div>
              </div>

              {/* Center: Main Playback Controls */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={hasPrevious ? { scale: 1.1 } : {}}
                  whileTap={hasPrevious ? { scale: 0.9 } : {}}
                  onClick={playPrevious}
                  disabled={!hasPrevious}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                    hasPrevious 
                      ? 'text-gray-200 hover:text-white hover:bg-white/10' 
                      : 'text-gray-600 cursor-not-allowed'
                  }`}
                  aria-label={lang === 'my' ? 'ယခင် တရားတော်သို့' : 'Play Previous Track'}
                >
                  <SkipBack className="w-5 h-5 fill-current" aria-hidden="true" />
                </motion.button>

                <div className="relative">
                  {isBuffering && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute -inset-1 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"
                    />
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={error ? () => playAudio(activeRecord) : togglePlay}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg relative z-10 focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                      error 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/50' 
                        : 'bg-amber-400 text-slate-950 font-bold hover:bg-amber-300'
                    }`}
                    aria-label={error ? `Retry loading ${titleDisplay}` : isPlaying ? `Pause ${titleDisplay}` : `Play ${titleDisplay}`}
                    aria-pressed={isPlaying}
                    disabled={isBuffering && !error}
                  >
                    {error ? (
                      <RefreshCw className="w-6 h-6" aria-hidden="true" />
                    ) : isBuffering ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-950" aria-hidden="true" />
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                    hasNext 
                      ? 'text-gray-200 hover:text-white hover:bg-white/10' 
                      : 'text-gray-600 cursor-not-allowed'
                  }`}
                  aria-label={lang === 'my' ? 'နောက် တရားတော်သို့' : 'Play Next Track'}
                >
                  <SkipForward className="w-5 h-5 fill-current" aria-hidden="true" />
                </motion.button>
              </div>

              {/* Right: Done Toggle & Close Player */}
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onToggleDone(activeRecord.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                    activeRecord.isCompleted ? 'text-amber-300 bg-amber-500/20' : 'text-gray-200 hover:text-white hover:bg-white/10'
                  }`}
                  aria-label={activeRecord.isCompleted ? `Mark ${titleDisplay} as incomplete` : `Mark ${titleDisplay} as completed`}
                  aria-pressed={activeRecord.isCompleted}
                >
                  <Check className={`w-5 h-5 ${activeRecord.isCompleted ? 'stroke-[3]' : 'stroke-[2]'}`} aria-hidden="true" />
                </motion.button>

                <button
                  onClick={stopAudio}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-200 hover:text-white hover:bg-white/10 transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  aria-label={lang === 'my' ? `ဖွင့်စက်ကို ပိတ်ရန် - ${titleDisplay}` : `Close audio player for ${titleDisplay}`}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Progress Bar Row */}
            <div className="space-y-1 mt-1">
              <div className="relative group px-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progress}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300 transition-all focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  aria-label="Playback progress"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                />
              </div>
              <div className="flex justify-between px-1">
                <span className="text-[10px] font-mono text-gray-200 font-semibold">{formatTime(currentTime)}</span>
                <span className="text-[10px] font-mono text-gray-200 font-semibold">{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default StickyMiniPlayer;

