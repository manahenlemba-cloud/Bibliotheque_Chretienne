import React, { useState, useEffect } from 'react';
import { User, Smartphone, Mail, Calendar, MessageSquare, Search, RefreshCw, ExternalLink } from 'lucide-react';

interface UserRecord {
  id: string;
  name: string;
  email?: string;
  whatsapp?: string;
  auth_provider: 'whatsapp' | 'google';
  created_at: string;
  questions_count: number;
}

export const AdminUsersTab: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-passcode': 'admin123' }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.warn('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.whatsapp && u.whatsapp.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base">Utilisateurs & Fidèles Inscrits ({users.length})</h3>
            <p className="text-xs text-slate-400">Comptes authentifiés par Google / Gmail</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-400"
            />
          </div>
          <button
            onClick={fetchUsers}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
          <span>Chargement des utilisateurs...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
          Aucun utilisateur trouvé.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => (
            <div key={u.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-100">{u.name}</h4>
                    <span className="text-[10px] text-slate-500">ID: {u.id}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  u.auth_provider === 'whatsapp'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                    : 'bg-sky-950 text-sky-400 border border-sky-500/30'
                }`}>
                  {u.auth_provider === 'whatsapp' ? 'WhatsApp' : 'Google'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  {u.auth_provider === 'whatsapp' ? (
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Mail className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  )}
                  <span className="truncate">{u.whatsapp || u.email}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}</span>
                </div>

                <div className="flex items-center gap-2 text-sky-400">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{u.questions_count} question(s) posée(s)</span>
                </div>
              </div>

              {u.whatsapp && (
                <div className="pt-2 border-t border-slate-800">
                  <a
                    href={`https://wa.me/${u.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Contacter sur WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
