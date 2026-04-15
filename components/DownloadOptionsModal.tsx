
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileAudio, FileText, Download, X, Files } from 'lucide-react';
import { AudioGuide } from '../types';

interface DownloadOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (type: 'mp3' | 'html' | 'both') => void;
  guide: AudioGuide;
  t: any;
}

const DownloadOptionsModal: React.FC<DownloadOptionsModalProps> = ({ 
  isOpen, 
  onClose, 
  onDownload, 
  guide,
  t 
}) => {
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
            className="glass-card w-full max-w-sm p-8 rounded-[2.5rem] border-2 border-[#D4AF37]/40 bg-[#051a12] shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#B8860B]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#D4AF37]/30">
                <Download className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {t.downloadOptions}
              </h3>
              <p className="text-teal-100/60 text-xs font-bold uppercase tracking-widest">
                {guide.title || `Day ${guide.id}`}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => onDownload('mp3')}
                className="flex items-center gap-4 w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center group-hover:bg-[#D4AF37]/30 transition-colors">
                  <FileAudio className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{t.mp3File}</p>
                  <p className="text-[10px] text-white/40">{t.mp3Desc}</p>
                </div>
              </button>

              <button
                onClick={() => onDownload('html')}
                disabled={!guide.transcript}
                className={`flex items-center gap-4 w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group ${!guide.transcript ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{t.htmlFile}</p>
                  <p className="text-[10px] text-white/40">{t.htmlDesc}</p>
                </div>
              </button>

              <button
                onClick={() => onDownload('both')}
                disabled={!guide.transcript}
                className={`flex items-center gap-4 w-full p-4 bg-gradient-to-r from-[#B8860B]/20 to-[#D4AF37]/20 hover:from-[#B8860B]/30 hover:to-[#D4AF37]/30 border border-[#D4AF37]/30 rounded-2xl transition-all group ${!guide.transcript ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg">
                  <Files className="w-5 h-5 text-black" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{t.bothFiles}</p>
                  <p className="text-[10px] text-[#D4AF37]">{t.bothDesc}</p>
                </div>
              </button>

              <button
                onClick={onClose}
                className="mt-4 w-full py-4 text-white/40 font-bold hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                {t.close}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DownloadOptionsModal;
