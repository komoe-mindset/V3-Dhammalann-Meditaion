import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ServerOff, AlertTriangle, RefreshCw, Globe, ExternalLink, ShieldAlert, VolumeX, Download, CheckCircle, X } from 'lucide-react';

interface MaintenanceNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  lang: 'my' | 'en';
  setLang: (lang: 'my' | 'en') => void;
  isRetrying?: boolean;
  serverErrorMsg?: string | null;
}

export const MaintenanceNotificationModal: React.FC<MaintenanceNotificationModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  lang,
  setLang,
  isRetrying = false,
  serverErrorMsg
}) => {
  if (!isOpen) return null;

  const isMyanmar = lang === 'my';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="maintenance-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="glass-card w-full max-w-lg p-6 sm:p-8 rounded-[2.5rem] border-2 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden my-auto"
        >
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          {/* Header Controls: Language Switcher & Close */}
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center gap-2 bg-white/5 border border-amber-500/30 rounded-full p-1">
              <button
                type="button"
                onClick={() => setLang('my')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all focus-ring ${
                  isMyanmar ? 'bg-amber-500 text-black shadow-md' : 'text-white/70 hover:text-white'
                }`}
              >
                မြန်မာ
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all focus-ring ${
                  !isMyanmar ? 'bg-amber-500 text-black shadow-md' : 'text-white/70 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all focus-ring"
              aria-label={isMyanmar ? 'အသိပေးချက် ပိတ်မည်' : 'Close Notification'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Visual Icon & Badge */}
          <div className="text-center mb-6 relative z-10">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-red-600/30 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/40 shadow-xl">
                <ServerOff className="w-10 h-10 text-amber-400 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>{isMyanmar ? 'ဆာဗာ ပြုပြင်ထိန်းသိမ်းနေပါသည်' : 'Backend Server Down / Maintenance'}</span>
            </div>

            <h2 id="maintenance-title" className="text-2xl sm:text-3xl font-bold gold-text leading-snug">
              {isMyanmar ? 'ဓမ္မလမ်း ဆာဗာ အသိပေးချက်' : 'Dhammalann Maintenance'}
            </h2>
          </div>

          {/* Main Content Details */}
          <div className="space-y-4 mb-6 relative z-10 text-left">
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-100 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{isMyanmar ? 'ဆာဗာ ပြုပြင်ထိန်းသိမ်းမှု သတိပေးချက်' : 'Server Maintenance Alert'}</span>
              </div>
              
              <p className={`leading-relaxed text-xs sm:text-sm text-amber-100/90 ${isMyanmar ? 'font-myanmar' : ''}`}>
                {isMyanmar ? (
                  <>
                    လက်ရှိတွင် မူရင်း <strong>Backend ဆာဗာ ပြုပြင်ထိန်းသိမ်းမှု (Maintenance)</strong> ပြုလုပ်နေပါသဖြင့် အက်ပ်အတွင်း အွန်လိုင်းမှ တရားတော်များ တိုက်ရိုက် နာယူရန် ခေတ္တ မရရှိနိုင်ပါ။
                  </>
                ) : (
                  <>
                    The <strong>Backend Server is down for maintenance</strong>. Direct online streaming of Dhamma audio inside the app is temporarily unavailable.
                  </>
                )}
              </p>

              <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/20 text-amber-200/90 text-xs space-y-2.5">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <VolumeX className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isMyanmar ? 'အသံဖိုင် နာယူနိုင်မှု အခြေအနေ:' : 'Audio Availability Notice:'}</span>
                </p>
                <ul className={`list-disc list-inside space-y-1.5 text-white/80 ${isMyanmar ? 'font-myanmar' : ''}`}>
                  <li>
                    {isMyanmar 
                      ? 'ဆာဗာ ပြုပြင်ထိန်းသိမ်းနေချိန်တွင် အက်ပ်အတွင်း တရားတော်များ တိုက်ရိုက် နာယူခြင်းနှင့် MP3 ဒေါင်းလုဒ် ရယူခြင်းများကို ခေတ္တ ပြုလုပ်နိုင်မည် မဟုတ်ပါ။'
                      : 'Online streaming and MP3 file downloads inside the app are temporarily unavailable while the server is down.'}
                  </li>
                  <li>
                    {isMyanmar
                      ? 'ဖုန်း/စက်ထဲသို့ စက်တွင်း သိမ်းဆည်းထားပြီးဖြစ်သော MP3 တရားတော်များကို Media Player ဖြင့် မခက်ခဲဘဲ ဆက်လက် နာယူနိုင်ပါသည်။'
                      : 'Previously saved MP3 files on your device can still be played using your local media player.'}
                  </li>
                  <li>
                    {isMyanmar
                      ? 'ဆရာကြီးဒေါက်တာစိုးလွင်၏ ဝဘ်ဆိုက် (drsoelwin.dhammalann.org) သို့ သွားရောက်၍လည်း တရားတော်များ လေ့လာနိုင်ပါသည်။'
                      : 'You can also visit Dr. Soe Lwin official website (drsoelwin.dhammalann.org) for audio and biography resources.'}
                  </li>
                  <li>
                    {isMyanmar
                      ? 'ဆာဗာ ပြုပြင်ထိန်းသိမ်းမှု ပြီးစီးပါက ပုံမှန်အတိုင်း အွန်လိုင်းမှ တိုက်ရိုက် နာယူနိုင်မည် ဖြစ်ပါသည်။'
                      : 'Online playback and services will automatically resume as soon as maintenance is complete.'}
                  </li>
                </ul>
              </div>
            </div>

            {serverErrorMsg && (
              <p className="text-[11px] text-red-300/70 italic text-center font-mono bg-black/30 p-2 rounded-lg border border-red-500/20">
                System Status Log: {serverErrorMsg}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 relative z-10">
            {/* Retry Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-[#D4AF37] text-black font-bold shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 focus-ring"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>
                {isRetrying 
                  ? (isMyanmar ? 'ဆာဗာ ပြန်လည် စစ်ဆေးနေသည်...' : 'Checking Server...') 
                  : (isMyanmar ? 'ဆာဗာ ပြန်လည် ချိတ်ဆက်ကြည့်မည်' : 'Retry Server Connection')}
              </span>
            </motion.button>

            {/* Continue to App Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full py-3.5 px-5 rounded-2xl bg-white/10 text-white font-bold border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2 focus-ring"
            >
              <span>{isMyanmar ? 'အက်ပ်သို့ ဆက်သွားမည် (အော့ဖ်လိုင်း မုဒ်)' : 'Continue to App (Offline Mode)'}</span>
            </motion.button>

            {/* External Biography / Library */}
            <a
              href="https://drsoelwin.dhammalann.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-5 rounded-2xl bg-white/5 text-white/70 hover:text-white text-xs font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2 focus-ring"
            >
              <Globe className="w-4 h-4 text-amber-400" />
              <span>{isMyanmar ? 'ဆရာကြီးဒေါက်တာစိုးလွင် ဝဘ်ဆိုက်သို့ သွားရန်' : 'Visit Dr. Soe Lwin Biography Website'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/40" />
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MaintenanceNotificationModal;
