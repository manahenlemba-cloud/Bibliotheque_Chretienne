import React, { useState } from 'react';
import { 
  X, 
  FileDown, 
  Cloud, 
  Check, 
  ExternalLink, 
  Copy, 
  Loader2, 
  BookOpen, 
  Headphones, 
  Calendar, 
  FileText,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import { Book, Sermon, ReadingPlanDay } from '../types.ts';
import { 
  buildBookPdf, 
  buildSermonPdf, 
  buildReadingPlanPdf, 
  triggerPdfDownload, 
  uploadPdfToGoogleDrive,
  DriveExportResult 
} from '../services/pdfExportService.ts';

export type ExportDocumentType = 
  | { type: 'book'; book: Book }
  | { type: 'sermon'; sermon: Sermon }
  | { type: 'reading_plan'; days: ReadingPlanDay[] };

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ExportDocumentType | null;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  document
}) => {
  const [isExportingToDrive, setIsExportingToDrive] = useState(false);
  const [driveResult, setDriveResult] = useState<DriveExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !document) return null;

  // Determine doc metadata
  let docTitle = '';
  let docAuthor = 'Docteur LEMBA KAVUMBULA MOÏSE';
  let docCategory = 'Édification & Sanctification';
  let docFileName = 'document-chretien.pdf';
  let docIcon = <FileText className="w-6 h-6 text-slate-900" />;
  let docSubtitle = '';

  if (document.type === 'book') {
    docTitle = document.book.title;
    docAuthor = document.book.author || docAuthor;
    docCategory = document.book.category || docCategory;
    docFileName = `${document.book.title.replace(/[^a-zA-Z0-9-_\s]/g, '').trim().replace(/\s+/g, '-')}.pdf`;
    docIcon = <BookOpen className="w-6 h-6 text-slate-900" />;
    docSubtitle = `${document.book.chapters?.length || 1} section(s) • ${document.book.page_count || 12} pages estimées`;
  } else if (document.type === 'sermon') {
    docTitle = document.sermon.title;
    docAuthor = document.sermon.preacher || docAuthor;
    docCategory = (document.sermon.tags && document.sermon.tags[0]) || 'Prédications & Sermons';
    docFileName = `Sermon-${document.sermon.title.replace(/[^a-zA-Z0-9-_\s]/g, '').trim().replace(/\s+/g, '-')}.pdf`;
    docIcon = <Headphones className="w-6 h-6 text-slate-900" />;
    docSubtitle = `Prêché le ${document.sermon.date} • Passage : ${document.sermon.scripture}`;
  } else if (document.type === 'reading_plan') {
    docTitle = 'Plan de Lecture Biblique & Sanctification (30 Jours)';
    docAuthor = 'La Bibliothèque Chrétienne de la Dernière Heure';
    docCategory = 'Méditation Quotidienne';
    docFileName = 'Plan-Lecture-Biblique-30-Jours.pdf';
    docIcon = <Calendar className="w-6 h-6 text-slate-900" />;
    docSubtitle = `${document.days.length} jours de méditation (Ancien Testament, Psaumes & Nouveau Testament)`;
  }

  // Generate JS-PDF instance
  const getPdfDoc = () => {
    if (document.type === 'book') {
      return buildBookPdf(document.book);
    } else if (document.type === 'sermon') {
      return buildSermonPdf(document.sermon);
    } else {
      return buildReadingPlanPdf(document.days);
    }
  };

  // Handler: Instant Local Download
  const handleLocalDownload = () => {
    try {
      setExportError(null);
      const doc = getPdfDoc();
      triggerPdfDownload(doc, docFileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      console.error('Erreur téléchargement PDF :', err);
      setExportError(err.message || 'Impossible de générer le fichier PDF.');
    }
  };

  // Handler: Direct Upload & Sync to Google Drive
  const handleExportToGoogleDrive = async () => {
    try {
      setIsExportingToDrive(true);
      setExportError(null);

      const doc = getPdfDoc();
      const res = await uploadPdfToGoogleDrive(doc, {
        fileName: docFileName,
        title: docTitle,
        author: docAuthor,
        category: docCategory,
        documentType: document.type,
        bookId: document.type === 'book' ? document.book.id : undefined
      });

      setDriveResult(res);
    } catch (err: any) {
      console.error('Erreur export vers Google Drive :', err);
      setExportError(err.message || 'Échec de la synchronisation avec Google Drive.');
    } finally {
      setIsExportingToDrive(false);
    }
  };

  const handleCopyLink = () => {
    if (driveResult?.webViewLink) {
      navigator.clipboard.writeText(driveResult.webViewLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center shadow-sm">
              <Cloud className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider text-sky-200 uppercase block">
                Exportation PDF & Cloud
              </span>
              <h2 className="font-display font-bold text-lg text-white">
                Exporter vers Google Drive
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Document Preview Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex-shrink-0">
                {docIcon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-black block">
                  {docCategory}
                </span>
                <h3 className="font-display font-bold text-base text-black truncate" title={docTitle}>
                  {docTitle}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Par <strong className="text-black">{docAuthor}</strong>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {docSubtitle}
                </p>
              </div>
            </div>

            {/* Spiritual Notice */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-[11px] text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-800 flex-shrink-0" />
              <span>
                Mise en page certifiée : A4, typographie d'édification, mention pastorale et verset 1 Pierre 5:10.
              </span>
            </div>
          </div>

          {/* Google Drive Status Banner */}
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-black">
                <FolderOpen className="w-4 h-4 text-sky-700" />
                <span>Dossier Cible Google Drive :</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-black border border-sky-300">
                Connecté
              </span>
            </div>
            <p className="text-xs text-black font-semibold">
              « 📚 LA BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE »
            </p>
            <p className="text-[11px] text-slate-600">
              Le document PDF sera sauvegardé dans le stockage Google Drive officiel pour conservation pérenne et consultation universelle.
            </p>
          </div>

          {/* Error Message */}
          {exportError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {exportError}
            </div>
          )}

          {/* Success Result from Drive */}
          {driveResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Document exporté avec succès dans Google Drive !</span>
              </div>
              <p className="text-xs text-emerald-900">
                Fichier : <strong>{driveResult.fileName}</strong> ({(driveResult.sizeBytes / 1024).toFixed(1)} Ko)
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={driveResult.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir dans Google Drive</span>
                </a>

                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-black border border-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
                  title="Copier le lien public Google Drive"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Lien copié !' : 'Copier le lien Drive'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Local Download Alert */}
          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-black text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Le fichier PDF a été généré et téléchargé sur votre appareil.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Action 1: Upload directly to Google Drive */}
            <button
              onClick={handleExportToGoogleDrive}
              disabled={isExportingToDrive}
              className="py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
            >
              {isExportingToDrive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Exportation Google Drive...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 text-white" />
                  <span>Sauvegarder sur Google Drive</span>
                </>
              )}
            </button>

            {/* Action 2: Direct Local PDF Download */}
            <button
              onClick={handleLocalDownload}
              className="py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-black border-2 border-slate-300 font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer order-2 sm:order-1"
            >
              <FileDown className="w-4 h-4 text-slate-900" />
              <span>Télécharger le PDF</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Format standard A4 • Impression & archivage</span>
          <button
            onClick={onClose}
            className="text-black font-semibold hover:underline cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
