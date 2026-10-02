import { findLocalTheologicalConcept, TheologicalConcept } from '../data/theologicalDictionary';

export interface TheologicalDefinitionResponse {
  term: string;
  originalWord: string;
  languageOrigin?: string;
  definition: string;
  theologicalMeaning: string;
  biblicalContext: string;
  keyVerses: Array<{ reference: string; text: string }>;
  spiritualApplication: string;
}

export interface FetchDefinitionParams {
  term: string;
  contextVerse?: string;
  book?: string;
  chapter?: number;
  version?: string;
  language?: string;
}

export async function fetchTheologicalDefinition(
  params: FetchDefinitionParams
): Promise<{ definition: TheologicalDefinitionResponse; source: 'gemini_ai' | 'theological_lexicon' }> {
  const cleanTerm = params.term.trim().replace(/^[^a-zA-ZÀ-ÿ0-9]+|[^a-zA-ZÀ-ÿ0-9]+$/g, '');

  try {
    const res = await fetch('/api/bible/theological-definition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...params,
        term: cleanTerm
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.definition) {
        return {
          definition: data.definition,
          source: data.source || 'gemini_ai'
        };
      }
    }
  } catch (err) {
    console.warn('Network error during theological definition fetch, using local fallback:', err);
  }

  // Client-side fallback if server fails or network offline
  const local = findLocalTheologicalConcept(cleanTerm);
  if (local) {
    return {
      definition: {
        term: local.term,
        originalWord: local.originalWord,
        languageOrigin: local.languageOrigin,
        definition: local.definition,
        theologicalMeaning: local.theologicalMeaning,
        biblicalContext: params.contextVerse 
          ? `Dans le passage sélectionné (« ${params.contextVerse} ») : ${local.biblicalContext}`
          : local.biblicalContext,
        keyVerses: local.keyVerses,
        spiritualApplication: local.spiritualApplication
      },
      source: 'theological_lexicon'
    };
  }

  return {
    definition: {
      term: cleanTerm,
      originalWord: "Terme biblique hébreu / grec",
      languageOrigin: "Grec / Hébreu",
      definition: `Le terme « ${cleanTerm} » désigne une vérité doctrinale essentielle selon le témoignage des saintes Écritures.`,
      theologicalMeaning: `Dans la doctrine chrétienne, « ${cleanTerm} » se rapporte au plan souverain de salut de Dieu révélé en Jésus-Christ et vécu par la foi.`,
      biblicalContext: params.contextVerse 
        ? `Éclairé par le verset : « ${params.contextVerse} ».`
        : `Examiné dans la plénitude de la révélation biblique.`,
      keyVerses: [
        { reference: "2 Timothée 3:16", text: "Toute Écriture est inspirée de Dieu, et utile pour enseigner, pour convaincre, pour corriger, pour instruire dans la justice." },
        { reference: "1 Pierre 5:10", text: "Le Dieu de toute grâce vous perfectionnera lui-même, vous affermira, vous fortifiera, vous rendra inébranlables." }
      ],
      spiritualApplication: `Méditez ce terme dans la prière afin que sa signification vivifie votre foi et votre marche quotidienne dans la sanctification.`
    },
    source: 'theological_lexicon'
  };
}
