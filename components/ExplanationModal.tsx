
import React from 'react';
import DOMPurify from 'dompurify';
import { AudioGuide } from '../types';

interface ExplanationModalProps {
  selectedAudio: AudioGuide;
  lang: 'my' | 'en';
  t: any;
  onClose: () => void;
  onListenNow: (guide: AudioGuide) => void;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({ 
  selectedAudio, 
  lang, 
  t, 
  onClose, 
  onListenNow 
}) => {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="glass-card w-full max-w-lg rounded-[2.5rem] p-8 border-2 border-[#D4AF37]/40 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 id="modal-title" className="text-2xl font-bold gold-text mb-1">{t.dayLabel} {selectedAudio.id}</h3>
              {selectedAudio.date && <p className="text-teal-100/40 text-xs font-bold uppercase tracking-widest">{selectedAudio.date}</p>}
            </div>
            <button 
              onClick={onClose}
              className="p-2 min-w-[48px] min-h-[48px] text-white/40 hover:text-white transition-colors focus-ring rounded-full"
              aria-label="Close information modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="mb-8 space-y-6">
            <div>
              <h4 className="text-xs font-bold gold-text uppercase tracking-widest mb-3 opacity-60">{t.explanation}</h4>
              <div 
                className={`text-white/90 leading-relaxed max-h-[200px] overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap focus-ring rounded-lg ${lang === 'my' ? 'text-lg' : 'text-base'}`}
                tabIndex={0}
              >
                {selectedAudio.explanation || (lang === 'my' ? "ရှင်းလင်းချက် မရှိသေးပါ။" : "No explanation available yet.")}
              </div>
            </div>

            {selectedAudio.transcript && (
              <div>
                <h4 className="text-xs font-bold gold-text uppercase tracking-widest mb-3 opacity-60">Transcript</h4>
                <div 
                  className={`text-white/90 leading-relaxed max-h-[300px] overflow-y-auto pr-2 custom-scrollbar prose prose-invert prose-sm max-w-none focus-ring rounded-lg ${lang === 'my' ? 'text-lg' : 'text-base'}`}
                  tabIndex={0}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedAudio.transcript, { FORCE_BODY: true }) }}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => onListenNow(selectedAudio)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#B8860B] text-white rounded-2xl font-bold shadow-lg hover:bg-[#9a700a] transition-all active-scale border border-[#FCF6BA]/30 focus-ring"
              aria-label={`${t.listenNow} for ${t.dayLabel} ${selectedAudio.id}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/></svg>
              {t.listenNow}
            </button>
            {selectedAudio.downloadUrl && (
              <a 
                href={selectedAudio.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/5 text-white/80 rounded-2xl font-bold shadow-lg hover:bg-white/10 transition-all active-scale border border-white/10 focus-ring"
                aria-label={`${t.download} audio for ${t.dayLabel} ${selectedAudio.id}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                {t.download}
              </a>
            )}
            <button 
              onClick={onClose}
              className="px-6 py-4 bg-white/5 text-white/60 rounded-2xl font-bold hover:bg-white/10 transition-all active-scale border border-white/10 focus-ring"
              aria-label="Close"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplanationModal;
