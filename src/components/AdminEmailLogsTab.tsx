import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  Clock, 
  BookOpen, 
  User, 
  Send,
  AlertCircle
} from 'lucide-react';

interface EmailLogItem {
  id: string;
  recipient: string;
  subject: string;
  category: string;
  bookTitle?: string;
  senderName: string;
  senderEmail: string;
  questionId: string;
  preview: string;
  sentAt: string;
  status: 'delivered' | 'pending' | 'failed';
}

interface AdminEmailLogsTabProps {
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

export const AdminEmailLogsTab: React.FC<AdminEmailLogsTabProps> = ({ onNotify }) => {
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [adminEmail, setAdminEmail] = useState('bibliothequechretien@gmail.com');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'book_question' | 'admin_direct'>('all');

  const fetchLogs = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch('/api/admin/email-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.adminOfficialEmail) {
          setAdminEmail(data.adminOfficialEmail);
        }
      }
    } catch (err) {
      console.warn('Error fetching email logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => fetchLogs(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filterCategory !== 'all' && log.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.subject.toLowerCase().includes(q) ||
        log.senderName.toLowerCase().includes(q) ||
        log.senderEmail.toLowerCase().includes(q) ||
        (log.bookTitle && log.bookTitle.toLowerCase().includes(q)) ||
        log.preview.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">
                Centre de Notifications Gmail Administrateur
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                Actif
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Boîte de réception officielle de l'administrateur :{' '}
              <a
                href={`mailto:${adminEmail}`}
                className="text-sky-300 font-mono font-semibold hover:underline"
              >
                {adminEmail}
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20"
          >
            <span>Ouvrir Gmail</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une notification..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            Toutes ({logs.length})
          </button>

          <button
            onClick={() => setFilterCategory('book_question')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterCategory === 'book_question'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            📖 Questions Livres
          </button>

          <button
            onClick={() => setFilterCategory('admin_direct')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterCategory === 'admin_direct'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            👨‍💼 Requêtes Directes
          </button>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
            <span>Chargement des notifications envoyées...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Mail className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">Aucune notification enregistrée</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Dès qu'un visiteur pose une question (sur un livre ou directement pour l'administrateur), une notification sera enregistrée et expédiée vers {adminEmail}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredLogs.map((log) => {
              const isBook = log.category === 'book_question' || !!log.bookTitle;
              return (
                <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-850/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isBook ? (
                          <span className="px-2 py-0.5 rounded-md bg-sky-950 border border-sky-500/40 text-sky-300 font-semibold text-[11px] flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>Partie 1 : Question Livre</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-semibold text-[11px] flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>Partie 2 : Question Directe Admin</span>
                          </span>
                        )}

                        <span className="font-mono text-xs font-bold text-slate-300">
                          {log.subject}
                        </span>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Envoyé à {log.recipient}</span>
                        </span>
                      </div>

                      {log.bookTitle && (
                        <div className="text-xs text-sky-300 font-medium">
                          Ouvrage concerné : « {log.bookTitle} »
                        </div>
                      )}

                      <p className="text-xs text-slate-300 leading-relaxed font-light line-clamp-2">
                        {log.preview}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="text-slate-200 font-medium">👤 {log.senderName}</span>
                        <span>•</span>
                        <a
                          href={`mailto:${log.senderEmail}`}
                          className="text-sky-400 hover:underline"
                        >
                          ✉️ {log.senderEmail}
                        </a>
                        <span>•</span>
                        <span>{new Date(log.sentAt).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                      <span className="font-mono text-[10px] text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-500/30">
                        {log.questionId}
                      </span>
                      <a
                        href={`mailto:${log.senderEmail}?subject=${encodeURIComponent(`Réponse à : ${log.subject}`)}`}
                        className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-semibold flex items-center gap-1"
                        title="Répondre directement par courriel"
                      >
                        <Send className="w-3 h-3" />
                        <span>Répondre</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
