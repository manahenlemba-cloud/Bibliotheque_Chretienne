import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Languages, 
  ShieldCheck, 
  Share2, 
  ExternalLink,
  HelpCircle,
  Bookmark
} from 'lucide-react';
import { TheologicalDefinitionResponse } from '../services/theologicalService.ts';

interface TheologicalDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  definition: TheologicalDefinitionResponse | null;
  source?: 'gemini_ai' | 'theological_lexicon';
  contextVerse?: string;
  onAskAiWithQuestion?: (question: string) => void;
}

export const TheologicalDefinitionModal: React.FC<TheologicalDefinitionModalProps> = ({
  isOpen,
  onClose,
  definition,
  source = 'gemini_ai',
  contextVerse,
  onAskAiWithQuestion
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isOpen || !definition) return null;

  const handleCopy = () => {
    const textToCopy = `📖 DÉFINITION THÉOLOGIQUE BIBLIQUE : ${definition.term}
Origine : ${definition.originalWord}
Définition : ${definition.definition}

Sens théologique : ${definition.theologicalMeaning}
Contexte biblique : ${definition.biblicalContext}

Versets clés :
${definition.keyVerses.map(v => `• ${v.reference} : « ${v.text} »`).join('\n')}

Application spirituelle : ${definition.spiritualApplication}
(Source : La Bibliothèque Chrétienne de la Dernière Heure)`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const narration = `${definition.term}. ${definition.originalWord}. Définition théologique : ${definition.definition}. Sens spirituel : ${definition.theologicalMeaning}. Application : ${definition.spiritualApplication}`;
    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white p-5 sm:p-6 flex items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500 text-slate-950 flex items-center justify-center shadow-md font-bold">
              <Sparkles className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider text-sky-300 uppercase">
                  Recherche & Définition Théologique
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-medium border border-white/20">
                  {source === 'gemini_ai' ? 'Exégèse IA Gemini' : 'Lexique Théologique'}
                </span>
              </div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-white capitalize mt-0.5">
                {definition.term}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeak}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isSpeaking 
                  ? 'bg-sky-500 text-slate-950 font-bold' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isSpeaking ? "Arrêter la lecture" : "Écouter la définition"}
            >
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Copier la fiche théologique"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Original Word & Etymology Banner */}
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white border border-sky-200 shadow-2xs">
                <Languages className="w-5 h-5 text-sky-800" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900 block">
                  Langues Bibliques d'Origine (Grec / Hébreu)
                </span>
                <p className="font-serif text-sm sm:text-base font-bold text-black mt-0.5">
                  {definition.originalWord}
                </p>
              </div>
            </div>

            {contextVerse && (
              <div className="text-right sm:border-l sm:border-sky-200 sm:pl-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Passage d'origine
                </span>
                <span className="text-xs font-semibold text-black italic max-w-xs truncate block" title={contextVerse}>
                  « {contextVerse} »
                </span>
              </div>
            )}
          </div>

          {/* Section 1: Définition Essentielle */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-800" />
              <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
                Définition Doctrinale
              </h3>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-black text-sm sm:text-base leading-relaxed font-medium">
              {definition.definition}
            </div>
          </div>

          {/* Section 2: Sens & Portée Théologique */}
          <div className="space-y-2">
            <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
              Sens Spirituel & Théologie Biblique
            </h3>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm leading-relaxed space-y-2">
              <p>{definition.theologicalMeaning}</p>
            </div>
          </div>

          {/* Section 3: Contexte Biblique & Exégèse */}
          {definition.biblicalContext && (
            <div className="space-y-2">
              <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
                Contexte Biblique & Éclairage Scripturaire
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed">
                {definition.biblicalContext}
              </div>
            </div>
          )}

          {/* Section 4: Versets Clés */}
          {definition.keyVerses && definition.keyVerses.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="font-display font-bold text-sm text-black uppercase tracking-wider">
                Versets Clés de Référence ({definition.keyVerses.length})
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {definition.keyVerses.map((v, i) => (
                  <div 
                    key={i}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-colors space-y-1"
                  >
                    <span className="text-xs font-bold text-black block">
                      {v.reference}
                    </span>
                    <p className="font-serif italic text-xs sm:text-sm text-slate-800">
                      « {v.text} »
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Application Spirituelle & Sanctification */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Application pour le Croyant & Sanctification (1 Pierre 5:10)</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-medium">
              {definition.spiritualApplication}
            </p>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onAskAiWithQuestion && (
              <button
                onClick={() => {
                  onClose();
                  onAskAiWithQuestion(`Peux-tu approfondir le concept théologique de « ${definition.term} » selon les Écritures et la sainte doctrine ?`);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Approfondir avec l'IA</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-black border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier la fiche'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-black border border-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
