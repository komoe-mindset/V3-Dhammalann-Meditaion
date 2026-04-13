import React, { useState, useEffect } from 'react';

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
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[90] w-full max-w-md px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]" aria-label="Bottom navigation menu">
      <div className="glass-card rounded-full p-2 border-2 border-[#D4AF37]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-2 backdrop-blur-xl bg-black/40 relative">
        
        {!isStandalone && (
          <button 
            onClick={handleInstallClick}
            className="flex-1 bg-white/5 hover:bg-white/10 p-2 min-w-[48px] min-h-[48px] rounded-full flex flex-col items-center justify-center gap-1 transition-all active:scale-90 border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#051a12]"
            title={t.installApp}
            aria-label={t.installApp}
          >
            <svg className="w-5 h-5 text-[#B8860B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span className="text-xs font-bold text-white/60 uppercase tracking-tighter" aria-hidden="true">Install</span>
          </button>
        )}
        
        <button 
          onClick={() => setLang(lang === 'my' ? 'en' : 'my')} 
          className="flex-1 bg-white/5 hover:bg-white/10 p-2 min-w-[48px] min-h-[48px] rounded-full flex flex-col items-center justify-center gap-1 transition-all active:scale-90 border border-white/10 relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#051a12]"
          title={lang === 'my' ? "Switch to English" : "မြန်မာဘာသာသို့ ပြောင်းရန်"}
          aria-label={lang === 'my' ? "Switch to English language" : "မြန်မာဘာသာသို့ ပြောင်းရန်"}
        >
          <div className="relative" aria-hidden="true">
            <svg className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B8860B] text-[8px] font-bold text-white ring-1 ring-black/50">
              {lang === 'my' ? 'MY' : 'EN'}
            </span>
          </div>
          <span className="text-xs font-bold text-white/60 uppercase tracking-tighter" aria-hidden="true">Language</span>
        </button>

        <button 
          onClick={onOpenAdminDashboard} 
          className="flex-1 p-2 min-w-[48px] min-h-[48px] rounded-full flex flex-col items-center justify-center gap-1 transition-all active:scale-90 border bg-white/5 border-white/10 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#051a12]"
          title="Open Admin Dashboard"
          aria-label="Open Admin Dashboard"
        >
          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-tighter text-white/60" aria-hidden="true">Admin</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavDock;
