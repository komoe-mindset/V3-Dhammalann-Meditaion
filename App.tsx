
import PocketBase from 'pocketbase';
import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioGuide } from './types';
import { meditationItems } from './data/meditationData';
import logoUrl from './public/icon.svg';
import AudioCard from './components/AudioCard';
import BottomNavDock from './components/BottomNavDock';
import AudioListContainer from './components/AudioListContainer';
import UpNextCard from './components/UpNextCard';
import StickyMiniPlayer from './components/StickyMiniPlayer';
import GlobalOfflineBanner from './components/GlobalOfflineBanner';
import UpdateNotification from './components/UpdateNotification';

import { AudioProvider, useAudio } from './src/context/AudioContext';
import { useStorageManager } from './src/hooks/useStorageManager';

// Initialize PocketBase
const pb = new PocketBase('https://api.mindset-it.online');

// Lazy load non-critical components
const ExplanationModal = lazy(() => import('./components/ExplanationModal'));
const InstallModal = lazy(() => import('./components/InstallModal'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ActionModal = lazy(() => import('./components/ActionModal'));
const ShareModal = lazy(() => import('./components/ShareModal'));

/**
 * AUDIO LINK SYSTEM
 * The app now automatically fetches links from your PocketBase backend!
 */
const STORAGE_KEY = 'mindful_project_v3';
const LANG_KEY = 'mindfulness_lang_pref';
const PATRON_WEBSITE_URL = "https://drsoelwin.dhammalann.org/";
const AUDIO_SUMMARY_URL = "https://library.dhammalann.org/";
const NOTEBOOK_LM_URL = "https://notebooklm.google.com/notebook/5c693072-7f7a-40a2-84da-8060c1213a8d";

// Stabilize todayDate outside the component to ensure memoized callbacks remain stable
const todayDate = new Date().toISOString().split('T')[0];

type Language = 'my' | 'en';

const AppContent: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem(LANG_KEY) as Language) || 'my');
  const [audioGuides, setAudioGuides] = useState<AudioGuide[]>(meditationItems);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioGuide | null>(null);
  const [actionAudio, setActionAudio] = useState<AudioGuide | null>(null);
  const { activeRecord, stopAudio, playAudio: contextPlayAudio, setMeditations } = useAudio();
  const { storageEstimate, formatBytes } = useStorageManager();
  const [isLoading, setIsLoading] = useState(true);
  const itemRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  
  const [hasScrolled, setHasScrolled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosModal, setShowIosModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const fetchPocketbaseData = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await pb.collection('meditations').getFullList({
        sort: '+day_number',
      });

      if (records.length > 0) {
        setAudioGuides(prev => prev.map(guide => {
          const record = records.find(r => r.day_number === guide.id);
          if (!record) return guide;

          const url = pb.files.getUrl(record, record.audio_file);
          return {
            ...guide,
            day_number: record.day_number,
            title: record.title,
            fileName: record.title,
            explanation: record.title,
            date: record.date_string || guide.date,
            audioUrl: url,
            downloadUrl: url,
            transcript: record.transcript,
            // isCompleted is preserved from prev state
          };
        }));
      }
    } catch (error) {
      console.error("Error fetching PocketBase data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const firstUncompletedId = useMemo(() => audioGuides.find(g => !g.isCompleted)?.id, [audioGuides]);
  const nextAudio = useMemo(() => audioGuides.find(g => !g.isCompleted), [audioGuides]);
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (const guide of audioGuides) {
      if (guide.isCompleted) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [audioGuides]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(!!isStandaloneMode);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    checkStandalone();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    fetchPocketbaseData();
  }, [fetchPocketbaseData]);

  useEffect(() => {
    if (actionAudio) {
      const updated = audioGuides.find(g => g.id === actionAudio.id);
      if (updated && updated !== actionAudio) {
        setActionAudio(updated);
      }
    }
    if (selectedAudio) {
      const updated = audioGuides.find(g => g.id === selectedAudio.id);
      if (updated && updated !== selectedAudio) {
        setSelectedAudio(updated);
      }
    }
  }, [audioGuides, actionAudio, selectedAudio]);

  useEffect(() => {
    setMeditations(audioGuides);
  }, [audioGuides, setMeditations]);

  useEffect(() => {
    if (!hasScrolled && audioGuides.length > 0 && firstUncompletedId && !selectedAudio && !actionAudio) {
      // Only scroll if it's not the first day to avoid unnecessary movement on fresh start
      if (firstUncompletedId > 1) {
        const timer = setTimeout(() => {
          // Double check conditions inside timeout to prevent jump if user interacted
          if (hasScrolled || selectedAudio || actionAudio) return;
          
          const element = itemRefs.current.get(firstUncompletedId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHasScrolled(true);
          }
        }, 1000); // Increased delay to 1s for smoother initial load
        return () => clearTimeout(timer);
      } else {
        setHasScrolled(true);
      }
    }
  }, [audioGuides, firstUncompletedId, hasScrolled, selectedAudio, actionAudio]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayNum = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const month = months[date.getMonth()];
    const dayName = days[date.getDay()];
    return `${dayName}, ${dayNum} ${month}`;
  }, []);

  const loadInitialData = useCallback(async () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === todayDate) {
        setAudioGuides(parsed.audioGuides || meditationItems);
      }
    }
  }, [todayDate]);
  const saveAndSync = useCallback(async (updatedAudio: AudioGuide[]) => {
    const stateToSave = { date: todayDate, audioGuides: updatedAudio };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [todayDate]);

  const toggleAudio = useCallback((id: number) => {
    setAudioGuides(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, isCompleted: !a.isCompleted } : a);
      saveAndSync(updated);
      return updated;
    });
  }, [saveAndSync]);

  const playAudio = useCallback((guide: AudioGuide) => {
    setSelectedAudio(guide);
  }, []);

  const listenNow = useCallback((guide: AudioGuide) => {
    if (guide.audioUrl) {
      contextPlayAudio(guide);
      setSelectedAudio(null);
    }
  }, [contextPlayAudio]);

  const t = useMemo(() => ({
    titleEn: "Dhammalann Meditation",
    audioTitle: lang === 'my' ? "တရားတော်များ နာယူရန်" : "Audio Sanctuary",
    audioSubtitle: lang === 'my' ? "တစ်နှစ်တာ နေ့စဉ် နာယူရန်" : "365 Days Journey",
    googleSheet: lang === 'my' ? "Google Sheet ကြည့်ရန်" : "View Google Sheet",
    fullLibrary: lang === 'my' ? "တရားတော်များအားလုံး" : "Full Audio Library",
    completed: lang === 'my' ? "ပြီး" : "Done",
    play: lang === 'my' ? "နာယူရန်" : "Play",
    dayLabel: lang === 'my' ? "နေ့ရက်" : "Day",
    listenNow: lang === 'my' ? "ယခုနာယူရန်" : "Listen Now",
    explanation: lang === 'my' ? "ရှင်းလင်းချက်" : "Explanation",
    download: lang === 'my' ? "ဒေါင်းလုဒ်လုပ်ရန်" : "Download",
    close: lang === 'my' ? "ပိတ်ရန်" : "Close",
    patronInfo: lang === 'my' ? "ဝိသုဒ္ဓိမဂ်ဓမ္မလမ်းဝိပဿနာအဖွဲ့များ၏ ဦးဆောင်နာယက၊ မဟာသဒ္ဓမ္မဇောတိကဓဇ ဆရာကြီးဒေါက်တာစိုးလွင်(မန္တလေး)" : "Patron of Visuddhimag Dhammalann Vipassana Organizations, Mahasaddhamajawtikadaja Dr. Soe Lwin (Mandalay)",
    visitWebsite: lang === 'my' ? "ကိုယ်ရေးအကျဉ်း ကြည့်ရန်" : "Visit Biography Website",
    audioSummary: lang === 'my' ? "တရားတော်များ အနှစ်ချုပ်" : "Audio Summary",
    notebookLM: "NotebookLM",
    installApp: lang === 'my' ? "App ထည့်သွင်းရန်" : "Install App",
    iosInstallTitle: lang === 'my' ? "App ထည့်သွင်းနည်း" : "How to Install",
    androidInstallTitle: lang === 'my' ? "App ထည့်သွင်းရန်" : "Install App",
    iosInstallDesc: lang === 'my' ? "App ထည့်သွင်းရန်: သင့်ဖုန်း၏ Share icon ကိုနှိပ်ပြီး 'Add to Home Screen' ကိုရွေးချယ်ပါ။" : "To install: Tap the Share icon at the bottom of your screen, then select 'Add to Home Screen'.",
    androidInstallDesc: lang === 'my' ? "App ထည့်သွင်းရန်: ဘရောက်ဇာမီနူး (အစက်သုံးစက်) ကိုနှိပ်ပြီး 'Install app' သို့မဟုတ် 'Add to Home screen' ကိုရွေးချယ်ပါ။" : "To install: Tap the browser menu (three dots) at the top right, then select 'Install app' or 'Add to Home screen'.",
    upNext: lang === 'my' ? "နောက်ထပ် နာယူရန်" : "Up Next",
    continueJourney: lang === 'my' ? "ဓမ္မလမ်း ကိုလျှောက်ကြမယ်" : "Let's walk the Dhammalann path",
    streakLabel: lang === 'my' ? "ရက်ဆက်တိုက်" : "Day Streak",
    submit: lang === 'my' ? "အတည်ပြုရန်" : "Submit",
    share: lang === 'my' ? "မျှဝေရန်" : "Share",
    shareViaApps: lang === 'my' ? "အက်ပ်များမှတစ်ဆင့် မျှဝေရန်" : "Share via Apps",
    copyLink: lang === 'my' ? "လင့်ခ်ကို ကူးယူရန်" : "Copy Link",
    copied: lang === 'my' ? "ကူးယူပြီးပါပြီ" : "Copied!",
    downloadOptions: lang === 'my' ? "ဒေါင်းလုဒ် ရွေးချယ်စရာများ" : "Download Options",
    mp3File: lang === 'my' ? "MP3 အသံဖိုင်" : "MP3 Audio File",
    htmlFile: lang === 'my' ? "စာသားဖိုင် (HTML)" : "HTML Transcript",
    bothFiles: lang === 'my' ? "ဖိုင်နှစ်မျိုးလုံး" : "Both Files",
    mp3Desc: lang === 'my' ? "အသံဖိုင်သာ" : "Download only the audio",
    htmlDesc: lang === 'my' ? "စာသားဖိုင်သာ" : "Download the text version",
    bothDesc: lang === 'my' ? "အသံနှင့် စာသား" : "MP3 + HTML Transcript",
    saveToDevice: lang === 'my' ? "စက်ထဲသိမ်းရန်" : "Save to Device",
    readAudioBook: lang === 'my' ? "စာအုပ်ဖတ်ရန်" : "Read Audio Book",
    availableOffline: lang === 'my' ? "အော့ဖ်လိုင်း နာယူရန်" : "Available Offline",
    downloadForOffline: lang === 'my' ? "အော့ဖ်လိုင်း နာယူရန်" : "Download for Offline",
    audioUnavailable: lang === 'my' ? "တရားတော် မရရှိနိုင်သေးပါ" : "Audio Unavailable"
  }), [lang]);

  const handleAdminClick = useCallback(() => {
    setShowAdminDashboard(true);
  }, []);

  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const handleAdminClose = useCallback(() => {
    setShowAdminDashboard(false);
    fetchPocketbaseData();
  }, [fetchPocketbaseData]);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(userAgent);
      if (isIos) {
        setShowIosModal(true);
      } else {
        setShowAndroidModal(true);
      }
    }
  }, [deferredPrompt]);

  const animationProps = useMemo(() => {
    if (isMobile) return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 }
    };
    return {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, ease: "easeOut" as const }
    };
  }, [isMobile]);

  return (
    <main 
      id="main-content" 
      className={`max-w-2xl mx-auto px-4 py-4 md:py-12 relative transition-all duration-300 ${
        activeRecord ? 'pb-48' : 'pb-24'
      } ${lang === 'my' ? 'lang-my' : ''}`}
    >
      <GlobalOfflineBanner />
      <UpdateNotification />
      <motion.header 
        className="text-center mb-6 md:mb-16 relative pt-4 md:pt-12"
        {...animationProps}
      >
        {/* Share Button (Top Right) */}
        <div className="absolute top-4 right-0 md:top-12">
          <button
            onClick={handleShare}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-[#D4AF37] border border-[#D4AF37]/20 transition-all active:scale-90"
            aria-label="Share this app"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="block mx-auto transition-transform active:scale-95 group"
          aria-label="Go to home"
        >
          <img 
            src={logoUrl} 
            alt="Dhammalann Logo" 
            className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 drop-shadow-2xl rounded-2xl group-hover:ring-2 ring-[#D4AF37]/30 transition-all"
            fetchPriority="high"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </button>
        <h1 className="font-bold mb-2 text-balance break-keep text-2xl md:text-4xl leading-tight">
          {t.titleEn}
        </h1>
        <div className="h-0.5 w-10 bg-[#B8860B] mx-auto rounded-full opacity-30" aria-hidden="true"></div>
      </motion.header>

      <UpNextCard 
        nextAudio={nextAudio}
        currentStreak={currentStreak}
        t={t}
        lang={lang}
      />

      {/* Audio Section - PRIMARY FOCUS */}
      <motion.section 
        className="glass-card rounded-[2.5rem] p-6 md:p-10 mb-8 text-white shadow-2xl relative overflow-hidden border-2 border-[#D4AF37]/30"
        {...animationProps}
        transition={{ ...animationProps.transition, delay: 0.1 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16" aria-hidden="true"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className={lang === 'my' ? 'leading-relaxed' : ''}>
              <h2 className="text-xl font-bold gold-text">{t.audioTitle}</h2>
              <p className="text-teal-100/70 text-xs italic">{t.audioSubtitle}</p>
            </div>
          </div>
          <AudioListContainer 
            audioGuides={audioGuides}
            onToggleDone={toggleAudio}
            onOpenAction={(guide) => setActionAudio(guide)}
            firstUncompletedId={firstUncompletedId}
            t={t}
            lang={lang}
            itemRefs={itemRefs}
            isLoading={isLoading}
          />
        </div>
      </motion.section>

      {/* Patron Information Section */}
      <motion.section 
        className="mb-12"
        {...animationProps}
        transition={{ ...animationProps.transition, delay: 0.2 }}
      >
        <div className="glass-card rounded-[2rem] p-8 border-l-4 border-[#D4AF37] shadow-2xl flex flex-col items-center text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full -mr-12 -mt-12"></div>
          <div className="space-y-2 relative z-10">
            <h2 className="text-[10px] font-bold gold-text uppercase tracking-[0.2em]">Our Spiritual Patron</h2>
            <p className={`text-white font-serif italic leading-relaxed md:text-lg ${lang === 'my' ? 'text-base' : 'text-sm'}`}>
              {t.patronInfo}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 relative z-10">
            <a 
              href={PATRON_WEBSITE_URL} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#B8860B] text-white rounded-2xl text-xs font-bold shadow-lg hover:bg-[#9a700a] transition-all active-scale border border-[#FCF6BA]/30"
            >
              {t.visitWebsite}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
            <a 
              href={AUDIO_SUMMARY_URL} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white/80 rounded-2xl text-xs font-bold shadow-lg hover:bg-white/10 transition-all active-scale border border-white/10"
            >
              {t.audioSummary}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </a>
            <a 
              href={NOTEBOOK_LM_URL} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white/80 rounded-2xl text-xs font-bold shadow-lg hover:bg-white/10 transition-all active-scale border border-white/10"
            >
              {t.notebookLM}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" /></svg>
            </a>
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-teal-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-[200] font-bold text-xs" 
            role="status"
            aria-live="polite"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={
        <div className="fixed inset-0 flex items-center justify-center z-[300] bg-[#051a12]/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(212,175,55,0.3)]"></div>
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Loading Hub...</p>
          </div>
        </div>
      }>
        {/* Admin Dashboard */}
        {showAdminDashboard && (
          <AdminDashboard onClose={handleAdminClose} />
        )}

        {/* Explanation Modal */}
        {selectedAudio && (
          <ExplanationModal 
            selectedAudio={selectedAudio}
            lang={lang}
            t={t}
            onClose={() => setSelectedAudio(null)}
            onListenNow={listenNow}
          />
        )}

        {/* Action Modal */}
        {actionAudio && (
          <ActionModal 
            guide={actionAudio}
            t={t}
            onClose={() => setActionAudio(null)}
            onPlay={listenNow}
          />
        )}

        {/* iOS Install Modal */}
        {showIosModal && (
          <InstallModal 
            type="ios"
            t={t}
            onClose={() => setShowIosModal(false)}
          />
        )}

        {/* Android Install Modal */}
        {showAndroidModal && (
          <InstallModal 
            type="android"
            t={t}
            onClose={() => setShowAndroidModal(false)}
          />
        )}

        {/* Share Modal */}
        {showShareModal && (
          <ShareModal 
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            t={t}
          />
        )}
      </Suspense>

      <StickyMiniPlayer 
        lang={lang}
      />

      <BottomNavDock 
        isStandalone={isStandalone}
        handleInstallClick={handleInstallClick}
        lang={lang}
        setLang={setLang}
        onOpenAdminDashboard={handleAdminClick}
        t={t}
      />

      <footer className="mt-12 text-center pb-8 opacity-40 border-t border-gray-200 pt-8">
        <p className="text-[10px] tracking-[0.3em] font-bold text-teal-900/60 uppercase">Dhammalann Meditation / {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  );
};

export default App;
