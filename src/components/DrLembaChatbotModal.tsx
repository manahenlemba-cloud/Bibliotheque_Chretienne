import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles, 
  BookOpen, 
  Trash2, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  Minimize2, 
  Maximize2,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { BibleVersionId } from '../types';
import { BIBLE_VERSIONS } from '../data/bibleData';
import { useLanguage } from '../context/LanguageContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'dr-lemba';
  text: string;
  timestamp: number;
  citations?: Array<{
    source: string;
    author: string;
    chapter?: string;
    verses?: string;
  }>;
}

interface DrLembaChatbotModalProps {
  selectedBibleVersion?: BibleVersionId;
  onNavigateToBook?: (bookId: string) => void;
  onNavigateToSermon?: () => void;
}

const STORAGE_KEY = 'christian_dr_lemba_chat_history_v2';
const TIMESTAMP_KEY = 'christian_dr_lemba_chat_timestamp';
const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

export const DrLembaChatbotModal: React.FC<DrLembaChatbotModalProps> = ({
  selectedBibleVersion = 'LSG',
  onNavigateToBook,
  onNavigateToSermon
}) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeVersion, setActiveVersion] = useState<BibleVersionId>(selectedBibleVersion);
  const [hasResetNotice, setHasResetNotice] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize messages with 48h check
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const storedTime = localStorage.getItem(TIMESTAMP_KEY);
      const now = Date.now();

      if (storedTime && now - parseInt(storedTime, 10) > FORTY_EIGHT_HOURS) {
        // Expired after 48h
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(TIMESTAMP_KEY, now.toString());
        return [];
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Storage check error:', e);
    }
    return [];
  });

  // Default welcome message if empty
  useEffect(() => {
    if (messages.length === 0) {
      const welcome: ChatMessage = {
        id: 'welcome-msg',
        sender: 'dr-lemba',
        text: `Que la grâce et la paix de notre Seigneur Jésus-Christ vous soient multipliées !\n\nJe suis l'assistant spirituel du **Docteur LEMBA KAVUMBULA MOÏSE**, auteur de l'ouvrage *« Les 5 Étapes Spirituelles Pour Devenir Chrétien »* (1 Pierre 5:10).\n\nJe suis à votre écoute **24h/24** pour répondre à toutes vos questions doctrinales et théologiques, en m'appuyant rigoureusement sur nos livres, nos prédications et les Saintes Écritures.\n\n*Note : Pour votre sérénité et discrétion, l'historique de nos échanges est automatiquement effacé après 48 heures.*`,
        timestamp: Date.now()
      };
      setMessages([welcome]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
      localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
    }
  }, [messages.length]);

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        if (!localStorage.getItem(TIMESTAMP_KEY)) {
          localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat/dr-lemba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          question: textToSend.trim(),
          bibleVersion: activeVersion,
          language,
          chatHistory: newMessages.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            text: m.text
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const lembaReply: ChatMessage = {
          id: 'lemba-' + Date.now(),
          sender: 'dr-lemba',
          text: data.answer || "Demeurez ferme dans la Parole.",
          timestamp: Date.now(),
          citations: data.citations
        };
        setMessages(prev => [...prev, lembaReply]);
      } else {
        const fallbackReply: ChatMessage = {
          id: 'err-' + Date.now(),
          sender: 'dr-lemba',
          text: "Je n'ai pas pu joindre le moteur de sagesse spirituelle pour le moment. Vérifiez votre connexion ou réessayez dans un instant.",
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, fallbackReply]);
      }
    } catch (err: any) {
      const fallbackReply: ChatMessage = {
        id: 'net-err-' + Date.now(),
        sender: 'dr-lemba',
        text: "Une erreur de réseau est survenue. N'hésitez pas à reformuler votre interrogation.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, fallbackReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Voulez-vous effacer l'historique de votre conversation maintenant ?")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
      setMessages([]);
      setHasResetNotice(true);
      setTimeout(() => setHasResetNotice(false), 3000);
    }
  };

  const quickPrompts = [
    "Quelles sont les 5 étapes de 1 Pierre 5:10 ?",
    "Que dit le Dr. LEMBA sur la sanctification ?",
    "Comment demeurer vigilant dans la dernière heure ?"
  ];

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-white text-black shadow-2xl hover:shadow-xl border-2 border-sky-300 transition-all transform hover:scale-105 cursor-pointer"
            aria-label="Ouvrir le chat avec le Dr. LEMBA KAVUMBULA Moïse"
          >
            {/* Status Ping */}
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
            </span>

            <div className="flex flex-col text-left">
              <span className="text-xs font-bold tracking-wide text-black uppercase">
                Dr. LEMBA KAVUMBULA Moïse
              </span>
              <span className="text-[11px] text-slate-600 font-medium">
                Assistant Spirituel 24h/24
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center border border-sky-200 ml-1">
              <Sparkles className="w-4 h-4 text-slate-800" />
            </div>
          </button>
        </div>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div 
          className={`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 transition-all duration-300 ease-out flex flex-col ${
            isMinimized 
              ? 'w-80 h-16' 
              : 'w-[92vw] sm:w-[460px] h-[85vh] max-h-[680px]'
          } bg-white rounded-3xl shadow-2xl border border-sky-200 overflow-hidden`}
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white p-4 flex items-center justify-between gap-2 flex-shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-sky-900" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-white leading-tight">
                  Dr. LEMBA KAVUMBULA Moïse
                </h3>
                <p className="text-[10px] text-sky-200 flex items-center gap-1 font-medium">
                  <span>Assistant Spirituel 24h/24</span>
                  <span>•</span>
                  <span className="text-emerald-300 font-semibold">En direct</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-sky-200">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title={isMinimized ? "Agrandir" : "Réduire"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Fermer le chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Secondary Controls Bar: Bible Version & 48h Privacy Notice */}
              <div className="px-4 py-2 bg-sky-50/90 border-b border-sky-100 flex items-center justify-between text-xs text-slate-600 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Version Bible :</span>
                  <select
                    value={activeVersion}
                    onChange={(e) => setActiveVersion(e.target.value as BibleVersionId)}
                    className="text-[11px] font-bold text-sky-800 bg-white border border-sky-200 rounded-md px-1.5 py-0.5 outline-none"
                  >
                    {BIBLE_VERSIONS.map(v => (
                      <option key={v.id} value={v.id}>{v.id} - {v.name.split(' ')[0]}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1" title="Historique effacé après 48h">
                    <Clock className="w-3 h-3 text-sky-600" />
                    <span>Reset 48h</span>
                  </span>
                  <button
                    onClick={handleClearHistory}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Effacer l'historique maintenant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {hasResetNotice && (
                <div className="p-2 bg-emerald-50 text-emerald-800 text-xs text-center border-b border-emerald-100">
                  Historique réinitialisé avec succès.
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                {messages.map((msg) => {
                  const isLemba = msg.sender === 'dr-lemba';

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isLemba ? 'items-start' : 'items-end justify-end'}`}
                    >
                      {isLemba && (
                        <div className="w-8 h-8 rounded-xl bg-sky-700 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs mt-1">
                          DL
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                          isLemba
                            ? 'bg-white border border-slate-200/80 text-slate-800 shadow-xs'
                            : 'bg-sky-700 text-white shadow-xs font-medium'
                        }`}
                      >
                        <div className="whitespace-pre-line font-normal">
                          {msg.text}
                        </div>

                        {/* Citations if available */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                            <span className="font-bold text-sky-800 uppercase tracking-wider block">
                              Sources & Références :
                            </span>
                            {msg.citations.map((c, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <BookOpen className="w-3 h-3 text-sky-600 flex-shrink-0" />
                                <span className="font-semibold text-slate-700">{c.source}</span>
                                {c.verses && <span className="text-slate-400">({c.verses})</span>}
                              </div>
                            ))}
                          </div>
                        )}

                        <span className={`text-[10px] block mt-1.5 text-right ${isLemba ? 'text-slate-400' : 'text-sky-200'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-2.5 items-start">
                    <div className="w-8 h-8 rounded-xl bg-sky-700 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      DL
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 shadow-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>Le Dr. LEMBA consulte les écrits et les écritures...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              {messages.length <= 2 && (
                <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Bar */}
              <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2 flex-shrink-0">
                <input
                  type="text"
                  placeholder="Posez votre question doctrinale ou spirituelle..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white transition-all"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={loading || !inputMessage.trim()}
                  className="p-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white transition-all shadow-xs cursor-pointer flex-shrink-0"
                  title="Envoyer la question"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default DrLembaChatbotModal;
