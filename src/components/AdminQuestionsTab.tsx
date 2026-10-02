import React, { useState, useEffect } from 'react';
import { UserQuestion, QuestionMessage } from '../types';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Send, 
  RefreshCw, 
  Search, 
  Smartphone, 
  Mail, 
  ShieldCheck, 
  User, 
  Trash2, 
  ExternalLink, 
  AlertCircle,
  Check,
  Calendar,
  Filter
} from 'lucide-react';

interface AdminQuestionsTabProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export const AdminQuestionsTab: React.FC<AdminQuestionsTabProps> = ({ onNotify }) => {
  const [questions, setQuestions] = useState<UserQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<UserQuestion | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'answered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, answered: 0 });

  const [isConnectedSSE, setIsConnectedSSE] = useState(false);

  const fetchQuestions = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch('/api/admin/questions', {
        headers: {
          'x-admin-passcode': 'admin123'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const allQuestions = data.questions || [];
        setQuestions(allQuestions);
        setStats({
          total: data.total || 0,
          pending: data.pending || 0,
          answered: data.answered || 0
        });

        // Automatically select question if opened from Gmail notification link
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const urlQuestionId = urlParams.get('id');
          if (urlQuestionId) {
            const matched = allQuestions.find((q: UserQuestion) => q.id === urlQuestionId);
            if (matched) {
              setSelectedQuestion(matched);
            }
          } else if (selectedQuestion) {
            const updated = allQuestions.find((q: UserQuestion) => q.id === selectedQuestion.id);
            if (updated) setSelectedQuestion(updated);
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Failed to load admin questions', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuestions();

    // Connect to Server-Sent Events (SSE) for instant bidirectional updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/stream');
      
      eventSource.onopen = () => {
        setIsConnectedSSE(true);
      };

      eventSource.addEventListener('whatsapp_reply', (e) => {
        try {
          const data = JSON.parse(e.data);
          onNotify('success', `🔔 Réponse reçue en direct depuis WhatsApp pour ${data.questionId} !`);
          fetchQuestions(true);
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      });

      eventSource.addEventListener('new_question', (e) => {
        try {
          const data = JSON.parse(e.data);
          onNotify('success', `🔔 Nouvelle question reçue (${data.questionId}) de ${data.question.user_name} !`);
          fetchQuestions(true);
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      });

      eventSource.addEventListener('admin_reply', () => {
        fetchQuestions(true);
      });

      eventSource.addEventListener('question_deleted', () => {
        fetchQuestions(true);
      });

      eventSource.onerror = () => {
        setIsConnectedSSE(false);
      };
    } catch (err) {
      console.warn('SSE connection failed, falling back to interval:', err);
    }

    const interval = setInterval(() => fetchQuestions(true), 12000);
    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const res = await fetch(`/api/admin/questions/${selectedQuestion.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': 'admin123'
        },
        body: JSON.stringify({ reply: replyText.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        onNotify('success', 'Réponse pastorale enregistrée et transmise à l\'utilisateur !');
        setReplyText('');
        await fetchQuestions(true);
      } else {
        onNotify('error', data.error || 'Erreur lors de l\'enregistrement de la réponse.');
      }
    } catch (e: any) {
      onNotify('error', e.message || 'Erreur réseau.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Êtes-vous certain de vouloir supprimer cette question de l\'historique ?')) return;

    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-passcode': 'admin123' }
      });
      if (res.ok) {
        onNotify('success', 'Question supprimée avec succès.');
        if (selectedQuestion?.id === id) setSelectedQuestion(null);
        fetchQuestions(true);
      }
    } catch (e) {
      onNotify('error', 'Impossible de supprimer la question.');
    }
  };

  // Filtered list
  const filtered = questions.filter(q => {
    if (filterStatus !== 'all' && q.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const qry = searchQuery.toLowerCase();
      return (
        q.subject.toLowerCase().includes(qry) ||
        q.user_name.toLowerCase().includes(qry) ||
        q.user_contact.toLowerCase().includes(qry) ||
        q.messages.some(m => m.message.toLowerCase().includes(qry))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Realtime Live Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Gestion des Questions & Notifications Gmail Admin</span>
              {isConnectedSSE ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-500/40 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
                  <span>En direct (SSE actif)</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                  Synchronisation auto
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Notification automatique envoyée à <span className="text-sky-300 font-mono font-medium">bibliothequechretien@gmail.com</span> pour chaque question soumise (Livre ou Requête Directe).
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchQuestions(true)}
          disabled={isRefreshing}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Questions
            </span>
            <span className="text-2xl font-bold font-display text-slate-100">{stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              En Attente de Réponse
            </span>
            <span className="text-2xl font-bold font-display text-white">{stats.pending}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
              Questions Répondues
            </span>
            <span className="text-2xl font-bold font-display text-emerald-400">{stats.answered}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Toutes ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'pending'
                ? 'bg-amber-400 text-black font-bold'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-750'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>En attente ({stats.pending})</span>
          </button>
          <button
            onClick={() => setFilterStatus('answered')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'answered'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-emerald-400 hover:bg-slate-750'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Répondues ({stats.answered})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par fidèle, sujet..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>
          <button
            onClick={() => fetchQuestions(true)}
            title="Rafraîchir"
            className={`p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ${
              isRefreshing ? 'animate-spin text-sky-400' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Split View: Questions List vs Conversation & Reply Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Questions List */}
        <div className="lg:col-span-5 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
              <span>Chargement des questions...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">Aucune question trouvée</p>
              <p className="text-xs text-slate-500">Aucun message ne correspond à ce filtre.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {filtered.map((q) => {
                const isSelected = selectedQuestion?.id === q.id;
                const isPending = q.status === 'pending';

                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestion(q)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-950/50'
                        : isPending
                        ? 'bg-slate-900/90 hover:bg-slate-850 border-amber-500/40 hover:border-amber-400'
                        : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-xs text-slate-100 truncate">
                          {q.user_name}
                        </span>
                        <span className="font-mono text-[10px] text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-500/30 font-bold">
                          {q.conversation_id || q.id}
                        </span>
                      </div>
                      {isPending ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-black border border-amber-300 flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3 text-black" />
                          <span className="text-black">À répondre</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{q.last_source === 'whatsapp' ? 'Répondu (WhatsApp)' : 'Répondu'}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-sky-300">
                        {q.subject}
                      </span>
                      {q.question_category_type === 'book_question' || q.book_title ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-500/30 font-medium">
                          📖 Livre : {q.book_title || 'Site'}
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-medium">
                          👨‍💼 Requête Directe Admin
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {q.messages[0]?.message || ''}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-800/60">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Mail className="w-3 h-3 text-sky-400" />
                        <span>{q.user_contact}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-0.5">
                          <Mail className="w-2.5 h-2.5" />
                          <span>Notifié Gmail</span>
                        </span>
                        <span>{new Date(q.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Conversation & Response Editor */}
        <div className="lg:col-span-7">
          {selectedQuestion ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[750px] shadow-2xl overflow-hidden">
              
              {/* Question Header */}
              <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-base">
                      {selectedQuestion.subject}
                    </h3>
                    <span className="font-mono text-xs text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-lg border border-sky-500/40 font-bold">
                      {selectedQuestion.conversation_id || selectedQuestion.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedQuestion.status === 'answered'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                        : 'bg-amber-400 text-black border border-amber-300'
                    }`}>
                      {selectedQuestion.status === 'answered' ? 'Répondu' : 'En attente'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {selectedQuestion.question_category_type === 'book_question' || selectedQuestion.book_title ? (
                      <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-500/30 text-sky-300 font-medium">
                        📖 Question sur le Livre : « {selectedQuestion.book_title || 'Non spécifié'} »
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-medium">
                        👨‍💼 Requête pastorale directe pour l'Administrateur
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                      ✓ Notifié sur bibliothequechretien@gmail.com
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    <span className="font-semibold text-slate-200">
                      👤 {selectedQuestion.user_name}
                    </span>
                    <span>•</span>
                    <a
                      href={`mailto:${selectedQuestion.user_contact}?subject=${encodeURIComponent(`Réponse à votre question : ${selectedQuestion.subject}`)}`}
                      className="flex items-center gap-1 text-sky-400 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{selectedQuestion.user_contact}</span>
                    </a>
                    <span>•</span>
                    <span>{new Date(selectedQuestion.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selectedQuestion.user_contact}?subject=${encodeURIComponent(`Réponse Pastorale - ${selectedQuestion.subject}`)}`}
                    className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Envoyer un courriel direct au fidèle"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Courriel Direct</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => handleDeleteQuestion(selectedQuestion.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Supprimer la question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Flow */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {selectedQuestion.messages.map((m) => {
                  const isAdmin = m.sender_type === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                        {isAdmin ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                            <strong className="text-sky-300">Votre Réponse (Administrateur)</strong>
                            {m.source === 'whatsapp' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                                <Smartphone className="w-2.5 h-2.5" />
                                <span>Envoyé depuis WhatsApp</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-950/60 text-sky-400 border border-sky-500/30">
                                Via Plateforme
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>{m.sender_name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                          isAdmin
                            ? 'bg-gradient-to-br from-sky-950/80 to-slate-900 border border-sky-500/40 text-slate-100 rounded-tr-sm shadow-md'
                            : 'bg-slate-800/90 text-slate-100 border border-slate-700/70 rounded-tl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-line">{m.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Admin Reply Composer */}
              <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold flex items-center gap-1.5 text-sky-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Rédiger la réponse pastorale de l'administrateur</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Sera visible dans l'espace du fidèle
                  </span>
                </div>

                <form onSubmit={handleSendReply} className="space-y-2.5">
                  <textarea
                    rows={3}
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Saisissez votre réponse pastorale détaillée, conseils bibliques ou éclaircissements..."
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none leading-relaxed resize-y"
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-500">
                      Signature automatique : Docteur LEMBA KAVUMBULA MOÏSE
                    </p>

                    <button
                      type="submit"
                      disabled={isSendingReply || !replyText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-40"
                    >
                      {isSendingReply ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Envoi en cours...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>ENVOYER LA RÉPONSE AU FIDÈLE</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          ) : (
            <div className="h-[750px] bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h4 className="font-semibold text-slate-300 text-base">Sélectionnez une question</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Choisissez une question dans la colonne de gauche pour lire la conversation complète et adresser votre réponse pastorale à l'utilisateur.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
