import { Book, DriveDocument, RagSearchResult, BibleVersionId, Sermon } from '../types.ts';
import { MULTI_VERSION_VERSES, BIBLE_BOOKS } from '../data/bibleData.ts';
import { INITIAL_SPIRITUAL_STEPS, SpiritualStepData } from '../data/spiritualStepsData.ts';

export interface RagChunk {
  id: string;
  sourceType: 'book' | 'drive' | 'bible' | 'step' | 'sermon';
  sourceId: string;
  sourceTitle: string;
  sourceAuthor?: string;
  sectionOrChapter?: string;
  pageOrVerse?: string;
  content: string;
  keywords: string[];
}

// Initial synced Google Drive Documents
export const INITIAL_DRIVE_DOCUMENTS: DriveDocument[] = [
  {
    id: 'drive-doc-1',
    title: 'Manuscrit Pastoral : Les 5 Étapes Spirituelles & 1 Pierre 5:10',
    originalFileName: 'Les_5_Etapes_Spirituelles_Manuscrit_Docteur_Lemba.pdf',
    driveUrl: 'https://drive.google.com/drive/folders/1-lemba-moise-les-5-etapes-spirituelles',
    mimeType: 'application/pdf',
    fileSizeBytes: 2450000,
    indexedAt: '2025-01-10T10:00:00Z',
    status: 'indexed',
    chunksCount: 8,
    excerpt: 'L\'Appel, la Souffrance sanctifiante, le Perfectionnement réparateur, l\'Affermissement inébranlable et la Fortification par le Saint-Esprit.',
    author: 'Docteur LEMBA KAVUMBULA MOÏSE',
    category: 'Vie Chrétienne & Sanctification'
  },
  {
    id: 'drive-doc-2',
    title: 'Notes Doctrinales : 1 Pierre 5:10 dans le Texte Grec et les Versions Bibliques',
    originalFileName: 'Exegese_1_Pierre_5_10_Translations.docx',
    driveUrl: 'https://drive.google.com/drive/folders/demo-bibliotheque-derniere-heure-01',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSizeBytes: 890000,
    indexedAt: '2025-01-12T14:30:00Z',
    status: 'indexed',
    chunksCount: 4,
    excerpt: 'Étude des verbes katartisei (perfectionnera), sterixei (affermira), sthenosei (fortifiera), themeliosei (établira sur des fondations solides).',
    author: 'Collège Théologique de Réveil',
    category: 'Édification Spirituelle'
  },
  {
    id: 'drive-doc-3',
    title: 'Recueil de Prières & Veille pour la Dernière Heure',
    originalFileName: 'Prieres_Derniere_Heure_Sanctification.pdf',
    driveUrl: 'https://drive.google.com/drive/folders/demo-bibliotheque-derniere-heure-04',
    mimeType: 'application/pdf',
    fileSizeBytes: 1200000,
    indexedAt: '2025-02-05T09:00:00Z',
    status: 'indexed',
    chunksCount: 6,
    excerpt: 'Prières d\'abandon, consécration de l\'esprit, purification des pensées et supplication pour la persévérance des saints.',
    author: 'Collectif Pastoral d\'Intercession',
    category: 'Prière & Intercession'
  }
];

export class RagKnowledgeEngine {
  private chunks: RagChunk[] = [];
  private driveDocuments: DriveDocument[] = [...INITIAL_DRIVE_DOCUMENTS];
  private spiritualSteps: SpiritualStepData[] = [...INITIAL_SPIRITUAL_STEPS];
  private isIndexReady = false;

  constructor() {
    this.rebuildIndex([]);
  }

  public getDriveDocuments(): DriveDocument[] {
    return this.driveDocuments;
  }

  public getChunksCount(): number {
    return this.chunks.length;
  }

  public addDriveDocument(doc: DriveDocument): void {
    this.driveDocuments.unshift(doc);
  }

  public getSpiritualSteps(): SpiritualStepData[] {
    return this.spiritualSteps;
  }

  public updateSpiritualStep(id: string, update: Partial<SpiritualStepData>): SpiritualStepData | null {
    const idx = this.spiritualSteps.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.spiritualSteps[idx] = { ...this.spiritualSteps[idx], ...update, id };
    return this.spiritualSteps[idx];
  }

  public resetSpiritualSteps(): SpiritualStepData[] {
    this.spiritualSteps = [...INITIAL_SPIRITUAL_STEPS];
    return this.spiritualSteps;
  }

  /**
   * Rebuild the entire in-memory RAG chunk store from books, drive docs, spiritual steps, sermons and bible verses
   */
  public rebuildIndex(books: Book[], sermons: Sermon[] = []): void {
    const newChunks: RagChunk[] = [];

    // 1. Index Site Books
    for (const book of books) {
      // Index description & metadata
      newChunks.push({
        id: `book-${book.id}-meta`,
        sourceType: 'book',
        sourceId: book.id,
        sourceTitle: book.title,
        sourceAuthor: book.author,
        sectionOrChapter: 'Vue d\'ensemble & Résumé doctrinal',
        content: `Ouvrage : "${book.title}" par ${book.author}.\nCatégorie : ${book.category}.\nRésumé : ${book.ai_indexed_content?.summary || book.description}\nThèmes clés : ${(book.ai_indexed_content?.keyThemes || []).join(', ')}\nRéférences bibliques : ${(book.ai_indexed_content?.biblicalReferences || []).join(', ')}`,
        keywords: [
          ...book.title.toLowerCase().split(/\s+/),
          book.author.toLowerCase(),
          book.category.toLowerCase(),
          ...(book.ai_indexed_content?.keyThemes || []).map(t => t.toLowerCase()),
          ...(book.ai_indexed_content?.biblicalReferences || []).map(r => r.toLowerCase())
        ]
      });

      // Index Chapters
      if (book.chapters && book.chapters.length > 0) {
        book.chapters.forEach((ch, idx) => {
          // Chunk chapter content in segments of ~800 chars
          const text = ch.content;
          const chunkSize = 1200;
          for (let i = 0; i < text.length; i += chunkSize) {
            const segment = text.slice(i, i + chunkSize);
            newChunks.push({
              id: `book-${book.id}-ch-${idx}-${i}`,
              sourceType: 'book',
              sourceId: book.id,
              sourceTitle: book.title,
              sourceAuthor: book.author,
              sectionOrChapter: ch.title,
              pageOrVerse: `Section ${Math.floor(i / chunkSize) + 1}`,
              content: `[Livre : ${book.title} | Auteur : ${book.author} | Chapitre : ${ch.title}]\n${segment}`,
              keywords: [
                ...book.title.toLowerCase().split(/\s+/),
                ...ch.title.toLowerCase().split(/\s+/),
                book.author.toLowerCase()
              ]
            });
          }
        });
      }
    }

    // 2. Index Google Drive Synced Documents
    for (const doc of this.driveDocuments) {
      newChunks.push({
        id: `drive-${doc.id}-overview`,
        sourceType: 'drive',
        sourceId: doc.id,
        sourceTitle: doc.title,
        sourceAuthor: doc.author || 'Document Google Drive Indexé',
        sectionOrChapter: 'Document Google Drive Documentaire',
        pageOrVerse: 'Fichier PDF/DOCX',
        content: `[Google Drive Document : ${doc.title} (${doc.originalFileName}) | Auteur : ${doc.author || 'Inconnu'}]\nExtrait indexé : ${doc.excerpt}\nCatégorie : ${doc.category || 'Général'}`,
        keywords: [
          ...doc.title.toLowerCase().split(/\s+/),
          ...(doc.author ? doc.author.toLowerCase().split(/\s+/) : []),
          'drive',
          'document'
        ]
      });

      // Specific Drive deep content for the 5 Spiritual Steps
      if (doc.id === 'drive-doc-1') {
        const fiveStepsContent = `Enseignement magistral du Docteur LEMBA KAVUMBULA MOÏSE sur 1 Pierre 5:10 :
Étape 1 : APPEL - Vocation céleste où Dieu souverainement réveille le pécheur et l'attire à Christ par la grâce imméritée.
Étape 2 : SOUFFRANCE - Le creuset indispensable où la chair est crucifiée et où la foi est épurée comme l'or au feu afin d'ôter toute vanité.
Étape 3 : PERFECTIONNEMENT - Action restauratrice de Jésus-Christ qui guérit les fractures intérieures et forme le caractère divin.
Étape 4 : AFFERMISSEMENT - Ancrage inébranlable sur le roc de la vérité pour résister aux faux enseignements et vents de séduction.
Étape 5 : FORTIFICATION - Revêtement de puissance du Saint-Esprit conférant la vigueur apostolique pour vaincre jusqu'au retour du Seigneur.`;
        newChunks.push({
          id: `drive-${doc.id}-deep`,
          sourceType: 'drive',
          sourceId: doc.id,
          sourceTitle: doc.title,
          sourceAuthor: doc.author,
          sectionOrChapter: 'Manuscrit - Les 5 Étapes Spirituelles',
          pageOrVerse: 'Pages 1-15',
          content: fiveStepsContent,
          keywords: ['5', 'cinq', 'étapes', 'spirituelles', 'appel', 'souffrance', 'perfectionnement', 'affermissement', 'fortification', 'lemba', '1 pierre 5:10']
        });
      }
    }

    // 3. Index Spiritual Steps
    for (const step of this.spiritualSteps) {
      const stepContent = `[Parcours Spirituel : Étape ${step.stepNumber} - ${step.code} (${step.name})]\nTitre : ${step.title}\nVerset central : ${step.subtitle}\nDescription : ${step.description}\nEnseignements : ${step.teachings.map(t => `${t.title} : ${t.content}`).join(' ')}\nVersets bibliques : ${step.biblicalVerses.map(v => `${v.reference} : ${v.text}`).join(' | ')}`;
      newChunks.push({
        id: `step-${step.id}`,
        sourceType: 'step',
        sourceId: step.id,
        sourceTitle: `Les 5 Étapes Spirituelles - ${step.name}`,
        sourceAuthor: 'Docteur LEMBA KAVUMBULA MOÏSE & Enseignement Biblique',
        sectionOrChapter: `Étape ${step.stepNumber} : ${step.code}`,
        pageOrVerse: '1 Pierre 5:10',
        content: stepContent,
        keywords: [
          step.code.toLowerCase(),
          step.name.toLowerCase(),
          'étape',
          'etapes',
          'spirituelle',
          '1 pierre 5:10',
          'lemba'
        ]
      });
    }

    // 4. Index Sermons and Teachings
    for (const sermon of sermons) {
      if (!sermon.published) continue;
      newChunks.push({
        id: `sermon-${sermon.id}-meta`,
        sourceType: 'sermon',
        sourceId: sermon.id,
        sourceTitle: sermon.title,
        sourceAuthor: sermon.preacher,
        sectionOrChapter: `Prédication : ${sermon.title}`,
        pageOrVerse: sermon.scripture,
        content: `[Sermon : "${sermon.title}" | Prédicateur : ${sermon.preacher} | Passage biblique : ${sermon.scripture} | Date : ${sermon.date}]\nRésumé : ${sermon.excerpt}\nThèmes : ${(sermon.tags || []).join(', ')}`,
        keywords: [
          ...sermon.title.toLowerCase().split(/\s+/),
          ...sermon.preacher.toLowerCase().split(/\s+/),
          sermon.scripture.toLowerCase(),
          ...(sermon.tags || []).map(t => t.toLowerCase())
        ]
      });

      // Index sermon content in chunks
      const text = sermon.content;
      const chunkSize = 1000;
      for (let i = 0; i < text.length; i += chunkSize) {
        const segment = text.slice(i, i + chunkSize);
        newChunks.push({
          id: `sermon-${sermon.id}-body-${i}`,
          sourceType: 'sermon',
          sourceId: sermon.id,
          sourceTitle: sermon.title,
          sourceAuthor: sermon.preacher,
          sectionOrChapter: `Prédication : ${sermon.title} (Partie ${Math.floor(i / chunkSize) + 1})`,
          pageOrVerse: sermon.scripture,
          content: `[Sermon : "${sermon.title}" par ${sermon.preacher} | Écriture : ${sermon.scripture}]\n${segment}`,
          keywords: [
            ...sermon.title.toLowerCase().split(/\s+/),
            sermon.preacher.toLowerCase(),
            sermon.scripture.toLowerCase()
          ]
        });
      }
    }

    // 5. Index Multi-Version Bible Key Scriptures
    for (const verseItem of MULTI_VERSION_VERSES) {
      const versionsSummary = Object.entries(verseItem.translations)
        .map(([ver, text]) => `[${ver}]: ${text}`)
        .join('\n');

      newChunks.push({
        id: `bible-${verseItem.book}-${verseItem.chapter}-${verseItem.verse}`,
        sourceType: 'bible',
        sourceId: `${verseItem.book}-${verseItem.chapter}-${verseItem.verse}`,
        sourceTitle: `Sainte Bible — ${verseItem.bookName} ${verseItem.chapter}:${verseItem.verse}`,
        sectionOrChapter: `${verseItem.bookName} ${verseItem.chapter}`,
        pageOrVerse: `Verset ${verseItem.verse}`,
        content: `[Sainte Bible : ${verseItem.bookName} ${verseItem.chapter}:${verseItem.verse}]\n${versionsSummary}`,
        keywords: [
          verseItem.bookName.toLowerCase(),
          `${verseItem.chapter}:${verseItem.verse}`,
          `${verseItem.chapter}`,
          `${verseItem.verse}`
        ]
      });
    }

    this.chunks = newChunks;
    this.isIndexReady = true;
  }

  /**
   * Search knowledge base using semantic & keyword matching
   */
  public search(query: string, options?: { bookId?: string; minScore?: number; limit?: number }): RagSearchResult[] {
    if (!query || !query.trim()) return [];
    const lowerQuery = query.toLowerCase().trim();
    const queryTokens = lowerQuery.split(/\s+/).filter(t => t.length > 2);
    const limit = options?.limit || 6;
    const minScore = options?.minScore || 0.15;

    const scoredResults: RagSearchResult[] = [];

    for (const chunk of this.chunks) {
      // If bookId scope specified, prioritize or restrict to that book
      if (options?.bookId && options.bookId !== 'all') {
        if (chunk.sourceType === 'book' && chunk.sourceId !== options.bookId) {
          continue;
        }
      }

      let score = 0;
      const lowerContent = chunk.content.toLowerCase();
      const lowerTitle = chunk.sourceTitle.toLowerCase();
      const lowerSection = (chunk.sectionOrChapter || '').toLowerCase();

      // Exact phrase match
      if (lowerContent.includes(lowerQuery)) {
        score += 3.0;
      }
      if (lowerTitle.includes(lowerQuery)) {
        score += 4.0;
      }

      // Keyword token matching
      for (const token of queryTokens) {
        if (lowerTitle.includes(token)) score += 1.5;
        if (lowerSection.includes(token)) score += 1.2;
        if (chunk.keywords.some(k => k.includes(token))) score += 1.0;

        // Count occurrences in content
        const occurrences = (lowerContent.match(new RegExp(token, 'g')) || []).length;
        if (occurrences > 0) {
          score += Math.min(occurrences * 0.3, 2.0);
        }
      }

      // Special priority bonuses
      if (lowerQuery.includes('5 étapes') || lowerQuery.includes('cinq étapes') || lowerQuery.includes('1 pierre 5:10') || lowerQuery.includes('lemba')) {
        if (chunk.keywords.includes('lemba') || chunk.keywords.includes('1 pierre 5:10') || chunk.sourceType === 'step') {
          score += 3.5;
        }
      }

      if (score >= minScore) {
        // Snippet extraction around best matching token
        let snippet = chunk.content;
        if (snippet.length > 350) {
          const firstTokenIndex = queryTokens.length > 0 
            ? lowerContent.indexOf(queryTokens[0]) 
            : -1;
          if (firstTokenIndex !== -1 && firstTokenIndex > 100) {
            snippet = '...' + chunk.content.substring(firstTokenIndex - 60, firstTokenIndex + 260) + '...';
          } else {
            snippet = chunk.content.substring(0, 320) + '...';
          }
        }

        scoredResults.push({
          chunkId: chunk.id,
          sourceType: chunk.sourceType as any,
          sourceTitle: chunk.sourceTitle,
          sourceAuthor: chunk.sourceAuthor,
          author: chunk.sourceAuthor || "Docteur LEMBA KAVUMBULA MOÏSE",
          sectionOrChapter: chunk.sectionOrChapter,
          chapterOrSection: chunk.sectionOrChapter,
          verses: chunk.pageOrVerse,
          snippet,
          text: snippet,
          biblicalReferences: chunk.keywords.filter(k => k.includes(':') || k.includes('pierre') || k.includes('jean') || k.includes('matthieu')),
          score
        });
      }
    }

    // Sort descending by score
    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults.slice(0, limit);
  }

  /**
   * Helper alias for API route integration
   */
  public buildRagPrompt(question: string, results: RagSearchResult[], language: string) {
    const built = this.buildPrompt({
      question,
      searchResults: results,
      language
    });
    return {
      systemInstruction: built.systemPrompt,
      userPrompt: built.userPrompt
    };
  }

  /**
   * Build the strict anti-hallucination prompt according to specifications
   */
  public buildPrompt(params: {
    question: string;
    searchResults: RagSearchResult[];
    language: string;
    targetBookTitle?: string;
    bibleVersion?: BibleVersionId;
  }): {
    systemPrompt: string;
    userPrompt: string;
    hasSufficientSources: boolean;
  } {
    const { question, searchResults, language, targetBookTitle, bibleVersion = 'LSG' } = params;

    // Check if we have sufficient sources (at least 1 result with decent score)
    const hasSufficientSources = searchResults.length > 0 && searchResults[0].score >= 0.25;

    let langInstruction = "RÉPONDS STRICTEMENT EN FRANÇAIS dans un style biblique soigné et respectueux.";
    if (language === 'en') {
      langInstruction = "CRITICAL MANDATE: RESPOND 100% IN ENGLISH. All sections, headings, citations labels, and theological explanations MUST be strictly in English with a reverent biblical tone.";
    } else if (language === 'sw') {
      langInstruction = "AGIZO KUU: JIBU 100% KWA KISWAHILI. Vichwa vya habari vyote, maelezo ya kiteolojia na marejeleo ya Biblia LAZIMA yawe katika Kiswahili fasaha cha kibiblia.";
    } else if (language === 'ln') {
      langInstruction = "MOKO YA NTINA MINGI: YANOLA 100% NA LINGÁLA. Mitó ya makomi nyonso, ndimbola ya mateya mpe biverse ya Biblia ESENGELI kozala na Lingála ya peto mpe ya lokumu.";
    } else if (language === 'es') {
      langInstruction = "MANDATO CRÍTICO: RESPONDE 100% EN ESPAÑOL. Todos los encabezados, citas, análisis bíblicos y explicaciones teológicas DEBEN estar redactados estrictamente en español con un tono bíblico reverente.";
    } else if (language === 'pt') {
      langInstruction = "MANDATO CRÍTICO: RESPONDA 100% EM PORTUGUES. Todos os titulos, citacoes e analises biblicas DEVEM ser estritamente em portugues.";
    } else if (language === 'de') {
      langInstruction = "KRITISCHE VORGABE: ANTWORTEN SIE ZU 100% AUF DEUTSCH. Alle Ueberschriften, Zitate und biblischen Erlaeuterungen MUESSEN auf Deutsch verfasst sein.";
    } else if (language === 'it') {
      langInstruction = "MANDATO CRITICO: RISPONDI AL 100% IN ITALIANO. Tutti i titoli, le citazioni e le spiegazioni bibliche DEVONO essere rigorosamente in italiano.";
    } else if (language === 'kg') {
      langInstruction = "MANDAT CRITIQUE: VUTULA MVUTU 100% NA KIKÔNGO (Kikongo).";
    } else if (language === 'lu') {
      langInstruction = "MANDAT CRITIQUE: ANDAMUNA 100% MU TSHILUBA.";
    } else if (language && language !== 'fr') {
      langInstruction = `CRITICAL MANDATE: RESPOND 100% IN THE SELECTED LANGUAGE (Code: ${language}). Do not answer in French. Every heading, reflection, and biblical reference must be provided in this language.`;
    }

    const systemPrompt = `Tu es l'Assistant Théologique et de Connaissance de « La Bibliothèque Chrétienne de la Dernière Heure ».
${langInstruction}

DIRECTIVES FONDAMENTALES ANTI-HALLUCINATION :
1. RÈGLE ABSOLUE : « NE PAS INVENTER ».
   - Tu dois fonder ta réponse STRICTEMENT ET UNIQUEMENT sur les sources documentaires fournies dans le contexte ci-dessous (Livres du site, Documents Google Drive, Versets bibliques).
   - Si les sources fournies ne contiennent pas d'information suffisante ou pertinente pour répondre avec certitude à la question, TU ES FORMELLEMENT TENU D'INDIQUER CLAIREMENT DANS LA LANGUE SÉLECTIONNÉE (${language}) que la bibliothèque ne contient pas d'élément suffisamment concluant pour certifier la réponse.
   Ne tente jamais de spéculer ou d'extrapoler sans fondement scripturaire ou doctrinal avéré dans nos écrits.

2. STRUCTURE DE RÉPONSE OBLIGATOIRE :
   Toute réponse valide doit respecter rigoureusement la structure suivante :
   ### 🤖 Réponse IA
   (Exposé clair, théologique et spirituel répondant à la question en s'appuyant sur les sources).

   Quand la question implique à la fois les livres et la Bible, sépare distinctement :
   - **📚 Ce que disent les livres :** (Synthèse des écrits des auteurs du site ou documents Drive)
   - **📖 Ce que dit le texte biblique :** (Texte de l'Écriture et analyse scripturaire)

   ### 📚 Sources consultées
   - Lister précisément : [Nom du Livre / Document], [Auteur], [Chapitre / Section], [Page si applicable].

   ### 📖 Références bibliques
   - Lister les versets bibliques cités (ex: 1 Pierre 5:10, Jean 16:8).

3. LES 5 ÉTAPES SPIRITUELLES (Si la question porte sur ce sujet) :
   - Respecter impérativement l'ordre divin établi par 1 Pierre 5:10 et le Dr LEMBA KAVUMBULA MOÏSE :
     1. APPEL
     2. SOUFFRANCE
     3. PERFECTIONNEMENT
     4. AFFERMISSEMENT
     5. FORTIFICATION
   - Ne jamais altérer ni réorganiser ces termes.`;

    const formattedSources = searchResults.map((r, idx) => {
      return `[SOURCE ${idx + 1} - Type: ${r.sourceType.toUpperCase()} | Titre: "${r.sourceTitle}" | Auteur: ${r.sourceAuthor || 'N/A'} | Section: ${r.sectionOrChapter || 'N/A'}]
Contenu :
${r.snippet}`;
    }).join('\n\n');

    const userPrompt = `SOURCES DOCUMENTAIRES INDEXÉES (LIVRES DU SITE, GOOGLE DRIVE, SAINTE BIBLE) :
${formattedSources || "AUCUNE SOURCE PERTINENTE TROUVÉE DANS LA BASE DOCUMENTAIRE."}

VERSION BIBLIQUE SÉLECTIONNÉE : ${bibleVersion}
${targetBookTitle ? `LIVRE CIBLÉ : ${targetBookTitle}` : 'PÉRIMÈTRE : TOUTE LA BIBLIOTHÈQUE'}

QUESTION DE L'UTILISATEUR :
"${question}"

Génère la réponse en respectant strictement les consignes anti-hallucination et la structure demandée.`;

    return {
      systemPrompt,
      userPrompt,
      hasSufficientSources
    };
  }

  /**
   * Safe Fallback response generator when Gemini key is absent or quota exceeded
   */
  public generateFallbackResponse(params: {
    question: string;
    searchResults: RagSearchResult[];
    language: string;
    bibleVersion?: BibleVersionId;
  }): { answer: string; citations: any[] } {
    const { question, searchResults, language, bibleVersion = 'LSG' } = params;

    if (searchResults.length === 0 || searchResults[0].score < 0.20) {
      return {
        answer: `### 🤖 Réponse de l'Assistant

Je n'ai pas trouvé de contenu suffisamment pertinent dans les livres disponibles sur cette plateforme ni dans les sources bibliques sélectionnées pour répondre avec certitude à cette question.

*Conseil : Vérifiez l'orthographe de votre recherche ou interrogez l'assistant sur les thèmes de notre bibliothèque (Les 5 étapes spirituelles selon 1 Pierre 5:10, la sanctification, la prière fervente, ou la veille spirituelle).*`,
        citations: []
      };
    }

    const top = searchResults[0];
    const isFiveSteps = question.toLowerCase().includes('5') || 
                        question.toLowerCase().includes('étape') || 
                        question.toLowerCase().includes('etape') || 
                        question.toLowerCase().includes('pierre 5:10') ||
                        question.toLowerCase().includes('lemba');

    let answerBody = '';

    if (isFiveSteps) {
      answerBody = `### 🤖 Réponse IA

Selon les enseignements fondamentaux conservés dans notre bibliothèque, en particulier l'ouvrage magistral du **Docteur LEMBA KAVUMBULA MOÏSE** et le texte inspiré de **1 Pierre 5:10**, la vie chrétienne authentique est scandée par **5 étapes spirituelles majeures** qui doivent être vécues dans cet ordre précis :

1. **APPEL** : Le Dieu souverain prend l'initiative bienveillante de nous tirer des ténèbres par sa grâce salvatrice en Jésus-Christ.
2. **SOUFFRANCE** : Le creuset salutaire « d'un peu de temps » où l'orgueil de la chair est crucifié et où notre foi est purifiée comme l'or au feu (1 Pierre 4:12-14).
3. **PERFECTIONNEMENT** : L'action réparatrice par laquelle le Divin Potier restaure nos filets déchirés et façonne notre être intérieur à la stature de Christ.
4. **AFFERMISSEMENT** : L'enracinement inébranlable dans la saine doctrine apostolique face aux faux enseignements de la dernière heure.
5. **FORTIFICATION** : Le revêtement de puissance par le Saint-Esprit accordant la victoire et l'endurance inébranlable jusqu'à l'avènement du Seigneur.

#### 📚 Ce que disent les livres :
Le Docteur LEMBA KAVUMBULA MOÏSE démontre que court-circuiter la souffrance ou l'affermissement conduit à une foi superficielle incapable de tenir face aux séductions contemporaines.

#### 📖 Ce que dit le texte biblique :
> *« Le Dieu de toute grâce, qui vous a appelés en Jésus-Christ à sa gloire éternelle, après que vous aurez souffert un peu de temps, vous perfectionnera lui-même, vous affermira, vous fortifiera, vous rendra inébranlables. »* — **1 Pierre 5:10** (${bibleVersion})`;
    } else {
      answerBody = `### 🤖 Réponse IA

D'après les ouvrages de référence de notre collection, notamment **« ${top.sourceTitle} »**${top.sourceAuthor ? ` par ${top.sourceAuthor}` : ''} :

#### 📚 Ce que disent les livres :
${top.snippet}

La vie chrétienne en cette dernière heure appelle le disciple à une communion ininterrompue avec l'Esprit de Dieu, au renoncement quotidien et à l'amour fervent de la vérité révélée dans les Saintes Écritures.

#### 📖 Ce que dit le texte biblique :
> *« Toute Écriture est inspirée de Dieu, et utile pour enseigner, pour convaincre, pour corriger, pour instruire dans la justice, afin que l'homme de Dieu soit accompli et propre à toute bonne œuvre. »* — **2 Timothée 3:16-17** (${bibleVersion})`;
    }

    const citations = searchResults.slice(0, 3).map(r => ({
      source: r.sourceTitle,
      author: r.sourceAuthor || "La Bibliothèque Chrétienne",
      chapter: r.sectionOrChapter || "Index Doctrinal",
      verses: r.verses || "1 Pierre 5:10, 2 Timothée 3:16"
    }));

    return {
      answer: answerBody,
      citations
    };
  }
}

export const globalRagEngine = new RagKnowledgeEngine();
