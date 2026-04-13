
import React, { useMemo } from 'react';

interface InstallModalProps {
  type: 'ios' | 'android';
  t: any;
  onClose: () => void;
}

const InstallModal: React.FC<InstallModalProps> = ({ type, t, onClose }) => {
  const isIosDevice = useMemo(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }, []);

  const isIos = type === 'ios' || isIosDevice;
  
  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
    >
      <div className="glass-card w-full max-w-sm rounded-[2.5rem] p-8 border-2 border-[#D4AF37]/40 relative overflow-hidden shadow-2xl text-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-[#B8860B]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            {isIos ? (
              <svg className="w-8 h-8 text-[#B8860B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-[#B8860B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            )}
          </div>
          <h3 id="install-modal-title" className="text-xl font-bold gold-text mb-4">
            {isIos ? (t.iosInstallTitle || 'Install on iPhone') : (t.androidInstallTitle || 'Install App')}
          </h3>
          <div className="text-white/80 text-sm leading-relaxed mb-8">
            {isIos ? (
              <div className="space-y-6 text-left">
                <p className="text-center">To install this app, tap the Share icon at the bottom of Safari, then scroll down and tap <strong>Add to Home Screen</strong>.</p>
                
                <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                      </svg>
                    </div>
                    <p className="text-xs">1. Tap the <strong>Share</strong> button in Safari's toolbar.</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    </div>
                    <p className="text-xs">2. Scroll down and tap <strong>Add to Home Screen</strong>.</p>
                  </div>
                </div>
              </div>
            ) : (
              <p>{t.androidInstallDesc}</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-[#B8860B] text-white rounded-2xl font-bold shadow-lg hover:bg-[#9a700a] transition-all active-scale border border-[#FCF6BA]/30"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallModal;
