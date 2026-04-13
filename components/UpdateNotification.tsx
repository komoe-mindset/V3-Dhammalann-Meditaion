import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X } from 'lucide-react';

const UpdateNotification: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered');
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 z-[1000]"
        >
          <div className="glass-card p-4 rounded-2xl border border-[#D4AF37]/30 shadow-2xl bg-[#051a12]/95 backdrop-blur-xl flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center shrink-0">
                  <RefreshCw className={`w-5 h-5 text-[#D4AF37] ${needRefresh ? 'animate-spin-slow' : ''}`} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {needRefresh ? 'Update Available!' : 'Ready for Offline!'}
                  </h4>
                  <p className="text-xs text-white/60 mt-1">
                    {needRefresh 
                      ? 'A new version of Dhammalann is ready.' 
                      : 'App is cached and ready to work offline.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={close}
                className="p-1 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="w-full py-3 bg-[#D4AF37] text-black rounded-xl font-bold text-xs transition-all active:scale-95 hover:bg-[#B8860B] shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh Now
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNotification;
