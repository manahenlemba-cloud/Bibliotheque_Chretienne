import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  Image as ImageIcon,
  Sparkles,
  UploadCloud,
  Layers,
  BookOpen
} from 'lucide-react';
import { ShowcasePhoto } from '../types';

interface AdminShowcasePhotosManagerProps {
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AdminShowcasePhotosManager: React.FC<AdminShowcasePhotosManagerProps> = ({ onNotify }) => {
  const [photos, setPhotos] = useState<ShowcasePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<ShowcasePhoto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for creating or editing photo
  const [formTitle, setFormTitle] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formBadge, setFormBadge] = useState('Ouvrage Magistral');
  const [formAuthor, setFormAuthor] = useState('Docteur LEMBA KAVUMBULA MOÏSE');

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/showcase-photos');
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (e) {
      console.error(e);
      onNotify('error', 'Erreur lors du chargement des photos de la vitrine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const openAddModal = () => {
    setEditingPhoto(null);
    setFormTitle('');
    setFormCaption('');
    setFormUrl('');
    setFormBadge('Ouvrage Magistral');
    setFormAuthor('Docteur LEMBA KAVUMBULA MOÏSE');
    setIsModalOpen(true);
  };

  const openEditModal = (photo: ShowcasePhoto) => {
    setEditingPhoto(photo);
    setFormTitle(photo.title);
    setFormCaption(photo.caption || '');
    setFormUrl(photo.url);
    setFormBadge(photo.badge || 'Vitrine');
    setFormAuthor(photo.authorOrSource || 'Docteur LEMBA KAVUMBULA MOÏSE');
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      onNotify('error', 'L\'image dépasse la taille maximale recommandée (8 Mo).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setFormUrl(result);
      if (!formTitle) {
        const guessedName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setFormTitle(guessedName.charAt(0).toUpperCase() + guessedName.slice(1));
      }
      onNotify('success', 'Photo chargée depuis votre appareil.');
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      onNotify('error', 'Veuillez renseigner le nom de la photo.');
      return;
    }
    if (!formUrl.trim()) {
      onNotify('error', 'Veuillez sélectionner ou saisir une photo.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingPhoto) {
        // Edit existing
        const res = await fetch(`/api/showcase-photos/${editingPhoto.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            caption: formCaption.trim(),
            url: formUrl.trim(),
            badge: formBadge.trim(),
            authorOrSource: formAuthor.trim()
          })
        });

        if (res.ok) {
          onNotify('success', 'Photo mise à jour avec succès.');
          setIsModalOpen(false);
          fetchPhotos();
        } else {
          onNotify('error', 'Erreur lors de la mise à jour.');
        }
      } else {
        // Create new
        const res = await fetch('/api/showcase-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            caption: formCaption.trim(),
            url: formUrl.trim(),
            badge: formBadge.trim(),
            authorOrSource: formAuthor.trim()
          })
        });

        if (res.ok) {
          onNotify('success', 'Nouvelle photo ajoutée à la vitrine.');
          setIsModalOpen(false);
          fetchPhotos();
        } else {
          onNotify('error', 'Erreur lors de l\'ajout de la photo.');
        }
      }
    } catch (e) {
      console.error(e);
      onNotify('error', 'Erreur de connexion au serveur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePhoto = async (id: string, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la photo « ${title} » de la vitrine ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/showcase-photos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onNotify('success', 'Photo retirée de la vitrine.');
        setPhotos(prev => prev.filter(p => p.id !== id));
      } else {
        onNotify('error', 'Erreur lors de la suppression.');
      }
    } catch (e) {
      console.error(e);
      onNotify('error', 'Erreur réseau.');
    }
  };

  const handleToggleActive = async (photo: ShowcasePhoto) => {
    try {
      const res = await fetch(`/api/showcase-photos/${photo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !photo.active })
      });
      if (res.ok) {
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, active: !p.active } : p));
        onNotify('info', photo.active ? 'Photo masquée de la vitrine' : 'Photo affichée dans la vitrine');
      }
    } catch (e) {
      onNotify('error', 'Erreur lors du changement de statut.');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    const newPhotos = [...photos];
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[newIndex];
    newPhotos[newIndex] = temp;

    setPhotos(newPhotos);

    try {
      await fetch('/api/showcase-photos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newPhotos.map(p => p.id) })
      });
      onNotify('success', 'Ordre des photos actualisé.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Actions */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
              Module Administrateur
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {photos.length} photos enregistrées
            </span>
          </div>
          <h3 className="font-display text-xl font-bold text-slate-900 mt-1">
            Gestion de la Vitrine Interactive de Photos
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Importez des photos depuis votre appareil, attribuez un nom précis et une description spirituelle à chaque photo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPhotos}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-all cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une photo à la vitrine</span>
          </button>
        </div>
      </div>

      {/* Photos List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Chargement de la vitrine...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="font-semibold text-slate-800 text-sm">Aucune photo dans la vitrine</h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Commencez par ajouter la première photo avec son nom et sa légende.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Importer une photo maintenant</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`p-4 rounded-2xl bg-white border transition-all flex flex-col justify-between ${
                photo.active !== false
                  ? 'border-slate-200/90 shadow-sm hover:shadow-md'
                  : 'border-slate-200 bg-slate-50/60 opacity-60'
              }`}
            >
              <div className="flex gap-4 items-start">
                
                {/* Photo Thumbnail */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 group">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-1 left-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur">
                      #{index + 1}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                      {photo.badge || "Vitrine"}
                    </span>
                    {photo.authorOrSource && (
                      <span className="text-[11px] text-slate-500 font-medium truncate">
                        {photo.authorOrSource}
                      </span>
                    )}
                  </div>

                  {/* Photo Name (TITLE) */}
                  <h4 className="font-display font-bold text-slate-900 text-base leading-tight">
                    {photo.title}
                  </h4>

                  {photo.caption && (
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {photo.caption}
                    </p>
                  )}
                </div>

              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                
                {/* Order buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMoveOrder(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Monter"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveOrder(index, 'down')}
                    disabled={index === photos.length - 1}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Descendre"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status and Edit/Delete */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleActive(photo)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      photo.active !== false
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                    title={photo.active !== false ? 'Masquer la photo' : 'Rendre visible'}
                  >
                    {photo.active !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{photo.active !== false ? 'Actif' : 'Masqué'}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(photo)}
                    className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 cursor-pointer transition-all"
                    title="Modifier le nom ou la description"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeletePhoto(photo.id, photo.title)}
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer transition-all"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal: Add / Edit Photo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-lg">
                    {editingPhoto ? 'Modifier la photo de la vitrine' : 'Ajouter une photo à la vitrine'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Définissez le nom, l'image et la description spirituelle
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              
              {/* Photo Name (TITRE) - Crucial requirement! */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Nom de la photo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Les 5 Étapes Spirituelles Pour Devenir Chrétien"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 text-sm text-slate-900 outline-none transition-all"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Ce nom sera affiché en grand sur la photo dans la vitrine interactive.
                </span>
              </div>

              {/* Image Input: File Upload OR Url */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Image / Photo <span className="text-red-500">*</span>
                </label>

                {/* File picker */}
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold cursor-pointer transition-all">
                    <UploadCloud className="w-4 h-4 text-sky-600" />
                    <span>Importer depuis l'appareil (Ordinateur / Téléphone)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="mt-2">
                  <span className="text-[11px] text-slate-500 block mb-1">Ou saisir une URL directe :</span>
                  <input
                    type="text"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://... ou /images/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-sky-600 text-xs text-slate-800 outline-none"
                  />
                </div>

                {/* Image Live Preview */}
                {formUrl && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <img
                      src={formUrl}
                      alt="Aperçu"
                      className="w-16 h-16 rounded-lg object-cover border border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-slate-800 block">Aperçu de l'image</span>
                      <span className="text-[10px] text-emerald-600 font-medium">✓ Image prête pour la vitrine</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Caption / Description */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Légende / Description spirituelle
                </label>
                <textarea
                  rows={3}
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  placeholder="Ex: Ouvrage magistral fondé sur 1 Pierre 5:10, axé sur la préparation de l'Église pour le retour glorieux de Jésus-Christ."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 text-sm text-slate-900 outline-none transition-all"
                />
              </div>

              {/* Badge & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Badge / Catégorie
                  </label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="Ex: Ouvrage Magistral"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-sky-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Auteur ou Source
                  </label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Ex: Docteur LEMBA KAVUMBULA MOÏSE"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingPhoto ? 'Enregistrer les modifications' : 'Ajouter à la vitrine'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
