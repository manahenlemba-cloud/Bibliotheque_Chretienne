import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Send, 
  BookOpen, 
  ScrollText, 
  Layers, 
  Copy, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Trash2, 
  HelpCircle,
  Flame,
  Info,
  Globe
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Book, ChatMessage } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AiAssistantViewProps {
  books: Book[];
  initialBookId?: string;
  initialQuestion?: string;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  books,
  initialBookId,
  initialQuestion
}) => {
  const [selectedBookScope, setSelectedBookScope] = useState<string>(initialBookId || 'all');
  const [inputValue, setInputValue] = useState<string>(initialQuestion || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const { language, t, languages } = useLanguage();

  const currentLangObj = languages.find(l => l.code === language) || {
    code: language,
    name: language.toUpperCase(),
    nativeName: language.toUpperCase(),
    flag: '🌐'
  };

  const initialWelcomeText = useMemo(() => {
    return t('aiAssistantWelcome');
  }, [language, t]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: initialWelcomeText,
      citations: [
        {
          source: "La Bibliothèque Chrétienne de la Dernière Heure",
          author: "Docteur LEMBA KAVUMBULA MOÏSE",
          chapter: "Corpus Doctrinal & 1 Pierre 5:10",
          verses: "1 Jean 2:18, 1 Pierre 5:10, 2 Timothée 3:16"
        }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // When language switches and user hasn't started a custom chat, sync the welcome message
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [
          {
            ...prev[0],
            content: initialWelcomeText
          }
        ];
      }
      return prev;
    });
  }, [initialWelcomeText]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle auto-send if initialQuestion is provided
  useEffect(() => {
    if (initialQuestion && initialQuestion.trim()) {
      handleSend(initialQuestion);
    }
  }, []);

  const sampleQuestions = useMemo(() => {
    if (language === 'en') {
      return [
        "What are the 5 spiritual steps to become a Christian according to Dr. Lemba Kavumbula Moïse?",
        "What does the divine Calling and heavenly vocation mean according to 1 Peter 5:10?",
        "Why is suffering a purifying crucible for the disciple?",
        "What does divine Perfecting accomplished by Jesus Christ mean?",
        "How can a believer remain established and steadfast in holiness in the last hour?",
        "How to receive the fortification of the Holy Spirit for victorious witness?"
      ];
    } else if (language === 'sw') {
      return [
        "Hatua 5 za kiroho za kuwa Mkristo kulingana na Daktari Lemba Kavumbula Moïse ni zipi?",
        "Nini maana ya Wito wa kimungu kulingana na 1 Petro 5:10?",
        "Kwa nini mateso ni tanuru la kusafisha imani ya mfuasi wa Yesu?",
        "Ukamilifu wa kiungu unaofanywa na Yesu Kristo unamaanisha nini?",
        "Jinsi ya kusimama imara na kuthibitishwa katika utakaso wa saa ya mwisho?",
        "Jinsi ya kupokea kutiwa nguvu na Roho Mtakatifu kwa ushuhuda wa ushindi?"
      ];
    } else if (language === 'ln') {
      return [
        "Mabaku 5 ma molimo mpo na kokóma moklísto kolandana na Doktɛrɛ Lemba Kavumbula Moïse ezali nini?",
        "Nini elimboli Kobengama ya Nzambe kolandana na 1 Petro 5:10?",
        "Mpo na nini konyokwama ezali motambo mwa bopeto mpo na moyekoli?",
        "Kokomisa mobimba oyo Yesu Klisto asalaka elimboli nini?",
        "Ndenge nini kotelema ngwi kati na bopeto na ngonga eye ya suka?",
        "Ndenge nini kozwa nguya ya Molimo Mosantu mpo na kotatola na bolongi?"
      ];
    } else if (language === 'es') {
      return [
        "¿Cuáles son los 5 pasos espirituales para ser cristiano según el Doctor Lemba Kavumbula Moïse?",
        "¿Qué significa el Llamado divino según 1 Pedro 5:10?",
        "¿Por qué el sufrimiento es un crisol purificador para el discípulo?",
        "¿En qué consiste el Perfeccionamiento divino obrado por Jesucristo?",
        "¿Cómo permanecer firme e inconmovible en santidad en la última hora?",
        "¿Cómo recibir la fortaleza del Espíritu Santo para un testimonio victorioso?"
      ];
    }
    return [
      "Quelles sont les 5 étapes spirituelles pour devenir chrétien selon le Docteur Lemba Kavumbula Moïse ?",
      "Que signifie l'Appel divin et la vocation céleste selon 1 Pierre 5:10 ?",
      "Pourquoi la souffrance est-elle un creuset purificateur indispensable pour le disciple ?",
      "En quoi consiste le perfectionnement divin opéré par Jésus-Christ ?",
      "Comment demeurer affermi et inébranlable dans la sainteté face aux séductions de la dernière heure ?",
      "Comment recevoir la fortification du Saint-Esprit pour le témoignage victorieux ?"
    ];
  }, [language]);

  const handleSend = async (questionToSend?: string) => {
    const text = questionToSend || inputValue;
    if (!text || !text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      bookScope: selectedBookScope
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text.trim(),
          bookId: selectedBookScope,
          chatHistory: messages.slice(-4).map(m => ({ sender: m.sender, content: m.content })),
          language
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la communication avec l\'assistant');
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: data.answer || "Aucune réponse n'a pu être générée.",
        citations: data.citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        bookScope: data.bookScope,
        ragFound: data.ragFound,
        bibleVersion: data.bibleVersion
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: `Une difficulté est survenue : ${err.message || 'Impossible de joindre le serveur'}. Veuillez réessayer dans un instant.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = (msgId: string, content: string) => {
    try {
      navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.warn('Clipboard write error', e);
    }
  };

  const toggleSpeakMessage = (msgId: string, content: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = content.replace(/[#*_`>\[\]\(\)]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'en' ? 'en-US' : language === 'sw' ? 'sw-TZ' : language === 'es' ? 'es-ES' : 'fr-FR';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
    setSpeakingId(msgId);
  };

  const clearChat = () => {
    if (window.confirm(language === 'en' ? "Would you like to clear this chat?" : language === 'sw' ? "Je, unataka kufuta mazungumzo haya?" : language === 'ln' ? "Olingi koboma masolo maye?" : "Souhaitez-vous réinitialiser cette discussion ?")) {
      setMessages([messages[0]]);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-500/20 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="p-1 rounded-md bg-sky-500/20 text-sky-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">
              {t('statAi')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-900/80 border border-sky-500/40 text-[11px] font-bold text-sky-200">
              <span>{currentLangObj.flag}</span>
              <span>{t('aiLanguageActive')} : {currentLangObj.name} ({currentLangObj.code.toUpperCase()})</span>
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100">
            {t('aiAssistantHeaderTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-1">
            {t('aiAssistantHeaderSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-medium border border-slate-800 transition-colors cursor-pointer"
              title={t('aiAssistantClear')}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('aiAssistantClear')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Scope Selector Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <BookOpen className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span className="font-semibold text-slate-200">{t('aiAssistantSearchScope')} :</span>
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedBookScope}
            onChange={(e) => setSelectedBookScope(e.target.value)}
            className="w-full sm:w-80 bg-slate-950 border border-sky-500/30 text-sky-300 text-xs rounded-xl px-3 py-2 outline-none font-medium cursor-pointer"
          >
            <option value="all">{t('aiAssistantAllBooks')} ({books.length} {t('statBooks').toLowerCase()})</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} ({b.author})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CHAT CONTAINER */}
      <div className="rounded-3xl bg-slate-900/40 border border-sky-500/20 shadow-2xl flex flex-col h-[580px] overflow-hidden">
        
        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-md">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                )}

                {/* Message Body */}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none space-y-3'
                  }`}
                >
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed font-light">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Grounded Citations (Anti-Hallucination Proof) */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
                        {t('aiAssistantSources')} :
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.citations.map((cite, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] space-y-0.5">
                            <span className="font-semibold text-slate-200 block truncate">{cite.source}</span>
                            <span className="text-slate-400 block truncate">{cite.chapter}</span>
                            {cite.verses && (
                              <span className="text-sky-300/90 font-mono text-[10px] block truncate">{cite.verses}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar inside Message */}
                  <div className={`flex items-center justify-between pt-1 text-[11px] ${isUser ? 'text-sky-200' : 'text-slate-500'}`}>
                    <span>{msg.timestamp}</span>

                    {!isUser && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copyMessage(msg.id, msg.content)}
                          className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Copier"
                        >
                          {copiedId === msg.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => toggleSpeakMessage(msg.id, msg.content)}
                          className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Lecture vocale"
                        >
                          {speakingId === msg.id ? <VolumeX className="w-3.5 h-3.5 text-sky-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-slate-950 font-bold text-xs flex-shrink-0 mt-1 shadow-md">
                    {language === 'en' ? 'You' : language === 'sw' ? 'Wewe' : language === 'ln' ? 'Yo' : language === 'es' ? 'Tú' : 'Vous'}
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0 animate-spin">
                <Sparkles className="w-4 h-4 text-sky-400" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 p-4 text-xs text-sky-300 space-y-1 shadow-md animate-pulse">
                <span className="font-semibold block">{t('translatingWithGemini')}</span>
                <span className="text-slate-400 text-[11px] block">{t('aiConfiguredForLanguage')} ({currentLangObj.name}).</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* PROMPTS SUGGESTIONS CAROUSEL */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] text-slate-500 whitespace-nowrap flex items-center gap-1 font-semibold">
            <Flame className="w-3.5 h-3.5 text-sky-400" />
            <span>Suggestions ({currentLangObj.code.toUpperCase()}) :</span>
          </span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-sky-300 border border-slate-800 text-xs whitespace-nowrap transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* INPUT FORM */}
        <div className="p-4 bg-slate-950 border-t border-sky-500/20">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('aiAssistantPlaceholder')}
              disabled={isLoading}
              className="w-full pl-4 pr-14 py-3.5 bg-slate-900 border border-slate-800 focus:border-sky-500/60 rounded-2xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed shadow transition-all cursor-pointer"
              title={t('aiAssistantSend')}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
            <span>{t('adv2Title')}</span>
            <span className="text-sky-400/80 font-bold">{currentLangObj.flag} Gemini 3.8 Flash • {currentLangObj.name}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
