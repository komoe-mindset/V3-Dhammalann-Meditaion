
import React, { useMemo } from 'react';
import { Share, PlusSquare, CheckCircle2 } from 'lucide-react';

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
              <Share className="w-8 h-8 text-[#B8860B]" />
            ) : (
              <svg className="w-8 h-8 text-[#B8860B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            )}
          </div>
          <h3 id="install-modal-title" className="text-xl font-bold gold-text mb-4">
            {isIos ? 'iPhone တွင် Install ပြုလုပ်ရန်' : (t.androidInstallTitle || 'Install App')}
          </h3>
          <div className="text-white/80 text-sm leading-relaxed mb-8">
            {isIos ? (
              <div className="space-y-6 text-left">
                <div className="space-y-4 bg-white/5 p-5 rounded-3xl border border-white/10 backdrop-blur-md">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <Share className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <p className="text-sm leading-snug">
                      ၁။ Safari Browser ၏ အောက်ခြေရှိ <span className="text-[#D4AF37] font-bold">Share</span> ခလုတ် (📤) ကို နှိပ်ပါ။
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <PlusSquare className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <p className="text-sm leading-snug">
                      ၂။ အောက်သို့ ဆွဲချပြီး <span className="text-[#D4AF37] font-bold">'Add to Home Screen'</span> (➕) ကို ရွေးချယ်ပါ။
                    </p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <p className="text-sm leading-snug">
                      ၃။ အပေါ်ထောင့်ရှိ <span className="text-[#D4AF37] font-bold">'Add'</span> ကို နှိပ်လိုက်ပါက App အဖြစ် အသုံးပြုနိုင်ပါပြီ။
                    </p>
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
