import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Download, Globe, Shield, X } from 'lucide-react';

interface BottomNavDockProps {
  isStandalone: boolean;
  handleInstallClick: () => void;
  lang: 'my' | 'en';
  setLang: (lang: 'my' | 'en') => void;
  onOpenAdminDashboard: () => void;
  t: any;
}

const BottomNavDock: React.FC<BottomNavDockProps> = ({
  isStandalone,
  handleInstallClick,
  lang,
  setLang,
  onOpenAdminDashboard,
  t,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <nav className="fixed bottom-6 right-6 z-[100]" ref={menuRef} role="navigation" aria-label="Main Navigation Menu">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 mb-2 flex flex-col gap-3 items-end"
          >
            {/* Admin Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onOpenAdminDashboard();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 glass-card rounded-2xl border border-[#D4AF37]/30 text-white shadow-xl whitespace-nowrap bg-[#051a12]/70 backdrop-blur-xl"
              aria-label="Open Admin Dashboard"
            >
              <span className="text-xs font-bold uppercase tracking-wider">Admin</span>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <Shield className="w-5 h-5 text-[#D4AF37]" aria-hidden="true" />
              </div>
            </motion.button>

            {/* Language Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setLang(lang === 'my' ? 'en' : 'my');
                // Don't close menu automatically so user can see the change
              }}
              className="flex items-center gap-3 px-4 py-3 glass-card rounded-2xl border border-[#D4AF37]/30 text-white shadow-xl whitespace-nowrap bg-[#051a12]/70 backdrop-blur-xl"
              aria-label={lang === 'my' ? 'Switch to English' : 'မြန်မာဘာသာသို့ ပြောင်းရန်'}
            >
              <span className="text-xs font-bold uppercase tracking-wider">
                {lang === 'my' ? 'English' : 'မြန်မာဘာသာ'}
              </span>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 relative">
                <Globe className="w-5 h-5 text-[#D4AF37]" aria-hidden="true" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B8860B] text-[8px] font-bold text-white ring-1 ring-black/50">
                  {lang === 'my' ? 'MY' : 'EN'}
                </span>
              </div>
            </motion.button>

            {/* Install Button (Only if not standalone) */}
            {!isStandalone && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  handleInstallClick();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 glass-card rounded-2xl border border-[#D4AF37]/30 text-white shadow-xl whitespace-nowrap bg-[#051a12]/70 backdrop-blur-xl"
                aria-label={t.installApp}
              >
                <span className="text-xs font-bold uppercase tracking-wider">{t.installApp}</span>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Download className="w-5 h-5 text-[#D4AF37]" aria-hidden="true" />
                </div>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all border-2 ${
          isOpen 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-gradient-to-br from-[#B8860B] to-[#D4AF37] border-[#D4AF37]/50 text-black'
        }`}
        aria-label={isOpen ? "Close Settings Menu" : "Open Settings Menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6" aria-hidden="true" />
        ) : (
          <Settings className="w-6 h-6 animate-spin-slow" aria-hidden="true" />
        )}
      </motion.button>
    </nav>
  );
};

export default BottomNavDock;
