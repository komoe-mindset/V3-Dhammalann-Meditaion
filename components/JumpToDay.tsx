
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Play, X, AlertCircle } from 'lucide-react';
import { useAudio } from '../src/context/AudioContext';

interface JumpToDayProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'my' | 'en';
  t: any;
}

const JumpToDay: React.FC<JumpToDayProps> = ({ isOpen, onClose, lang, t }) => {
  const [dayInput, setDayInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { meditations, playAudio } = useAudio();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleJump = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    const dayNumber = parseInt(dayInput);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 365) {
      setError(lang === 'my' ? "နေ့ရက် (၁) မှ (၃၆၅) အတွင်းသာ ရှာဖွေနိုင်ပါသည်။" : "Please enter a day between 1 and 365.");
      return;
    }

    const targetDay = meditations.find(m => m.id === dayNumber);
    if (targetDay && targetDay.audioUrl) {
      playAudio(targetDay);
      onClose();
      setDayInput('');
    } else if (targetDay && !targetDay.audioUrl) {
      setError(lang === 'my' ? "ဤနေ့ရက်အတွက် တရားတော် မရရှိနိုင်သေးပါ။" : "Audio not available for this day yet.");
    } else {
      setError(lang === 'my' ? "နေ့ရက် ရှာမတွေ့ပါ။" : "Day not found.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass-card w-full max-w-sm p-8 rounded-[2.5rem] border-2 border-[#D4AF37]/40 bg-[#051a12]/70 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#B8860B]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#D4AF37]/30">
                <Search className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {lang === 'my' ? "နေ့ရက်အလိုက် ရှာဖွေရန်" : "Jump to Day"}
              </h3>
              <p className="text-teal-100/60 text-xs font-bold uppercase tracking-widest">
                Day 1 - 365
              </p>
            </div>

            <form id="jump-to-day-form" onSubmit={handleJump} className="space-y-4">
              <div className="relative">
                <label htmlFor="day-number-input" className="sr-only">
                  {lang === 'my' ? "နေ့ရက် နံပါတ်" : "Enter Day Number"}
                </label>
                <input
                  id="day-number-input"
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="365"
                  placeholder={lang === 'my' ? "နေ့ရက် နံပါတ်" : "Enter Day Number"}
                  value={dayInput}
                  onChange={(e) => {
                    setDayInput(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-white/5 border-2 border-white/10 focus:border-[#D4AF37] rounded-2xl text-white text-center font-bold py-4 text-2xl transition-all outline-none"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  id="jump-to-day-submit"
                  type="submit"
                  className="w-full py-4 bg-[#D4AF37] text-black rounded-2xl font-bold hover:bg-[#B8860B] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20"
                >
                  <Play className="w-5 h-5 fill-current" />
                  {lang === 'my' ? "နာယူရန်" : "Go to Day"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-4 text-white/40 font-bold hover:text-white transition-all"
                >
                  {t.close}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JumpToDay;
