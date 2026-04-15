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
      {needRefresh && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[1000]"
        >
          <div className="glass-card p-5 rounded-[2rem] border-2 border-[#D4AF37] shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#051a12] backdrop-blur-2xl flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                <RefreshCw className="w-6 h-6 text-[#D4AF37] animate-spin-slow" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-[#D4AF37] leading-tight">
                  App ဗားရှင်းအသစ် ရရှိနေပါပြီ
                </h4>
                <p className="text-xs text-white/70 mt-1">
                  ပိုမိုကောင်းမွန်သော လုပ်ဆောင်ချက်များ ရရှိရန်အတွက် ယခုပင် Update ပြုလုပ်လိုက်ပါ။
                </p>
              </div>
              <button 
                onClick={close}
                className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => updateServiceWorker(true)}
              className="w-full py-4 bg-[#D4AF37] text-black rounded-2xl font-bold text-sm transition-all active:scale-95 hover:bg-[#B8860B] shadow-[0_10px_20px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 border border-[#FCF6BA]/50"
            >
              <RefreshCw className="w-4 h-4" />
              Update Now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNotification;
