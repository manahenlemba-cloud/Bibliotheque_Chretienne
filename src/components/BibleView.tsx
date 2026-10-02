import React, { useState, useEffect } from 'react';
import { 
  ScrollText, 
  Search, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Copy, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  ArrowRight,
  Filter,
  Bookmark,
  Maximize2,
  Minimize2,
  Type,
  Languages,
  BookOpenCheck
} from 'lucide-react';
import { BIBLE_BOOKS, BIBLE_VERSIONS, getChapterVerses, searchBibleVerses, getLocalizedBookName, getLocalizedTestament } from '../data/bibleData';
import { BibleBookInfo, BibleVerse, BibleVersionId } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_TO_DEFAULT_BIBLE_VERSION } from '../data/dailyVerses';
import { fetchTheologicalDefinition, TheologicalDefinitionResponse } from '../services/theologicalService';
import { TheologicalDefinitionModal } from './TheologicalDefinitionModal';

const POPULAR_THEOLOGICAL_TERMS = [
  { term: 'Sanctification', label: 'Sanctification' },
  { term: 'Justification', label: 'Justification' },
  { term: 'Grâce', label: 'Grâce' },
  { term: 'Rédemption', label: 'Rédemption' },
  { term: 'Expiation', label: 'Expiation' },
  { term: 'Nouvelle Naissance', label: 'Nouvelle Naissance' },
  { term: 'Foi', label: 'Foi' },
  { term: 'Repentance', label: 'Repentance' },
  { term: 'Parousie', label: 'Parousie' },
  { term: 'Alliance', label: 'Alliance' },
  { term: 'Saint-Esprit', label: 'Saint-Esprit' }
];

interface BibleViewProps {
  onAskAiWithVerse?: (verseText: string) => void;
}

export const BibleView: React.FC<BibleViewProps> = ({ onAskAiWithVerse }) => {
  const { t, language } = useLanguage();
  const [testament, setTestament] = useState<'Ancien Testament' | 'Nouveau Testament'>('Nouveau Testament');
  const [selectedBook, setSelectedBook] = useState<BibleBookInfo>(() => {
    return BIBLE_BOOKS.find(b => b.id === 'MAT') || BIBLE_BOOKS[0];
  });
  const [selectedChapter, setSelectedChapter] = useState<number>(24);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersionId>(() => {
    return LANGUAGE_TO_DEFAULT_BIBLE_VERSION[language] || 'LSG';
  });

  // Automatically switch Bible translation to match the language selected in the language bar
  useEffect(() => {
    const defaultVer = LANGUAGE_TO_DEFAULT_BIBLE_VERSION[language] || 'LSG';
    setSelectedVersion(defaultVer);
  }, [language]);

  const currentBookName = getLocalizedBookName(selectedBook, language);
  const [fontSize, setFontSize] = useState<number>(18);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedVerseIndex, setCopiedVerseIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Theological Search & Definition State
  const [theologicalQuery, setTheologicalQuery] = useState('');
  const [theologicalLoading, setTheologicalLoading] = useState(false);
  const [isTheologicalModalOpen, setIsTheologicalModalOpen] = useState(false);
  const [theologicalDefinition, setTheologicalDefinition] = useState<TheologicalDefinitionResponse | null>(null);
  const [theologicalSource, setTheologicalSource] = useState<'gemini_ai' | 'theological_lexicon'>('gemini_ai');
  const [theologicalContextVerse, setTheologicalContextVerse] = useState<string | undefined>();
  const [floatingSelection, setFloatingSelection] = useState<{
    term: string;
    verseContext: string;
    top: number;
    left: number;
  } | null>(null);

  // Active Bible version details
  const activeVersion = BIBLE_VERSIONS.find(v => v.id === selectedVersion) || BIBLE_VERSIONS[0];

  // Verses of current selected chapter in current selected version
  const currentVerses = getChapterVerses(selectedBook.id, selectedChapter, selectedVersion, language);

  // Filter books by testament
  const booksInTestament = BIBLE_BOOKS.filter(b => b.testament === testament);

  const handleBookChange = (book: BibleBookInfo) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setIsSearching(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const results = searchBibleVerses(searchQuery, selectedVersion, language);
    setSearchResults(results);
  };

  const copyVerse = (v: BibleVerse, idx: number) => {
    navigator.clipboard.writeText(`« ${v.text} » (${v.bookName} ${v.chapter}:${v.verse}, ${activeVersion.fullName})`);
    setCopiedVerseIndex(idx);
    setTimeout(() => setCopiedVerseIndex(null), 2000);
  };

  // Audio Speech synthesis adapted to Bible version language
  const readChapterAloud = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const fullText = currentVerses.map(v => `${v.verse}. ${v.text}`).join(' ');
    const utterance = new SpeechSynthesisUtterance(`${currentBookName}, ${t('bibleChapterText')} ${selectedChapter}. ${fullText}`);
    
    // Choose speech language based on version & UI language
    if (selectedVersion === 'KJV' || selectedVersion === 'AMP' || language === 'en') {
      utterance.lang = 'en-US';
    } else if (selectedVersion === 'SW-ZAN' || selectedVersion === 'SW-KEN' || language === 'sw') {
      utterance.lang = 'sw';
    } else if (selectedVersion === 'LN-BIB' || language === 'ln') {
      utterance.lang = 'ln';
    } else if (selectedVersion === 'RVR' || language === 'es') {
      utterance.lang = 'es-ES';
    } else {
      utterance.lang = 'fr-FR';
    }

    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Theological term lookup handler
  const handleLookupTerm = async (termToLookup: string, context?: string) => {
    if (!termToLookup || !termToLookup.trim()) return;
    setTheologicalLoading(true);
    setTheologicalQuery(termToLookup);

    try {
      const result = await fetchTheologicalDefinition({
        term: termToLookup,
        contextVerse: context || `${currentBookName} ${selectedChapter}`,
        book: currentBookName,
        chapter: selectedChapter,
        version: selectedVersion,
        language: (language as any) || 'fr'
      });

      setTheologicalDefinition(result.definition);
      setTheologicalSource(result.source);
      setTheologicalContextVerse(context || `${currentBookName} ${selectedChapter}`);
      setIsTheologicalModalOpen(true);
    } catch (err) {
      console.error('Erreur définition théologique:', err);
    } finally {
      setTheologicalLoading(false);
    }
  };

  const handleTheologicalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!theologicalQuery.trim()) return;
    handleLookupTerm(theologicalQuery, `${currentBookName} ${selectedChapter}`);
  };

  // Word selection listener in Bible text
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          return;
        }

        const raw = selection.toString().trim();
        const cleaned = raw.replace(/^[^a-zA-ZÀ-ÿ0-9]+|[^a-zA-ZÀ-ÿ0-9]+$/g, '');
        if (!cleaned || cleaned.length < 2 || cleaned.length > 50) {
          return;
        }

        // Check if selection is inside Bible reading area
        let node: Node | null = selection.anchorNode;
        let isInsideBible = false;
        let verseContext = '';

        while (node && node !== document.body) {
          if (node instanceof HTMLElement) {
            if (node.dataset.verseRef) {
              verseContext = node.dataset.verseRef;
              isInsideBible = true;
              break;
            }
            if (node.classList.contains('bible-reading-container')) {
              isInsideBible = true;
            }
          }
          node = node.parentNode;
        }

        if (isInsideBible && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect && rect.width > 0) {
            setFloatingSelection({
              term: cleaned,
              verseContext: verseContext || `${currentBookName} ${selectedChapter}`,
              top: Math.max(10, rect.top - 12),
              left: Math.min(window.innerWidth - 120, Math.max(120, rect.left + rect.width / 2))
            });
          }
        }
      }, 60);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.theological-floating-pill')) {
        return;
      }
      setFloatingSelection(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 ${isFullScreen ? 'fixed inset-0 z-50 overflow-y-auto bg-slate-950 p-4 sm:p-10 max-w-none' : ''}`}>
      
      {/* Fullscreen Sticky Header Bar */}
      {isFullScreen && (
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border border-sky-500/30 p-3.5 rounded-2xl flex items-center justify-between shadow-2xl mb-6">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-sky-400 text-sm">
              {currentBookName} {selectedChapter}
            </span>
            <span className="text-xs text-slate-300 font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {activeVersion.code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Font Size */}
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl text-xs">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold flex items-center justify-center cursor-pointer"
                title="Diminuer la police"
              >
                A-
              </button>
              <span className="px-1 text-slate-300 text-[11px]">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold flex items-center justify-center cursor-pointer"
                title="Agrandir la police"
              >
                A+
              </button>
            </div>

            <button
              onClick={() => setIsFullScreen(false)}
              className="px-3 py-1.5 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow hover:bg-sky-400 transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>{t('exitFullscreenBtn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      {!isFullScreen && (
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold">
            <ScrollText className="w-4 h-4 text-sky-400" />
            <span>Sainte Écriture • 7 Versions Bibliques Authentiques</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-slate-100">
            La Bible en Ligne
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed">
            Méditez la Parole de Dieu, explorez les 66 livres inspirés en français, anglais et kiswahili (Zanzibar et Kenya).
          </p>
        </div>
      )}

      {/* Bible Versions Selector Ribbon */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-sky-500/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Versions Bibliques Disponibles :
            </span>
          </div>
          <span className="text-xs text-sky-300/90 font-medium">
            Version active : <strong>{activeVersion.fullName}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {BIBLE_VERSIONS.map((ver) => {
            const isSelected = selectedVersion === ver.id;
            return (
              <button
                key={ver.id}
                onClick={() => setSelectedVersion(ver.id)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20 font-bold'
                    : 'bg-slate-950/80 hover:bg-slate-800/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
                title={ver.description}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                    isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-sky-400'
                  }`}>
                    {ver.code}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                </div>

                <span className="text-xs leading-snug line-clamp-1">
                  {ver.name}
                </span>

                <span className={`text-[10px] truncate ${
                  isSelected ? 'text-slate-900' : 'text-slate-500'
                }`}>
                  {ver.badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pt-2 text-[11px] text-slate-400 italic">
          💡 {activeVersion.description}
        </div>
      </div>

      {/* RECHERCHE DE TERMES THÉOLOGIQUES & DÉFINITION IA */}
      <div className="max-w-4xl mx-auto p-5 sm:p-6 rounded-3xl bg-slate-900/95 border border-sky-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
              <BookOpenCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-base sm:text-lg text-white">
                  Recherche de Termes Théologiques
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>Définition IA Gemini</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                💡 <strong>Astuce :</strong> Sélectionnez n'importe quel mot dans les versets ci-dessous pour faire apparaître l'option <strong>« Définition IA »</strong>, ou cherchez un terme théologique ci-dessous pour explorer son étymologie (Grec/Hébreu) et sa portée doctrinale.
              </p>
            </div>
          </div>
        </div>

        {/* Input & Action */}
        <form onSubmit={handleTheologicalSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
            <input
              type="text"
              value={theologicalQuery}
              onChange={(e) => setTheologicalQuery(e.target.value)}
              placeholder="Ex: Sanctification, Justification, Grâce, Rédemption, Expiation, Parousie, Alliance, Foi..."
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 outline-none shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={theologicalLoading || !theologicalQuery.trim()}
            className="px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all shrink-0 active:scale-95"
          >
            {theologicalLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Analyse...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Définition IA</span>
              </>
            )}
          </button>
        </form>

        {/* Popular theological concept chips */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Concepts Doctrinaux Clés (Accès Rapide) :
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_THEOLOGICAL_TERMS.map((concept) => (
              <button
                key={concept.term}
                type="button"
                onClick={() => handleLookupTerm(concept.term, `${currentBookName} ${selectedChapter}`)}
                className="px-3 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hover:border-sky-400/50"
              >
                <span>{concept.label}</span>
                <ChevronRight className="w-3 h-3 text-sky-400" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bible Search Bar */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t('bibleSearchPlaceholder')} (${activeVersion.name})`}
            className="w-full pl-12 pr-28 py-3.5 bg-slate-900 border border-slate-800 focus:border-sky-500/60 rounded-2xl text-sm text-slate-100 placeholder-slate-500 outline-none shadow-lg"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow cursor-pointer transition-colors"
          >
            {t('bibleSearchBtn')}
          </button>
        </form>

        {isSearching && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>
              Résultats de recherche pour « <strong className="text-sky-300">{searchQuery}</strong> » dans {activeVersion.name} : {searchResults.length} verset(s)
            </span>
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="text-sky-400 hover:underline cursor-pointer font-semibold"
            >
              Retour au lecteur de chapitre →
            </button>
          </div>
        )}
      </div>

      {/* SEARCH RESULTS VIEW */}
      {isSearching ? (
        <div className="max-w-4xl mx-auto space-y-4">
          {searchResults.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800">
              <ScrollText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-300">Aucun verset répertorié ne correspond exactement à votre requête.</p>
              <p className="text-xs text-slate-500 mt-1">Essayez avec des mots clés simples comme « paix », « berger », « heure », « foi », « fin », « wokovu ».</p>
            </div>
          ) : (
            searchResults.map((v, idx) => (
              <div 
                key={idx}
                data-verse-ref={`${v.bookName} ${v.chapter}:${v.verse} - « ${v.text} »`}
                className="bible-reading-container select-text p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/40 space-y-3 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sky-400 text-sm">
                      {v.bookName} {v.chapter}:{v.verse}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono">
                      {v.version || selectedVersion}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLookupTerm(searchQuery || v.text.split(' ')[0], `${v.bookName} ${v.chapter}:${v.verse} - « ${v.text} »`)}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 text-xs font-semibold flex items-center gap-1 cursor-pointer border border-sky-400/30"
                      title="Obtenir la définition théologique liée à ce verset"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>Définition IA</span>
                    </button>
                    <button
                      onClick={() => copyVerse(v, idx)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-sky-300 text-xs cursor-pointer"
                      title="Copier le verset"
                    >
                      {copiedVerseIndex === idx ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {onAskAiWithVerse && (
                      <button
                        onClick={() => onAskAiWithVerse(`${v.bookName} ${v.chapter}:${v.verse} (${v.version || selectedVersion}) : "${v.text}"`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-sky-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                        <span>Questionner l'IA</span>
                      </button>
                    )}
                  </div>
                </div>
                <p className="font-reading text-base text-slate-200 leading-relaxed italic select-text">
                  « {v.text} »
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        /* STANDARD BIBLE READER VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR: TESTAMENTS, BOOKS & CHAPTERS */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Testament Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => {
                  setTestament('Ancien Testament');
                  const firstOld = BIBLE_BOOKS.find(b => b.testament === 'Ancien Testament');
                  if (firstOld) {
                    setSelectedBook(firstOld);
                    setSelectedChapter(1);
                  }
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center ${
                  testament === 'Ancien Testament'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('bibleOldTestament')} (39)
              </button>
              <button
                onClick={() => {
                  setTestament('Nouveau Testament');
                  const firstNew = BIBLE_BOOKS.find(b => b.testament === 'Nouveau Testament');
                  if (firstNew) {
                    setSelectedBook(firstNew);
                    setSelectedChapter(1);
                  }
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center ${
                  testament === 'Nouveau Testament'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('bibleNewTestament')} (27)
              </button>
            </div>

            {/* Books List for Selected Testament */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t('bibleBooksLabel')} ({booksInTestament.length}) :
                </span>
                <span className="text-xs text-sky-400 font-medium">
                  {currentBookName}
                </span>
              </div>
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {booksInTestament.map((b) => {
                  const isSelected = selectedBook.id === b.id;
                  const localizedBName = getLocalizedBookName(b, language);
                  return (
                    <button
                      key={b.id}
                      onClick={() => handleBookChange(b)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
                      }`}
                    >
                      <span className="truncate">{localizedBName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {b.chaptersCount} ch.
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chapters Grid Selector */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t('bibleChaptersLabel')} ({currentBookName}) :
                </span>
                <span className="text-xs text-sky-400 font-semibold">
                  Ch. {selectedChapter} / {selectedBook.chaptersCount}
                </span>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((chNum) => {
                  const isChSelected = selectedChapter === chNum;
                  return (
                    <button
                      key={chNum}
                      onClick={() => setSelectedChapter(chNum)}
                      className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                        isChSelected
                          ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800/80'
                      }`}
                    >
                      {chNum}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT CANVAS: CHAPTER READING */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Chapter Header Bar */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-sky-400 block">
                    {getLocalizedTestament(selectedBook.testament, language)} • {selectedBook.category}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-mono font-semibold border border-slate-700">
                    {activeVersion.name}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-100">
                  {currentBookName} {selectedChapter}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Font Size Adjuster */}
                <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl text-xs border border-slate-700">
                  <button
                    onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                    className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold flex items-center justify-center cursor-pointer"
                    title={t('bibleFontSize')}
                  >
                    A-
                  </button>
                  <span className="px-1 text-slate-400 text-[10px]">{fontSize}px</span>
                  <button
                    onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                    className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold flex items-center justify-center cursor-pointer"
                    title={t('bibleFontSize')}
                  >
                    A+
                  </button>
                </div>

                {/* Audio Button */}
                <button
                  onClick={readChapterAloud}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSpeaking 
                      ? 'bg-sky-500 text-slate-950 border-sky-400 animate-pulse' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title={isSpeaking ? t('bibleAudioStop') : t('bibleAudioPlay')}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
                  <span className="hidden sm:inline">{isSpeaking ? t('bibleAudioStop') : t('bibleAudioPlay')}</span>
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isFullScreen 
                      ? 'bg-sky-500 text-slate-950 border-sky-400' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title={isFullScreen ? t('exitFullscreenBtn') : t('fullscreenBtn')}
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-sky-400" />}
                  <span className="hidden sm:inline">{isFullScreen ? t('exitFullscreenBtn') : t('fullscreenBtn')}</span>
                </button>

                {onAskAiWithVerse && (
                  <button
                    onClick={() => onAskAiWithVerse(`Explique le sens spirituel et le contexte théologique de ${currentBookName} chapitre ${selectedChapter} selon la sainte doctrine biblique (${activeVersion.name})`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-bold border border-sky-500/30 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden md:inline">{t('bibleAskAiVerse')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Verses Reading Container */}
            <div className="bible-reading-container select-text p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-slate-800 shadow-2xl space-y-6">
              {currentVerses.map((verse, index) => (
                <div 
                  key={index}
                  data-verse-ref={`${currentBookName} ${selectedChapter}:${verse.verse} - « ${verse.text} »`}
                  className="group flex items-start gap-4 p-2 rounded-xl hover:bg-slate-900/80 transition-colors"
                >
                  <span className="font-display font-bold text-sky-400/90 text-sm select-none pt-1 min-w-[28px]">
                    {verse.verse}
                  </span>
                  <div className="flex-1">
                    <p 
                      className="font-reading text-slate-200 leading-relaxed select-text"
                      style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                    >
                      {verse.text}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => handleLookupTerm(verse.text.split(' ')[0] || 'foi', `${currentBookName} ${selectedChapter}:${verse.verse} - « ${verse.text} »`)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-sky-300 cursor-pointer"
                      title={t('bibleTheologicalLookup')}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    </button>
                    <button
                      onClick={() => copyVerse(verse, index)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-sky-300 cursor-pointer"
                      title={t('bibleCopyVerse')}
                    >
                      {copiedVerseIndex === index ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Bottom chapter navigation */}
              <div className="pt-8 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <button
                  disabled={selectedChapter <= 1}
                  onClick={() => setSelectedChapter(selectedChapter - 1)}
                  className="disabled:opacity-30 disabled:cursor-not-allowed hover:text-sky-300 font-semibold cursor-pointer"
                >
                  ← {t('biblePrevChapter')}
                </button>
                <span className="text-slate-400 font-medium">
                  {activeVersion.fullName}
                </span>
                <button
                  disabled={selectedChapter >= selectedBook.chaptersCount}
                  onClick={() => setSelectedChapter(selectedChapter + 1)}
                  className="disabled:opacity-30 disabled:cursor-not-allowed hover:text-sky-300 font-semibold cursor-pointer"
                >
                  {t('bibleNextChapter')} →
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Floating Selection Tooltip when text is selected */}
      {floatingSelection && (
        <div
          style={{
            position: 'fixed',
            top: `${floatingSelection.top}px`,
            left: `${floatingSelection.left}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999
          }}
          className="theological-floating-pill animate-fade-in pointer-events-auto"
        >
          <button
            onMouseDown={(e) => {
              // Crucial: prevent click from deselecting text before click fires
              e.preventDefault();
            }}
            onClick={() => {
              handleLookupTerm(floatingSelection.term, floatingSelection.verseContext);
              setFloatingSelection(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950 text-white border-2 border-sky-400 shadow-2xl hover:bg-slate-900 transition-all text-xs font-bold cursor-pointer hover:scale-105 active:scale-95"
            title="Analyser ce mot avec l'intelligence théologique Gemini"
          >
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            <span className="whitespace-nowrap">
              Définition IA : « <span className="text-sky-300 font-extrabold">{floatingSelection.term}</span> »
            </span>
          </button>
        </div>
      )}

      {/* Theological Definition Modal */}
      <TheologicalDefinitionModal
        isOpen={isTheologicalModalOpen}
        onClose={() => setIsTheologicalModalOpen(false)}
        definition={theologicalDefinition}
        source={theologicalSource}
        contextVerse={theologicalContextVerse}
        onAskAiWithQuestion={onAskAiWithVerse}
      />

    </div>
  );
};
