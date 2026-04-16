import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioGuide } from '../types';
import AudioCard, { AudioCardSkeleton } from './AudioCard';

interface AudioListContainerProps {
  audioGuides: AudioGuide[];
  onToggleDone: (id: number) => void;
  onOpenAction: (guide: AudioGuide) => void;
  firstUncompletedId: number | undefined;
  t: {
    play: string;
    dayLabel: string;
    storageFull?: string;
  };
  lang: 'my' | 'en';
  itemRefs: React.MutableRefObject<Map<number, HTMLDivElement | null>>;
  isLoading?: boolean;
}

const AudioListContainer: React.FC<AudioListContainerProps> = ({
  audioGuides,
  onToggleDone,
  onOpenAction,
  firstUncompletedId,
  t,
  lang,
  itemRefs,
  isLoading = false
}) => {
  // Helper to convert numbers to Myanmar digits
  const toMyanmarDigits = (num: number) => {
    const myDigits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
    return num.toString().split('').map(d => myDigits[parseInt(d)] || d).join('');
  };

  // Group audio guides into months (30 days each)
  const months = useMemo(() => {
    const groups: AudioGuide[][] = [];
    for (let i = 0; i < audioGuides.length; i += 30) {
      groups.push(audioGuides.slice(i, i + 30));
    }
    return groups;
  }, [audioGuides]);

  // Find the month containing the first uncompleted item to open it by default
  const defaultOpenMonth = useMemo(() => {
    if (!firstUncompletedId) return 0;
    return Math.floor((firstUncompletedId - 1) / 30);
  }, [firstUncompletedId]);

  const [openMonth, setOpenMonth] = useState<number | null>(defaultOpenMonth);

  const toggleMonth = (index: number) => {
    setOpenMonth(openMonth === index ? null : index);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 -mr-2 custom-scrollbar pb-4">
        {[...Array(3)].map((_, monthIdx) => (
          <div key={monthIdx} className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 animate-pulse">
            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white/10"></div>
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-white/10 rounded"></div>
                  <div className="h-3 w-24 bg-white/5 rounded"></div>
                </div>
              </div>
              <div className="w-5 h-5 bg-white/10 rounded"></div>
            </div>
            {monthIdx === 0 && (
              <div className="px-6 pb-6 pt-2 space-y-4">
                {[...Array(3)].map((_, cardIdx) => (
                  <AudioCardSkeleton key={cardIdx} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-4 max-h-[600px] overflow-y-auto pr-2 -mr-2 custom-scrollbar pb-4" role="list">
      {months.map((monthItems, index) => {
        const isOpen = openMonth === index;
        const monthNumber = index + 1;
        const myMonthNumber = toMyanmarDigits(monthNumber);
        const completedCount = monthItems.filter(item => item.isCompleted).length;
        const totalCount = monthItems.length;
        const progressPercentage = (completedCount / totalCount) * 100;
        const isFullyCompleted = completedCount === totalCount;

        return (
          <li 
            key={index} 
            className={`rounded-3xl overflow-hidden border transition-all duration-300 ${
              isOpen 
                ? 'bg-white/10 border-[#D4AF37]/40 shadow-xl' 
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            {/* Month Header */}
            <button
              onClick={() => toggleMonth(index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left group relative"
              aria-expanded={isOpen}
              aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${lang === 'my' ? `${myMonthNumber} လ` : `Month ${monthNumber}`}`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base transition-all ${
                  isFullyCompleted 
                    ? 'bg-[#B8860B] text-white shadow-[0_0_15px_rgba(184,134,11,0.4)]' 
                    : 'bg-white/10 text-white/60 group-hover:bg-white/20'
                }`}>
                  {lang === 'my' ? myMonthNumber : monthNumber}
                </div>
                <div className="flex-1 min-w-[140px]">
                  <h3 className={`text-lg font-bold transition-colors ${isOpen ? 'gold-text' : 'text-white/90'}`}>
                    {lang === 'my' ? `${myMonthNumber} လ` : `Month ${monthNumber}`}
                  </h3>
                  
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[10px] text-white/50 uppercase tracking-[0.15em] font-bold">
                      {lang === 'my' 
                        ? `${toMyanmarDigits(completedCount)} / ${toMyanmarDigits(totalCount)} ပြီးစီးမှု` 
                        : `${completedCount} / ${totalCount} Days Completed`}
                    </p>
                    {/* Progress Bar Container */}
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-[#B8860B] shadow-[0_0_8px_rgba(184,134,11,0.6)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Month Content (Grid of AudioCards) */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="px-6 pb-6 pt-2">
                    <ul className="flex flex-col gap-4" role="list">
                      {monthItems.map((guide) => (
                        <li key={guide.id}>
                          <AudioCard 
                            ref={(el) => {
                              if (el) itemRefs.current.set(guide.id, el);
                              else itemRefs.current.delete(guide.id);
                            }}
                            guide={guide}
                            onToggleDone={onToggleDone}
                            onOpenAction={onOpenAction}
                            isHighlighted={guide.id === firstUncompletedId}
                            t={{ 
                              play: t.play, 
                              dayLabel: t.dayLabel,
                              storageFull: t.storageFull
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
};

export default AudioListContainer;
