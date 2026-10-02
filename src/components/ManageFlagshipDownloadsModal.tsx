import React, { useState, useEffect } from 'react';
import { 
  DownloadCloud, 
  Link as LinkIcon, 
  ExternalLink, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileText, 
  Music, 
  Sparkles, 
  BookOpen, 
  AlertCircle, 
  Save, 
  X, 
  HardDrive,
  Globe,
  Layers,
  Check
} from 'lucide-react';
import { Book, BookDownloadLink } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentBook?: Book | null;
  onSaved?: (updatedBook: Book) => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

export const ManageFlagshipDownloadsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentBook,
  onSaved,
  onNotify
}) => {
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [downloadLinks, setDownloadLinks] = useState<BookDownloadLink[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Initialize from current book or load from dedicated endpoint
  useEffect(() => {
    if (isOpen) {
      if (currentBook) {
        setGoogleDriveUrl(currentBook.google_drive_url || '');
        setPdfUrl(currentBook.pdf_url || '');
        setDownloadLinks(currentBook.download_links ? [...currentBook.download_links] : []);
      } else {
        // Fetch from API in case book exists on server
        fetch('/api/books/flagship/download-links')
          .then(res => res.json())
          .then(data => {
            if (data) {
              setGoogleDriveUrl(data.google_drive_url || '');
              setPdfUrl(data.pdf_url || '');
              setDownloadLinks(data.download_links || []);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, currentBook]);

  if (!isOpen) return null;

  const handleAddLink = (preset?: { label: string; format: BookDownloadLink['format']; urlPlaceholder?: string }) => {
    const newLink: BookDownloadLink = {
      id: 'dl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      label: preset?.label || 'Téléchargement direct',
      url: preset?.urlPlaceholder || '',
      format: preset?.format || 'pdf',
      note: ''
    };
    setDownloadLinks(prev => [...prev, newLink]);
  };

  const handleUpdateLink = (id: string, field: keyof BookDownloadLink, val: string) => {
    setDownloadLinks(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const handleRemoveLink = (id: string) => {
    setDownloadLinks(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        google_drive_url: googleDriveUrl.trim(),
        pdf_url: pdfUrl.trim(),
        download_links: downloadLinks.filter(l => l.url.trim().length > 0 || l.label.trim().length > 0),
        title: currentBook?.title || "Les 5 Étapes Spirituelles Pour Devenir Chrétien",
        author: currentBook?.author || "Docteur LEMBA KAVUMBULA MOÏSE"
      };

      const res = await fetch('/api/books/flagship/download-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (onNotify) {
          onNotify('success', data.message || "Liens de téléchargement enregistrés avec succès !");
        }
        if (onSaved && data.book) {
          onSaved(data.book);
        }
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        if (onNotify) {
          onNotify('error', errData.error || "Erreur lors de l'enregistrement des liens.");
        } else {
          alert("Erreur lors de l'enregistrement.");
        }
      }
    } catch (err: any) {
      if (onNotify) {
        onNotify('error', err.message || "Erreur réseau.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formatIcon = (format?: string) => {
    switch (format) {
      case 'drive':
        return <HardDrive className="w-3.5 h-3.5 text-emerald-400" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-purple-400" />;
      case 'epub':
        return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-sky-500/40 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl my-6">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <DownloadCloud className="w-5 h-5" />
              </span>
              <span className="text-xs uppercase font-extrabold text-sky-400 tracking-wider">
                Espace Éditeur & Téléchargements
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-100">
              Liens de Téléchargement du Livre
            </h2>
            <p className="text-xs text-sky-300 font-medium">
              « {currentBook?.title || "Les 5 Étapes Spirituelles Pour Devenir Chrétien"} » • Dr. LEMBA KAVUMBULA MOÏSE
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Notice info */}
          <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/30 text-xs text-slate-300 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sky-200">
                Configurez librement les sources de téléchargement pour vos lecteurs
              </p>
              <p className="text-slate-400 leading-relaxed">
                Vous pouvez ajouter votre lien Google Drive officiel (dossier ou fichier PDF), un lien direct de téléchargement PDF, ainsi que des versions additionnelles (audio MP3, haute définition, version mobile, miroir). Ces liens apparaîtront directement sur la page du livre et dans le parcours des 5 étapes.
              </p>
            </div>
          </div>

          {/* 1. Official Google Drive Link */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>1. Lien Principal Google Drive (Officiel)</span>
              </label>
              {googleDriveUrl && (
                <a
                  href={googleDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 hover:underline"
                >
                  <span>Tester le lien Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Collez le lien de partage Google Drive de votre fichier ou dossier d'ouvrage (ex: lié à <code className="text-sky-300 font-mono">bibliothequechretien@gmail.com</code>).
            </p>

            <div className="relative">
              <input
                type="url"
                value={googleDriveUrl}
                onChange={(e) => setGoogleDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/1A2B3C4D.../view?usp=sharing"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* 2. Direct PDF Download Link */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>2. Lien de Téléchargement Direct PDF (Optionnel)</span>
              </label>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 hover:underline"
                >
                  <span>Tester le lien PDF</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              URL directe vers le fichier PDF hébergé ou miroir de téléchargement instantané.
            </p>

            <div className="relative">
              <input
                type="url"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="https://votre-serveur.com/fichiers/les-5-etapes-spirituelles.pdf"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* 3. Multiple Custom Download Links */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-amber-400" />
                  <span>3. Liens de Téléchargement Personnalisés Multiples</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ajoutez autant de liens spécifiques que nécessaire (formats alternatifs, audios, miroirs, formats mobiles).
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddLink({ label: "Téléchargement PDF Haute Définition", format: 'pdf' })}
                  className="px-2.5 py-1 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-600/40 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ PDF HD</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddLink({ label: "Enseignement Audio (MP3)", format: 'audio' })}
                  className="px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-600/40 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Audio MP3</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddLink({ label: "Liseuse & Mobile (EPUB)", format: 'epub' })}
                  className="px-2.5 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/40 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ EPUB</span>
                </button>
              </div>
            </div>

            {/* List of custom links */}
            {downloadLinks.length === 0 ? (
              <div className="py-6 px-4 rounded-xl border border-dashed border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  Aucun lien personnalisé supplémentaire ajouté.
                </p>
                <button
                  type="button"
                  onClick={() => handleAddLink()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ajouter un premier lien personnalisé</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {downloadLinks.map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      
                      {/* Format selector */}
                      <div className="sm:col-span-3">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Format
                        </label>
                        <select
                          value={item.format || 'pdf'}
                          onChange={(e) => handleUpdateLink(item.id, 'format', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-sky-500 cursor-pointer"
                        >
                          <option value="pdf">📄 Fichier PDF</option>
                          <option value="drive">📁 Google Drive</option>
                          <option value="audio">🎧 Audio MP3</option>
                          <option value="epub">📱 Format EPUB</option>
                          <option value="mirror">🌐 Lien Miroir</option>
                          <option value="other">🔗 Autre lien</option>
                        </select>
                      </div>

                      {/* Label */}
                      <div className="sm:col-span-5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Libellé du Bouton
                        </label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => handleUpdateLink(item.id, 'label', e.target.value)}
                          placeholder="Ex: Télécharger le PDF (Édition Complète)"
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Note or size */}
                      <div className="sm:col-span-3">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Note (Ex: 12 Mo)
                        </label>
                        <input
                          type="text"
                          value={item.note || ''}
                          onChange={(e) => handleUpdateLink(item.id, 'note', e.target.value)}
                          placeholder="Ex: 8 Mo / HD"
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Delete */}
                      <div className="sm:col-span-1 flex items-end justify-center pt-4 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(item.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-colors"
                          title="Supprimer ce lien"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* URL */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-bold text-slate-400">
                          Adresse Web du Lien (URL)
                        </label>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:underline"
                          >
                            <span>Tester</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) => handleUpdateLink(item.id, 'url', e.target.value)}
                        placeholder="https://..."
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 font-mono outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddLink()}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-700 hover:border-sky-500/50 bg-slate-900/50 hover:bg-slate-900 text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un autre lien de téléchargement</span>
                </button>
              </div>
            )}
          </div>

          {/* Live Preview Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Aperçu en direct des boutons pour les lecteurs</span>
              </span>
              <span className="text-[10px] text-slate-500">Affichage public</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {googleDriveUrl && (
                <div className="py-2 px-3 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Google Drive (Officiel)</span>
                </div>
              )}

              {pdfUrl && (
                <div className="py-2 px-3 rounded-xl bg-sky-600/20 border border-sky-500/40 text-sky-300 text-xs font-semibold flex items-center gap-2">
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Téléchargement direct (PDF)</span>
                </div>
              )}

              {downloadLinks.map((dl, idx) => (
                <div
                  key={idx}
                  className="py-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2"
                >
                  {formatIcon(dl.format)}
                  <span>{dl.label || 'Télécharger'}</span>
                  {dl.note && <span className="text-[10px] text-slate-400 font-normal">({dl.note})</span>}
                </div>
              ))}

              {!googleDriveUrl && !pdfUrl && downloadLinks.length === 0 && (
                <span className="text-xs text-slate-500 italic">
                  Aucun lien configuré pour l'instant. Les lecteurs verront un lien vers la bibliothèque.
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 cursor-pointer transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/20 cursor-pointer flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les Liens de Téléchargement'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
