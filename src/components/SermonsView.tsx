import React, { useState, useEffect } from 'react';
import { 
  Headphones, 
  Heart, 
  MessageSquare, 
  Sparkles, 
  BookOpen, 
  Calendar, 
  UserCheck, 
  Plus, 
  Send, 
  Share2, 
  Check, 
  Search, 
  Filter, 
  X, 
  Church, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Cloud,
  Users
} from 'lucide-react';
import { Sermon, SermonComment, BibleVersionId } from '../types';
import { BIBLE_VERSIONS } from '../data/bibleData';
import { LANGUAGE_TO_DEFAULT_BIBLE_VERSION } from '../data/dailyVerses';
import { PdfExportModal } from './PdfExportModal.tsx';
import { PreachersManagementModal } from './PreachersManagementModal';
import { useLanguage, TranslatedContent } from '../context/LanguageContext';

interface SermonsViewProps {
  isAdmin?: boolean;
  onNavigateToAdmin?: () => void;
  selectedBibleVersion?: BibleVersionId;
}

export const SermonsView: React.FC<SermonsViewProps> = ({ 
  isAdmin = false, 
  onNavigateToAdmin,
  selectedBibleVersion = 'LSG'
}) => {
  const { language, t } = useLanguage();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreacher, setSelectedPreacher] = useState('Tous');
  const [selectedTag, setSelectedTag] = useState('Tous');
  const [isPreachersModalOpen, setIsPreachersModalOpen] = useState(false);
  
  // Active reading sermon
  const [activeSermon, setActiveSermon] = useState<Sermon | null>(null);
  const [sermonToExport, setSermonToExport] = useState<Sermon | null>(null);

  // Likes state (cached locally)
  const [likedSermonIds, setLikedSermonIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('christian_liked_sermons');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Comments state
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // AI Q&A State for a specific sermon
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chosenVersion, setChosenVersion] = useState<BibleVersionId>(selectedBibleVersion);

  useEffect(() => {
    if (selectedBibleVersion && selectedBibleVersion !== 'LSG') {
      setChosenVersion(selectedBibleVersion);
    } else if (language && LANGUAGE_TO_DEFAULT_BIBLE_VERSION[language]) {
      setChosenVersion(LANGUAGE_TO_DEFAULT_BIBLE_VERSION[language]);
    }
  }, [selectedBibleVersion, language]);

  // Add Sermon Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPreacher, setNewPreacher] = useState('Le Serviteur de Dieu KAYEMBE MWANANGIZI Lawi');
  const [newScripture, setNewScripture] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newTags, setNewTags] = useState('Sanctification, Édification');
  const [addLoading, setAddLoading] = useState(false);

  const fetchSermons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sermons');
      if (res.ok) {
        const data = await res.json();
        setSermons(data.sermons || []);
        if (data.sermons?.length > 0 && !activeSermon) {
          setActiveSermon(data.sermons[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSermons();
  }, []);

  const handleLike = async (sermonId: string) => {
    if (likedSermonIds.includes(sermonId)) return;

    try {
      const res = await fetch(`/api/sermons/${sermonId}/like`, { method: 'POST' });
      if (res.ok) {
        const updated = [...likedSermonIds, sermonId];
        setLikedSermonIds(updated);
        localStorage.setItem('christian_liked_sermons', JSON.stringify(updated));

        setSermons(prev => prev.map(s => s.id === sermonId ? { ...s, likesCount: (s.likesCount || 0) + 1 } : s));
        if (activeSermon?.id === sermonId) {
          setActiveSermon(prev => prev ? { ...prev, likesCount: (prev.likesCount || 0) + 1 } : null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSermon || !commentText.trim()) return;

    try {
      setCommentSubmitting(true);
      const res = await fetch(`/api/sermons/${activeSermon.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: commentName.trim() || 'Fidèle en Christ',
          comment: commentText.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedComments = [data.comment, ...(activeSermon.comments || [])];
        
        setActiveSermon({ ...activeSermon, comments: updatedComments });
        setSermons(prev => prev.map(s => s.id === activeSermon.id ? { ...s, comments: updatedComments } : s));
        
        setCommentText('');
        setCommentName('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleAskSermonAi = async (q?: string) => {
    const questionToSend = q || aiQuestion;
    if (!activeSermon || !questionToSend.trim()) return;

    try {
      setAiLoading(true);
      setAiError(null);
      setAiAnswer(null);

      const res = await fetch(`/api/sermons/${activeSermon.id}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionToSend,
          bibleVersion: chosenVersion,
          language
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnswer(data.answer);
      } else {
        setAiError("Impossible d'obtenir une réponse de l'assistant pour le moment.");
      }
    } catch (e: any) {
      setAiError("Erreur de connexion : " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPreacher.trim() || !newContent.trim()) {
      alert('Veuillez renseigner le titre, le prédicateur et le contenu du sermon.');
      return;
    }

    try {
      setAddLoading(true);
      const res = await fetch('/api/sermons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          preacher: newPreacher.trim(),
          scripture: newScripture.trim() || '1 Pierre 5:10',
          content: newContent.trim(),
          excerpt: newExcerpt.trim() || newContent.trim().substring(0, 180) + '...',
          tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      if (res.ok) {
        const created = await res.json();
        setSermons(prev => [created, ...prev]);
        setActiveSermon(created);
        setIsAddModalOpen(false);
        setNewTitle('');
        setNewContent('');
        setNewExcerpt('');
        setNewScripture('');
      } else {
        alert("Erreur lors de l'enregistrement du sermon.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur réseau.");
    } finally {
      setAddLoading(false);
    }
  };

  const filteredSermons = sermons.filter(s => {
    const matchesSearch = !searchQuery.trim() || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.preacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.scripture.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPreacher = selectedPreacher === 'Tous' || s.preacher.toLowerCase().includes(selectedPreacher.toLowerCase());
    const matchesTag = selectedTag === 'Tous' || s.tags?.some(t => t.toLowerCase() === selectedTag.toLowerCase());

    return matchesSearch && matchesPreacher && matchesTag;
  });

  const preachersList = [
    'Tous',
    'Docteur LEMBA KAVUMBULA MOÏSE',
    'KAYEMBE MWANANGIZI Lawi',
    'LUKANGILA FARIALA Manassé'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Banner - Clean Christian Light Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white p-8 sm:p-10 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider shadow-xs">
              <Headphones className="w-3.5 h-3.5 text-black" />
              <span className="text-black">{t('sermonsHeaderBadge')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-wide">
              {t('sermonsTitle')}
            </h1>
            <p className="text-sm sm:text-base text-sky-100 font-light leading-relaxed">
              {t('sermonsSubtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
            {isAdmin && (
              <button
                onClick={() => setIsPreachersModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-black hover:bg-slate-900 border-2 border-amber-400 text-amber-300 font-extrabold text-xs flex items-center gap-2 shadow-xl transition-all cursor-pointer"
                title={t('sermonsManagePreachersBtn')}
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>{t('sermonsManagePreachersBtn')}</span>
              </button>
            )}

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('sermonsPublishBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('sermonsSearchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <select
            value={selectedPreacher}
            onChange={(e) => setSelectedPreacher(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="Tous">{t('sermonsAllPreachers')}</option>
            <option value="LEMBA KAVUMBULA MOÏSE">Dr. LEMBA KAVUMBULA MOÏSE</option>
            <option value="KAYEMBE MWANANGIZI">Serviteur KAYEMBE MWANANGIZI Lawi</option>
            <option value="LUKANGILA FARIALA">Pasteur LUKANGILA FARIALA Manassé</option>
          </select>
        </div>
      </div>

      {/* Main Sermons Grid: List (left) + Reader/Interaction Panel (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Sermons Directory */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 max-h-[850px] overflow-y-auto pr-1">
          {sermons.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-600 space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
                <Headphones className="w-6 h-6 text-slate-800" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">
                {t('sermonsEmptyTitle')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('sermonsEmptyDesc')}
              </p>
              {isAdmin && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('sermonsPublishBtn')}</span>
                </button>
              )}
            </div>
          ) : filteredSermons.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              {t('noBooksFound')}
            </div>
          ) : (
            filteredSermons.map(sermon => {
              const isSelected = activeSermon?.id === sermon.id;
              const hasLiked = likedSermonIds.includes(sermon.id);

              return (
                <div
                  key={sermon.id}
                  onClick={() => {
                    setActiveSermon(sermon);
                    setAiAnswer(null);
                    setAiError(null);
                  }}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-sky-50/80 border-sky-300 shadow-md ring-2 ring-sky-200'
                      : 'bg-white border-slate-200 hover:border-sky-200 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      {sermon.scripture}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {sermon.date}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 leading-snug">
                      {sermon.title}
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold mt-1 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>{sermon.preacher}</span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {sermon.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                        <span>{sermon.likesCount || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sermon.comments?.length || 0}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSermonToExport(sermon);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-black text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        title="Exporter ce sermon en PDF & Google Drive"
                      >
                        <Cloud className="w-3 h-3 text-slate-800" />
                        <span>PDF</span>
                      </button>

                      <span className="text-sky-700 font-bold flex items-center gap-0.5 text-xs">
                        <span>Lire</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Full Sermon Reader, Like, Comments & AI Study */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {activeSermon ? (
            <div className="bg-white rounded-3xl p-6 sm:p-9 border border-slate-200 shadow-lg space-y-8">
              
              {/* Header of Sermon */}
              <div className="space-y-4 border-b border-slate-100 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider">
                      {activeSermon.scripture}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      {activeSermon.durationMin || 45} min d'écoute / lecture
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLike(activeSermon.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        likedSermonIds.includes(activeSermon.id)
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedSermonIds.includes(activeSermon.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{activeSermon.likesCount || 0} J'aime</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 leading-tight">
                    {activeSermon.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                      {activeSermon.preacher}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {activeSermon.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sermon Scripture Box */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-black space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-black flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-800" />
                  Passage central de l'exhortation
                </span>
                <p className="font-serif italic text-sm sm:text-base font-semibold text-black">
                  {activeSermon.scripture}
                </p>
              </div>

              {/* Sermon Content */}
              <div className="prose max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-4 font-normal">
                {activeSermon.content.split('\n\n').map((para, i) => (
                  <p key={i} className="whitespace-pre-line">{para}</p>
                ))}
              </div>

              {/* ========================================================== */}
              {/* AI SERMON ASSISTANT (STRICTLY GROUNDED ON THIS SERMON & BIBLE) */}
              {/* ========================================================== */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-sky-50/80 via-white to-amber-50/50 border border-sky-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm sm:text-base text-slate-900">
                        Étude IA du Sermon & Fondement Biblique
                      </h4>
                      <p className="text-xs text-slate-500">
                        Répond EXCLUSIVEMENT à partir du contenu de ce sermon et de la Bible.
                      </p>
                    </div>
                  </div>

                  {/* Bible Version Picker */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-medium">Version :</span>
                    <select
                      value={chosenVersion}
                      onChange={(e) => setChosenVersion(e.target.value as BibleVersionId)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-xs font-bold text-sky-800 outline-none"
                    >
                      {BIBLE_VERSIONS.map(v => (
                        <option key={v.id} value={v.id}>{v.id} - {v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Suggested Questions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleAskSermonAi("Quels sont les trois points majeurs développés par l'orateur dans ce sermon ?")}
                    className="text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 font-medium transition-colors cursor-pointer"
                  >
                    💡 3 points majeurs
                  </button>
                  <button
                    onClick={() => handleAskSermonAi("Quels avertissements spirituels pour la sanctification ce message adresse-t-il ?")}
                    className="text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 font-medium transition-colors cursor-pointer"
                  >
                    ⚠️ Avertissements spirituels
                  </button>
                  <button
                    onClick={() => handleAskSermonAi("Comment ce sermon s'harmonise-t-il avec 1 Pierre 5:10 et les 5 étapes ?")}
                    className="text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 font-medium transition-colors cursor-pointer"
                  >
                    🕊️ Lien avec les 5 étapes
                  </button>
                </div>

                {/* Question Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Posez votre question sur ce sermon spécifique..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-xs sm:text-sm text-slate-900 outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAskSermonAi();
                    }}
                  />
                  <button
                    onClick={() => handleAskSermonAi()}
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer flex-shrink-0"
                  >
                    {aiLoading ? (
                      <span>Analyse...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Demander</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Answer Display */}
                {aiAnswer && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-sky-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-xs text-sky-800 font-bold border-b border-sky-100 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Réponse théologique (Garantie saine doctrine)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px]">
                        Version {chosenVersion}
                      </span>
                    </div>
                    <div className="prose max-w-none text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {aiAnswer}
                    </div>
                  </div>
                )}

                {aiError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {aiError}
                  </div>
                )}
              </div>

              {/* ========================================================== */}
              {/* COMMENTS & COMMUNITY EDIFICATION */}
              {/* ========================================================== */}
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-sky-600" />
                    <span>Commentaires & Témoignages ({activeSermon.comments?.length || 0})</span>
                  </h3>
                </div>

                {/* Comment Form */}
                <form onSubmit={handleAddComment} className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Votre Nom ou Prénom (Ex: Frère David)"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 outline-none"
                    />
                  </div>
                  <textarea
                    required
                    rows={3}
                    placeholder="Partagez ce que ce message a suscité dans votre cœur..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 outline-none resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={commentSubmitting || !commentText.trim()}
                      className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{commentSubmitting ? 'Publication...' : 'Publier le commentaire'}</span>
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-3">
                  {!activeSermon.comments || activeSermon.comments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4">
                      Soyez le premier à laisser un mot d'édification sur ce sermon.
                    </p>
                  ) : (
                    activeSermon.comments.map(c => (
                      <div key={c.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{c.authorName}</span>
                          <span className="text-[11px] text-slate-400">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-light">
                          <TranslatedContent text={c.comment} />
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Headphones className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">
                {sermons.length === 0 ? t('sermonsEmptyDesc') : t('sermonsSelectPrompt')}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================== */}
      {/* ADD SERMON MODAL (PASTOR / ADMIN) */}
      {/* ========================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-black flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-slate-800" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    Ajouter une Nouvelle Prédication
                  </h3>
                  <p className="text-xs text-slate-500">
                    Le sermon sera indexé automatiquement par l'IA et accessible à toute l'assemblée.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSermon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Titre du Sermon *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: La Puissance de la Grâce dans l'Épreuve"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Prédicateur / Orateur *
                  </label>
                  <select
                    value={newPreacher}
                    onChange={(e) => setNewPreacher(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none bg-white"
                  >
                    <option value="Le Serviteur de Dieu KAYEMBE MWANANGIZI Lawi">Le Serviteur de Dieu KAYEMBE MWANANGIZI Lawi</option>
                    <option value="Le Pasteur LUKANGILA FARIALA Manassé">Le Pasteur LUKANGILA FARIALA Manassé</option>
                    <option value="Docteur LEMBA KAVUMBULA MOÏSE">Docteur LEMBA KAVUMBULA MOÏSE</option>
                    <option value="Ancien de l'Église Cereshe/OUA">Ancien de l'Église Cereshe/OUA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Passage Biblique de Référence *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 1 Pierre 5:10 ou Romains 8:28"
                    value={newScripture}
                    onChange={(e) => setNewScripture(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Résumé ou Thèmes Clés (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Bref résumé d'introduction..."
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Texte Intégral du Sermon *
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Collez ici le texte complet ou les notes détaillées du sermon..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-sky-500 resize-y font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-6 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>{addLoading ? 'Enregistrement...' : 'Publier et Indexer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preachers & Cleanup Management Modal (Admin) */}
      <PreachersManagementModal
        isOpen={isPreachersModalOpen}
        onClose={() => setIsPreachersModalOpen(false)}
        onPreachersChanged={() => fetchSermons()}
        onSermonsCleaned={() => fetchSermons()}
      />

    </div>
  );
};
