import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { AudioGuide } from '../types';
import { useAudioControls } from '../src/context/AudioContext';
import JumpToDay from './JumpToDay';

interface UpNextCardProps {
  nextAudio: AudioGuide | undefined;
  currentStreak: number;
  t: any;
  lang: 'my' | 'en';
  isLoading?: boolean;
}

const UpNextCard: React.FC<UpNextCardProps> = ({ nextAudio, currentStreak, t, lang, isLoading = false }) => {
  const { playAudio } = useAudioControls();
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mb-4 md:mb-6 glass-card rounded-2xl p-3 md:p-4 border border-white/10 animate-pulse">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-white/10 shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-white/10 rounded"></div>
            <div className="h-3 w-1/2 bg-white/5 rounded"></div>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 shrink-0"></div>
        </div>
      </div>
    );
  }

  if (!nextAudio) return null;

  // Helper to convert numbers to Myanmar digits
  const toMyanmarDigits = (num: number) => {
    const myDigits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
    return num.toString().split('').map(d => myDigits[parseInt(d)] || d).join('');
  };

  const dayDisplay = lang === 'my' ? toMyanmarDigits(nextAudio.id) : nextAudio.id;
  const streakDisplay = lang === 'my' ? toMyanmarDigits(currentStreak) : currentStreak;

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 md:mb-6 relative group"
      aria-label="Up next meditation"
    >
      <div className="glass-card relative rounded-2xl p-3 md:p-4 border border-[#D4AF37]/30 shadow-xl overflow-hidden">
        {/* Background Decorative Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16 blur-2xl" aria-hidden="true"></div>

        <div className="relative z-10 flex items-center gap-3 md:gap-4">
          {/* Thumbnail / Day Indicator */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsJumpModalOpen(true)}
            className="relative shrink-0 group/icon focus-ring rounded-xl"
            aria-label="Jump to a specific day"
          >
            {nextAudio.coverImage ? (
              <img 
                src={nextAudio.coverImage} 
                alt="" 
                className="w-12 h-12 md:w-16 md:h-16 rounded-xl object-cover border border-white/10 shadow-lg group-hover/icon:border-[#D4AF37]/50 transition-all"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-[#B8860B]/20 to-[#D4AF37]/20 border border-[#D4AF37]/30 flex flex-col items-center justify-center shadow-lg group-hover/icon:border-[#D4AF37]/60 transition-all">
                <span className="text-[10px] font-bold text-[#D4AF37]/60 uppercase tracking-tighter leading-none mb-0.5">Day</span>
                <span className="text-lg md:text-xl font-black text-[#D4AF37] leading-none">{dayDisplay}</span>
              </div>
            )}
            
            {/* Up Next Badge Overlay */}
            <div className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-md bg-[#D4AF37] text-black text-[8px] font-black uppercase tracking-wider shadow-lg">
              Next
            </div>
          </motion.button>

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-sm md:text-base font-bold text-white truncate">
                {nextAudio.title || nextAudio.titleEn || `${t.dayLabel} ${nextAudio.id}`}
              </h2>
              {currentStreak > 0 && (
                <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-tighter">
                  🔥 {streakDisplay}
                </span>
              )}
            </div>
            <p className="text-xs text-teal-100/50 truncate">
              {t.continueJourney} • {t.dayLabel} {dayDisplay}
            </p>
          </div>

          {/* Compact Play Button */}
          <motion.button
            whileHover={nextAudio.audioUrl ? { scale: 1.1 } : {}}
            whileTap={nextAudio.audioUrl ? { scale: 0.9 } : {}}
            onClick={() => nextAudio.audioUrl && playAudio(nextAudio)}
            disabled={!nextAudio.audioUrl}
            className={`shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all active-scale focus-ring ${
              nextAudio.audioUrl 
                ? 'bg-gradient-to-r from-[#B8860B] to-[#D4AF37] shadow-[#B8860B]/20' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
            aria-label={!nextAudio.audioUrl ? "Audio not available" : `${t.play} ${t.dayLabel} ${nextAudio.id}`}
          >
            <Play className={`w-5 h-5 md:w-6 md:h-6 fill-current ml-0.5 ${!nextAudio.audioUrl ? 'opacity-20' : ''}`} />
          </motion.button>
        </div>
      </div>

      <JumpToDay 
        isOpen={isJumpModalOpen}
        onClose={() => setIsJumpModalOpen(false)}
        lang={lang}
        t={t}
      />
    </motion.section>
  );
};

export default UpNextCard;
