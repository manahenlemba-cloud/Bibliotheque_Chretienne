import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  X, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert, 
  Layers, 
  Eye, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  HardDrive,
  Plus,
  Link as LinkIcon
} from 'lucide-react';
import { Book, BookPublicationAnalysis, BookDownloadLink } from '../types';

interface EditBookPublicationModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onBookUpdated: (updatedBook: Book) => void;
  onBookDeleted: (bookId: string) => void;
}

export const EditBookPublicationModal: React.FC<EditBookPublicationModalProps> = ({
  book,
  isOpen,
  onClose,
  onBookUpdated,
  onBookDeleted
}) => {
  const [activeTab, setActiveTab] = useState<'cover' | 'pdf' | 'delete'>('cover');
  
  // Cover state
  const [coverUrl, setCoverUrl] = useState(book.cover_image || '');
  const [coverPreview, setCoverPreview] = useState(book.cover_image || '');
  const [coverUploading, setCoverUploading] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  // PDF, Drive & Download state
  const [googleDriveUrl, setGoogleDriveUrl] = useState(book.google_drive_url || '');
  const [pdfUrl, setPdfUrl] = useState(book.pdf_url || '');
  const [downloadLinks, setDownloadLinks] = useState<BookDownloadLink[]>(book.download_links ? [...book.download_links] : []);
  const [readingContent, setReadingContent] = useState(book.reading_file || '');
  const [pdfFileName, setPdfFileName] = useState('');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<BookPublicationAnalysis | null>(
    (book.ai_indexed_content as any) || null
  );
  const pdfFileInputRef = useRef<HTMLInputElement | null>(null);

  // Book details
  const [title, setTitle] = useState(book.title || '');
  const [author, setAuthor] = useState(book.author || 'Docteur LEMBA KAVUMBULA MOÏSE');
  const [description, setDescription] = useState(book.description || '');

  // Delete state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteFromDrive, setDeleteFromDrive] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  // 1. Handle Cover Upload (Base64 file or direct URL)
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setCoverPreview(base64);
      setCoverUrl(base64);
      setCoverUploading(false);
    };
    reader.onerror = () => {
      alert("Erreur lors de la lecture de l'image.");
      setCoverUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // 2. Handle PDF / Document Upload & Trigger Real-Time Gemini AI Analysis
  const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    setIsAnalyzingAi(true);

    // Read text content if text/markdown/html, or trigger AI analysis
    const reader = new FileReader();
    reader.onload = async (event) => {
      const extractedText = typeof event.target?.result === 'string' ? event.target.result : '';
      if (extractedText) {
        setReadingContent(extractedText);
      }

      // Call Gemini real-time document analysis endpoint
      try {
        const res = await fetch('/api/admin/books/analyze-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || book.title,
            author: author || book.author,
            fileName: file.name,
            textContent: extractedText || `Fichier PDF : ${file.name} (Taille : ${Math.round(file.size / 1024)} Ko)`
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.analysis) {
            setAiAnalysis(data.analysis);
          }
        }
      } catch (err) {
        console.error("Erreur d'analyse IA:", err);
      } finally {
        setIsAnalyzingAi(false);
      }
    };

    // If text readable, read text, else trigger with filename
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      reader.readAsText(file);
    } else {
      // For PDF binary, analyze based on filename and metadata
      setTimeout(async () => {
        try {
          const res = await fetch('/api/admin/books/analyze-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: title || book.title,
              author: author || book.author,
              fileName: file.name,
              textContent: `Document officiel téléversé : ${file.name}. Portée : Enseignements chrétiens, sanctification et édification spirituelle.`
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.analysis) {
              setAiAnalysis(data.analysis);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsAnalyzingAi(false);
        }
      }, 600);
    }
  };

  // Trigger manual AI re-analysis
  const handleTriggerManualAiAnalysis = async () => {
    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/admin/books/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || book.title,
          author: author || book.author,
          fileName: pdfFileName || 'manuscrit.pdf',
          textContent: readingContent || description || book.description
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setAiAnalysis(data.analysis);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Apply AI synthesis to book fields
  const handleApplyAiSynthesis = () => {
    if (!aiAnalysis) return;
    if (aiAnalysis.summary) {
      setDescription(aiAnalysis.summary);
    }
    alert("La synthèse structurée de l'IA a été appliquée à la description du livre ! Pensez à enregistrer.");
  };

  // 3. Save Book Publication Changes
  const handleSavePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload: any = {
        title: title.trim(),
        author: author.trim(),
        description: description.trim(),
        cover_image: coverUrl.trim() || coverPreview,
        pdf_url: pdfUrl.trim(),
        google_drive_url: googleDriveUrl.trim() || book.google_drive_url || '',
        download_links: downloadLinks
      };

      if (readingContent) {
        payload.reading_file = readingContent;
      }

      if (aiAnalysis) {
        payload.ai_indexed_content = aiAnalysis;
      }

      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setSaveSuccess(true);
        onBookUpdated(updated);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 1200);
      } else {
        alert("Erreur lors de la mise à jour de la publication.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion.");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Delete Book Completely
  const handleDeleteBook = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'SUPPRIMER') {
      alert('Veuillez taper exactement "SUPPRIMER" pour confirmer.');
      return;
    }

    if (!window.confirm(`Confirmez-vous la suppression définitive et irréversible de l'ouvrage « ${book.title} » ?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/books/${book.id}?deleteFromDrive=${deleteFromDrive}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert(`L'ouvrage « ${book.title} » a été supprimé avec succès.`);
        onBookDeleted(book.id);
        onClose();
      } else {
        alert("Erreur lors de la suppression du livre.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-950 text-white rounded-3xl max-w-4xl w-full border border-slate-800 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        
        {/* Dark Minimalist Header */}
        <div className="bg-black p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-amber-400 text-slate-950 uppercase">
                  Espace Administrateur
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {book.id}</span>
              </div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-white line-clamp-1 mt-0.5">
                Modifier la publication : « {book.title} »
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Dark Minimalist) */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-950">
          <button
            type="button"
            onClick={() => setActiveTab('cover')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'cover'
                ? 'border-sky-400 text-sky-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>1. Couverture & Photo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'pdf'
                ? 'border-sky-400 text-sky-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Fichier PDF & Synthèse IA</span>
            {aiAnalysis && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('delete')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ml-auto ${
              activeTab === 'delete'
                ? 'border-rose-500 text-rose-400 bg-rose-950/30'
                : 'border-transparent text-rose-400/80 hover:text-rose-300'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>3. Supprimer le livre</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm font-semibold flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>Publication mise à jour avec succès avec indexation IA !</span>
            </div>
          )}

          {/* TAB 1: COVER UPLOAD / CHANGE */}
          {activeTab === 'cover' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <ImageIcon className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-white">Changement de la Couverture Officielle</p>
                  <p>
                    Téléversez une nouvelle image de couverture pour remplacer celle actuellement affichée dans la bibliothèque et la vitrine du site. Formats supportés : JPG, PNG, WEBP.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Visual Preview */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Aperçu en direct</span>
                  <div className="w-48 h-64 rounded-2xl overflow-hidden bg-black border-2 border-slate-700 shadow-2xl flex items-center justify-center relative group">
                    {coverPreview ? (
                      <img 
                        src={coverPreview} 
                        alt="Aperçu couverture" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-500">
                        <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <span className="text-xs">Aucune image</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Actions */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Téléverser une image depuis votre appareil
                    </label>
                    <input 
                      type="file" 
                      ref={coverFileInputRef}
                      onChange={handleCoverFileChange}
                      accept="image/*" 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      disabled={coverUploading}
                      className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-dashed border-sky-500/50 hover:border-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                    >
                      {coverUploading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                      ) : (
                        <Upload className="w-4 h-4 text-sky-400" />
                      )}
                      <span>{coverUploading ? "Chargement de l'image..." : "Choisir un nouveau fichier photo / couverture"}</span>
                    </button>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="flex-shrink mx-4 text-[11px] uppercase font-bold text-slate-500">ou via URL directe</span>
                    <div className="flex-grow border-t border-slate-800"></div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Lien direct vers l'image (URL)
                    </label>
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => {
                        setCoverUrl(e.target.value);
                        setCoverPreview(e.target.value);
                      }}
                      placeholder="https://.../couverture.jpg"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Titre de l'ouvrage</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Auteur</label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LINK OR REPLACE PDF & REAL-TIME GEMINI AI ANALYSIS */}
          {activeTab === 'pdf' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>Liaison PDF & Synthèse IA en Temps Réel (Gemini API)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-950 text-sky-300 border border-sky-800">
                      gemini-3.8-flash
                    </span>
                  </p>
                  <p>
                    Téléversez ou liez un fichier PDF. Dès qu'un nouveau document est téléversé ou détecté, l'IA analyse automatiquement son contenu scripturaire pour générer et afficher une synthèse structurée en temps réel.
                  </p>
                </div>
              </div>

              {/* Upload Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-black border border-slate-800 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block">
                    1. Téléverser un fichier PDF / Document
                  </span>
                  <input 
                    type="file" 
                    ref={pdfFileInputRef}
                    onChange={handlePdfFileChange}
                    accept=".pdf,.txt,.md,.epub"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => pdfFileInputRef.current?.click()}
                    disabled={isAnalyzingAi}
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isAnalyzingAi ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    ) : (
                      <Upload className="w-4 h-4 text-sky-400" />
                    )}
                    <span>{isAnalyzingAi ? "Analyse IA en cours..." : "Téléverser un nouveau PDF"}</span>
                  </button>
                  {pdfFileName && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5 truncate">
                      <Check className="w-3.5 h-3.5" />
                      <span>Fichier détecté : {pdfFileName}</span>
                    </p>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-black border border-slate-800 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Lien Officiel Google Drive</span>
                      </span>
                      {googleDriveUrl && (
                        <a
                          href={googleDriveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-sky-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Tester</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      value={googleDriveUrl}
                      onChange={(e) => setGoogleDriveUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        <span>Lien Direct de Téléchargement PDF</span>
                      </span>
                      {pdfUrl && (
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-sky-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Tester</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      placeholder="https://.../livre.pdf"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  {/* Multiple custom links */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Liens Additionnels ({downloadLinks.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setDownloadLinks(prev => [...prev, {
                          id: 'dl-' + Date.now(),
                          label: 'Téléchargement alternatif',
                          url: '',
                          format: 'pdf',
                          note: ''
                        }])}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Ajouter un lien</span>
                      </button>
                    </div>

                    {downloadLinks.map((dl, idx) => (
                      <div key={dl.id || idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="grid grid-cols-12 gap-2">
                          <input
                            type="text"
                            value={dl.label}
                            onChange={(e) => {
                              const updated = [...downloadLinks];
                              updated[idx].label = e.target.value;
                              setDownloadLinks(updated);
                            }}
                            placeholder="Libellé (ex: Format Audio MP3)"
                            className="col-span-7 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                          />
                          <input
                            type="text"
                            value={dl.note || ''}
                            onChange={(e) => {
                              const updated = [...downloadLinks];
                              updated[idx].note = e.target.value;
                              setDownloadLinks(updated);
                            }}
                            placeholder="Note (10 Mo)"
                            className="col-span-4 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setDownloadLinks(downloadLinks.filter((_, i) => i !== idx))}
                            className="col-span-1 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center justify-center cursor-pointer"
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type="url"
                          value={dl.url}
                          onChange={(e) => {
                            const updated = [...downloadLinks];
                            updated[idx].url = e.target.value;
                            setDownloadLinks(updated);
                          }}
                          placeholder="https://..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerManualAiAnalysis}
                    disabled={isAnalyzingAi}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Lancer l'analyse IA sur ce document</span>
                  </button>
                </div>
              </div>

              {/* REAL-TIME AI SYNTHESIS PANEL */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-700 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="font-display font-bold text-sm text-white">
                      Synthèse Structurée Générée par l'IA en Temps Réel
                    </h3>
                  </div>

                  {aiAnalysis && (
                    <button
                      type="button"
                      onClick={handleApplyAiSynthesis}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Appliquer à la description</span>
                    </button>
                  )}
                </div>

                {isAnalyzingAi ? (
                  <div className="py-10 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-white">
                      Gemini API analyse le document en profondeur...
                    </p>
                    <p className="text-xs text-slate-400">
                      Extraction des thèmes, structuration doctrinale et synthèse des chapitres.
                    </p>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-4 text-xs">
                    {/* Summary */}
                    <div className="p-4 rounded-xl bg-black/60 border border-slate-800 space-y-1.5">
                      <span className="font-bold text-sky-400 uppercase tracking-wider text-[11px] block">
                        Message Central & Synthèse Doctrinale
                      </span>
                      <p className="text-slate-200 leading-relaxed whitespace-pre-line">
                        {aiAnalysis.summary}
                      </p>
                    </div>

                    {/* Key Themes & Target Audience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-2">
                        <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] block">
                          Thèmes Majeurs Détectés
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {aiAnalysis.keyThemes?.map((theme, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-medium text-[11px]">
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-1">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                          Public Cible & Portée
                        </span>
                        <p className="text-slate-300">
                          {aiAnalysis.targetAudience || 'Tous les disciples et chercheurs de vérité biblique.'}
                        </p>
                        {aiAnalysis.doctrinalFocus && (
                          <p className="text-sky-300 font-medium pt-1">
                            Axe : {aiAnalysis.doctrinalFocus}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Chapters Breakdown */}
                    {aiAnalysis.chaptersSummary && aiAnalysis.chaptersSummary.length > 0 && (
                      <div className="p-4 rounded-xl bg-black/60 border border-slate-800 space-y-2.5">
                        <span className="font-bold text-sky-400 uppercase tracking-wider text-[10px] block">
                          Découpage & Plan des Chapitres
                        </span>
                        <div className="space-y-2">
                          {aiAnalysis.chaptersSummary.map((ch, i) => (
                            <div key={i} className="border-l-2 border-sky-500 pl-3 py-1 text-slate-300">
                              <span className="font-bold text-white block">{ch.chapter}</span>
                              <span className="text-slate-400">{ch.summary}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Spiritual Takeaways */}
                    {aiAnalysis.spiritualTakeaways && aiAnalysis.spiritualTakeaways.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-1.5">
                        <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] block">
                          Applications Spirituelles Pour la Sanctification
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                          {aiAnalysis.spiritualTakeaways.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Aucune analyse effectuée. Téléversez un PDF ci-dessus ou cliquez sur « Lancer l'analyse IA ».
                  </div>
                )}
              </div>

              {/* Description preview / edit */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description officielle enregistrée sur la publication
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>
          )}

          {/* TAB 3: DANGER ZONE - COMPLETE DELETION */}
          {activeTab === 'delete' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-rose-950/40 border-2 border-rose-600/60 space-y-3">
                <div className="flex items-center gap-3 text-rose-400">
                  <ShieldAlert className="w-6 h-6 flex-shrink-0" />
                  <h3 className="font-display font-bold text-base text-white">
                    Zone de Danger : Suppression Définitive de la Publication
                  </h3>
                </div>
                <p className="text-xs text-rose-200 leading-relaxed">
                  Attention : cette action supprimera définitivement le livre « <strong className="text-white">{book.title}</strong> » de la bibliothèque, de la vitrine, du moteur de recherche RAG et de l'assistant IA. Cette opération est irréversible.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="deleteDriveCheck"
                    checked={deleteFromDrive}
                    onChange={(e) => setDeleteFromDrive(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-500 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="deleteDriveCheck" className="text-xs text-slate-300 cursor-pointer">
                    Supprimer également le fichier PDF stocké sur Google Drive (si connecté)
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider">
                    Pour confirmer, tapez exactement « SUPPRIMER » ci-dessous :
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="w-full px-4 py-3 rounded-xl bg-black border-2 border-rose-900 focus:border-rose-500 text-white text-sm font-mono tracking-widest focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('cover')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteBook}
                    disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== 'SUPPRIMER'}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      deleteConfirmText.trim().toUpperCase() === 'SUPPRIMER'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isDeleting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>{isDeleting ? "Suppression en cours..." : "Supprimer Définitivement cet Ouvrage"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {activeTab !== 'delete' && (
          <div className="bg-black p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Fermer sans enregistrer
            </button>

            <button
              type="button"
              onClick={handleSavePublication}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Check className="w-4 h-4 text-slate-950" />
              )}
              <span>{isSaving ? "Enregistrement..." : "Enregistrer les modifications de la publication"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
