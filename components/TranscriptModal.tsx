
import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify'; // REMINDER: Run 'npm install dompurify @types/dompurify' if not already installed
import { AudioGuide } from '../types';
import { getOfflineMetadata } from '../src/utils/indexedDB';
import { fetchMeditationTranscript } from '../src/lib/meditationService';

interface TranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  guide: AudioGuide;
  lang: 'my' | 'en';
}

const TranscriptModal: React.FC<TranscriptModalProps> = ({ isOpen, onClose, guide, lang }) => {
  const [offlineTranscript, setOfflineTranscript] = useState<string | null>(null);
  const [fetchedTranscript, setFetchedTranscript] = useState<string | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFetchedTranscript(null);
      setOfflineTranscript(null);
      setIsLoadingTranscript(false);
      return;
    }

    if (guide.transcript) {
      setFetchedTranscript(guide.transcript);
      return;
    }

    let isMounted = true;
    const loadTranscript = async () => {
      setIsLoadingTranscript(true);
      try {
        const remoteTranscript = await fetchMeditationTranscript(guide.id);
        if (isMounted && remoteTranscript) {
          setFetchedTranscript(remoteTranscript);
          setIsLoadingTranscript(false);
          return;
        }
      } catch (err) {
        console.warn('Lazy loading transcript error:', err);
      }

      try {
        const metadata = await getOfflineMetadata(String(guide.id));
        if (isMounted && metadata?.transcript) {
          setOfflineTranscript(metadata.transcript);
        }
      } catch (err) {
        console.warn('Error reading offline metadata transcript:', err);
      } finally {
        if (isMounted) setIsLoadingTranscript(false);
      }
    };

    loadTranscript();

    return () => {
      isMounted = false;
    };
  }, [isOpen, guide.id, guide.transcript]);

  const transcriptToRender = fetchedTranscript || guide.transcript || offlineTranscript;

  const sanitizedHtml = useMemo(() => {
    if (!transcriptToRender) return '';
    try {
      // Configure DOMPurify to handle full documents better if needed
      // and ensure it doesn't strip everything if it's a full HTML doc
      const clean = DOMPurify.sanitize(transcriptToRender, {
        WHOLE_DOCUMENT: false, // We want the fragment to insert into our article
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
      });
      
      // If sanitization results in empty string but we have raw content, 
      // it might be because it's a full document that DOMPurify stripped too much of.
      // We'll try a second pass or a more permissive approach if empty.
      if (!clean.trim() && transcriptToRender.trim()) {
        return DOMPurify.sanitize(transcriptToRender, {
          FORCE_BODY: true,
        });
      }
      
      return clean;
    } catch (e) {
      console.error("Sanitization error:", e);
      return transcriptToRender; 
    }
  }, [transcriptToRender]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl bg-[#041a13] border-t sm:border border-[#D4AF37]/30 rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transcript-title"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center">
                  <BookOpen className="text-[#D4AF37] w-5 h-5" />
                </div>
                <div>
                  <h2 id="transcript-title" className="text-xl font-bold gold-text leading-none">
                    {guide.title || `Day ${guide.id}`}
                  </h2>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
                    Audio Transcript
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"
                aria-label="Close transcript"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              {isLoadingTranscript ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/60">
                  <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mb-3" />
                  <p className="text-[#D4AF37] text-sm font-medium">
                    {lang === 'my' ? 'တရားတော် စာသားရယူနေသည်...' : 'Loading transcript...'}
                  </p>
                </div>
              ) : sanitizedHtml ? (
                <article 
                  className={`prose prose-invert max-w-none ${
                    lang === 'my' ? 'text-lg leading-[2.2]' : 'text-base leading-relaxed'
                  }`}
                  dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-white/40 italic">
                  <BookOpen className="w-12 h-12 mb-4 opacity-10" />
                  <p>{lang === 'my' ? 'ဤတရားတော်အတွက် စာသား မရှိသေးပါ။' : 'No transcript available for this session.'}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex justify-center">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TranscriptModal;
