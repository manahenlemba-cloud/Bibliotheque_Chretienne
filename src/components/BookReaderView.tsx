import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  DownloadCloud, 
  Sparkles, 
  Bookmark, 
  BookOpen, 
  FileText, 
  Sliders, 
  Maximize2, 
  Minimize2, 
  Type, 
  Sun, 
  Moon, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Layers,
  Languages,
  Loader2,
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  HardDrive,
  Wifi,
  WifiOff,
  Cloud
} from 'lucide-react';
import { Book } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { saveReadingProgress, getCachedBookById, formatBytes } from '../utils/indexedDb';
import { AudioReaderPlayer } from './AudioReaderPlayer';
import { splitIntoSentences, getFilteredVoices, estimateReadingTime, VoiceOption } from '../utils/textToSpeech';
import { PdfExportModal } from './PdfExportModal.tsx';
import { BookShareModal } from './BookShareModal';

interface BookReaderViewProps {
  book: Book;
  onBack: () => void;
  onAskAi: (bookId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (bookId: string) => void;
}

export const BookReaderView: React.FC<BookReaderViewProps> = ({
  book,
  onBack,
  onAskAi,
  isFavorite,
  onToggleFavorite
}) => {
  const [activeTab, setActiveTab] = useState<'reader' | 'pdf' | 'metadata'>('reader');
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);

  const chapters = book.chapters && book.chapters.length > 0 
    ? book.chapters 
    : [
        {
          title: "Introduction et Texte Général",
          content: book.reading_file || book.description || "Contenu du manuscrit en préparation."
        }
      ];

  const [fontSize, setFontSize] = useState<number>(18);
  const [readerTheme, setReaderTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { language, translateDynamicText, t } = useLanguage();
  const [isTranslatingChapter, setIsTranslatingChapter] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);

  // Offline IndexedDB persistent cache state
  const { isOnline, isCached, saveBookOffline } = useOffline();
  const [offlineStatusMsg, setOfflineStatusMsg] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Auto-cache consulted book in IndexedDB for offline reading
  useEffect(() => {
    if (book) {
      saveBookOffline(book, isFavorite).catch((e) => {
        console.warn("Erreur auto-cache IndexedDB:", e);
      });
    }
  }, [book.id, isFavorite, saveBookOffline]);

  // Restore saved chapter progress from IndexedDB if available
  useEffect(() => {
    if (book?.id) {
      getCachedBookById(book.id).then((record) => {
        if (record?.readingProgress && typeof record.readingProgress.chapterIdx === 'number') {
          const savedIdx = record.readingProgress.chapterIdx;
          if (savedIdx > 0 && savedIdx < chapters.length) {
            setCurrentChapterIdx(savedIdx);
          }
        }
      });
    }
  }, [book.id, chapters.length]);

  // Persist reading progress into IndexedDB
  useEffect(() => {
    if (book?.id) {
      saveReadingProgress(book.id, currentChapterIdx, currentSentenceIdx);
    }
  }, [book.id, currentChapterIdx, currentSentenceIdx]);

  const currentChapter = chapters[currentChapterIdx] || chapters[0];

  const effectiveChapterContent = (showTranslated && translatedContent) ? translatedContent : currentChapter.content;
  const effectiveChapterTitle = (showTranslated && translatedTitle) ? translatedTitle : currentChapter.title;

  const sentences = useMemo(() => {
    return splitIntoSentences(effectiveChapterContent);
  }, [effectiveChapterContent]);

  // Audio Text-to-Speech (TTS) State
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [autoAdvanceChapter, setAutoAdvanceChapter] = useState(true);

  // References for non-stale callbacks inside SpeechSynthesis events
  const isPlayingRef = useRef(isPlayingAudio);
  isPlayingRef.current = isPlayingAudio;
  const isPausedRef = useRef(isPausedAudio);
  isPausedRef.current = isPausedAudio;
  const currentSentenceIdxRef = useRef(currentSentenceIdx);
  currentSentenceIdxRef.current = currentSentenceIdx;
  const currentChapterIdxRef = useRef(currentChapterIdx);
  currentChapterIdxRef.current = currentChapterIdx;
  const playbackRateRef = useRef(playbackRate);
  playbackRateRef.current = playbackRate;
  const pitchRef = useRef(pitch);
  pitchRef.current = pitch;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const selectedVoiceRef = useRef(selectedVoice);
  selectedVoiceRef.current = selectedVoice;
  const autoAdvanceRef = useRef(autoAdvanceChapter);
  autoAdvanceRef.current = autoAdvanceChapter;
  const sentencesRef = useRef(sentences);
  sentencesRef.current = sentences;

  // Load available browser voices matching the current reader language
  useEffect(() => {
    const updateVoices = () => {
      const voices = getFilteredVoices(language);
      setAvailableVoices(voices);
      if (!selectedVoiceRef.current && voices.length > 0) {
        setSelectedVoice(voices[0].voice);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [language]);

  // Core Speech Synthesis Function
  const speakSentence = useCallback((idx: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn("Synthèse vocale (Web Speech API) non supportée par ce navigateur.");
      return;
    }

    const currentSentences = sentencesRef.current;
    if (!currentSentences || currentSentences.length === 0) return;

    if (idx >= currentSentences.length) {
      // End of current chapter reached
      if (autoAdvanceRef.current && currentChapterIdxRef.current < chapters.length - 1) {
        const nextChapter = currentChapterIdxRef.current + 1;
        setCurrentChapterIdx(nextChapter);
        // Will continue at sentence 0 on next chapter via effect
        return;
      } else {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
        setCurrentSentenceIdx(0);
        return;
      }
    }

    const targetIdx = Math.max(0, idx);
    window.speechSynthesis.cancel();

    const textToSpeak = currentSentences[targetIdx];
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = playbackRateRef.current;
    utterance.pitch = pitchRef.current;
    utterance.volume = volumeRef.current;

    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    } else {
      utterance.lang = language === 'en' ? 'en-US' : 'fr-FR';
    }

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setIsPausedAudio(false);
      setCurrentSentenceIdx(targetIdx);
    };

    utterance.onend = () => {
      if (isPlayingRef.current && !isPausedRef.current) {
        speakSentence(targetIdx + 1);
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn("Speech error, continuing:", e);
        if (isPlayingRef.current) {
          speakSentence(targetIdx + 1);
        }
      }
    };

    window.speechSynthesis.speak(utterance);
    setShowAudioPlayer(true);
    setIsPlayingAudio(true);
    setIsPausedAudio(false);
    setCurrentSentenceIdx(targetIdx);

    // Auto-scroll active sentence into view
    try {
      const el = document.getElementById(`sentence-${targetIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch {
      // Ignore
    }
  }, [chapters.length, language]);

  // Audio Playback Handlers
  const handlePlayAudio = () => {
    setShowAudioPlayer(true);
    speakSentence(currentSentenceIdx);
  };

  const handlePauseAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setIsPausedAudio(true);
  };

  const handleResumeAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
      if (!window.speechSynthesis.speaking) {
        speakSentence(currentSentenceIdx);
      }
    }
  };

  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
    setCurrentSentenceIdx(0);
  };

  const handleSeekSentence = (idx: number) => {
    speakSentence(idx);
  };

  const handleNextSentence = () => {
    speakSentence(Math.min(sentences.length - 1, currentSentenceIdx + 1));
  };

  const handlePrevSentence = () => {
    speakSentence(Math.max(0, currentSentenceIdx - 1));
  };

  const handleRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (isPlayingAudio && !isPausedAudio) {
      speakSentence(currentSentenceIdx);
    }
  };

  const handleVoiceChange = (voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
    if (isPlayingAudio && !isPausedAudio) {
      speakSentence(currentSentenceIdx);
    }
  };

  const handleCloseAudioPlayer = () => {
    handleStopAudio();
    setShowAudioPlayer(false);
  };

  const handleNextChapterWithAudio = () => {
    if (currentChapterIdx < chapters.length - 1) {
      setCurrentChapterIdx(currentChapterIdx + 1);
    }
  };

  const handlePrevChapterWithAudio = () => {
    if (currentChapterIdx > 0) {
      setCurrentChapterIdx(currentChapterIdx - 1);
    }
  };

  // When chapter changes while audio was playing, resume at sentence 0 of new chapter
  const prevChapterIdxRef = useRef(currentChapterIdx);
  useEffect(() => {
    if (prevChapterIdxRef.current !== currentChapterIdx) {
      prevChapterIdxRef.current = currentChapterIdx;
      if (isPlayingRef.current) {
        const timer = setTimeout(() => {
          speakSentence(0);
        }, 200);
        return () => clearTimeout(timer);
      } else {
        setCurrentSentenceIdx(0);
      }
    }
  }, [currentChapterIdx, speakSentence]);

  // Clean up speech synthesis when unmounting or leaving view
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  React.useEffect(() => {
    setTranslatedContent(null);
    setTranslatedTitle(null);
    setShowTranslated(false);
  }, [currentChapterIdx, language]);

  const handleTranslateChapter = async () => {
    if (showTranslated) {
      setShowTranslated(false);
      return;
    }

    if (translatedContent) {
      setShowTranslated(true);
      return;
    }

    setIsTranslatingChapter(true);
    try {
      const [tTitle, tContent] = await Promise.all([
        translateDynamicText(currentChapter.title),
        translateDynamicText(currentChapter.content)
      ]);
      setTranslatedTitle(tTitle);
      setTranslatedContent(tContent);
      setShowTranslated(true);
    } catch (e) {
      console.warn("Translation failed:", e);
    } finally {
      setIsTranslatingChapter(false);
    }
  };

  const shareBook = async () => {
    // If native Web Share API is available on mobile/supported browser, try it first
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      const shareUrl = `${window.location.origin}/?view=book&book=${encodeURIComponent(book.id)}`;
      const shareText = `Découvrez et lisez l'ouvrage chrétien « ${book.title} » du ${book.author} sur La Bibliothèque Chrétienne de la Dernière Heure.`;
      try {
        await navigator.share({
          title: `« ${book.title} » par ${book.author}`,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    // Fallback to rich sharing modal (WhatsApp, Facebook, Instagram, Clipboard)
    setIsShareModalOpen(true);
  };

  const themeClasses = {
    dark: 'bg-slate-950 text-slate-100 border-slate-800',
    sepia: 'bg-[#F4ECD8] text-[#3D3024] border-[#E2D4B7]',
    light: 'bg-white text-slate-900 border-slate-200'
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-sky-300 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span>Retour à la Bibliothèque</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(book.id)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isFavorite 
                ? 'bg-sky-500 text-slate-950 border-sky-400' 
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-sky-300'
            }`}
            title="Favoris"
          >
            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 transition-all cursor-pointer shadow-2xs"
            title="Partager cet ouvrage (WhatsApp, Facebook, Instagram, Presse-papier)"
          >
            <Share2 className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold hidden sm:inline">Partager</span>
          </button>

          <a
            href={book.google_drive_file_id ? `/api/drive/download/${book.google_drive_file_id}` : book.google_drive_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 text-xs font-bold shadow-md shadow-sky-500/10 transition-all cursor-pointer"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Télécharger (Google Drive)</span>
          </a>
        </div>
      </div>

      {/* Book Presentation Banner */}
      <div className="relative rounded-3xl bg-slate-900/80 border border-sky-500/30 p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
          
          {/* Book Cover */}
          <div className="w-32 sm:w-44 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-slate-950 flex-shrink-0 border border-sky-500/20">
            <img 
              src={book.cover_image} 
              alt={book.title} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Book Metadata */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {book.category}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Statut : {book.status}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                ~{book.reading_time_min} min
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Ajouté le {book.created_at}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-100 leading-tight">
              {book.title}
            </h1>

            <p className="text-sm sm:text-base text-sky-400/90 font-medium">
              Par {book.author}
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light max-w-3xl">
              {book.description}
            </p>

            {/* Quick action bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setActiveTab('reader');
                  setShowAudioPlayer(true);
                  handlePlayAudio();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                title="Écouter la lecture de cet ouvrage grâce à la synthèse vocale"
              >
                <Headphones className="w-4 h-4" />
                <span>{isPlayingAudio && !isPausedAudio ? 'Écoute audio en cours...' : 'Écouter ce livre (Audio TTS)'}</span>
              </button>

              <button
                onClick={() => onAskAi(book.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 text-xs font-bold transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Interroger cet ouvrage avec l'IA</span>
              </button>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-black text-xs font-bold border border-slate-300 transition-all cursor-pointer shadow-xs"
                title="Générer un PDF certifié de cet ouvrage et le sauvegarder dans Google Drive"
              >
                <Cloud className="w-4 h-4 text-black" />
                <span className="text-black">Exporter PDF / Drive</span>
              </button>

              <a
                href={book.google_drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <DownloadCloud className="w-4 h-4 text-sky-400" />
                <span>Lien direct Google Drive</span>
              </a>

              <button
                onClick={async () => {
                  try {
                    await saveBookOffline(book, isFavorite);
                    setOfflineStatusMsg("Ouvrage vérifié et disponible hors-ligne dans IndexedDB !");
                    setTimeout(() => setOfflineStatusMsg(null), 3500);
                  } catch {
                    setOfflineStatusMsg("Erreur lors de la mise en cache.");
                    setTimeout(() => setOfflineStatusMsg(null), 3500);
                  }
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isCached(book.id)
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Cet ouvrage est sauvegardé dans le stockage IndexedDB de votre navigateur"
              >
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>{isCached(book.id) ? 'Disponible Hors-Ligne (IndexedDB)' : 'Sauvegarder Hors-Ligne'}</span>
              </button>
            </div>

            {offlineStatusMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{offlineStatusMsg}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('reader')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'reader'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Lecture Confortable</span>
          </button>

          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'pdf'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Lecteur PDF Intégré</span>
          </button>

          <button
            onClick={() => setActiveTab('metadata')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'metadata'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Fiche & Indexation IA</span>
          </button>
        </div>

        {/* Reader Customizer Controls (when reader tab is active) */}
        {activeTab === 'reader' && (
          <div className="hidden sm:flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            {/* Font size */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                title="Diminuer la police"
              >
                A-
              </button>
              <span className="px-1 text-slate-400">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(26, fontSize + 2))}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                title="Agrandir la police"
              >
                A+
              </button>
            </div>

            <div className="w-px h-4 bg-slate-700" />

            {/* Font family */}
            <button
              onClick={() => setFontFamily(fontFamily === 'serif' ? 'sans' : 'serif')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium cursor-pointer"
            >
              {fontFamily === 'serif' ? 'Sérif (Lora)' : 'Sans-sérif'}
            </button>

            <div className="w-px h-4 bg-slate-700" />

            {/* Themes */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setReaderTheme('dark')}
                className={`w-5 h-5 rounded-full bg-slate-950 border ${readerTheme === 'dark' ? 'border-sky-400 scale-110' : 'border-slate-700'}`}
                title="Mode Sombre"
              />
              <button
                onClick={() => setReaderTheme('sepia')}
                className={`w-5 h-5 rounded-full bg-[#E8DEC7] border ${readerTheme === 'sepia' ? 'border-sky-500 scale-110' : 'border-slate-700'}`}
                title="Mode Sépia"
              />
              <button
                onClick={() => setReaderTheme('light')}
                className={`w-5 h-5 rounded-full bg-white border ${readerTheme === 'light' ? 'border-sky-500 scale-110' : 'border-slate-700'}`}
                title="Mode Clair"
              />
            </div>

            <div className="w-px h-4 bg-slate-700" />

            {/* Audio TTS toggle */}
            <button
              onClick={() => {
                if (showAudioPlayer && isPlayingAudio) {
                  handlePauseAudio();
                } else {
                  setShowAudioPlayer(true);
                  handlePlayAudio();
                }
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                isPlayingAudio && !isPausedAudio 
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' 
                  : showAudioPlayer
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title="Activer la lecture vocale (Text-to-Speech)"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>{isPlayingAudio && !isPausedAudio ? 'Audio actif' : 'Écouter'}</span>
            </button>

            <div className="w-px h-4 bg-slate-700" />

            {/* Full Screen Toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                isFullScreen 
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={isFullScreen ? t('exitFullscreenBtn') : t('fullscreenBtn')}
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullScreen ? t('exitFullscreenBtn') : t('fullscreenBtn')}</span>
            </button>

            <div className="w-px h-4 bg-slate-700" />

            {/* Offline IndexedDB badge */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              title="Cet ouvrage est stocké dans votre base locale IndexedDB pour une lecture sans connexion"
            >
              <HardDrive className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Hors-Ligne Prêt</span>
            </div>

            {!isOnline && (
              <div 
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-black border border-amber-300 animate-pulse"
                title="Mode Hors-Connexion actif"
              >
                <WifiOff className="w-3 h-3 text-slate-800" />
                <span className="hidden md:inline text-black">Hors-Connexion</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TAB CONTENT: COMFORTABLE TEXT READER */}
      {activeTab === 'reader' && (
        <div className={`space-y-6 ${isFullScreen ? 'fixed inset-0 z-50 overflow-y-auto bg-slate-950 p-4 sm:p-10' : ''}`}>
          
          {/* Floating full-screen header controls when in full-screen mode */}
          {isFullScreen && (
            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border border-sky-500/30 p-3.5 rounded-2xl flex items-center justify-between shadow-2xl mb-6">
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-slate-100 text-sm truncate">
                  {book.title}
                </span>
                <span className="text-xs text-sky-400 font-semibold hidden sm:inline">
                  • {effectiveChapterTitle}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (showAudioPlayer && isPlayingAudio) {
                      handlePauseAudio();
                    } else {
                      setShowAudioPlayer(true);
                      handlePlayAudio();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition-colors ${
                    isPlayingAudio && !isPausedAudio
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>{isPlayingAudio && !isPausedAudio ? 'Audio actif' : 'Écouter'}</span>
                </button>
                <button
                  onClick={() => setIsFullScreen(false)}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>{t('exitFullscreenBtn')}</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Chapter Navigation Selector */}
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <button
              disabled={currentChapterIdx <= 0}
              onClick={handlePrevChapterWithAudio}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Précédent</span>
            </button>

            <div className="text-center">
              <span className="text-[11px] text-sky-400/90 uppercase font-bold tracking-wider block">
                Chapitre {currentChapterIdx + 1} sur {chapters.length}
              </span>
              <span className="font-display font-semibold text-sm sm:text-base text-slate-100 block">
                {effectiveChapterTitle}
              </span>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <button
                  onClick={() => {
                    setShowAudioPlayer(true);
                    if (isPlayingAudio && !isPausedAudio) {
                      handlePauseAudio();
                    } else {
                      handlePlayAudio();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-all cursor-pointer"
                >
                  {isPlayingAudio && !isPausedAudio ? (
                    <>
                      <Pause className="w-3 h-3 fill-current" />
                      <span>Pause audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>{isPausedAudio ? 'Reprendre l\'audio' : 'Écouter ce chapitre'}</span>
                    </>
                  )}
                </button>
                {language !== 'fr' && (
                  <button
                    onClick={handleTranslateChapter}
                    disabled={isTranslatingChapter}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                      showTranslated 
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold' 
                        : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                    }`}
                  >
                    {isTranslatingChapter ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Languages className="w-3 h-3" />
                    )}
                    <span>{showTranslated ? 'Version Originale' : 'Traduire'}</span>
                  </button>
                )}
              </div>
            </div>

            <button
              disabled={currentChapterIdx >= chapters.length - 1}
              onClick={handleNextChapterWithAudio}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Reading Paper Canvas */}
          <div className={`p-8 sm:p-14 rounded-3xl border shadow-2xl transition-all ${themeClasses[readerTheme]}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-8">
              <h2 className="font-display font-bold text-2xl sm:text-3xl opacity-90 leading-tight">
                {effectiveChapterTitle}
              </h2>
              <button
                onClick={() => {
                  setShowAudioPlayer(true);
                  if (isPlayingAudio && !isPausedAudio) {
                    handlePauseAudio();
                  } else {
                    handlePlayAudio();
                  }
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold cursor-pointer transition-colors self-start sm:self-auto"
                title="Écouter ce chapitre en audio TTS"
              >
                <Headphones className="w-4 h-4 text-sky-400" />
                <span>{isPlayingAudio && !isPausedAudio ? 'En cours d\'écoute...' : 'Synthèse Vocale (TTS)'}</span>
              </button>
            </div>

            {/* Audio Tip Banner when audio player is opened */}
            {showAudioPlayer && (
              <div className="mb-6 p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-sky-300">
                  <Volume2 className="w-4 h-4 text-sky-400 flex-shrink-0 animate-pulse" />
                  <span>
                    <strong>Synthèse Vocale active :</strong> cliquez sur n'importe quelle phrase pour démarrer ou sauter la lecture à cet endroit précis.
                  </span>
                </div>
                <span className="text-[11px] opacity-75 font-mono">
                  {sentences.length} phrases • ~{estimateReadingTime(effectiveChapterContent, playbackRate).minutes} min
                </span>
              </div>
            )}

            {/* Interactive Sentence-Level Reading Surface */}
            <div
              className={`leading-relaxed tracking-wide ${
                fontFamily === 'serif' ? 'font-reading' : 'font-sans'
              }`}
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.85 }}
            >
              {sentences.map((sent, sIdx) => {
                const isCurrent = (isPlayingAudio || isPausedAudio) && currentSentenceIdx === sIdx;
                return (
                  <span
                    key={sIdx}
                    id={`sentence-${sIdx}`}
                    onClick={() => {
                      setShowAudioPlayer(true);
                      handleSeekSentence(sIdx);
                    }}
                    className={`cursor-pointer transition-all duration-200 inline rounded-lg px-1.5 py-0.5 my-0.5 select-text ${
                      isCurrent
                        ? readerTheme === 'light'
                          ? 'bg-sky-100 text-sky-950 font-medium shadow-sm ring-2 ring-sky-400/80 scale-[1.01]'
                          : readerTheme === 'sepia'
                          ? 'bg-[#E5D7B7] text-[#2C2115] font-medium shadow-sm ring-2 ring-[#B89868] scale-[1.01]'
                          : 'bg-sky-500/25 text-sky-100 font-medium shadow-sm ring-2 ring-sky-400/80 scale-[1.01]'
                        : showAudioPlayer
                        ? 'hover:bg-sky-500/10 hover:text-sky-300'
                        : ''
                    }`}
                    title="Cliquer pour écouter cette phrase"
                  >
                    {sent}{' '}
                  </span>
                );
              })}
            </div>

            {/* Bottom of Chapter Navigation */}
            <div className="mt-14 pt-8 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-80 text-xs">
              <span>{book.title} — {book.author}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowAudioPlayer(true);
                    speakSentence(0);
                  }}
                  className="inline-flex items-center gap-1.5 text-sky-400 font-bold hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réécouter ce chapitre</span>
                </button>
                <span>•</span>
                <a
                  href={book.google_drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-500 font-bold hover:underline"
                >
                  Télécharger l'ouvrage complet sur Google Drive →
                </a>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: EMBEDDED PDF VIEWER */}
      {activeTab === 'pdf' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-sky-400" />
              <div>
                <span className="font-display font-semibold text-sm text-slate-100 block">
                  Visionneuse PDF & Document Numérique
                </span>
                <span className="text-xs text-slate-400 font-light">
                  Consultez le document original ou téléchargez-le sur Google Drive pour une lecture hors ligne.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-black border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Générer un PDF certifié de cet ouvrage et le sauvegarder dans Google Drive"
              >
                <Cloud className="w-4 h-4 text-black" />
                <span className="text-black">Exporter PDF / Drive</span>
              </button>

              <a
                href={book.google_drive_file_id ? `/api/drive/download/${book.google_drive_file_id}` : book.google_drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Télécharger le fichier PDF depuis Google Drive"
              >
                <DownloadCloud className="w-4 h-4 text-sky-400" />
                <span>Télécharger</span>
              </a>

              <a
                href={book.google_drive_url || (book.google_drive_file_id ? `https://drive.google.com/file/d/${book.google_drive_file_id}/view` : '#')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Ouvrir sur Google Drive</span>
              </a>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-sky-500/30 bg-slate-900 aspect-[4/3] sm:aspect-[16/10] min-h-[550px] shadow-2xl flex flex-col">
            {/* Viewer Header */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-medium text-sky-300">{book.title}.pdf</span>
                {book.file_size_bytes && (
                  <span className="text-slate-500 text-[11px]">
                    ({(book.file_size_bytes / (1024 * 1024)).toFixed(1)} Mo)
                  </span>
                )}
              </div>
              <span className="text-slate-500">Google Drive Document • Consultation intégrée</span>
            </div>

            {/* Embedded iframe or rich fallback */}
            <iframe
              src={book.google_drive_file_id ? `https://drive.google.com/file/d/${book.google_drive_file_id}/preview` : (book.pdf_url || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")}
              title={`Lecteur PDF : ${book.title}`}
              className="w-full flex-1 border-0 bg-slate-800"
              allow="autoplay"
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: AI INDEXATION & BOOK METADATA */}
      {activeTab === 'metadata' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-sky-500/30 space-y-6 shadow-xl">
            <div>
              <span className="text-xs uppercase font-bold text-sky-400 tracking-widest block mb-1">
                Indexation & Intelligence Artificielle
              </span>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-100">
                Synthèse Doctrinale & Données Indexées
              </h2>
            </div>

            {/* AI Summary */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs text-sky-300 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Résumé théologique indexé par l'IA
              </span>
              <p className="text-sm text-slate-300 leading-relaxed font-light">
                {book.ai_indexed_content?.summary || book.description}
              </p>
            </div>

            {/* Themes */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">
                Thèmes doctrinaux clés :
              </span>
              <div className="flex flex-wrap gap-2">
                {book.ai_indexed_content?.keyThemes?.map((theme, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 text-xs font-medium">
                    #{theme}
                  </span>
                ))}
              </div>
            </div>

            {/* Biblical references */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">
                Passages scripturaires rattachés :
              </span>
              <div className="flex flex-wrap gap-2">
                {book.ai_indexed_content?.biblicalReferences?.map((ref, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-slate-950 text-slate-200 border border-slate-800 text-xs font-mono">
                    📖 {ref}
                  </span>
                ))}
              </div>
            </div>

            {/* Chapters breakdown */}
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-semibold block">
                Découpage des chapitres indexés :
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {book.ai_indexed_content?.chaptersSummary?.map((ch, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-xs font-semibold text-sky-400 block">{ch.chapter}</span>
                    <p className="text-xs text-slate-400 font-light">{ch.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt AI directly */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Indexé le : {new Date(book.ai_indexed_content?.indexedAt || book.created_at).toLocaleDateString('fr-FR')}
              </span>
              <button
                onClick={() => onAskAi(book.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Interroger cet ouvrage avec l'IA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TEXT-TO-SPEECH AUDIO PLAYER CONTROLLER */}
      {showAudioPlayer && (
        <AudioReaderPlayer
          bookTitle={book.title}
          chapterTitle={effectiveChapterTitle}
          chapterIndex={currentChapterIdx}
          totalChapters={chapters.length}
          isPlaying={isPlayingAudio}
          isPaused={isPausedAudio}
          currentSentenceIdx={currentSentenceIdx}
          totalSentences={sentences.length}
          activeSentenceText={sentences[currentSentenceIdx] || ''}
          playbackRate={playbackRate}
          pitch={pitch}
          volume={volume}
          selectedVoice={selectedVoice}
          availableVoices={availableVoices}
          autoAdvance={autoAdvanceChapter}
          onPlay={handlePlayAudio}
          onPause={handlePauseAudio}
          onResume={handleResumeAudio}
          onStop={handleStopAudio}
          onSeekSentence={handleSeekSentence}
          onNextSentence={handleNextSentence}
          onPrevSentence={handlePrevSentence}
          onRateChange={handleRateChange}
          onPitchChange={setPitch}
          onVolumeChange={setVolume}
          onVoiceChange={handleVoiceChange}
          onToggleAutoAdvance={() => setAutoAdvanceChapter(!autoAdvanceChapter)}
          onClosePlayer={handleCloseAudioPlayer}
          onNextChapter={currentChapterIdx < chapters.length - 1 ? handleNextChapterWithAudio : undefined}
          onPrevChapter={currentChapterIdx > 0 ? handlePrevChapterWithAudio : undefined}
        />
      )}

      {/* PDF Export & Google Drive Modal */}
      <PdfExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        document={{ type: 'book', book }}
      />

      {/* Book Quick Share Modal (WhatsApp, Facebook, Instagram, Web Share API, Clipboard) */}
      <BookShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        book={book}
      />

    </div>
  );
};
