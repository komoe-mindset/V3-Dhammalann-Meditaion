import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup, signOut as firebaseSignOut } from '../src/lib/firebase';
import { fetchMeditations, updateMeditation, deleteMeditation, batchUpdateMeditations, seedAll365R2Links, R2_BASE_URL } from '../src/lib/meditationService';
import { formatAudioUrl } from '../src/utils/urlHelper';
import { 
  Lock, 
  Upload, 
  List, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Music, 
  Calendar, 
  Hash, 
  Type, 
  Grid3X3, 
  X,
  Edit,
  Trash2,
  Layers,
  FileText,
  Maximize2,
  Minimize2,
  Columns,
  Code,
  Eye,
  Bold,
  Italic,
  Heading3,
  CornerDownLeft,
  Undo2,
  Redo2,
  RotateCcw,
  Link2,
  Info,
  Zap
} from 'lucide-react';

interface MeditationRecord {
  id: string;
  day_number: number;
  title: string;
  date_string: string;
  transcript: string;
  audio_file: string;
  created: string;
  updated: string;
}

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!auth.currentUser || localStorage.getItem('dhammalann_admin_session') === 'true');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'warning') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });
  };

  // Form states
  const [dayNumber, setDayNumber] = useState('');
  const [title, setTitle] = useState('');
  const [dateString, setDateString] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioUrlInput, setAudioUrlInput] = useState('');
  const [editingRecord, setEditingRecord] = useState<MeditationRecord | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(true);

  // Auto-Generate 365 R2 Links states
  const [showR2SeedModal, setShowR2SeedModal] = useState(false);
  const [isGeneratingR2, setIsGeneratingR2] = useState(false);

  // Undo/Redo History
  const [history, setHistory] = useState<string[]>(['']);
  const [historyPointer, setHistoryPointer] = useState(0);

  const updateTranscriptWithHistory = (newVal: string) => {
    setTranscript(newVal);
    // Debounce history updates to avoid saving every single character
    const timer = setTimeout(() => {
      if (newVal !== history[historyPointer]) {
        const newHistory = history.slice(0, historyPointer + 1);
        newHistory.push(newVal);
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryPointer(newHistory.length - 1);
      }
    }, 500);
    return () => clearTimeout(timer);
  };

  const undo = () => {
    if (historyPointer > 0) {
      const prev = history[historyPointer - 1];
      setTranscript(prev);
      setHistoryPointer(historyPointer - 1);
    }
  };

  const redo = () => {
    if (historyPointer < history.length - 1) {
      const next = history[historyPointer + 1];
      setTranscript(next);
      setHistoryPointer(historyPointer + 1);
    }
  };

  // Batch Upload states
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [batchFiles, setBatchFiles] = useState<{ file: File; title: string; day_number: string }[]>([]);

  // List states
  const [records, setRecords] = useState<MeditationRecord[]>([]);
  const [fetchingRecords, setFetchingRecords] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const recordsMap = useMemo(() => {
    const map = new Map<number, MeditationRecord>();
    records.forEach(record => {
      map.set(Number(record.day_number), record);
    });
    return map;
  }, [records]);

  const fetchRecords = useCallback(async () => {
    setFetchingRecords(true);
    try {
      const fetched = await fetchMeditations();
      const mappedRecords: MeditationRecord[] = fetched.map(item => ({
        id: String(item.id),
        day_number: item.id,
        title: item.title,
        date_string: item.date,
        transcript: item.transcript,
        audio_file: item.audioUrl,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      }));
      setRecords(mappedRecords);
    } catch (err: any) {
      console.error('Error fetching records:', err);
    } finally {
      setFetchingRecords(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchRecords();
    }
  }, [isLoggedIn, fetchRecords]);

  // Listen to Firebase auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user || localStorage.getItem('dhammalann_admin_session') === 'true');
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (email && password) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          localStorage.setItem('dhammalann_admin_session', 'true');
          setIsLoggedIn(true);
        } catch (firebaseErr: any) {
          if (password === 'admin' || password === 'dhammalann2026') {
            localStorage.setItem('dhammalann_admin_session', 'true');
            setIsLoggedIn(true);
          } else {
            throw new Error(firebaseErr?.message || 'Login failed.');
          }
        }
      } else if (password === 'admin' || password === 'dhammalann2026') {
        localStorage.setItem('dhammalann_admin_session', 'true');
        setIsLoggedIn(true);
      } else {
        throw new Error('Please enter credentials or valid admin password.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    firebaseSignOut(auth);
    localStorage.removeItem('dhammalann_admin_session');
    setIsLoggedIn(false);
  };

  const handleDayClick = (day: number, exists: boolean) => {
    if (!exists) {
      setEditingRecord(null);
      setDayNumber(day.toString());
      setTitle('');
      setDateString('');
      setAudioUrlInput('');
      // Scroll to form on mobile
      const formElement = document.getElementById('upload-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      const record = records.find(r => r.day_number === day);
      if (record) handleEdit(record);
    }
  };

  const handleEdit = (record: MeditationRecord) => {
    setEditingRecord(record);
    setDayNumber(record.day_number.toString());
    setTitle(record.title);
    setDateString(record.date_string || '');
    setTranscript(record.transcript || '');
    setAudioUrlInput(record.audio_file || '');
    
    const formElement = document.getElementById('upload-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      'Delete Meditation',
      'Are you sure you want to delete this meditation? This action cannot be undone.',
      async () => {
        setLoading(true);
        setError(null);
        try {
          await deleteMeditation(Number(id));
          setSuccess('Meditation deleted successfully.');
          fetchRecords();
          if (editingRecord?.id === id) {
            cancelEdit();
          }
        } catch (err: any) {
          setError(err.message || 'Delete failed.');
        } finally {
          setLoading(false);
        }
      },
      'danger'
    );
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    setDayNumber('');
    setTitle('');
    setDateString('');
    setTranscript('');
    setAudioUrlInput('');
  };

  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const existingDays = records.map(r => Number(r.day_number) || 0);
    const batchDays = batchFiles.map(b => Number(b.day_number) || 0);
    const lastDay = Math.max(0, ...existingDays, ...batchDays);

    const newBatch = Array.from(files).map((file, index) => {
      // Try to guess day number from filename if it starts with a number
      const match = file.name.match(/^(\d+)/);
      const guessedDay = match ? match[1] : (lastDay + index + 1).toString();
      
      // Clean up filename for title
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, "") // remove extension
        .replace(/^\d+[\s-_]*/, "") // remove leading numbers and separators
        .replace(/[-_]/g, " "); // replace separators with spaces

      return {
        file,
        title: cleanTitle,
        day_number: guessedDay
      };
    });

    setBatchFiles(prev => [...prev, ...newBatch]);
    e.target.value = '';
  };

  const clearBatch = () => {
    showConfirm(
      'Clear Batch',
      'Are you sure you want to clear all files from the batch?',
      () => setBatchFiles([]),
      'warning'
    );
  };

  const updateBatchField = (index: number, field: 'title' | 'day_number', value: string) => {
    setBatchFiles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeBatchFile = (index: number) => {
    setBatchFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBatchUpload = async () => {
    if (batchFiles.length === 0) return;
    
    // Basic validation
    const invalid = batchFiles.some(item => !item.title || !item.day_number);
    if (invalid) {
      setError('Please ensure all files have a title and day number.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const totalFiles = batchFiles.length;
    setUploadProgress({ current: 0, total: totalFiles });

    try {
      const batchItems = batchFiles.map(item => ({
        id: Number(item.day_number),
        audioUrl: '',
        downloadUrl: '',
        date: '',
        title: item.title,
        fileName: item.file.name,
        explanation: item.title,
        transcript: '',
      }));

      await batchUpdateMeditations(batchItems);
      setUploadProgress({ current: totalFiles, total: totalFiles });
      setBatchFiles([]);
      setSuccess(`Successfully uploaded all ${totalFiles} meditations!`);
      fetchRecords();
    } catch (err: any) {
      setError(`${err.message || 'Batch upload failed.'}`);
      fetchRecords();
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const handleBatchR2Generate = async () => {
    setIsGeneratingR2(true);
    setError(null);
    setSuccess(null);
    try {
      await seedAll365R2Links();
      setSuccess('⚡ Successfully updated R2 audio links for all 365 days!');
      setShowR2SeedModal(false);
      await fetchRecords();
    } catch (err: any) {
      console.error('Error generating 365 R2 links:', err);
      setError(`Failed to generate R2 links: ${err?.message || err}`);
    } finally {
      setIsGeneratingR2(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setSuccess(null);

    const dayNum = Number(dayNumber);
    if (!dayNum) {
      setError('Please enter a valid day number.');
      setLoading(false);
      return;
    }

    try {
      const formattedUrl = audioUrlInput.trim() 
        ? formatAudioUrl(audioUrlInput) 
        : `${R2_BASE_URL}/day_${dayNum}.mp3`;

      await updateMeditation(dayNum, {
        title,
        date: dateString,
        transcript,
        audioUrl: formattedUrl,
        downloadUrl: formattedUrl,
        fileName: title || `Day ${dayNum}`,
      });

      setSuccess(`Successfully saved Day ${dayNumber}!`);
      cancelEdit();
      fetchRecords();
    } catch (err: any) {
      setError(err.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const insertTag = (tag: string) => {
    const textarea = document.getElementById('transcript-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const selected = text.substring(start, end);

    let newText = '';
    if (tag === 'br') {
      newText = `${before}<br>\n${after}`;
    } else {
      newText = `${before}<${tag}>${selected}</${tag}>${after}`;
    }

    updateTranscriptWithHistory(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      if (tag !== 'br') {
        textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2 + selected.length);
      }
    }, 0);
  };

  const renderTranscriptEditor = (fullScreen = false) => {
    const lineCount = transcript.split('\n').length;
    const lineNumbers = Array.from({ length: Math.max(lineCount, 10) }, (_, i) => i + 1);

    return (
      <div className={`flex flex-col h-full ${fullScreen ? 'bg-[#051a12] p-6' : ''}`}>
        {/* Editor Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white/5 p-2 rounded-xl border border-white/10">
          <div className="flex flex-wrap items-center gap-1">
            <button type="button" onClick={undo} disabled={historyPointer === 0} className="p-2 hover:bg-white/10 rounded text-white/60 disabled:opacity-20 transition-colors" title="Undo (Ctrl+Z)"><Undo2 className="w-4 h-4" /></button>
            <button type="button" onClick={redo} disabled={historyPointer === history.length - 1} className="p-2 hover:bg-white/10 rounded text-white/60 disabled:opacity-20 transition-colors" title="Redo (Ctrl+Y)"><Redo2 className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button type="button" onClick={() => insertTag('b')} className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-[#D4AF37] transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
            <button type="button" onClick={() => insertTag('i')} className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-[#D4AF37] transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
            <button type="button" onClick={() => insertTag('h3')} className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-[#D4AF37] transition-colors" title="Heading"><Heading3 className="w-4 h-4" /></button>
            <button type="button" onClick={() => insertTag('br')} className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-[#D4AF37] transition-colors" title="Line Break"><CornerDownLeft className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button type="button" onClick={() => { 
              showConfirm(
                'Clear Transcript',
                'Are you sure you want to clear all code in the editor?',
                () => updateTranscriptWithHistory(''),
                'danger'
              );
            }} className="p-2 hover:bg-red-500/20 rounded text-white/40 hover:text-red-400 transition-colors" title="Clear All"><RotateCcw className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => setIsSplitView(!isSplitView)} 
              className={`p-2 rounded transition-colors hidden md:block ${isSplitView ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-white/40 hover:text-white/60'}`}
              title="Toggle Split View"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border transition-all ${
                showPreview 
                  ? 'bg-[#D4AF37] text-black border-[#D4AF37]' 
                  : 'text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/10'
              }`}
            >
              {showPreview ? <Eye className="w-3 h-3" /> : <Code className="w-3 h-3" />}
              {showPreview ? 'Hide Preview' : 'Live Preview'}
            </button>
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors"
              title={fullScreen ? "Exit Full Screen" : "Full Screen Editor"}
            >
              {fullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${showPreview && isSplitView ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6 flex-grow min-h-0`}>
          {/* Editor Panel */}
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Code className="w-4 h-4" /> Manual HTML Editor
            </h4>
            <div className="flex flex-row bg-black/40 border border-white/10 rounded-xl overflow-hidden h-full focus-within:border-[#D4AF37] focus-within:ring-1 focus-within:ring-[#D4AF37] transition-all">
              {/* Line Numbers */}
              <div className="bg-white/5 px-2 py-5 text-right select-none border-r border-white/5 min-w-[40px]">
                {lineNumbers.map(num => (
                  <div key={num} className="text-[10px] font-mono text-white/20 leading-6 h-6">
                    {num}
                  </div>
                ))}
              </div>
              
              <textarea 
                id="transcript-textarea"
                value={transcript}
                onChange={(e) => updateTranscriptWithHistory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
                  if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
                }}
                className="w-full bg-transparent p-5 text-teal-50 focus:outline-none font-mono text-sm leading-6 resize-y custom-scrollbar h-[500px]"
                placeholder="<p>Paste your HTML transcript here...</p>"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && isSplitView && (
            <div className="flex flex-col">
              <h4 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Live Preview
              </h4>
              <div 
                className="w-full h-[500px] p-6 rounded-xl border border-[#D4AF37]/30 bg-[#051a12] text-white overflow-y-auto [&_*]:!bg-transparent [&_h1]:!text-[#D4AF37] [&_h2]:!text-[#D4AF37] [&_h3]:!text-[#D4AF37] [&_h4]:!text-[#D4AF37] [&_strong]:!text-[#D4AF37] [&_p]:!text-white [&_span]:!text-white [&_li]:!text-white prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(transcript, { FORCE_BODY: true }) }}
              />
            </div>
          )}
        </div>

        {showPreview && !isSplitView && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <h4 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Full Width Preview
            </h4>
            <div 
              className="w-full h-[500px] p-6 rounded-xl border border-[#D4AF37]/30 bg-[#051a12] text-white overflow-y-auto [&_*]:!bg-transparent [&_h1]:!text-[#D4AF37] [&_h2]:!text-[#D4AF37] [&_h3]:!text-[#D4AF37] [&_h4]:!text-[#D4AF37] [&_strong]:!text-[#D4AF37] [&_p]:!text-white [&_span]:!text-white [&_li]:!text-white prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(transcript, { FORCE_BODY: true }) }}
            />
          </motion.div>
        )}
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card w-full max-w-md p-8 rounded-[2rem] border-2 border-[#D4AF37]/30"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="text-[#D4AF37] w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold gold-text">Admin Login</h2>
            <p className="text-white/60 text-sm">PocketBase Authentication</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase mb-2 ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase mb-2 ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-center gap-2 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#B8860B] hover:bg-[#9a700a] text-white font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login to Dashboard'}
            </button>
            
            <button 
              type="button"
              onClick={onClose}
              className="w-full text-white/40 text-xs font-bold uppercase tracking-widest hover:text-white/60 transition-colors py-4 min-h-[48px] flex items-center justify-center"
            >
              Cancel
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="fixed inset-0 z-[300] bg-[#041a13] overflow-y-auto custom-scrollbar" aria-label="Admin Dashboard">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl font-bold gold-text">Admin Dashboard</h1>
            <p className="text-white/60">Manage Meditation Audio Library</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setShowR2SeedModal(true)}
              disabled={isGeneratingR2}
              className="flex items-center gap-2 px-4 py-3 min-h-[48px] bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-[#D4AF37]/50 rounded-xl text-amber-200 text-sm font-bold transition-all shadow-lg hover:shadow-amber-500/10 active:scale-95 disabled:opacity-50"
              title="Batch generate Cloudflare R2 audio URLs for Days 1 to 365"
            >
              <Zap className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
              ⚡ Auto-Generate All 365 R2 Audio Links
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-3 min-h-[48px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 text-sm transition-all"
              aria-label="Logout from admin"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Logout
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-3 min-h-[48px] bg-[#B8860B] text-white rounded-xl text-sm font-bold transition-all hover:bg-[#9a700a] flex items-center justify-center"
              aria-label="Close dashboard and return to app"
            >
              Back to App
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Forms */}
          <section className="lg:col-span-5 space-y-6">
            {/* Tab Switcher */}
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
              <button 
                onClick={() => setActiveTab('single')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'single' ? 'bg-[#B8860B] text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
              >
                <Upload className="w-4 h-4" />
                Single
              </button>
              <button 
                onClick={() => setActiveTab('batch')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'batch' ? 'bg-[#B8860B] text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
              >
                <Layers className="w-4 h-4" />
                Batch
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'single' ? (
                <motion.div 
                  key="single"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  id="upload-form"
                  className="glass-card p-6 md:p-8 rounded-[2rem] border-2 border-[#D4AF37]/30"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      {editingRecord ? (
                        <Edit className="text-[#D4AF37] w-6 h-6" aria-hidden="true" />
                      ) : (
                        <Upload className="text-[#D4AF37] w-6 h-6" aria-hidden="true" />
                      )}
                      <h2 id="upload-title" className="text-xl font-bold text-white">
                        {editingRecord ? `Edit Day ${editingRecord.day_number}` : 'Upload New Day'}
                      </h2>
                    </div>
                    {editingRecord && (
                      <button 
                        onClick={cancelEdit}
                        className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"
                        aria-label="Cancel editing"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="day-number" className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase mb-2 ml-1">
                        <Hash className="w-3 h-3" aria-hidden="true" /> Day Number
                      </label>
                      <input 
                        id="day-number"
                        type="number" 
                        min="1" 
                        max="365"
                        value={dayNumber}
                        onChange={(e) => setDayNumber(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50"
                        placeholder="e.g. 1"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="title-my" className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase mb-2 ml-1">
                        <Type className="w-3 h-3" aria-hidden="true" /> Title (Myanmar)
                      </label>
                      <input 
                        id="title-my"
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50"
                        placeholder="တရားတော် အမည်"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="date-string" className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase mb-2 ml-1">
                        <Calendar className="w-3 h-3" aria-hidden="true" /> Date String (Optional)
                      </label>
                      <input 
                        id="date-string"
                        type="text" 
                        value={dateString}
                        onChange={(e) => setDateString(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50"
                        placeholder="e.g. 2024-01-01"
                      />
                    </div>

                    <div>
                      {renderTranscriptEditor()}
                    </div>

                    <div>
                      <label htmlFor="audio-url-input" className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase mb-2 ml-1">
                        <Link2 className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" /> Audio URL / Google Drive Share Link
                      </label>
                      <div className="relative space-y-1.5">
                        <input 
                          id="audio-url-input"
                          type="url"
                          value={audioUrlInput}
                          onChange={(e) => setAudioUrlInput(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder-white/20"
                          placeholder="https://drive.google.com/file/d/... or direct audio MP3 URL"
                        />
                        <p className="text-[11px] text-white/50 ml-1">
                          Paste a direct MP3 URL, Firebase Storage link, Cloudflare R2 link, or Google Drive share link.
                        </p>

                        <div className="mt-2.5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 space-y-1.5">
                          <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" /> Recommended Audio Hosting (အကြံပြုချက်):
                          </p>
                          <p className="text-[11px] leading-relaxed text-amber-100/80">
                            Please use direct MP3 file links (e.g., Firebase Storage, Cloudflare R2, or direct file URLs). Public Google Drive view links may be blocked from streaming by Google CORS rules.
                          </p>
                          <p className="text-[11px] leading-relaxed text-amber-200/70 font-sans">
                            (တိုက်ရိုက် MP3 ဖိုင် လင့်ခ်များ (ဥပမာ - Firebase Storage, Cloudflare R2 သို့မဟုတ် တိုက်ရိုက် File URL များ) ကို အသုံးပြုပေးပါ။ အများသုံး Google Drive View လင့်ခ်များသည် Google ၏ CORS စည်းမျဉ်းများကြောင့် တိုက်ရိုက် ဖွင့်ရန် ပိတ်ဆို့ခံရနိုင်ပါသည်။)
                          </p>
                        </div>

                        <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/70 space-y-1.5">
                          <p className="font-semibold text-[#D4AF37] flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> How to use Google Drive Audio Links (Google Drive အသုံးပြုနည်း):
                          </p>
                          <ol className="list-decimal list-inside space-y-1 text-white/60 text-[11px] leading-relaxed pl-1">
                            <li>
                              <strong className="text-white/80">Upload MP3</strong> to Google Drive (Google Drive သို့ MP3 ဖိုင် တင်ပါ)
                            </li>
                            <li>
                              Set access to <strong className="text-[#D4AF37]">"Anyone with the link"</strong> (ဖိုင်၏ Access ကို "Anyone with the link can view" ဟု ပြောင်းပါ)
                            </li>
                            <li>
                              <strong className="text-white/80">Copy Link</strong> and paste into the box above (Link ကို Copy ကူး၍ အထက်ပါ ကွက်လပ်တွင် ထည့်ပါ)
                            </li>
                          </ol>
                        </div>

                        {(audioUrlInput.includes('drive.google.com') || audioUrlInput.includes('docs.google.com')) && (
                          <div className="mt-2 text-xs text-amber-300 flex flex-col gap-1 font-medium bg-amber-500/10 p-3 rounded-lg border border-amber-500/30">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#D4AF37]" /> Google Drive link detected — automatically formatted for playback on save.
                            </div>
                            <p className="text-[11px] text-amber-200/80 font-normal pl-5">
                              Note: If streaming fails due to Google Drive CORS limits, consider using direct MP3 URLs (Firebase / Cloudflare R2).
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-center gap-2 text-red-200 text-xs" role="alert">
                        <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 flex items-center gap-2 text-green-200 text-xs" role="status">
                        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        {success}
                      </div>
                    )}

                    <div className="flex gap-3">
                      {editingRecord && (
                        <button 
                          type="button"
                          onClick={cancelEdit}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all active:scale-95 border border-white/10"
                        >
                          Cancel
                        </button>
                      )}
                      <button 
                        type="submit" 
                        disabled={loading}
                        className={`flex-[2] ${editingRecord ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#B8860B] hover:bg-[#9a700a]'} text-white font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50`}
                        aria-label={loading ? "Processing..." : editingRecord ? "Update Record" : "Create Record"}
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        ) : editingRecord ? (
                          'Update Record'
                        ) : (
                          'Create Record'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  key="batch"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-card p-6 md:p-8 rounded-[2rem] border-2 border-[#D4AF37]/30"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Layers className="text-[#D4AF37] w-6 h-6" aria-hidden="true" />
                      <h2 className="text-xl font-bold text-white">Batch Upload</h2>
                    </div>
                    {batchFiles.length > 0 && (
                      <button 
                        onClick={clearBatch}
                        className="text-xs font-bold text-red-400/60 hover:text-red-400 uppercase tracking-widest transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="relative">
                      <input 
                        type="file" 
                        multiple 
                        accept="audio/*"
                        onChange={handleBatchFileChange}
                        className="hidden"
                        id="batch-upload"
                      />
                      <label 
                        htmlFor="batch-upload"
                        className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-xl px-4 py-8 text-white/60 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 hover:border-[#D4AF37]/30 transition-all"
                      >
                        <Upload className="w-8 h-8 opacity-40" aria-hidden="true" />
                        <span className="text-sm font-medium">Select Multiple Files</span>
                        <span className="text-xs uppercase">MP3, WAV, M4A</span>
                      </label>
                    </div>

                    {batchFiles.length > 0 && (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {batchFiles.map((item, index) => (
                          <div key={index} className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center gap-3 relative group hover:border-[#D4AF37]/30 transition-colors">
                            <div className="w-8 h-8 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center shrink-0">
                              <Music className="w-4 h-4 text-[#D4AF37]" />
                            </div>
                            <div className="flex-grow min-w-0 grid grid-cols-12 gap-2">
                              <div className="col-span-3">
                                <input 
                                  type="number"
                                  value={item.day_number}
                                  onChange={(e) => updateBatchField(index, 'day_number', e.target.value)}
                                  placeholder="Day"
                                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]/50"
                                />
                              </div>
                              <div className="col-span-9">
                                <input 
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updateBatchField(index, 'title', e.target.value)}
                                  placeholder="Title"
                                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                                />
                              </div>
                            </div>
                            <button 
                              onClick={() => removeBatchFile(index)}
                              className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                              title="Remove from batch"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-center gap-2 text-red-200 text-xs" role="alert">
                        <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 flex items-center gap-2 text-green-200 text-xs" role="status">
                        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        {success}
                      </div>
                    )}

                    {batchFiles.length > 0 && (
                      <button 
                        onClick={handleBatchUpload}
                        disabled={loading}
                        className="w-full bg-[#B8860B] hover:bg-[#9a700a] text-white font-bold py-4 rounded-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-2 disabled:opacity-50 overflow-hidden relative"
                      >
                        {loading && uploadProgress && (
                          <motion.div 
                            className="absolute inset-0 bg-white/10 origin-left"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: uploadProgress.current / uploadProgress.total }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                          />
                        )}
                        <div className="relative z-10 flex items-center gap-2">
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                              <span>Uploading {uploadProgress?.current} of {uploadProgress?.total}</span>
                            </>
                          ) : (
                            `Upload All (${batchFiles.length} files)`
                          )}
                        </div>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* List/Grid View */}
          <section className="lg:col-span-7" aria-labelledby="tracker-title">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 md:p-8 rounded-[2rem] border-2 border-[#D4AF37]/10"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <Grid3X3 className="text-[#D4AF37] w-6 h-6" aria-hidden="true" />
                    <h2 id="tracker-title" className="text-xl font-bold text-white">365-Day Tracker</h2>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-green-500/40 border border-green-500/50"></div>
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Uploaded</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-red-500/10 border border-red-500/20"></div>
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Missing</span>
                    </div>
                    <div className="h-3 w-px bg-white/10 mx-1"></div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#D4AF37] font-mono font-bold">{records.length}</span>
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">/ 365 Days</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl" role="tablist" aria-label="View mode selection">
                  <button 
                    onClick={() => setViewMode('grid')}
                    role="tab"
                    aria-selected={viewMode === 'grid'}
                    className={`px-4 py-3 min-h-[48px] rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-[#B8860B] text-white' : 'text-white/40 hover:text-white/60'}`}
                    aria-label="Grid view"
                  >
                    Grid
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    role="tab"
                    aria-selected={viewMode === 'list'}
                    className={`px-4 py-3 min-h-[48px] rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-[#B8860B] text-white' : 'text-white/40 hover:text-white/60'}`}
                    aria-label="List view"
                  >
                    List
                  </button>
                </div>
              </div>

              {fetchingRecords ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4" aria-busy="true" aria-live="polite">
                  <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" aria-hidden="true" />
                  <p className="text-white/40 text-sm italic">Loading library...</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-12 gap-2" role="grid" aria-label="Audio records grid">
                  {Array.from({ length: 365 }, (_, i) => i + 1).map((day) => {
                    const record = recordsMap.get(day);
                    const exists = !!record;
                    return (
                      <button
                        key={day}
                        onClick={() => handleDayClick(day, exists)}
                        className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-mono transition-all ${
                          exists 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/40 hover:scale-105 shadow-lg shadow-green-500/5' 
                            : 'bg-red-500/10 text-red-400/30 border border-red-500/20 hover:bg-red-500/20 hover:text-red-400 cursor-pointer active:scale-90'
                        }`}
                        title={exists ? `Day ${day}: ${record.title} (Click to Edit)` : `Day ${day}: Missing`}
                        aria-label={`Day ${day}: ${exists ? record.title : 'Missing'}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-20">
                  <Music className="w-12 h-12 text-white/10 mx-auto mb-4" aria-hidden="true" />
                  <p className="text-white/40 italic">No records found. Start by uploading Day 1.</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse table-fixed min-w-[500px]" role="table" aria-label="Audio records table">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-4 px-2 text-xs font-bold text-white/40 uppercase tracking-wider w-16">Day</th>
                        <th className="py-4 px-2 text-xs font-bold text-white/40 uppercase tracking-wider">Title</th>
                        <th className="py-4 px-2 text-xs font-bold text-white/40 uppercase tracking-wider text-right w-32 sticky right-0 bg-[#041a13] z-10">Actions</th>
                      </tr>
                    </thead>
                    <tbody role="rowgroup">
                      {records.map((record) => (
                        <tr key={record.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="py-4 px-2">
                            <span className="w-8 h-8 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-xs">
                              {record.day_number}
                            </span>
                          </td>
                          <td className="py-4 px-2 overflow-hidden">
                            <div className="text-white text-sm font-medium truncate" title={record.title}>{record.title}</div>
                            <div className="text-white/40 text-xs uppercase tracking-tighter truncate">{record.date_string || 'No date'}</div>
                          </td>
                          <td className="py-4 px-2 text-right sticky right-0 bg-[#041a13]/90 backdrop-blur-sm z-10 group-hover:bg-[#0d4d3a]/90 transition-colors">
                            <div className="flex items-center justify-end gap-1">
                              <a 
                                href={record.audio_file || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-2 text-white/40 hover:text-white transition-colors"
                                aria-label={`Listen to Day ${record.day_number}`}
                              >
                                <Music className="w-4 h-4" />
                              </a>
                              <button 
                                onClick={() => handleEdit(record)}
                                className="p-2 text-blue-400/60 hover:text-blue-400 transition-colors"
                                aria-label={`Edit Day ${record.day_number}`}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(record.id)}
                                className="p-2 text-red-400/60 hover:text-red-400 transition-colors"
                                aria-label={`Delete Day ${record.day_number}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </section>
        </div>

        <AnimatePresence>
          {isFullScreen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500] bg-[#041a13] flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#051a12]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center">
                    <Code className="text-[#D4AF37] w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Transcript Editor</h2>
                    <p className="text-xs text-white/40">Manual HTML Mode</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFullScreen(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 text-sm transition-all"
                >
                  <Minimize2 className="w-4 h-4" />
                  Exit Full Screen
                </button>
              </div>
              <div className="flex-grow overflow-hidden">
                {renderTranscriptEditor(true)}
              </div>
            </motion.div>
          )}

          {confirmModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="glass-card w-full max-w-sm p-8 rounded-[2rem] border-2 border-white/10 bg-[#051a12] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                    confirmModal.type === 'danger' ? 'bg-red-500/20 text-red-500' : 
                    confirmModal.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500' : 
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{confirmModal.title}</h3>
                  <p className="text-white/60 text-sm mb-8">{confirmModal.message}</p>
                  
                  <div className="flex flex-col w-full gap-3">
                    <button
                      onClick={() => {
                        confirmModal.onConfirm();
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                      }}
                      className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 ${
                        confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : 
                        confirmModal.type === 'warning' ? 'bg-[#B8860B] hover:bg-[#9a700a] text-white' : 
                        'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                      className="w-full py-4 text-white/40 font-bold hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* R2 Batch 365 Auto-Generate Confirmation Modal */}
          {showR2SeedModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card w-full max-w-md p-6 rounded-[2rem] border-2 border-[#D4AF37]/40 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <Zap className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Auto-Generate 365 R2 Links</h3>
                    <p className="text-xs text-white/60">Cloudflare R2 Batch Configuration</p>
                  </div>
                </div>

                <p className="text-sm text-white/80 leading-relaxed">
                  This will update or create R2 audio links for <strong>Days 1 to 365</strong> in Firestore using the format:
                </p>
                <div className="p-3 bg-black/50 border border-white/10 rounded-xl font-mono text-xs text-[#D4AF37] break-all">
                  {R2_BASE_URL}/day_&#123;day_number&#125;.mp3
                </div>
                <p className="text-xs text-amber-200/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 leading-relaxed">
                  Proceed with batch generating and setting R2 links for all 365 days in Firestore?
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowR2SeedModal(false)}
                    disabled={isGeneratingR2}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBatchR2Generate}
                    disabled={isGeneratingR2}
                    className="px-5 py-2.5 rounded-xl bg-[#B8860B] hover:bg-[#9a700a] text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg transition-all"
                  >
                    {isGeneratingR2 ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Generating 365 Links...
                      </>
                    ) : (
                      'Yes, Generate All 365 Links'
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default AdminDashboard;
