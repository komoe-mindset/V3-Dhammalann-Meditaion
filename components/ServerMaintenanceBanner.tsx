import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ServerOff, AlertTriangle, RefreshCw } from 'lucide-react';

interface ServerMaintenanceBannerProps {
  isServerDown: boolean;
  onOpenNotice: () => void;
  onRetry: () => void;
  lang: 'my' | 'en';
}

export const ServerMaintenanceBanner: React.FC<ServerMaintenanceBannerProps> = ({
  isServerDown,
  onOpenNotice,
  onRetry,
  lang,
}) => {
  if (!isServerDown) return null;

  const isMyanmar = lang === 'my';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[150] pt-[env(safe-area-inset-top)]"
      >
        <div className="bg-gradient-to-r from-amber-950/95 via-red-950/95 to-amber-950/95 backdrop-blur-md text-amber-100 border-b border-amber-500/40 shadow-xl px-4 py-2.5">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <ServerOff className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="font-medium truncate">
                <span className="font-bold text-amber-300">
                  {isMyanmar ? 'ဆာဗာ ပြုပြင်ထိန်းသိမ်းဆဲ:' : 'Server Maintenance:'}
                </span>{' '}
                {isMyanmar 
                  ? 'အွန်လိုင်းမှ တရားတော် နာယူခြင်းနှင့် MP3 ဒေါင်းလုဒ် ရယူခြင်းများ ခေတ္တ မရရှိနိုင်သေးပါ။' 
                  : 'Online streaming and MP3 downloads are temporarily down for maintenance.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenNotice}
                className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-full font-bold text-[11px] transition-all focus-ring whitespace-nowrap"
              >
                {isMyanmar ? 'အသေးစိတ်' : 'Notice'}
              </button>
              <button
                type="button"
                onClick={onRetry}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all focus-ring"
                title={isMyanmar ? 'ပြန်လည် စစ်ဆေးမည်' : 'Retry'}
                aria-label={isMyanmar ? 'ဆာဗာ ပြန်လည် စစ်ဆေးမည်' : 'Retry server connection'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ServerMaintenanceBanner;
