import React, { useState } from 'react';
import { X, UploadCloud, Link as LinkIcon, Camera, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImageToDataUrl } from '../utils/imageCompressor';

export type SitePhotoSlot = 
  | 'showcaseCoverImage' 
  | 'authorPhotoUrl' 
  | 'logoUrl' 
  | 'heroBackgroundImage'
  | 'step-1'
  | 'step-2'
  | 'step-3'
  | 'step-4'
  | 'step-5';

interface SitePhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: SitePhotoSlot;
  slotTitle: string;
  slotDescription?: string;
  currentPhotoUrl?: string;
  onPhotoSaved: (slot: SitePhotoSlot, url: string) => void;
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const SitePhotoUploadModal: React.FC<SitePhotoUploadModalProps> = ({
  isOpen,
  onClose,
  slot,
  slotTitle,
  slotDescription,
  currentPhotoUrl = '',
  onPhotoSaved,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [photoUrl, setPhotoUrl] = useState<string>(currentPhotoUrl);
  const [previewUrl, setPreviewUrl] = useState<string>(currentPhotoUrl);
  const [fileName, setFileName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      if (onNotify) onNotify('error', "L'image ne doit pas dépasser 15 Mo.");
      return;
    }

    setFileName(file.name);
    try {
      // Compress to high-definition web image (max 800px, ~70-120KB) for permanent persistence
      const compressed = await compressImageToDataUrl(file, 800, 800, 0.88);
      setPhotoUrl(compressed);
      setPreviewUrl(compressed);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoUrl(result);
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (val: string) => {
    setPhotoUrl(val);
    setPreviewUrl(val);
  };

  const handleSave = async () => {
    if (!photoUrl.trim()) {
      if (onNotify) onNotify('error', "Veuillez sélectionner ou saisir une photo.");
      return;
    }

    try {
      setIsSaving(true);
      // If author photo, save to client persistent storage immediately
      if (slot === 'authorPhotoUrl') {
        try {
          localStorage.setItem('bdh_author_photo_url', photoUrl);
        } catch (e) {
          console.warn('LocalStorage author photo quota exceeded:', e);
        }
      }

      const res = await fetch('/api/admin/site-settings/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, image: photoUrl })
      });

      if (!res.ok) {
        throw new Error('Erreur lors de l\'enregistrement de la photo');
      }

      const data = await res.json();
      const finalUrl = data.url || photoUrl;
      if (slot === 'authorPhotoUrl' && finalUrl) {
        try {
          localStorage.setItem('bdh_author_photo_url', finalUrl);
        } catch {}
      }
      onPhotoSaved(slot, finalUrl);
      if (onNotify) onNotify('success', `Photo enregistrée pour « ${slotTitle} » !`);
      onClose();
    } catch (err) {
      console.error(err);
      if (slot === 'authorPhotoUrl') {
        try {
          localStorage.setItem('bdh_author_photo_url', photoUrl);
        } catch {}
      }
      onPhotoSaved(slot, photoUrl);
      if (onNotify) onNotify('success', `Photo appliquée avec succès.`);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsSaving(true);
      if (slot === 'authorPhotoUrl') {
        localStorage.removeItem('bdh_author_photo_url');
      }
      await fetch('/api/admin/site-settings/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, image: '', clear: true })
      });
      onPhotoSaved(slot, '');
      if (onNotify) onNotify('info', `Photo supprimée pour « ${slotTitle} ».`);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-100 text-sky-700">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-slate-900 leading-snug">
                {slotTitle}
              </h2>
              <p className="text-xs text-slate-500 line-clamp-1">
                {slotDescription || "Ajouter ou modifier cette photo du site"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Tabs */}
          <div className="flex p-1 rounded-2xl bg-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Depuis votre appareil</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Lien Web (URL)</span>
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-sky-200 hover:border-sky-400 rounded-2xl bg-sky-50/40 hover:bg-sky-50/70 transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-sky-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6 text-sky-600" />
                </div>
                <span className="text-xs font-bold text-slate-800 mb-1">
                  Sélectionnez une photo pour cet emplacement
                </span>
                <span className="text-[11px] text-slate-500">
                  Formats acceptés : JPG, PNG, WEBP (Max 10 Mo)
                </span>
                {fileName && (
                  <div className="mt-3 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                    <Check className="w-3 h-3" />
                    <span>{fileName}</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* URL Tab */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Adresse URL directe de la photo
              </label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://exemple.com/photo.jpg"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-xs text-slate-800 outline-none transition-all"
              />
            </div>
          )}

          {/* Live Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
            <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0 flex items-center justify-center shadow-xs">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                  onError={() => setPreviewUrl('')}
                />
              ) : (
                <div className="text-center p-2">
                  <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <span className="text-[9px] text-slate-500 font-semibold block leading-tight">
                    Aucune photo
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1">
              <span className="text-xs font-bold text-slate-800 block">
                Aperçu instantané
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Visualisez la photo avant de l'appliquer sur le site.
              </p>
              {currentPhotoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isSaving}
                  className="text-[11px] text-red-600 hover:text-red-700 font-semibold underline cursor-pointer mt-1"
                >
                  Supprimer la photo actuelle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !photoUrl.trim()}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Enregistrer la photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
