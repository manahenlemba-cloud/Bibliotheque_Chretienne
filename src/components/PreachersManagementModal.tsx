import React, { useState, useEffect } from 'react';
import { 
  Users, 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  UserCheck, 
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  Trash
} from 'lucide-react';
import { Preacher } from '../types';

interface PreachersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreachersChanged: () => void;
  onSermonsCleaned: () => void;
}

export const PreachersManagementModal: React.FC<PreachersManagementModalProps> = ({
  isOpen,
  onClose,
  onPreachersChanged,
  onSermonsCleaned
}) => {
  const [preachers, setPreachers] = useState<Preacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'cleanup'>('list');

  // Add / Edit preacher form state
  const [editingPreacherId, setEditingPreacherId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Cleanup state
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ removedCount: number; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPreachers();
    }
  }, [isOpen]);

  const loadPreachers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/preachers');
      if (res.ok) {
        const data = await res.json();
        setPreachers(data.preachers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAdd = () => {
    setEditingPreacherId(null);
    setName('');
    setRole('Pasteur & Prédicateur de la Parole');
    setBio('');
    setAvatar('/images/file_000000003b5481fdb8aeec6d9e69e0d1~2.jpg');
    setActiveTab('add');
  };

  const handleStartEdit = (p: Preacher) => {
    setEditingPreacherId(p.id);
    setName(p.name);
    setRole(p.role || '');
    setBio(p.bio || '');
    setAvatar(p.avatar || '');
    setActiveTab('add');
  };

  const handleSavePreacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Le nom du prédicateur est obligatoire.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        role: role.trim(),
        bio: bio.trim(),
        avatar: avatar.trim() || '/images/file_000000003b5481fdb8aeec6d9e69e0d1~2.jpg',
        active: true
      };

      const url = editingPreacherId ? `/api/preachers/${editingPreacherId}` : '/api/preachers';
      const method = editingPreacherId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setActionSuccess(editingPreacherId ? 'Prédicateur modifié avec succès !' : 'Nouveau prédicateur ajouté avec succès !');
        setTimeout(() => setActionSuccess(null), 2500);
        await loadPreachers();
        onPreachersChanged();
        setActiveTab('list');
      } else {
        alert("Erreur lors de l'enregistrement du prédicateur.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur de connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePreacher = async (p: Preacher) => {
    if (!window.confirm(`Voulez-vous vraiment retirer « ${p.name} » de la liste des prédicateurs officiels ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/preachers/${p.id}`, { method: 'DELETE' });
      if (res.ok) {
        setActionSuccess(`« ${p.name} » a été supprimé.`);
        setTimeout(() => setActionSuccess(null), 2500);
        await loadPreachers();
        onPreachersChanged();
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la suppression.");
    }
  };

  // 1-Click Clean unassociated sermons with confirmation
  const handleCleanupUnassociatedSermons = async () => {
    const confirmed = window.confirm(
      "CONFIRMATION OBLIGATOIRE :\n\nÊtes-vous sûr de vouloir supprimer tous les enseignements/sermons non associés aux prédicateurs officiels reconnus ?\n\nCette action supprimera définitivement les sermons orphelins ou personnalisés non rattachés."
    );

    if (!confirmed) return;

    try {
      setIsCleaning(true);
      setCleanupResult(null);

      const res = await fetch('/api/admin/sermons/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        setCleanupResult({
          removedCount: data.removedCount,
          message: data.message
        });
        onSermonsCleaned();
        await loadPreachers();
      } else {
        alert("Erreur lors du nettoyage des sermons.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors du nettoyage.");
    } finally {
      setIsCleaning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-950 text-white rounded-3xl max-w-3xl w-full border border-slate-800 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        
        {/* Header Dark Minimalist */}
        <div className="bg-black p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950">
                  Administration des Sermons
                </span>
                <span className="text-xs text-slate-400 font-mono">Prédicateurs & Nettoyage</span>
              </div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-white mt-0.5">
                Gestion des Prédicateurs & Enseignements
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'border-amber-400 text-amber-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Liste des Prédicateurs ({preachers.length})</span>
          </button>

          <button
            type="button"
            onClick={handleStartAdd}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'border-amber-400 text-amber-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{editingPreacherId ? 'Modifier le prédicateur' : 'Ajouter un prédicateur'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cleanup')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ml-auto ${
              activeTab === 'cleanup'
                ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                : 'border-transparent text-rose-400/80 hover:text-rose-300'
            }`}
          >
            <Trash className="w-4 h-4" />
            <span>Nettoyage Sermons Orphelins</span>
          </button>
        </div>

        {/* Action notification */}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: LIST OF PREACHERS */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">
                  Prédicateurs officiels reconnus pour les enseignements
                </span>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un Prédicateur</span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                  <span className="text-xs">Chargement des prédicateurs...</span>
                </div>
              ) : preachers.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  Aucun prédicateur enregistré pour l'instant.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {preachers.map((preacher) => (
                    <div
                      key={preacher.id}
                      className="p-4 rounded-2xl bg-black border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0">
                          {preacher.avatar ? (
                            <img src={preacher.avatar} alt={preacher.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-6 h-6 text-slate-500 m-auto mt-3" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-white">{preacher.name}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                              {preacher.sermonsCount || 0} sermon(s)
                            </span>
                          </div>
                          <p className="text-xs text-sky-400 font-medium">{preacher.role}</p>
                          {preacher.bio && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-md">{preacher.bio}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(preacher)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modifier</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePreacher(preacher)}
                          className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-400 hover:text-rose-200 transition-colors cursor-pointer"
                          title="Supprimer le prédicateur"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD / EDIT PREACHER */}
          {activeTab === 'add' && (
            <form onSubmit={handleSavePreacher} className="space-y-4">
              <div className="p-4 rounded-2xl bg-black border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                  {editingPreacherId ? 'Modifier les détails du Prédicateur' : 'Nouveau Prédicateur Officiel'}
                </span>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nom complet & Titre</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Docteur LEMBA KAVUMBULA MOÏSE"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rôle pastoral ou ecclésiastique</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="ex: Docteur en Théologie & Auteur Principal"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">URL Photo / Avatar</label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="/images/author-lemba.jpg ou URL"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Biographie ou présentation</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Présentation spirituelle et ministère..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <Save className="w-4 h-4 text-slate-950" />
                  )}
                  <span>{editingPreacherId ? 'Mettre à jour le Prédicateur' : 'Enregistrer le Prédicateur'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CLEANUP UNASSOCIATED SERMONS */}
          {activeTab === 'cleanup' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-700/60 space-y-3">
                <div className="flex items-center gap-2.5 text-rose-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <h3 className="font-bold text-sm text-white">
                    Nettoyage des Enseignements & Sermons Non Associés
                  </h3>
                </div>
                <p className="text-xs text-rose-200 leading-relaxed">
                  Cette fonction analyse tous les sermons présents sur la plateforme et supprime en un seul clic tous les sermons non associés à l'un des prédicateurs officiels actifs (ou créés lors de tests temporaires).
                </p>
                <p className="text-[11px] text-slate-400">
                  Prédicateurs reconnus actuels : {preachers.map(p => p.name).join(', ')}.
                </p>
              </div>

              {cleanupResult && (
                <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Nettoyage effectué avec succès !</span>
                  </div>
                  <p className="text-slate-300 font-normal">{cleanupResult.message}</p>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-black border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Lancer le nettoyage en un clic
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Une boîte de confirmation obligatoire apparaîtra avant la suppression définitive.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCleanupUnassociatedSermons}
                  disabled={isCleaning}
                  className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-xl flex items-center gap-2 transition-all cursor-pointer flex-shrink-0"
                >
                  {isCleaning ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash className="w-4 h-4" />
                  )}
                  <span>{isCleaning ? "Nettoyage en cours..." : "Supprimer tous les sermons non associés"}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-black p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Centre du Réveil Spirituel de la dernière Heure</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
