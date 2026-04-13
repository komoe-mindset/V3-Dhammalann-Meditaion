import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff } from 'lucide-react';

const GlobalOfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] pt-[env(safe-area-inset-top)] pointer-events-none"
        >
          <div className="flex justify-center p-2">
            <div 
              role="alert"
              aria-live="assertive"
              className="bg-red-500/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 border border-red-400/50 pointer-events-auto"
            >
              <WifiOff className="w-3 h-3 animate-pulse" />
              <span className="uppercase tracking-wider">Offline Mode</span>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalOfflineBanner;
