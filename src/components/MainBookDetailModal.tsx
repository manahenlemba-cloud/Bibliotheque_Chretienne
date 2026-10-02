import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  DownloadCloud, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  UserCheck, 
  Edit3, 
  Upload, 
  Layers, 
  Save, 
  FileText, 
  Eye, 
  Check, 
  ArrowRight,
  Clock,
  Share2,
  Cloud
} from 'lucide-react';
import { Book } from '../types';
import { PdfExportModal } from './PdfExportModal.tsx';
import { EditBookPublicationModal } from './EditBookPublicationModal';
import { BookShareModal } from './BookShareModal';

interface MainBookDetailModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onReadOnline: (book: Book) => void;
  onAskAi: (bookId: string) => void;
  isAdmin?: boolean;
  onBookUpdated?: () => void;
}

export const MainBookDetailModal: React.FC<MainBookDetailModalProps> = ({
  book,
  isOpen,
  onClose,
  onReadOnline,
  onAskAi,
  isAdmin = false,
  onBookUpdated
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditPublicationOpen, setIsEditPublicationOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit fields
  const [editCover, setEditCover] = useState(book.cover_image || '');
  const [editTitle, setEditTitle] = useState(book.title || '');
  const [editAuthor, setEditAuthor] = useState(book.author || 'Docteur LEMBA KAVUMBULA MOÏSE');
  const [editDesc, setEditDesc] = useState(book.description || '');
  const [editReadingContent, setEditReadingContent] = useState(book.reading_file || '');
  const [editPdfUrl, setEditPdfUrl] = useState(book.pdf_url || book.google_drive_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditCover(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReadingTextUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setEditReadingContent(text);
    };
    reader.readAsText(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          author: editAuthor.trim(),
          description: editDesc.trim(),
          cover_image: editCover.trim(),
          reading_file: editReadingContent.trim(),
          pdf_url: editPdfUrl.trim(),
          google_drive_url: editPdfUrl.trim()
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        if (onBookUpdated) onBookUpdated();
        setTimeout(() => {
          setSaveSuccess(false);
          setIsEditing(false);
        }, 1500);
      } else {
        alert("Erreur lors de l'enregistrement de l'ouvrage.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Table of contents items
  const tableOfContents = [
    { num: "Chapitre 1", title: "L'Appel Souverain de Dieu par Sa Grâce", ref: "1 Pierre 5:10a • Jean 16:8" },
    { num: "Chapitre 2", title: "La Souffrance d'un Peu de Temps et le Brisement Salutaire", ref: "1 Pierre 5:10b • 1 Pierre 4:12" },
    { num: "Chapitre 3", title: "Le Perfectionnement : La Restauration de l'Âme", ref: "1 Pierre 5:10c • Éphésiens 4:12" },
    { num: "Chapitre 4", title: "L'Affermissement dans la Saine Doctrine", ref: "1 Pierre 5:10d • Colossiens 2:7" },
    { num: "Chapitre 5", title: "La Force Inébranlable pour la Dernière Heure", ref: "1 Pierre 5:10e • Éphésiens 6:10" }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white p-5 sm:p-6 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-black border border-white/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-sky-200 uppercase block">
                Fiche de l'Ouvrage Magistral
              </span>
              <h2 className="font-display font-bold text-lg sm:text-xl text-white line-clamp-1">
                {book.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setIsEditPublicationOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md transition-all cursor-pointer"
                title="Modifier la publication (Couverture, PDF, Synthèse IA, Suppression)"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier la publication</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
              title="Partager"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          
          {isEditing ? (
            /* ADMIN EDIT MODE */
            <form onSubmit={handleSave} className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-black text-xs font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-800 flex-shrink-0" />
                <span className="text-black">Espace Administrateur : Vous pouvez modifier la couverture, importer le fichier complet ou ajuster le résumé.</span>
              </div>

              {saveSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Modifications enregistrées avec succès !</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Titre du Livre *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Auteur *
                  </label>
                  <input
                    type="text"
                    required
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Cover Image Manager */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Image de Couverture du Livre
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {editCover && (
                    <img 
                      src={editCover} 
                      alt="Couverture" 
                      className="w-20 h-28 object-cover rounded-xl border border-slate-200 shadow-sm"
                    />
                  )}
                  <div className="flex-1 space-y-2 w-full">
                    <input
                      type="text"
                      placeholder="URL directe de l'image de couverture"
                      value={editCover}
                      onChange={(e) => setEditCover(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200 cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-sky-600" />
                        <span>Importer une photo depuis l'ordinateur</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF & Google Drive URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Lien de Téléchargement PDF / Google Drive
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/..."
                  value={editPdfUrl}
                  onChange={(e) => setEditPdfUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-500"
                />
              </div>

              {/* Full Reading Text File Upload / Edit */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Fichier de Lecture Intégral du Livre (Texte)
                  </label>
                  <label className="px-3 py-1 rounded-lg bg-white hover:bg-sky-50 text-sky-800 text-xs font-semibold border border-slate-200 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Charger un fichier .txt ou .md</span>
                    <input
                      type="file"
                      accept=".txt,.md"
                      onChange={handleReadingTextUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={8}
                  value={editReadingContent}
                  onChange={(e) => setEditReadingContent(e.target.value)}
                  placeholder="Collez ou importez ici le texte intégral du livre..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-normal outline-none focus:border-sky-500 resize-y"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Résumé Spirituel de l'Ouvrage
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-sky-500 resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Enregistrement...' : 'Sauvegarder les modifications'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* USER VIEW MODE */
            <div className="space-y-6">
              
              {/* Presentation Grid: Cover + Info */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-4 flex justify-center">
                  <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-sky-100 max-w-[220px] w-full">
                    {book.cover_image ? (
                      <img
                        src={book.cover_image}
                        alt={book.title}
                        className="w-full h-auto object-cover"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-gradient-to-br from-slate-900 to-sky-950 text-white p-5 flex flex-col justify-between text-center border border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded">
                          {book.category}
                        </span>
                        <div className="my-auto py-2">
                          <h3 className="font-display font-bold text-sm text-white line-clamp-3">
                            {book.title}
                          </h3>
                          <p className="text-[11px] text-sky-200 mt-1">
                            {book.author}
                          </p>
                        </div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                          Bibliothèque Chrétienne
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-8 space-y-4">
                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-100 text-sky-800">
                      {book.category}
                    </span>
                    <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 mt-2 leading-snug">
                      {book.title}
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                      <UserCheck className="w-4 h-4 text-sky-600" />
                      <span>{book.author}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {book.description}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onReadOnline(book);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Lire en ligne</span>
                    </button>

                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                      title="Générer un PDF certifié et le synchroniser vers Google Drive"
                    >
                      <Cloud className="w-4 h-4 text-white" />
                      <span>Exporter PDF / Drive</span>
                    </button>

                    <a
                      href={book.pdf_url || book.google_drive_url || "https://drive.google.com/"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 flex items-center gap-2 shadow-xs transition-all"
                    >
                      <DownloadCloud className="w-4 h-4 text-sky-600" />
                      <span>Télécharger PDF</span>
                    </a>

                    <button
                      onClick={() => {
                        onClose();
                        onAskAi(book.id);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-black font-bold text-xs border border-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-slate-800" />
                      <span className="text-black">Interroger l'IA</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* TABLE OF CONTENTS SECTION */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-700" />
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Table des Matières & Parcours d'Édification
                  </h3>
                </div>

                <div className="space-y-2">
                  {tableOfContents.map((item, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50/70 border border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-sky-700 font-bold text-xs flex items-center justify-center shadow-2xs">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-[11px] font-bold text-sky-700 block uppercase">
                            {item.num}
                          </span>
                          <span className="font-semibold text-xs sm:text-sm text-slate-900">
                            {item.title}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-medium text-slate-500 px-2 py-0.5 rounded-md bg-white border border-slate-200 self-start sm:self-auto">
                        {item.ref}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* PDF Export & Google Drive Modal */}
      <PdfExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        document={{ type: 'book', book }}
      />

      {/* Book Quick Share Modal */}
      <BookShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        book={book}
      />

      {/* Edit Book Publication Modal (Admin) */}
      {isEditPublicationOpen && (
        <EditBookPublicationModal
          book={book}
          isOpen={isEditPublicationOpen}
          onClose={() => setIsEditPublicationOpen(false)}
          onBookUpdated={() => {
            if (onBookUpdated) onBookUpdated();
          }}
          onBookDeleted={() => {
            if (onBookUpdated) onBookUpdated();
            onClose();
          }}
        />
      )}
    </div>
  );
};
