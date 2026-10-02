import React, { useState, useEffect } from 'react';
import { 
  ScrollText, 
  CheckCircle, 
  Calendar, 
  BookOpen, 
  Sparkles, 
  Share2, 
  Check, 
  Flame, 
  Heart, 
  Clock, 
  ArrowRight,
  RotateCcw,
  Search
} from 'lucide-react';
import { INITIAL_READING_PLAN } from '../data/readingPlanData';
import { ReadingPlanDay } from '../types';

interface ReadingPlanViewProps {
  onNavigateToBible?: (bookName?: string, chapter?: number) => void;
}

export const ReadingPlanView: React.FC<ReadingPlanViewProps> = ({ onNavigateToBible }) => {
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [completedDays, setCompletedDays] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('christian_bible_reading_progress');
      return saved ? JSON.parse(saved) : [1];
    } catch {
      return [1];
    }
  });
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('christian_bible_reading_progress', JSON.stringify(completedDays));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [completedDays]);

  const filteredPlan = INITIAL_READING_PLAN.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.theme.toLowerCase().includes(q) ||
      p.passages.some(pass => pass.reference.toLowerCase().includes(q))
    );
  });

  const activeDay: ReadingPlanDay = 
    INITIAL_READING_PLAN.find(p => p.dayNumber === selectedDayNumber) || INITIAL_READING_PLAN[0];

  const toggleComplete = (dayNum: number) => {
    setCompletedDays(prev => 
      prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
    );
  };

  const resetProgress = () => {
    if (confirm('Voulez-vous réinitialiser votre progression de lecture ?')) {
      setCompletedDays([]);
    }
  };

  const copyVerse = (text: string, ref: string, dayNum: number) => {
    navigator.clipboard.writeText(`« ${text} » — ${ref}`);
    setCopiedVerse(dayNum);
    setTimeout(() => setCopiedVerse(null), 2500);
  };

  const percentComplete = Math.round((completedDays.length / INITIAL_READING_PLAN.length) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Banner - Clean Christian Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white p-8 sm:p-10 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider shadow-xs">
              <ScrollText className="w-3.5 h-3.5 text-black" />
              <span className="text-black">Méditation Quotidienne & Sanctification</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-wide">
              Plan de Lecture Biblique
            </h1>
            <p className="text-sm sm:text-base text-sky-100 font-light leading-relaxed">
              Méditez la Sainte Parole de Dieu chaque jour, nourrissez votre esprit des Écritures et préparez votre cœur pour la rencontre avec l'Époux.
            </p>
          </div>

          {/* Progress Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 text-center min-w-[200px] shadow-lg flex-shrink-0">
            <div className="flex items-center justify-center gap-2 text-white mb-1">
              <Flame className="w-5 h-5 fill-white text-white" />
              <span className="text-xs uppercase font-bold tracking-wider">Progression</span>
            </div>
            <div className="text-3xl font-display font-black text-white">
              {percentComplete}%
            </div>
            <p className="text-xs text-sky-200 mt-1">
              {completedDays.length} / {INITIAL_READING_PLAN.length} jours médités
            </p>
            <div className="w-full bg-white/20 rounded-full h-2 mt-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-sky-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Reset Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un jour, thème ou passage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetProgress}
            className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            title="Réinitialiser la progression"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* Main Reading View Grid: List of Days (left) + Day Meditation (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Interactive Days Calendar / List */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3 max-h-[750px] overflow-y-auto pr-2">
          {filteredPlan.map(item => {
            const isDone = completedDays.includes(item.dayNumber);
            const isSelected = item.dayNumber === activeDay.dayNumber;

            return (
              <div
                key={item.dayNumber}
                onClick={() => setSelectedDayNumber(item.dayNumber)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-sky-50/80 border-sky-300 shadow-md ring-2 ring-sky-200'
                    : isDone
                    ? 'bg-emerald-50/50 border-emerald-200/70 hover:bg-emerald-50'
                    : 'bg-white border-slate-200 hover:border-sky-200 hover:shadow-xs'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      Jour {item.dayNumber}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-900 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-sky-700 font-medium truncate max-w-[220px]">
                    {item.passages.map(p => p.reference).join(' • ')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComplete(item.dayNumber);
                  }}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex-shrink-0 ${
                    isDone
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                  }`}
                  title={isDone ? 'Marqué comme lu' : 'Marquer comme lu'}
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Day Deep Meditation Card */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg space-y-6">
          
          {/* Top Bar of Active Day */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider">
                Jour {activeDay.dayNumber} sur {INITIAL_READING_PLAN.length}
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 leading-tight">
                {activeDay.title}
              </h2>
              <p className="text-xs sm:text-sm text-sky-800 font-medium">
                {activeDay.theme}
              </p>
            </div>

            <button
              onClick={() => toggleComplete(activeDay.dayNumber)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                completedDays.includes(activeDay.dayNumber)
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{completedDays.includes(activeDay.dayNumber) ? 'Médité & Complété' : 'Marquer comme lu'}</span>
            </button>
          </div>

          {/* Passages to Read */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>Passages Bibliques à Lire Aujourd'hui</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeDay.passages.map((p, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                      {p.category}
                    </span>
                    {onNavigateToBible && (
                      <button
                        onClick={() => {
                          const parts = p.reference.split(' ');
                          const book = parts[0];
                          const ch = parseInt(parts[1]) || 1;
                          onNavigateToBible(book, ch);
                        }}
                        className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ouvrir Bible</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{p.reference}</h4>
                  {p.preview && (
                    <p className="text-xs text-slate-600 italic font-serif line-clamp-2">
                      « {p.preview} »
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Key Verse Highlight */}
          {activeDay.memoryVerse && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-sky-50/50 border border-amber-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-slate-800" />
                  <span className="text-black">Verset de Mémorisation</span>
                </span>
                <button
                  onClick={() => activeDay.memoryVerse && copyVerse(activeDay.memoryVerse.text, activeDay.memoryVerse.reference, activeDay.dayNumber)}
                  className="p-1.5 rounded-lg bg-white border border-amber-200 text-black hover:bg-amber-100 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copier le verset"
                >
                  {copiedVerse === activeDay.dayNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span className="text-[11px] font-semibold text-black">{copiedVerse === activeDay.dayNumber ? 'Copié' : 'Partager'}</span>
                </button>
              </div>
              <p className="font-serif italic text-base sm:text-lg text-slate-900 leading-relaxed">
                « {activeDay.memoryVerse.text} »
              </p>
              <p className="text-xs font-bold text-sky-800 text-right">
                — {activeDay.memoryVerse.reference}
              </p>
            </div>
          )}

          {/* Devotional Thought */}
          {activeDay.devotionalThought && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Méditation & Exhortation Spirituelle</span>
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {activeDay.devotionalThought}
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
