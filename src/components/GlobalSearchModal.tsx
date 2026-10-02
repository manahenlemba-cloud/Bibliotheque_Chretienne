import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  BookOpen, 
  ScrollText, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  Headphones, 
  Bookmark, 
  ChevronRight, 
  Compass, 
  CornerDownLeft, 
  HelpCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Book, BibleVerse } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { searchBibleVerses, BIBLE_BOOKS } from '../data/bibleData';
import { INITIAL_SPIRITUAL_STEPS } from '../data/spiritualStepsData';

export type SearchCategoryFilter = 'all' | 'books' | 'verses' | 'theology' | 'sermons';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onNavigate: (view: string, bookId?: string) => void;
  onOpenBook?: (book: Book) => void;
  onAskAi?: (question: string) => void;
}

const POPULAR_THEOLOGICAL_TOPICS = [
  {
    id: 'sanctification',
    term: 'Sanctification',
    definition: 'Séparation du péché et consécration totale à Dieu par le sang de Christ et l’action du Saint-Esprit (Hébreux 12:14).',
    stepLink: 'step-3-perfectionnement',
    view: 'spiritual-steps'
  },
  {
    id: 'les-5-etapes',
    term: 'Les 5 Étapes Spirituelles (1 Pierre 5:10)',
    definition: 'Appel, Souffrance d\'un peu de temps, Perfectionnement, Affermissement et Fortification.',
    stepLink: 'step-1-appel',
    view: 'spiritual-steps'
  },
  {
    id: 'justification',
    term: 'Justification par la Foi',
    definition: 'Acte judiciaire de Dieu déclarant le pécheur juste sur la base des mérites de Jésus-Christ (Romains 5:1).',
    stepLink: 'step-1-appel',
    view: 'spiritual-steps'
  },
  {
    id: 'appel-divin',
    term: 'L\'Appel Divin & Vocation',
    definition: 'L’initiative souveraine de la grâce divine attirant le pécheur à Christ (1 Pierre 5:10a, Jean 6:44).',
    stepLink: 'step-1-appel',
    view: 'spiritual-steps'
  },
  {
    id: 'souffrance-epreuve',
    term: 'La Souffrance Salutaire & Brisement',
    definition: 'L’épreuve de la foi d\'un peu de temps qui consume les scories et forme le caractère de Christ.',
    stepLink: 'step-2-souffrance',
    view: 'spiritual-steps'
  },
  {
    id: 'perfectionnement',
    term: 'Perfectionnement & Rétablissement',
    definition: 'L’œuvre de restauration divine réparant les brèches de l\'âme pour la maturité spirituelle.',
    stepLink: 'step-3-perfectionnement',
    view: 'spiritual-steps'
  },
  {
    id: 'affermissement',
    term: 'Affermissement & Enracinement',
    definition: 'L’enracinement inébranlable dans la saine doctrine pour résister aux vents de tromperie.',
    stepLink: 'step-4-affermissement',
    view: 'spiritual-steps'
  },
  {
    id: 'fortification',
    term: 'Fortification Divine & Victoire',
    definition: 'La puissance dynamique du Saint-Esprit rendant le croyant victorieux face aux puissances des ténèbres.',
    stepLink: 'step-5-fortification',
    view: 'spiritual-steps'
  },
  {
    id: 'retour-christ',
    term: 'Parousie & Veille de la Dernière Heure',
    definition: 'La préparation active et sainte de l’Église pour l’enlèvement et le retour glorieux de Jésus-Christ.',
    stepLink: 'step-4-affermissement',
    view: 'spiritual-steps'
  },
  {
    id: 'mon-historique',
    term: 'Mon Historique de Lecture',
    definition: 'Consultez la liste des derniers livres et études que vous avez ouverts pour reprendre votre lecture.',
    stepLink: '',
    view: 'history'
  }
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  books,
  onNavigate,
  onOpenBook,
  onAskAi
}) => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setActiveCategory('all');
    }
  }, [isOpen]);

  // Handle ESC and global key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 1. Books Search
  const matchingBooks = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return books.filter(b => 
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      (b.description && b.description.toLowerCase().includes(q)) ||
      (b.ai_indexed_content?.keyThemes && b.ai_indexed_content.keyThemes.some(th => th.toLowerCase().includes(q)))
    ).slice(0, 6);
  }, [books, query]);

  // 2. Bible Verses Search
  const matchingVerses = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return [];
    try {
      const results = searchBibleVerses(query.trim(), 'LSG', language);
      return results.slice(0, 5);
    } catch {
      return [];
    }
  }, [query, language]);

  // 3. Theological Topics Search
  const matchingTopics = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return POPULAR_THEOLOGICAL_TOPICS.filter(item => 
      item.term.toLowerCase().includes(q) ||
      item.definition.toLowerCase().includes(q)
    ).slice(0, 4);
  }, [query]);

  // 4. Spiritual Steps Search
  const matchingSteps = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return INITIAL_SPIRITUAL_STEPS.filter(step =>
      step.name.toLowerCase().includes(q) ||
      step.title.toLowerCase().includes(q) ||
      step.subtitle.toLowerCase().includes(q) ||
      step.description.toLowerCase().includes(q) ||
      step.biblicalVerses.some(v => v.reference.toLowerCase().includes(q) || v.text.toLowerCase().includes(q))
    ).slice(0, 3);
  }, [query]);

  const totalResultsCount = 
    matchingBooks.length + 
    matchingVerses.length + 
    matchingTopics.length + 
    matchingSteps.length;

  if (!isOpen) return null;

  const handleSelectBook = (book: Book) => {
    if (onOpenBook) {
      onOpenBook(book);
    } else {
      onNavigate('library', book.id);
    }
    onClose();
  };

  const handleSelectVerse = (verse: BibleVerse) => {
    onNavigate('bible');
    onClose();
  };

  const handleSelectTopic = (topic: typeof POPULAR_THEOLOGICAL_TOPICS[0]) => {
    onNavigate(topic.view);
    onClose();
  };

  const handleSelectStep = (stepId: string) => {
    onNavigate('spiritual-steps');
    onClose();
  };

  const handleTriggerAiWithQuery = () => {
    const q = query.trim() || "Expliquez-moi le parcours des 5 étapes spirituelles selon 1 Pierre 5:10";
    if (onAskAi) {
      onAskAi(q);
    } else {
      onNavigate('ai');
    }
    onClose();
  };

  const handleAskAdmin = () => {
    onNavigate('ask-admin');
    onClose();
  };

  const hasFilter = (cat: SearchCategoryFilter) => activeCategory === 'all' || activeCategory === cat;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-20 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto sm:my-0 max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="relative border-b border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-sky-500/10 text-sky-600 border border-sky-500/20 flex-shrink-0">
            <Search className="w-5 h-5 text-sky-600 animate-pulse" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher livres, versets, thèmes (ex: 1 Pierre 5:10, Sanctification)..."
            className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-semibold focus:outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
            <kbd className="font-sans">ESC</kbd>
            <span>pour fermer</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="sm:hidden p-2 rounded-xl bg-slate-200 text-slate-600 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Category Chips */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 pr-1">Filtre :</span>
          {[
            { id: 'all', label: 'Tout explorer', count: query ? totalResultsCount : undefined },
            { id: 'books', label: 'Livres', count: matchingBooks.length },
            { id: 'verses', label: 'Versets Bibliques', count: matchingVerses.length },
            { id: 'theology', label: 'Théologie & 5 Étapes', count: matchingTopics.length + matchingSteps.length },
            { id: 'sermons', label: 'Prédications', count: undefined }
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => setActiveCategory(chip.id as SearchCategoryFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === chip.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>{chip.label}</span>
              {chip.count !== undefined && query.trim() !== '' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeCategory === chip.id ? 'bg-sky-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {chip.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Results / Suggestion Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Empty Query View: Popular Topics & Suggestions */}
          {!query.trim() && (
            <div className="space-y-6">
              {/* Popular Theological Themes */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-800 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Sujets & Thèmes Théologiques Majeurs</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {POPULAR_THEOLOGICAL_TOPICS.slice(0, 6).map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => handleSelectTopic(topic)}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-sky-50/80 border border-slate-200/80 hover:border-sky-300 text-left transition-all group cursor-pointer flex items-start gap-3"
                    >
                      <div className="p-2 rounded-xl bg-white text-sky-700 shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0 border border-slate-100">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-sky-800 block truncate">
                          {topic.term}
                        </span>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {topic.definition}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all mt-1" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Cardinal Scripture Verses */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  <ScrollText className="w-3.5 h-3.5 text-sky-600" />
                  <span>Versets Clés & Mémorisation</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { ref: '1 Pierre 5:10', label: 'Les 5 étapes : Appel, Souffrance, Perfectionnement...' },
                    { ref: 'Romains 12:1-2', label: 'Le culte raisonnable et le renouvellement de l’intelligence' },
                    { ref: 'Hébreux 12:14', label: 'Recherchez la sanctification, sans laquelle nul ne verra le Seigneur' },
                    { ref: 'Jean 3:16', label: 'Car Dieu a tant aimé le monde...' }
                  ].map(v => (
                    <button
                      key={v.ref}
                      onClick={() => {
                        setQuery(v.ref);
                      }}
                      className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all group cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-sky-700 block">{v.ref}</span>
                        <span className="text-[11px] text-slate-500 block truncate">{v.label}</span>
                      </div>
                      <Search className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Flagship Books */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                  <span>Ouvrages de Sanctification en Vitrine</span>
                </div>
                <div className="space-y-2">
                  {books.slice(0, 3).map(book => (
                    <button
                      key={book.id}
                      onClick={() => handleSelectBook(book)}
                      className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-sky-50/70 border border-slate-200/80 text-left transition-all group cursor-pointer flex items-center gap-3.5"
                    >
                      <div className="w-10 h-13 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 shadow-2xs border border-slate-300/60">
                        {book.cover_image ? (
                          <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-sky-900 text-white text-[10px] font-bold">
                            LIVRE
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-sky-800 block truncate">
                          {book.title}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {book.author} • {book.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-sky-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 group-hover:border-sky-300">
                        Lire
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Query: Grouped Results */}
          {query.trim() && (
            <div className="space-y-6">
              
              {/* No results message if completely empty */}
              {totalResultsCount === 0 && (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Aucun résultat direct trouvé pour « {query} »</p>
                    <p className="text-xs text-slate-500 mt-1">Vous pouvez poser directement votre question théologique à l'assistant IA ou au pasteur.</p>
                  </div>
                </div>
              )}

              {/* 1. Books Section */}
              {hasFilter('books') && matchingBooks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                      <span>Livres ({matchingBooks.length})</span>
                    </span>
                    <button 
                      onClick={() => { onNavigate('library'); onClose(); }}
                      className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold cursor-pointer"
                    >
                      Voir dans la bibliothèque &rarr;
                    </button>
                  </div>
                  <div className="space-y-2">
                    {matchingBooks.map(book => (
                      <div
                        key={book.id}
                        onClick={() => handleSelectBook(book)}
                        className="p-3.5 rounded-2xl bg-white hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 transition-all cursor-pointer flex items-center gap-3.5 shadow-2xs group"
                      >
                        <div className="w-11 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 shadow-2xs border border-slate-300">
                          {book.cover_image ? (
                            <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-sky-950 text-white flex items-center justify-center text-[10px] font-bold">
                              LIVRE
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-800 block truncate">
                            {book.title}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                            {book.author} • <span className="text-sky-700 font-medium">{book.category}</span>
                          </span>
                          {book.description && (
                            <p className="text-[11px] text-slate-600 line-clamp-1 mt-1 font-light">
                              {book.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectBook(book);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-2xs transition-colors"
                          >
                            Lire
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Scripture Verses Section */}
              {hasFilter('verses') && matchingVerses.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ScrollText className="w-3.5 h-3.5 text-sky-600" />
                      <span>Versets Bibliques ({matchingVerses.length})</span>
                    </span>
                    <button 
                      onClick={() => { onNavigate('bible'); onClose(); }}
                      className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold cursor-pointer"
                    >
                      Ouvrir la Sainte Bible &rarr;
                    </button>
                  </div>
                  <div className="space-y-2">
                    {matchingVerses.map((v, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectVerse(v)}
                        className="p-3.5 rounded-2xl bg-white hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 transition-all cursor-pointer shadow-2xs group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-sky-700 group-hover:text-sky-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
                            {v.bookName} {v.chapter}:{v.verse}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {v.version}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-serif leading-relaxed line-clamp-2">
                          « {v.text} »
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Theological Topics & Spiritual Steps */}
              {hasFilter('theology') && (matchingTopics.length > 0 || matchingSteps.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sujets Théologiques & 5 Étapes Spirituelles ({matchingTopics.length + matchingSteps.length})</span>
                    </span>
                    <button 
                      onClick={() => { onNavigate('spiritual-steps'); onClose(); }}
                      className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold cursor-pointer"
                    >
                      Voir le Parcours &rarr;
                    </button>
                  </div>
                  <div className="space-y-2">
                    {matchingSteps.map(st => (
                      <div
                        key={st.id}
                        onClick={() => handleSelectStep(st.id)}
                        className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/70 border border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs group flex items-start gap-3"
                      >
                        <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {st.stepNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 block truncate">
                            {st.title}
                          </span>
                          <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                            {st.subtitle}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-1" />
                      </div>
                    ))}

                    {matchingTopics.map(tp => (
                      <div
                        key={tp.id}
                        onClick={() => handleSelectTopic(tp)}
                        className="p-3.5 rounded-2xl bg-white hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 transition-all cursor-pointer shadow-2xs group flex items-start gap-3"
                      >
                        <div className="p-2 rounded-xl bg-sky-50 text-sky-700 flex-shrink-0 border border-sky-100 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-sky-900 block">
                            {tp.term}
                          </span>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                            {tp.definition}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 flex-shrink-0 mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fast Action Shortcuts: AI Assistant & Pastor */}
              <div className="pt-2 border-t border-slate-200">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-900 via-slate-900 to-sky-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex-shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">
                        Besoin d'un éclaircissement théologique sur « {query} » ?
                      </span>
                      <span className="text-[11px] text-sky-200/80 block mt-0.5">
                        Interrogez l'Assistant IA fondé sur la saine doctrine ou contactez le Dr. LEMBA.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleTriggerAiWithQuery}
                      className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Consulter l'IA</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAskAdmin}
                      className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors cursor-pointer text-center"
                    >
                      <span>Écrire au Pasteur</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer Shortcuts Info */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono text-slate-700 shadow-2xs">ESC</kbd> Fermer
            </span>
            <span className="hidden sm:flex items-center gap-1 font-medium">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono text-slate-700 shadow-2xs">⌘K</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono text-slate-700 shadow-2xs">Ctrl+K</kbd> Raccourci
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Recherche transversale en direct
          </div>
        </div>

      </div>
    </div>
  );
};
