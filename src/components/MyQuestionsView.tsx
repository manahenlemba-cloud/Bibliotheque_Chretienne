import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserQuestion, QuestionMessage } from '../types';
import { MessageSquare, Clock, CheckCircle2, Send, RefreshCw, AlertTriangle, ArrowLeft, Smartphone, Mail, Calendar, User, ShieldCheck, PlusCircle, MessageCircle } from 'lucide-react';

interface MyQuestionsViewProps {
  onNavigate: (view: string) => void;
}

export const MyQuestionsView: React.FC<MyQuestionsViewProps> = ({ onNavigate }) => {
  const { currentUser, isAuthenticated, visitorId, trackedQuestionIds, openAuthModal, logout } = useAuth();

  const [questions, setQuestions] = useState<UserQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<UserQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchRef, setSearchRef] = useState('');

  const [newReplyToast, setNewReplyToast] = useState<{ questionId: string; message: string } | null>(null);

  const fetchQuestions = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const headers: Record<string, string> = {};
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }
      if (visitorId) {
        headers['x-visitor-id'] = visitorId;
      }

      const params = new URLSearchParams();
      if (trackedQuestionIds && trackedQuestionIds.length > 0) {
        params.append('ids', trackedQuestionIds.join(','));
      }
      if (searchRef.trim()) {
        params.append('conversationId', searchRef.trim());
      }

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/user/questions${queryStr}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        // Update currently selected question if open
        if (selectedQuestion) {
          const updated = (data.questions || []).find((q: UserQuestion) => q.id === selectedQuestion.id);
          if (updated) setSelectedQuestion(updated);
        } else if (data.questions && data.questions.length > 0 && !selectedQuestion) {
          setSelectedQuestion(data.questions[0]);
        }
      }
    } catch (err) {
      console.warn('Error fetching questions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuestions();

    // Listen to real-time Server-Sent Events (SSE)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/stream');

      eventSource.addEventListener('admin_reply', (e) => {
        try {
          const data = JSON.parse(e.data);
          fetchQuestions(true);
          if (data.notification?.userId === currentUser?.id || data.question?.user_id === currentUser?.id || trackedQuestionIds.includes(data.questionId)) {
            setNewReplyToast({
              questionId: data.questionId,
              message: data.notification?.message || 'Nouvelle réponse pastorale de l\'administrateur'
            });
            setTimeout(() => setNewReplyToast(null), 8000);
          }
        } catch (err) {
          console.error('SSE error:', err);
        }
      });
    } catch (e) {
      console.warn('SSE not supported, falling back to interval:', e);
    }

    // Real-time polling fallback every 8 seconds
    const interval = setInterval(() => {
      fetchQuestions(true);
    }, 8000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [isAuthenticated, currentUser?.token, currentUser?.id, visitorId, trackedQuestionIds.length]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !replyText.trim()) return;

    setSendingReply(true);
    setErrorMsg(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }
      if (visitorId) {
        headers['x-visitor-id'] = visitorId;
      }

      const res = await fetch(`/api/user/questions/${selectedQuestion.id}/reply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          message: replyText.trim(),
          visitorId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du message.');
      }

      setReplyText('');
      await fetchQuestions(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible d\'envoyer votre réponse.');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Top Bar / Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-sky-600/30">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'V'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">
                {currentUser?.name || 'Visiteur du site'}
              </h2>
              {isAuthenticated ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
                  Compte Google / Gmail
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950 text-sky-400 border border-sky-800/60">
                  Mode Visiteur Ouvert
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              {currentUser?.email ? (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>{currentUser.email}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Questions posées depuis ce navigateur</span>
                </span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Session active</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('ask-admin')}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-sky-500/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouvelle Question</span>
          </button>

          <button
            onClick={() => fetchQuestions(true)}
            title="Actualiser les messages"
            className={`p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ${
              refreshing ? 'animate-spin text-sky-400' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isAuthenticated ? (
            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs transition-colors cursor-pointer"
            >
              Déconnexion
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Connexion Gmail (facultatif)</span>
            </button>
          )}
        </div>
      </div>

      {/* Visitor Banner if not connected to Gmail */}
      {!isAuthenticated && (
        <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <span>
              <strong>Interaction libre :</strong> Vous pouvez poser des questions et échanger sans vous connecter avec Gmail. Vos questions posées sur cet appareil restent affichées ci-dessous.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <input
              type="text"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              placeholder="Code (ex: QUESTION-1048)"
              className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
            />
            <button
              type="button"
              onClick={() => fetchQuestions(false)}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              Rechercher
            </button>
          </div>
        </div>
      )}

      {/* Live notification toast if incoming reply */}
      {newReplyToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 shadow-xl flex items-center justify-between gap-3 animate-slideDown">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-300">
                🔔 L'administrateur a répondu à votre question ({newReplyToast.questionId}) !
              </p>
              <p className="text-xs text-emerald-100/90 line-clamp-1">
                "{newReplyToast.message}"
              </p>
            </div>
          </div>
          <button
            onClick={() => setNewReplyToast(null)}
            className="text-xs text-emerald-400 hover:text-emerald-200 underline font-semibold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Main Grid: Questions List vs Active Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left List of Questions */}
        <div className={`${selectedQuestion ? 'hidden lg:block' : 'block'} lg:col-span-5 space-y-3`}>
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Vos Questions ({questions.length})
            </h3>
            {refreshing && (
              <span className="text-[10px] text-sky-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                Synchronisation...
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
              <span>Chargement de vos échanges...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-600" />
              <div className="text-sm font-semibold text-slate-300">
                Vous n'avez pas encore posé de question
              </div>
              <p className="text-xs text-slate-400">
                Une interrogation spirituelle ou doctrinale ? Posez-la directement à l'administrateur.
              </p>
              <button
                onClick={() => onNavigate('ask-admin')}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
              >
                Poser ma première question
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {questions.map((q) => {
                const isSelected = selectedQuestion?.id === q.id;
                const lastMessage = q.messages[q.messages.length - 1];
                const hasUnreadAnswer = q.status === 'answered' && lastMessage?.sender_type === 'admin';

                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestion(q)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-sky-950/40 border-sky-500 shadow-md shadow-sky-950/40'
                        : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-semibold text-sky-300 truncate max-w-[180px]">
                          {q.subject}
                        </span>
                        <span className="font-mono text-[10px] text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-500/30 font-bold">
                          {q.conversation_id || q.id}
                        </span>
                      </div>
                      {q.status === 'answered' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center gap-1 flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{q.last_source === 'whatsapp' ? 'Répondu (WhatsApp)' : 'Répondu'}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 border border-amber-300 text-black flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3 text-black" />
                          <span className="text-black">En attente</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {q.messages[0]?.message || ''}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-800/60">
                      <span>{new Date(q.created_at).toLocaleDateString('fr-FR')} à {new Date(q.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-sky-400/80">{q.messages.length} message{q.messages.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail / Conversation Thread */}
        <div className={`${!selectedQuestion ? 'hidden lg:block' : 'block'} lg:col-span-7`}>
          {selectedQuestion ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[650px] shadow-2xl overflow-hidden">
              
              {/* Conversation Header */}
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedQuestion(null)}
                    className="lg:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                        {selectedQuestion.subject}
                      </h3>
                      <span className="font-mono text-xs text-sky-400 bg-sky-950/90 px-2 py-0.5 rounded-lg border border-sky-500/40 font-bold">
                        {selectedQuestion.conversation_id || selectedQuestion.id}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{selectedQuestion.messages.length} message(s)</span>
                      <span>•</span>
                      <span>Dernière mise à jour : {new Date(selectedQuestion.created_at).toLocaleDateString('fr-FR')}</span>
                    </span>
                  </div>
                </div>

                <div>
                  {selectedQuestion.status === 'answered' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{selectedQuestion.last_source === 'whatsapp' ? 'Répondu depuis WhatsApp' : 'Répondu par l\'administrateur'}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 border border-amber-300 text-black flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-black" />
                      <span className="text-black">En attente de réponse</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Gmail Notification & Question Category Banner */}
              <div className="bg-gradient-to-r from-sky-950/70 via-slate-950 to-indigo-950/50 border-b border-sky-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-sky-300">
                  <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">
                        {selectedQuestion.question_category_type === 'book_question' || selectedQuestion.book_title
                          ? '📖 Question sur le Livre du site'
                          : '👨‍💼 Question pastorale directe pour l’Administrateur'}
                      </span>
                      {selectedQuestion.book_title && (
                        <span className="font-medium text-sky-300 bg-sky-950/80 border border-sky-500/40 px-2 py-0.5 rounded text-[11px]">
                          « {selectedQuestion.book_title} »
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Notification transmise au compte Gmail officiel de l'administrateur (<span className="text-sky-300 font-mono">bibliothequechretien@gmail.com</span>).
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-sky-950/80 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>Notification Gmail Envoyée</span>
                </div>
              </div>

              {/* Messages Flow */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {selectedQuestion.messages.map((m) => {
                  const isAdmin = m.sender_type === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                        {isAdmin ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                            <strong className="text-sky-300">Docteur LEMBA KAVUMBULA MOÏSE</strong>
                            {m.source === 'email' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950/80 text-sky-400 border border-sky-500/40 flex items-center gap-1">
                                <Mail className="w-2.5 h-2.5" />
                                <span>Via Gmail</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-950/60 text-sky-400 border border-sky-500/30">
                                Réponse Officielle
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>Vous ({currentUser.name})</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
                          isAdmin
                            ? 'bg-gradient-to-br from-sky-950/70 to-slate-900 border border-sky-500/30 text-slate-100 rounded-tl-sm shadow-md'
                            : 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-tr-sm'
                        }`}
                      >
                        <p className="whitespace-pre-line">{m.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <div className="p-4 bg-slate-950/90 border-t border-slate-800">
                {errorMsg && (
                  <div className="mb-2 p-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                    {errorMsg}
                  </div>
                )}
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Écrire un message complémentaire ou une précision..."
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {sendingReply ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Envoyer</span>
                      </>
                    )}
                  </button>
                </form>
                <div className="mt-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Les réponses envoyées depuis WhatsApp (+243 811 733 778) s'actualisent en direct.</span>
                  </span>
                  <a
                    href={`https://wa.me/243811733778?text=${encodeURIComponent(
                      `Bonjour Docteur LEMBA KAVUMBULA MOÏSE, je poursuis notre échange sur la question ${selectedQuestion.conversation_id || selectedQuestion.id}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Discuter via +243 811 733 778</span>
                  </a>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-[650px] bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-300">Sélectionnez une conversation</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Cliquez sur une question dans la liste de gauche pour lire l'historique complet et la réponse pastorale de l'administrateur.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
