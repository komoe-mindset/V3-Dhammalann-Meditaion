
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Copy, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: {
    share: string;
    shareViaApps: string;
    copyLink: string;
    copied: string;
  };
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, t }) => {
  const [copied, setCopied] = useState(false);

  // Prevent background scrolling when modal is open
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

  const handleNativeShare = async () => {
    const shareData = {
      title: 'Dhammalann Meditation',
      text: 'Let\'s walk the Dhammalann path together.',
      url: 'https://meditation.dhammalann.org/',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://meditation.dhammalann.org/');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-[#041a13] border border-[#D4AF37]/30 rounded-[2.5rem] overflow-hidden shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center">
                  <Share2 className="text-[#D4AF37] w-5 h-5" />
                </div>
                <h2 id="share-title" className="text-xl font-bold gold-text uppercase tracking-tight">
                  {t.share}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"
                aria-label="Close share modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 flex flex-col items-center gap-8 text-center">
              {/* QR Code Container */}
              <div className="relative group">
                <div className="absolute -inset-6 bg-[#D4AF37]/10 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="bg-white p-4 rounded-xl mx-auto inline-block relative shadow-2xl border-4 border-[#D4AF37]/10">
                  <img 
                    src="/qr-code.svg" 
                    alt="QR Code to share website" 
                    className="w-52 h-52 md:w-64 md:h-64"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://picsum.photos/seed/qr/300/300';
                      target.className = 'w-52 h-52 rounded-lg opacity-20';
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-3">
                {/* Primary: Share via Apps */}
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-[#D4AF37] text-black rounded-2xl font-bold active:scale-95 transition-transform duration-200 hover:bg-[#B8860B] shadow-lg shadow-[#D4AF37]/20"
                >
                  <Share2 className="w-5 h-5" />
                  {t.shareViaApps}
                </button>

                {/* Secondary: Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold active:scale-95 transition-transform duration-200 border border-[#D4AF37]/30 ${
                    copied 
                      ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      {t.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      {t.copyLink}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/5 border-t border-white/10 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                Scan to join the Dhammalann path
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;
