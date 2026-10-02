import React, { useState, useEffect } from 'react';
import { SpiritualStepData, BookDownloadLink } from '../types';
import { 
  Layers, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  BookOpen, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HeartHandshake,
  DownloadCloud,
  HardDrive,
  FileText,
  Link as LinkIcon,
  Plus
} from 'lucide-react';
import { ManageFlagshipDownloadsModal } from './ManageFlagshipDownloadsModal';

interface Props {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export const AdminSpiritualStepsTab: React.FC<Props> = ({ onNotify }) => {
  const [steps, setSteps] = useState<SpiritualStepData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStep, setEditingStep] = useState<SpiritualStepData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [isManageDownloadsOpen, setIsManageDownloadsOpen] = useState(false);
  const [flagshipData, setFlagshipData] = useState<{
    exists: boolean;
    google_drive_url: string;
    pdf_url: string;
    download_links: BookDownloadLink[];
  } | null>(null);

  useEffect(() => {
    fetchSteps();
    fetchFlagshipDownloads();
  }, []);

  const fetchFlagshipDownloads = async () => {
    try {
      const res = await fetch('/api/books/flagship/download-links');
      if (res.ok) {
        const data = await res.json();
        setFlagshipData(data);
      }
    } catch (e) {
      console.warn("Erreur chargement liens flagship:", e);
    }
  };

  const fetchSteps = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/spiritual-steps');
      if (res.ok) {
        const data = await res.json();
        setSteps(data);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des étapes:", err);
      onNotify('error', "Impossible de charger les 5 étapes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStep) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/spiritual-steps/${editingStep.stepNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStep)
      });

      if (res.ok) {
        const updated = await res.json();
        setSteps(prev => prev.map(s => s.stepNumber === updated.stepNumber ? updated : s));
        setEditingStep(null);
        onNotify('success', `Étape ${updated.stepNumber} (« ${updated.title} ») mise à jour avec succès.`);
      } else {
        const data = await res.json();
        onNotify('error', data.error || "Erreur lors de l'enregistrement.");
      }
    } catch (err: any) {
      onNotify('error', err.message || "Erreur de connexion.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir restaurer les textes canoniques d'origine des 5 étapes spirituelles ?")) return;

    try {
      setIsSaving(true);
      const res = await fetch('/api/spiritual-steps/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSteps(data);
        setEditingStep(null);
        onNotify('success', "Les 5 étapes ont été restaurées selon le texte fondateur d'origine.");
      }
    } catch (err: any) {
      onNotify('error', "Échec de réinitialisation: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Chargement du corpus des 5 Étapes Spirituelles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-sky-500/20 text-sky-400">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">
              Enseignement Fondateur • 1 Pierre 5:10
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-100">
            Gestion des 5 Étapes Spirituelles pour Devenir Chrétien
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Ordre strict et immuable selon l'auteur <strong className="text-sky-300">Docteur LEMBA KAVUMBULA MOÏSE</strong> : 
            1. APPEL, 2. SOUFFRANCE, 3. PERFECTIONNEMENT, 4. AFFERMISSEMENT, 5. FORTIFICATION.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer self-start sm:self-auto"
          title="Restaurer le texte fondateur original"
        >
          <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
          <span>Restaurer le texte d'origine</span>
        </button>
      </div>

      {/* OUVRAGE DE RÉFÉRENCE & LIENS DE TÉLÉCHARGEMENT */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-500/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Livre Magistral & Fichiers
                </span>
                <span className="text-xs text-slate-400">Docteur LEMBA KAVUMBULA MOÏSE</span>
              </div>
              <h3 className="font-display text-base sm:text-lg font-bold text-slate-100 mt-0.5">
                Les 5 Étapes Spirituelles Pour Devenir Chrétien
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Gérez les liens de téléchargement de l'ouvrage (Google Drive, PDF direct, et formats additionnels).
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsManageDownloadsOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto transition-all"
          >
            <DownloadCloud className="w-4 h-4 text-slate-950" />
            <span>Gérer les liens de téléchargement</span>
          </button>
        </div>

        {/* Current status pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Drive :</span>
            </span>
            <span className={`font-mono text-[11px] truncate max-w-[130px] font-semibold ${
              flagshipData?.google_drive_url ? 'text-emerald-300' : 'text-slate-500 italic'
            }`}>
              {flagshipData?.google_drive_url ? 'Configuré ✓' : 'Non défini'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>PDF Direct :</span>
            </span>
            <span className={`font-mono text-[11px] truncate max-w-[130px] font-semibold ${
              flagshipData?.pdf_url ? 'text-sky-300' : 'text-slate-500 italic'
            }`}>
              {flagshipData?.pdf_url ? 'Configuré ✓' : 'Non défini'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Liens Spécifiques :</span>
            </span>
            <span className="font-mono text-[11px] font-semibold text-slate-200">
              {flagshipData?.download_links?.length || 0} lien(s)
            </span>
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((step) => {
          const isExpanded = expandedStep === step.stepNumber;
          return (
            <div 
              key={step.stepNumber}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all hover:border-sky-500/30"
            >
              {/* Step Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-slate-900/90 border-b border-slate-800/80">
                <div className="flex items-center gap-3.5">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-sky-500/20">
                    {step.stepNumber}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base sm:text-lg font-bold text-slate-100">
                        {step.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                        {step.primaryScripture || (step.biblicalVerses && step.biblicalVerses[0]?.reference) || '1 Pierre 5:10'}
                      </span>
                    </div>
                    <p className="text-xs text-sky-300/80 font-medium">
                      {step.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingStep(step)}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>
                  <button
                    onClick={() => setExpandedStep(isExpanded ? null : step.stepNumber)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 cursor-pointer"
                    title={isExpanded ? "Réduire" : "Développer"}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Step Body (Expanded) */}
              {isExpanded && (
                <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-300">
                  <div>
                    <h4 className="font-bold text-sky-400 uppercase tracking-wider text-[11px] mb-1">
                      Résumé Doctrinal
                    </h4>
                    <p className="text-slate-200 leading-relaxed font-light bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      {step.summary || step.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-sky-400 uppercase tracking-wider text-[11px] mb-1">
                      Enseignement Complet & Fondement
                    </h4>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line font-light bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                      {step.fullExplanation || (step.teachings && step.teachings.map(t => `${t.title} :\n${t.content}`).join('\n\n')) || step.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <h5 className="font-bold text-sky-300 text-xs mb-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Passages Bibliques Clés</span>
                      </h5>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(step.biblicalReferences || (step.biblicalVerses ? step.biblicalVerses.map(v => v.reference) : [])).map((ref, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-200 text-[11px] font-mono border border-sky-500/20">
                            {ref}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <h5 className="font-bold text-sky-300 text-xs mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Thèmes Clés & Répercussions</span>
                      </h5>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(step.keyThemes || ['Sanctification', 'Croissance Spirituelle', 'Persévérance']).map((t, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {(step.practicalPrayer || step.complementaryContent?.stepPrayer) && (
                    <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/25">
                      <h5 className="font-bold text-sky-300 text-xs mb-1 flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>Prière Pratique / Engagement</span>
                      </h5>
                      <p className="text-sky-100/90 italic text-xs leading-relaxed">
                        « {step.practicalPrayer || step.complementaryContent?.stepPrayer} »
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* EDIT MODAL */}
      {editingStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-sky-500/40 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                  {editingStep.stepNumber}
                </span>
                <h3 className="font-display text-lg font-bold text-slate-100">
                  Modifier l'Étape {editingStep.stepNumber} : {editingStep.title}
                </h3>
              </div>
              <button 
                onClick={() => setEditingStep(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Titre de l'étape *</label>
                  <input
                    type="text"
                    required
                    value={editingStep.title}
                    onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Référence biblique principale *</label>
                  <input
                    type="text"
                    required
                    value={editingStep.primaryScripture || (editingStep.biblicalVerses && editingStep.biblicalVerses[0]?.reference) || ''}
                    onChange={(e) => setEditingStep({ ...editingStep, primaryScripture: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Sous-titre explicatif *</label>
                <input
                  type="text"
                  required
                  value={editingStep.subtitle}
                  onChange={(e) => setEditingStep({ ...editingStep, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Résumé doctrinal concis *</label>
                <textarea
                  rows={3}
                  required
                  value={editingStep.summary || editingStep.description || ''}
                  onChange={(e) => setEditingStep({ ...editingStep, summary: e.target.value, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Enseignement complet & Développements *</label>
                <textarea
                  rows={6}
                  required
                  value={editingStep.fullExplanation || editingStep.description || ''}
                  onChange={(e) => setEditingStep({ ...editingStep, fullExplanation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Prière pratique / Déclaration de foi</label>
                <textarea
                  rows={2}
                  value={editingStep.practicalPrayer || editingStep.complementaryContent?.stepPrayer || ''}
                  onChange={(e) => setEditingStep({ ...editingStep, practicalPrayer: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStep(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les Modifications'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flagship Downloads Modal */}
      {isManageDownloadsOpen && (
        <ManageFlagshipDownloadsModal
          isOpen={isManageDownloadsOpen}
          onClose={() => setIsManageDownloadsOpen(false)}
          onSaved={() => {
            fetchFlagshipDownloads();
            onNotify('success', "Liens de téléchargement de l'ouvrage magistral mis à jour !");
          }}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
