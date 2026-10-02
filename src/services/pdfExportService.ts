import { jsPDF } from 'jspdf';
import { Book, Sermon, ReadingPlanDay } from '../types.ts';

export interface PdfExportOptions {
  includePastoralHeader?: boolean;
  includeScriptureWatermark?: boolean;
  includeTableOfContents?: boolean;
}

export interface DriveExportResult {
  success: boolean;
  driveFileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink: string;
  sizeBytes: number;
  folderId?: string;
  isSimulated?: boolean;
  message: string;
}

/**
 * Builds a professionally styled Christian PDF document for a Book
 */
export function buildBookPdf(book: Book, options: PdfExportOptions = {}): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
      addRunningHeader();
    }
  };

  const addRunningHeader = () => {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('La Bibliothèque Chrétienne de la Dernière Heure — Dr. LEMBA KAVUMBULA MOÏSE', margin, 12);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageWidth - margin, 14);
  };

  // COVER / FRONT PAGE
  // Header decoration
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, cursorY, contentWidth, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('LA BIBLIOTHÈQUE CHRÉTIENNE DE LA DERNIÈRE HEURE', margin + 6, cursorY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(224, 242, 254);
  doc.text('Sous la direction spirituelle du Serviteur de Dieu KAYEMBE MWANANGIZI Lawi — Église Cereshe/OUA', margin + 6, cursorY + 17);

  cursorY += 36;

  // Category Tag
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, cursorY, 65, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text((book.category || 'Vie Chrétienne & Sanctification').toUpperCase(), margin + 4, cursorY + 5.5);
  cursorY += 15;

  // Main Book Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(book.title, contentWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += titleLines.length * 9 + 4;

  // Author
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(14, 116, 144); // cyan-700
  doc.text(`Auteur : ${book.author}`, margin, cursorY);
  cursorY += 8;

  // Scripture Anchor
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.rect(margin, cursorY, contentWidth, 18, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('« Le Dieu de toute grâce vous perfectionnera lui-même, vous affermira, vous fortifiera. » — 1 Pierre 5:10', margin + 4, cursorY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Document officiel certifié pour la méditation et l\'édification des saints.', margin + 4, cursorY + 13);
  cursorY += 26;

  // Description / Résumé
  if (book.description) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('RÉSUMÉ SPIRITUEL & DOCTRINAL', margin, cursorY);
    cursorY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    const descLines = doc.splitTextToSize(book.description, contentWidth);
    doc.text(descLines, margin, cursorY);
    cursorY += descLines.length * 5.2 + 8;
  }

  // Chapters & Content
  if (book.chapters && book.chapters.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('TABLE DES MATIÈRES & DÉVELOPPEMENT', margin, cursorY);
    cursorY += 8;

    book.chapters.forEach((chap, idx) => {
      checkPageBreak(35);

      // Chapter header badge
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, cursorY, contentWidth, 9, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${chap.title}`, margin + 3, cursorY + 6.2);
      cursorY += 14;

      if (chap.content) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);
        const chapLines = doc.splitTextToSize(chap.content, contentWidth);
        chapLines.forEach((line: string) => {
          checkPageBreak(6);
          doc.text(line, margin, cursorY);
          cursorY += 5.2;
        });
        cursorY += 6;
      }
    });
  } else if (book.reading_file) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('CONTENU DE L\'OUVRAGE', margin, cursorY);
    cursorY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const readingLines = doc.splitTextToSize(book.reading_file, contentWidth);
    readingLines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin, cursorY);
      cursorY += 5.2;
    });
  }

  // Add Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} sur ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('Propriété spirituelle : La Bibliothèque Chrétienne de la Dernière Heure', margin, pageHeight - 10);
  }

  return doc;
}

/**
 * Builds a professionally styled Christian PDF document for a Sermon
 */
export function buildSermonPdf(sermon: Sermon): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Prédications & Sermons d\'Édification — Bibliothèque Chrétienne', margin, 12);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 14, pageWidth - margin, 14);
    }
  };

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, cursorY, contentWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('PRÉDICATION CHRÉTIENNE DE LA DERNIÈRE HEURE', margin + 6, cursorY + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(224, 242, 254);
  doc.text(`Église Cereshe/OUA — Enregistré le ${sermon.date}`, margin + 6, cursorY + 16);
  cursorY += 32;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(sermon.title, contentWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += titleLines.length * 8.5 + 4;

  // Speaker & Reference
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(14, 116, 144);
  doc.text(`Prédicateur : ${sermon.preacher || 'Docteur LEMBA KAVUMBULA MOÏSE'}`, margin, cursorY);
  cursorY += 7;

  // Scripture Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, cursorY, contentWidth, 14, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Passage central : ${sermon.scripture}`, margin + 4, cursorY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Durée de l'exhortation : ${sermon.durationMin || 45} min • Thèmes : ${sermon.tags?.join(', ') || 'Édification'}`, margin + 4, cursorY + 11);
  cursorY += 22;

  // Description / Excerpt
  if (sermon.excerpt) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('RÉSUMÉ DU MESSAGE', margin, cursorY);
    cursorY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    const descLines = doc.splitTextToSize(sermon.excerpt, contentWidth);
    doc.text(descLines, margin, cursorY);
    cursorY += descLines.length * 5.2 + 8;
  }

  // Full Transcript or Content
  if (sermon.content) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('TRANSCRIPTION INTÉGRALE DE LA PRÉDICATION', margin, cursorY);
    cursorY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const contentLines = doc.splitTextToSize(sermon.content, contentWidth);
    contentLines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin, cursorY);
      cursorY += 5.2;
    });
  }

  // Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} sur ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('La Bibliothèque Chrétienne de la Dernière Heure', margin, pageHeight - 10);
  }

  return doc;
}

/**
 * Builds a professionally styled Christian PDF document for the Reading Plan
 */
export function buildReadingPlanPdf(days: ReadingPlanDay[]): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Plan de Lecture Biblique & Méditation Quotidienne — 1 Pierre 5:10', margin, 12);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 14, pageWidth - margin, 14);
    }
  };

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, cursorY, contentWidth, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('PLAN DE LECTURE BIBLIQUE & SANCTIFICATION', margin + 6, cursorY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(224, 242, 254);
  doc.text('Parcours méthodique de méditation des Écritures — La Bibliothèque Chrétienne', margin + 6, cursorY + 17);
  cursorY += 34;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('GUIDE MENSUEL DE MÉDITATION', margin, cursorY);
  cursorY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text('« Ta parole est une lampe à mes pieds, et une lumière sur mon sentier. » — Psaume 119:105', margin, cursorY);
  cursorY += 12;

  days.forEach((day) => {
    checkPageBreak(32);

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, cursorY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Jour ${day.dayNumber} : ${day.theme}`, margin + 3, cursorY + 5.5);
    cursorY += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    if (day.passages && day.passages.length > 0) {
      day.passages.forEach((p) => {
        doc.text(`• ${p.category} : ${p.reference}`, margin + 4, cursorY);
        cursorY += 5;
      });
    } else {
      doc.text(`• Lecture : ${day.title}`, margin + 4, cursorY);
      cursorY += 5;
    }

    if (day.memoryVerse) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(14, 116, 144);
      doc.text(`Verset clé : « ${day.memoryVerse.text} » (${day.memoryVerse.reference})`, margin + 4, cursorY);
      cursorY += 7;
    }
    cursorY += 4;
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} sur ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('La Bibliothèque Chrétienne de la Dernière Heure', margin, pageHeight - 10);
  }

  return doc;
}

/**
 * Downloads a generated PDF directly to the user's computer or device
 */
export function triggerPdfDownload(doc: jsPDF, fileName: string): void {
  const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  doc.save(safeName);
}

/**
 * Uploads a generated PDF directly to Google Drive via server API
 */
export async function uploadPdfToGoogleDrive(
  doc: jsPDF,
  metadata: {
    fileName: string;
    title: string;
    author?: string;
    category?: string;
    documentType?: 'book' | 'sermon' | 'reading_plan' | 'study';
    bookId?: string;
  }
): Promise<DriveExportResult> {
  const safeName = metadata.fileName.endsWith('.pdf') ? metadata.fileName : `${metadata.fileName}.pdf`;
  
  // Convert jsPDF to Base64 data URL
  const base64DataUrl = doc.output('datauristring');

  const response = await fetch('/api/drive/export-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileBase64: base64DataUrl,
      fileName: safeName,
      title: metadata.title,
      author: metadata.author || 'Docteur LEMBA KAVUMBULA MOÏSE',
      category: metadata.category || 'Édification & Sanctification',
      documentType: metadata.documentType || 'book',
      bookId: metadata.bookId
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erreur lors de l\'exportation vers Google Drive.');
  }

  const result = await response.json();
  return result;
}
