import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Book } from '../types';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Bot, 
  UserCheck, 
  ShieldCheck, 
  ArrowRight, 
  BookOpen, 
  Mail, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  Copy,
  Check,
  BookMarked,
  ScrollText,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  HeartHandshake
} from 'lucide-react';

interface AskAdminViewProps {
  onNavigate: (view: string, bookId?: string) => void;
  books?: Book[];
  initialBookId?: string;
}

const SAMPLE_AI_QUESTIONS = [
  "Quelles sont les 5 étapes selon 1 Pierre 5:10 et comment les vivre ?",
  "Que dit la Bible et le livre sur la vraie repentance et le renoncement ?",
  "Comment persévérer dans la sanctification face aux épreuves de la fin des temps ?",
  "Quelle est la signification de la souffrance chrétienne selon 1 Pierre 5:10 ?"
];

const ADMIN_DIRECT_TOPICS = [
  "Conseil Pastoral & Vie Chrétienne",
  "Demande de Prière & Intercession",
  "Question Doctrinale ou Théologique",
  "Combat Spirituel & Sanctification",
  "Entretien Pastoral Privé & Confidentiel"
];

const ADMIN_OFFICIAL_EMAIL = "bibliothequechretien@gmail.com";

export const AskAdminView: React.FC<AskAdminViewProps> = ({ onNavigate, books = [], initialBookId }) => {
  const { currentUser, isAuthenticated, visitorId, addTrackedQuestion, openAuthModal, setSessionUser } = useAuth();
  const { language } = useLanguage();

  // Active Rubric: 'book' = Rubrique 1 (Question sur les Livres & Bible par IA) | 'admin' = Rubrique 2 (Question à l'Admin avec Notification Gmail)
  const [activeSection, setActiveSection] = useState<'book' | 'admin'>('book');

  // --- RUBRIQUE 1: AI BOOK & BIBLE QUESTION STATE ---
  const [selectedBookId, setSelectedBookId] = useState<string>(initialBookId || 'all');
  const [bookChapter, setBookChapter] = useState('');
  const [bookQuestionText, setBookQuestionText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAnswerData, setAiAnswerData] = useState<{
    question: string;
    answer: string;
    citations: Array<{ source: string; author: string; chapter: string; verses?: string }>;
    bookScope: string;
    ragFound: boolean;
  } | null>(null);
  const [hasCopiedAi, setHasCopiedAi] = useState(false);

  // --- RUBRIQUE 2: DIRECT ADMIN QUESTION STATE ---
  const [adminTopic, setAdminTopic] = useState(ADMIN_DIRECT_TOPICS[0]);
  const [adminSubject, setAdminSubject] = useState('');
  const [adminQuestionText, setAdminQuestionText] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [adminErrorMsg, setAdminErrorMsg] = useState<string | null>(null);
  const [adminSuccessData, setAdminSuccessData] = useState<{
    message: string;
    questionId: string;
    recipient: string;
  } | null>(null);

  // Sync initialBookId if provided
  useEffect(() => {
    if (initialBookId) {
      setSelectedBookId(initialBookId);
      setActiveSection('book');
    }
  }, [initialBookId]);

  const selectedBookObj = books.find(b => b.id === selectedBookId);

  // Handler for Rubrique 1: AI Question on Book & Bible
  const handleAskAi = async (e?: React.FormEvent, customQuestion?: string) => {
    if (e) e.preventDefault();
    setAiError(null);

    const questionToSend = customQuestion || bookQuestionText.trim();
    if (!questionToSend || questionToSend.length < 4) {
      setAiError("Veuillez poser une question d'au moins 4 caractères.");
      return;
    }

    setIsAiLoading(true);
    setAiAnswerData(null);

    try {
      let contextualizedQuery = questionToSend;
      if (bookChapter.trim()) {
        contextualizedQuery = `[Concernant ${bookChapter.trim()}] : ${questionToSend}`;
      }

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: contextualizedQuery,
          bookId: selectedBookId === 'all' ? undefined : selectedBookId,
          language
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'obtenir la réponse de l'IA pour le moment.");
      }

      setAiAnswerData({
        question: questionToSend,
        answer: data.answer || "Aucune réponse générée.",
        citations: data.citations || [],
        bookScope: data.bookScope || selectedBookId,
        ragFound: data.ragFound ?? true
      });
    } catch (err: any) {
      setAiError(err.message || "Erreur de connexion avec l'assistant théologique.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyAiAnswer = () => {
    if (!aiAnswerData) return;
    try {
      navigator.clipboard.writeText(aiAnswerData.answer);
      setHasCopiedAi(true);
      setTimeout(() => setHasCopiedAi(false), 2500);
    } catch {}
  };

  // Forward AI question to Admin if user wants personal pastoral counsel
  const handleForwardToAdmin = () => {
    if (aiAnswerData) {
      setAdminSubject(`Approfondissement : ${aiAnswerData.question.slice(0, 60)}...`);
      setAdminQuestionText(`Question initiale : « ${aiAnswerData.question} »\n\nJ'ai consulté l'étude de l'IA sur le site, mais je sollicite votre conseil pastoral direct et vos prières à ce sujet.`);
    }
    setActiveSection('admin');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Handler for Rubrique 2: Direct Admin Question with Gmail notification
  const handleSubmitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminErrorMsg(null);

    const questionContent = adminQuestionText.trim();
    if (!questionContent || questionContent.length < 5) {
      setAdminErrorMsg("Votre message pour l'administrateur doit comporter au moins 5 caractères.");
      return;
    }

    const emailToUse = currentUser?.email || visitorEmail.trim();
    if (emailToUse && !emailToUse.includes('@')) {
      setAdminErrorMsg("L'adresse e-mail saisie n'est pas valide. Laissez ce champ vide si vous préférez poser votre question sans renseigner d'e-mail.");
      return;
    }

    const payload = {
      question_category_type: 'admin_direct',
      subject: adminSubject.trim() || adminTopic,
      question: questionContent,
      visitorName: visitorName.trim() || currentUser?.name || 'Visiteur de la Bibliothèque',
      visitorContact: emailToUse || 'Visiteur du site (anonyme)',
      visitorEmail: emailToUse || undefined
    };

    setIsAdminSubmitting(true);
    try {
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'x-visitor-id': visitorId
      };
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const res = await fetch('/api/user/questions', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Votre question n'a pas pu être transmise. Veuillez vérifier votre connexion.");
      }

      const generatedId = data.question?.id || data.question?.conversation_id || 'QUESTION-RECENTE';
      if (addTrackedQuestion && generatedId) {
        addTrackedQuestion(generatedId);
      }

      if (data.user && setSessionUser) {
        setSessionUser(data.user);
      }

      setAdminSuccessData({
        message: "Votre question a été enregistrée et transmise à l'administrateur avec succès.",
        questionId: generatedId,
        recipient: ADMIN_OFFICIAL_EMAIL
      });

      setAdminQuestionText('');
      setAdminSubject('');
    } catch (err: any) {
      setAdminErrorMsg(err.message || "Une erreur est survenue lors de l'envoi de votre question.");
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Top Banner: Introduction & Clear Dual Role */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400 block">
              Espace d'Échange, Étude Biblique & Conseil Pastoral
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-100">
              Poser une question
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
              Consultez l'intelligence artificielle théologique pour des réponses bibliques avec références et versets sur les livres du site, ou écrivez directement à l'administrateur qui recevra une notification instantanée sur son Gmail pour vous répondre.
            </p>
          </div>

          {/* Quick toggle indicator */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => { setActiveSection('book'); setAiError(null); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSection === 'book'
                  ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25'
                  : 'bg-slate-800 text-slate-300 hover:text-sky-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>1. IA (Bible & Livres)</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveSection('admin'); setAdminErrorMsg(null); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSection === 'admin'
                  ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25'
                  : 'bg-slate-800 text-slate-300 hover:text-sky-300'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>2. Message à l'Admin (Gmail)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Pastoral & Account Status Card */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Administrator Profile Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 block">
                  Responsable & Auteur
                </span>
                <h3 className="font-bold text-slate-100 text-sm truncate">
                  Docteur LEMBA KAVUMBULA MOÏSE
                </h3>
                <p className="text-xs text-slate-400">
                  Auteur de « Les 5 Étapes Spirituelles Pour Devenir Chrétien »
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              La plateforme met à votre disposition l'IA pour interroger les livres et la Bible, ainsi qu'un canal direct vers le Dr LEMBA notifié sur Gmail.
            </p>

            {/* Official Gmail Notification Box */}
            <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sky-200 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span>Notification Gmail Admin</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  Directe
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Toute question posée dans la <strong>Rubrique 2</strong> envoie immédiatement une notification à l'administrateur à l'adresse :
              </p>
              <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800 text-center font-mono text-xs text-sky-300 font-semibold select-all">
                {ADMIN_OFFICIAL_EMAIL}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                L'administrateur reçoit un lien direct pour venir vous répondre immédiatement sur le site.
              </p>
            </div>
          </div>

          {/* User Account / Status */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <span>Votre Compte Gmail</span>
            </h4>

            {isAuthenticated && currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-bold text-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-sm text-slate-100 block truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                      <Mail className="w-3 h-3 text-sky-400 flex-shrink-0" />
                      <span className="truncate">{currentUser.email || 'Connecté avec Gmail'}</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('my-questions')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Consulter mes questions & réponses</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Connectez-vous avec votre compte Gmail pour conserver l'historique complet de vos questions et des réponses pastorales.
                </p>
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Se connecter avec Gmail</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick link to Bible and Spiritual steps */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
              Ressources bibliques complémentaires
            </span>
            <button
              onClick={() => onNavigate('bible')}
              className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-sky-300 text-left flex items-center justify-between cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <ScrollText className="w-3.5 h-3.5 text-sky-400" />
                <span>Consulter la Sainte Bible</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
            <button
              onClick={() => onNavigate('spiritual-steps')}
              className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-sky-300 text-left flex items-center justify-between cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <BookMarked className="w-3.5 h-3.5 text-sky-400" />
                <span>Étude des 5 Étapes Spirituelles</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

        </div>

        {/* Right Side: The 2 Distinct Rubrics */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* RUBRIC SELECTOR TABS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              
              {/* Tab 1: AI (Bible & Books) */}
              <button
                type="button"
                onClick={() => { setActiveSection('book'); setAiError(null); }}
                className={`p-4 rounded-xl text-left transition-all cursor-pointer border ${
                  activeSection === 'book'
                    ? 'bg-sky-500/15 border-sky-400/50 shadow-md shadow-sky-500/10'
                    : 'bg-slate-950/40 border-transparent hover:bg-slate-800/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    activeSection === 'book' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    activeSection === 'book' ? 'text-sky-300' : 'text-slate-400'
                  }`}>
                    Rubrique 1 • Réponse IA
                  </span>
                </div>
                <h4 className={`font-bold text-sm ${activeSection === 'book' ? 'text-slate-100' : 'text-slate-300'}`}>
                  Question sur les Livres & la Bible
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  L'intelligence artificielle théologique répond immédiatement avec les versets bibliques et les références précises des ouvrages.
                </p>
              </button>

              {/* Tab 2: Admin Direct Question */}
              <button
                type="button"
                onClick={() => { setActiveSection('admin'); setAdminErrorMsg(null); }}
                className={`p-4 rounded-xl text-left transition-all cursor-pointer border ${
                  activeSection === 'admin'
                    ? 'bg-sky-500/15 border-sky-400/50 shadow-md shadow-sky-500/10'
                    : 'bg-slate-950/40 border-transparent hover:bg-slate-800/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    activeSection === 'admin' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    activeSection === 'admin' ? 'text-sky-300' : 'text-slate-400'
                  }`}>
                    Rubrique 2 • Admin Direct
                  </span>
                </div>
                <h4 className={`font-bold text-sm ${activeSection === 'admin' ? 'text-slate-100' : 'text-slate-300'}`}>
                  Question à l'Administrateur
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  L'administrateur reçoit une notification instantanée sur son Gmail ({ADMIN_OFFICIAL_EMAIL}) et peut répondre immédiatement sur le site.
                </p>
              </button>

            </div>
          </div>

          {/* ============================================================ */}
          {/* RUBRIQUE 1: QUESTION LIVRES & BIBLE AVEC RÉPONSE IA          */}
          {/* ============================================================ */}
          {activeSection === 'book' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-slate-100">
                      Interroger l'IA sur la Bible et les Livres
                    </h2>
                    <p className="text-xs text-slate-400">
                      Réponse instantanée ancrée sur le corpus doctrinal et les Écritures saintes
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-950 text-sky-400 border border-sky-500/30">
                  RAG Théologique
                </span>
              </div>

              {aiError && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Formulaire de question IA */}
              <form onSubmit={handleAskAi} className="space-y-4">
                
                {/* Book Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                      <span>Périmètre des Livres & Bible</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {books.length} ouvrages disponibles
                    </span>
                  </label>

                  <select
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
                  >
                    <option value="all">
                      🌟 Tous les livres du site + La Sainte Bible (Étude globale)
                    </option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        📖 {b.title} — {b.author}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Book Mini Badge if specific book selected */}
                {selectedBookObj && (
                  <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/30 flex items-center gap-3.5">
                    <img 
                      src={selectedBookObj.cover_image || "/images/les-5-etapes-spirituelles.jpg"} 
                      alt={selectedBookObj.title}
                      className="w-12 h-16 object-cover rounded-md border border-slate-700 flex-shrink-0 shadow"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
                        {selectedBookObj.category}
                      </span>
                      <h4 className="font-bold text-slate-100 text-sm truncate">
                        {selectedBookObj.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Auteur : {selectedBookObj.author}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('library')}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline"
                    >
                      Détails
                    </button>
                  </div>
                )}

                {/* Chapter or topic filter */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Chapitre, Page ou Thème doctrinal <span className="text-slate-500 text-[10px] font-normal">(facultatif)</span>
                  </label>
                  <input
                    type="text"
                    value={bookChapter}
                    onChange={(e) => setBookChapter(e.target.value)}
                    placeholder="Ex : Étape 2 (Repentance), Chapitre 3, ou Verset 1 Pierre 5:10"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                </div>

                {/* Question Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Votre Question sur la Bible ou les Livres du site <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={bookQuestionText}
                    onChange={(e) => setBookQuestionText(e.target.value)}
                    placeholder="Posez votre question théologique ou scripturaire. L'IA analysera les livres du site et la Bible pour vous répondre avec versets et références..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 leading-relaxed resize-y font-reading"
                  />
                </div>

                {/* Sample Prompt Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Suggestions d'études spirituelles en 1 clic :
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_AI_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setBookQuestionText(q);
                          handleAskAi(undefined, q);
                        }}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-sky-300 border border-slate-800 hover:border-sky-500/40 transition-colors text-left cursor-pointer"
                      >
                        « {q} »
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isAiLoading || !bookQuestionText.trim()}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAiLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Recherche dans la Bible et les livres du site...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>INTERROGER L'IA (BIBLE & LIVRES DU SITE)</span>
                    </>
                  )}
                </button>
              </form>

              {/* AI RESPONSE DISPLAY */}
              {aiAnswerData && (
                <div className="mt-8 pt-6 border-t border-slate-800 space-y-5 animate-fadeIn">
                  
                  {/* Response Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-2xl border border-sky-500/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 block">
                          Étude Théologique Générée
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                          Réponse basée sur la Bible et les écrits de la bibliothèque
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyAiAnswer}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-sky-300 border border-slate-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Copier la réponse"
                      >
                        {hasCopiedAi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{hasCopiedAi ? 'Copié !' : 'Copier'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate('bible')}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-sky-300 border border-slate-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Vérifier dans la Bible d'étude"
                      >
                        <ScrollText className="w-3.5 h-3.5 text-sky-400" />
                        <span>Bible</span>
                      </button>
                    </div>
                  </div>

                  {/* Markdown Content */}
                  <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800/90 text-slate-100 font-reading text-sm sm:text-base leading-relaxed space-y-4">
                    <div className="prose prose-invert max-w-none text-slate-200">
                      <ReactMarkdown>{aiAnswerData.answer}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Citations & Sources Grid */}
                  {aiAnswerData.citations && aiAnswerData.citations.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                        <BookMarked className="w-4 h-4" />
                        <span>Références & Sources Consultées :</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {aiAnswerData.citations.map((c, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                            <span className="font-bold text-slate-200 block truncate">
                              « {c.source} »
                            </span>
                            <p className="text-[11px] text-slate-400">
                              Auteur : {c.author} • Section : {c.chapter}
                            </p>
                            {c.verses && (
                              <p className="text-[11px] text-sky-300 font-mono">
                                📖 Versets : {c.verses}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Forward to Admin Option */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4 text-sky-400" />
                        <span>Vous souhaitez un conseil pastoral personnel ?</span>
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Transmettez directement votre question au Dr LEMBA. Il recevra une notification sur son Gmail ({ADMIN_OFFICIAL_EMAIL}).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleForwardToAdmin}
                      className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-sky-200 border border-sky-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>Transmettre à l'Administrateur</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* RUBRIQUE 2: QUESTION DIRECTE À L'ADMIN AVEC NOTIFICATION     */}
          {/* ============================================================ */}
          {activeSection === 'admin' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-slate-100">
                      Poser une question à l'Administrateur
                    </h2>
                    <p className="text-xs text-slate-400">
                      L'administrateur recevra une notification instantanée sur son Gmail officiel
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  Notification Gmail Active
                </span>
              </div>

              {adminErrorMsg && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{adminErrorMsg}</span>
                </div>
              )}

              {adminSuccessData && (
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-sm font-semibold text-emerald-300">
                        {adminSuccessData.message}
                      </strong>
                      <p className="text-slate-300 text-xs mt-1">
                        Numéro de suivi officiel : <span className="font-mono font-bold text-emerald-400">{adminSuccessData.questionId}</span>
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        ✉️ Une notification officielle a été immédiatement envoyée au Gmail de l'administrateur (<strong className="text-sky-300">{adminSuccessData.recipient}</strong>). Il peut cliquer sur son lien pour venir répondre directement sur le site.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigate('my-questions')}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Consulter mes conversations & réponses</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminSuccessData(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                    >
                      Poser un autre message
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitAdmin} className="space-y-5">
                
                {/* Visitor Fields if not logged in */}
                {!isAuthenticated && (
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mode Visiteur Ouvert — Posez votre question librement, sans connexion Gmail obligatoire</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                          Votre Nom ou Prénom <span className="text-slate-500 text-[10px] font-normal">(facultatif)</span>
                        </label>
                        <input
                          type="text"
                          value={visitorName}
                          onChange={(e) => setVisitorName(e.target.value)}
                          placeholder="Ex : Frère David ou Sœur Marie (ou anonyme)"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                          Votre E-mail <span className="text-slate-400 text-[10px] font-normal">(facultatif - pour copie)</span>
                        </label>
                        <input
                          type="email"
                          value={visitorEmail}
                          onChange={(e) => setVisitorEmail(e.target.value)}
                          placeholder="votre.adresse@gmail.com (facultatif)"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Topic and Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Nature de votre demande pastorale
                    </label>
                    <select
                      value={adminTopic}
                      onChange={(e) => setAdminTopic(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
                    >
                      {ADMIN_DIRECT_TOPICS.map((topic) => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Sujet / Titre de votre message <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={adminSubject}
                      onChange={(e) => setAdminSubject(e.target.value)}
                      placeholder="Ex : Conseil sur la prière et la sanctification"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Votre message pour l’Administrateur <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={adminQuestionText}
                    onChange={(e) => setAdminQuestionText(e.target.value)}
                    placeholder="Écrivez votre question pastorale, requête de prière ou préoccupation pour le Docteur LEMBA KAVUMBULA MOÏSE..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 leading-relaxed resize-y font-reading"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                    <span>Minimum 5 caractères</span>
                    <span>{adminQuestionText.length} caractères</span>
                  </div>
                </div>

                {/* Assurance & Confidentiality */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                  <span>
                    Votre message est strictement confidentiel. L'administrateur recevra une notification directe sur <strong>{ADMIN_OFFICIAL_EMAIL}</strong> avec un lien pour venir répondre directement sur le site.
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isAdminSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAdminSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Transmission de la notification à l’administrateur...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-slate-950" />
                      <span>TRANSMETTRE MA QUESTION À L’ADMINISTRATEUR (GMAIL)</span>
                    </>
                  )}
                </button>

                <div className="text-center text-[11px] text-slate-400">
                  ✉️ Notification automatique acheminée à : <span className="text-sky-300 font-semibold">{ADMIN_OFFICIAL_EMAIL}</span>
                </div>
              </form>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
