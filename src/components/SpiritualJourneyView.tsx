import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  BookOpen, 
  ScrollText, 
  ArrowRight, 
  CheckCircle2, 
  Compass, 
  ShieldCheck, 
  Heart, 
  DownloadCloud, 
  Flame, 
  Share2,
  ChevronRight,
  ExternalLink,
  Volume2,
  VolumeX,
  Copy,
  Info,
  Edit3,
  HardDrive,
  FileText,
  Link as LinkIcon,
  Plus,
  Camera
} from 'lucide-react';
import { Book, BibleVersionId } from '../types';
import { SpiritualStepData } from '../data/spiritualStepsData';
import { BIBLE_VERSIONS } from '../data/bibleData';
import { useLanguage } from '../context/LanguageContext';
import { EditBookPublicationModal } from './EditBookPublicationModal';
import { ManageFlagshipDownloadsModal } from './ManageFlagshipDownloadsModal';
import { SitePhotoUploadModal } from './SitePhotoUploadModal';

interface SpiritualJourneyViewProps {
  books: Book[];
  onOpenBook: (book: Book) => void;
  onNavigate: (view: string, bookId?: string) => void;
  initialStepCode?: string;
  isAdmin?: boolean;
  onBooksChange?: () => void;
}

export const SpiritualJourneyView: React.FC<SpiritualJourneyViewProps> = ({
  books,
  onOpenBook,
  onNavigate,
  initialStepCode,
  isAdmin = false,
  onBooksChange
}) => {
  const { t, language } = useLanguage();
  const [steps, setSteps] = useState<SpiritualStepData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectedBibleVersion, setSelectedBibleVersion] = useState<BibleVersionId>('LSG');
  const [copiedVerse, setCopiedVerse] = useState(false);
  const [speakingPrayer, setSpeakingPrayer] = useState(false);
  const [isEditPublicationOpen, setIsEditPublicationOpen] = useState(false);
  const [isManageDownloadsOpen, setIsManageDownloadsOpen] = useState(false);
  const [isStepPhotoModalOpen, setIsStepPhotoModalOpen] = useState(false);
  const [toastNotify, setToastNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotify = (type: 'success' | 'error', message: string) => {
    setToastNotify({ type, message });
    setTimeout(() => setToastNotify(null), 4000);
  };

  // Fetch spiritual steps from backend
  useEffect(() => {
    fetchSteps();
  }, []);

  const fetchSteps = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/spiritual-steps');
      if (res.ok) {
        const data = await res.json();
        const activeSteps: SpiritualStepData[] = (data.steps || data).filter((s: SpiritualStepData) => s.isActive !== false);
        // Sort strictly by displayOrder
        activeSteps.sort((a, b) => a.displayOrder - b.displayOrder);
        setSteps(activeSteps);

        if (initialStepCode) {
          const foundIdx = activeSteps.findIndex(s => s.code === initialStepCode.toUpperCase());
          if (foundIdx !== -1) setActiveStepIndex(foundIdx);
        }
      }
    } catch (err) {
      console.warn("Erreur chargement étapes spirituelles, utilisation du corpus local:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeStep = steps[activeStepIndex] || steps[0];

  // 1 Pierre 5:10 text for the selected version
  const mainVerseTranslations: Partial<Record<BibleVersionId, string>> & { LSG: string } = {
    LSG: "Le Dieu de toute grâce, qui vous a appelés en Jésus-Christ à sa gloire éternelle, après que vous aurez souffert un peu de temps, vous perfectionnera lui-même, vous affermira, vous fortifiera, vous rendra inébranlables.",
    BFC: "Mais le Dieu de toute grâce, qui vous a appelés à participer à sa gloire éternelle dans le Christ, vous perfectionnera lui-même, vous affermira, vous fortifiera et vous établira sur de solides fondations, après que vous aurez souffert un peu de temps.",
    BDS: "Mais le Dieu de toute grâce, qui vous a appelés en Jésus-Christ à sa gloire éternelle, après que vous aurez souffert un peu de temps, vous perfectionnera lui-même, vous affermira, vous fortifiera et vous établira sur un sol inébranlable.",
    KJV: "But the God of all grace, who hath called us unto his eternal glory by Christ Jesus, after that ye have suffered a while, make you perfect, stablish, strengthen, settle you.",
    AMP: "And the God of all grace [Who imparts all blessing and favor], Who has called you to His own eternal glory in Christ Jesus, will Himself complete and make you what you ought to be, establish and ground you securely, and strengthen, and settle you.",
    'SW-ZAN': "Na Mungu wa neema yote, aliyewaita kuingia katika utukufu wake wa milele katika Kristo Yesu, mkiisha kuteswa kwa muda mfupi, yeye mwenyewe atawatengeneza kamilifu, atawathibitisha, atawatia nguvu, na kuwaweka imara.",
    'SW-KEN': "Lakini baada ya kuteseka kwa muda mfupi, Mungu aliye chemchemi ya neema yote na aliyewaita muwe na sehemu katika utukufu wake wa milele katika Kristo, yeye mwenyewe atawafanya ninyi wakamilifu, imara, wenye nguvu na thabiti kabisa."
  };

  const currentMainVerse = mainVerseTranslations[selectedBibleVersion] || mainVerseTranslations.LSG;

  const copyMainVerse = () => {
    navigator.clipboard.writeText(`« ${currentMainVerse} » — 1 Pierre 5:10 (${selectedBibleVersion})`);
    setCopiedVerse(true);
    setTimeout(() => setCopiedVerse(false), 2000);
  };

  const toggleSpeakPrayer = (prayerText: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingPrayer) {
      window.speechSynthesis.cancel();
      setSpeakingPrayer(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(prayerText);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingPrayer(false);
    utterance.onerror = () => setSpeakingPrayer(false);
    window.speechSynthesis.speak(utterance);
    setSpeakingPrayer(true);
  };

  // Dr. Lemba's flagship book
  const flagshipBook = books.find(b => b.id === 'les-5-etapes-spirituelles-chretien') || (books.length > 0 ? books[0] : null);

  const activeFlagship: Book = flagshipBook || {
    id: 'les-5-etapes-spirituelles-chretien',
    title: "Les 5 Étapes Spirituelles Pour Devenir Chrétien",
    author: "Docteur LEMBA KAVUMBULA MOÏSE",
    category: "Vie Chrétienne & Sanctification",
    description: "Ouvrage magistral du Docteur LEMBA KAVUMBULA MOÏSE présentant le parcours biblique des 5 étapes selon 1 Pierre 5:10 : Appel, Souffrance, Perfectionnement, Affermissement et Fortification.",
    cover_image: "",
    reading_file: "Enseignement du Docteur LEMBA KAVUMBULA MOÏSE sur les 5 étapes...",
    google_drive_url: "",
    pdf_url: "",
    download_links: [],
    created_at: new Date().toISOString(),
    status: 'Publié',
    ai_indexed_content: {
      summary: "Les 5 étapes spirituelles selon 1 Pierre 5:10",
      keyThemes: ["Sanctification", "Appel", "Souffrance", "Perfectionnement", "Affermissement", "Fortification"],
      chaptersSummary: [],
      biblicalReferences: ["1 Pierre 5:10"],
      indexedAt: new Date().toISOString()
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Toast Notification */}
      {toastNotify && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xl animate-in fade-in duration-200 ${
          toastNotify.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' 
            : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastNotify.message}</span>
          </div>
          <button 
            onClick={() => setToastNotify(null)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION HEADER & HERO */}
      <div className="text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold uppercase tracking-wider shadow-sm">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Cheminement Apostolique Fondamental</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
          LES 5 ÉTAPES SPIRITUELLES POUR DEVENIR CHRÉTIEN
        </h1>

        <p className="text-sm sm:text-base text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
          Le chemin biblique inaltérable révélé dans les Saintes Écritures selon <strong className="text-sky-300 font-semibold">1 Pierre 5:10</strong> et exposé par le <strong className="text-sky-300 font-semibold">Docteur LEMBA KAVUMBULA MOÏSE</strong>.
        </p>

        {/* 5 STEPS SEQUENTIAL BADGES */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono font-bold">
          {['1. APPEL', '2. SOUFFRANCE', '3. PERFECTIONNEMENT', '4. AFFERMISSEMENT', '5. FORTIFICATION'].map((stepName, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => setActiveStepIndex(i)}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  activeStepIndex === i 
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-lg shadow-sky-500/25 scale-105' 
                    : 'bg-slate-900/80 text-sky-300/80 border-slate-800 hover:border-sky-500/40 hover:text-sky-200'
                }`}
              >
                {stepName}
              </button>
              {i < 4 && <span className="text-sky-500/50 hidden sm:inline">↓</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ADMIN PUBLICATION & DOWNLOADS MANAGEMENT BANNER */}
      {isAdmin && (
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-950 border-2 border-amber-400 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow-md flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950">
                  Espace Administrateur
                </span>
                <span className="text-xs text-amber-300 font-semibold">
                  Gestion de l'Ouvrage & Téléchargements
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Publication : « {activeFlagship.title} »
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Configurez les liens de téléchargement (Google Drive, PDF direct, audio, formats mobiles), mettez à jour la couverture ou éditez le texte intégral.
              </p>
              
              {/* Quick links status pills */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                  activeFlagship.google_drive_url 
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  <HardDrive className="w-3 h-3" />
                  <span>Google Drive : {activeFlagship.google_drive_url ? 'Configuré' : 'Non défini'}</span>
                </span>

                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                  activeFlagship.pdf_url 
                    ? 'bg-sky-950/80 text-sky-300 border-sky-500/40' 
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  <FileText className="w-3 h-3" />
                  <span>PDF Direct : {activeFlagship.pdf_url ? 'Configuré' : 'Non défini'}</span>
                </span>

                {activeFlagship.download_links && activeFlagship.download_links.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-950/80 text-purple-300 border border-purple-500/40">
                    <LinkIcon className="w-3 h-3" />
                    <span>{activeFlagship.download_links.length} autre(s) lien(s)</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => setIsManageDownloadsOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4 text-slate-950" />
              <span>Gérer les liens de téléchargement</span>
            </button>

            <button
              onClick={() => setIsEditPublicationOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Modifier la publication</span>
            </button>
          </div>
        </div>
      )}

      {/* VERSET MAÎTRE — 1 PIERRE 5:10 DYNAMIQUE AVEC SELECTEUR DE VERSION */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/40 border-2 border-sky-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-sky-400 tracking-wider block">
                Verset Fondamental du Parcours
              </span>
              <h3 className="font-display text-lg sm:text-xl font-bold text-slate-100">
                1 Pierre 5:10-11
              </h3>
            </div>
          </div>

          {/* Version Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Version biblique :</span>
            <select
              value={selectedBibleVersion}
              onChange={(e) => setSelectedBibleVersion(e.target.value as BibleVersionId)}
              className="bg-slate-950 border border-sky-500/40 text-sky-300 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-sky-400 transition-colors shadow-inner"
            >
              {BIBLE_VERSIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.badge})
                </option>
              ))}
            </select>

            <button
              onClick={copyMainVerse}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-sky-300 border border-slate-800 transition-colors cursor-pointer"
              title="Copier le verset"
            >
              {copiedVerse ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Verse text */}
        <blockquote className="text-base sm:text-lg lg:text-xl text-sky-100/95 font-serif italic leading-relaxed border-l-4 border-sky-500 pl-4 sm:pl-6 py-1">
          « {currentMainVerse} »
        </blockquote>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
          <span>Traduction sélectionnée : <strong>{BIBLE_VERSIONS.find(v => v.id === selectedBibleVersion)?.fullName}</strong></span>
          <span className="text-sky-400/80 font-mono">APPEL ↓ SOUFFRANCE ↓ PERFECTIONNEMENT ↓ AFFERMISSEMENT ↓ FORTIFICATION</span>
        </div>
      </div>

      {/* INTERACTIVE TIMELINE STEPPER CARDS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-sky-400" />
            <span>Navigation du Pèlerinage Spirituel</span>
          </h2>
          <span className="text-xs text-slate-400">
            Étape {activeStepIndex + 1} sur {steps.length || 5}
          </span>
        </div>

        {/* Stepper Tabs Bar */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {steps.map((step, idx) => {
            const isActive = activeStepIndex === idx;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStepIndex(idx)}
                className={`p-3 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-slate-900 border-sky-500 shadow-xl shadow-sky-500/20 ring-2 ring-sky-400/40'
                    : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-sky-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-400'
                  }`}>
                    0{step.stepNumber}
                  </span>
                  <span className="hidden md:inline-block w-2 h-2 rounded-full bg-sky-400/40"></span>
                </div>
                <span className={`text-xs sm:text-sm font-bold block truncate ${
                  isActive ? 'text-sky-300' : 'text-slate-300'
                }`}>
                  {step.code}
                </span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE STEP DETAILED DISPLAY CARD */}
        {activeStep && (
          <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-sky-500/25 shadow-2xl space-y-8 animate-in fade-in zoom-in-98 duration-300">
            
            {/* Step Top Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Photo & Badges */}
              <div className="lg:col-span-4 space-y-4">
                <div className="relative rounded-2xl overflow-hidden border-2 border-sky-500/40 shadow-2xl bg-slate-950 group">
                  {activeStep.image ? (
                    <img 
                      src={activeStep.image} 
                      alt={activeStep.title} 
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900 text-white p-6 flex flex-col justify-between text-center border-b border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold uppercase tracking-wider border border-sky-400/30">
                          Étape {activeStep.stepNumber}
                        </span>
                        <span className="text-[10px] font-mono text-sky-400 font-semibold">1 Pierre 5:10</span>
                      </div>
                      <div className="my-auto py-2">
                        <h4 className="font-display font-bold text-base text-white">
                          {activeStep.name}
                        </h4>
                        <p className="text-[11px] text-sky-200/80 mt-1 line-clamp-2">
                          {activeStep.subtitle}
                        </p>
                      </div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                        Parcours des 5 Étapes
                      </span>
                    </div>
                  )}

                  <div className="p-3 bg-slate-950 border-t border-slate-800 text-center flex items-center justify-between gap-2">
                    <span className="text-[11px] text-sky-300 font-semibold block truncate">
                      Enseignement Docteur LEMBA KAVUMBULA MOÏSE
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsStepPhotoModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-600 text-sky-300 hover:text-white text-[10px] font-bold border border-sky-400/40 flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0"
                        title="Ajouter ou modifier la photo de cette étape"
                      >
                        <Camera className="w-3 h-3" />
                        <span>{activeStep.image ? 'Modifier' : '+ Photo'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick actions for this step */}
                <div className="space-y-2">
                  <button
                    onClick={() => onNavigate('ai', activeFlagship.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>Interroger l'IA sur l'étape « {activeStep.code} »</span>
                  </button>

                  <button
                    onClick={() => onOpenBook(activeFlagship)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-sky-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Consulter l'ouvrage de référence</span>
                  </button>
                </div>

                {/* Section Téléchargements du Livre des 5 Étapes */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-sky-500/30 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DownloadCloud className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                        Télécharger le Livre
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => setIsManageDownloadsOpen(true)}
                        className="px-2 py-0.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Ajouter ou modifier les liens de téléchargement"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Gérer les liens</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug">
                    « {activeFlagship.title} » • Retrouvez l'enseignement intégral.
                  </p>

                  {/* Active download links */}
                  <div className="space-y-1.5 pt-1">
                    {activeFlagship.google_drive_url && (
                      <a
                        href={activeFlagship.google_drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-between gap-2 shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <HardDrive className="w-4 h-4 text-slate-950 flex-shrink-0" />
                          <span className="truncate">Télécharger sur Google Drive</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                      </a>
                    )}

                    {activeFlagship.pdf_url && (
                      <a
                        href={activeFlagship.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-between gap-2 shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">Téléchargement direct (PDF)</span>
                        </div>
                        <DownloadCloud className="w-3.5 h-3.5 opacity-80 group-hover:translate-y-0.5 transition-transform flex-shrink-0" />
                      </a>
                    )}

                    {activeFlagship.download_links && activeFlagship.download_links.map((dl, i) => (
                      <a
                        key={dl.id || i}
                        href={dl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 hover:border-sky-500/50 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-between gap-2 transition-colors group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <LinkIcon className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                          <span className="truncate">{dl.label}</span>
                          {dl.note && <span className="text-[10px] text-slate-400 font-normal">({dl.note})</span>}
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-sky-300 flex-shrink-0" />
                      </a>
                    ))}

                    {/* If no link configured yet */}
                    {!activeFlagship.google_drive_url && !activeFlagship.pdf_url && (!activeFlagship.download_links || activeFlagship.download_links.length === 0) && (
                      <div className="text-center py-2">
                        {isAdmin ? (
                          <button
                            onClick={() => setIsManageDownloadsOpen(true)}
                            className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Ajouter les liens de téléchargement</span>
                          </button>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">
                            Les liens de téléchargement sont en cours de mise en ligne.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Content details */}
              <div className="lg:col-span-8 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500 text-slate-950 text-xs font-bold uppercase tracking-wider">
                      Étape {activeStep.stepNumber} sur 5
                    </span>
                    <span className="text-xs font-mono text-sky-400/90 font-bold uppercase">
                      Code : {activeStep.code}
                    </span>
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-100 leading-tight">
                    {activeStep.title}
                  </h2>

                  <p className="mt-2 text-sm sm:text-base text-sky-300 font-medium">
                    {activeStep.subtitle}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 leading-relaxed font-light">
                  {activeStep.description}
                </div>

                {/* Biblical Verses Associated */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-sky-400 flex items-center gap-1.5">
                    <ScrollText className="w-4 h-4" />
                    <span>Fondements Scripturaires de l'Étape</span>
                  </h4>

                  <div className="space-y-2.5">
                    {activeStep.biblicalVerses.map((v, vIdx) => {
                      const dynamicText = v.textByVersion?.[selectedBibleVersion] || v.text;
                      return (
                        <div key={vIdx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sky-300 text-xs sm:text-sm">
                              {v.reference}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                              Version {selectedBibleVersion}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-200 font-serif italic">
                            « {dynamicText} »
                          </p>
                          {v.commentary && (
                            <p className="text-[11px] text-slate-400 font-sans pt-1 border-t border-slate-800/60">
                              <strong>Éclairage :</strong> {v.commentary}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Enseignements Théologiques */}
                {activeStep.teachings && activeStep.teachings.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-sky-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>Enseignements Théologiques & Pastoraux</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeStep.teachings.map((tItem, tIdx) => (
                        <div key={tIdx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                          <h5 className="font-semibold text-xs text-sky-200">
                            {tItem.title}
                          </h5>
                          <p className="text-xs text-slate-300/90 leading-relaxed font-light">
                            {tItem.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Livres Associés */}
                {activeStep.associatedBooks && activeStep.associatedBooks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-sky-400 flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4" />
                      <span>Livres & Traités Recommandés pour cette Étape</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeStep.associatedBooks.map((bItem, bIdx) => {
                        const targetBook = books.find(b => b.id === bItem.id);
                        return (
                          <div 
                            key={bIdx}
                            onClick={() => targetBook && onOpenBook(targetBook)}
                            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-200 group-hover:text-sky-300 truncate">
                                {bItem.title}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {bItem.author}
                              </p>
                              <p className="text-[10px] text-sky-400/80 mt-0.5">
                                {bItem.relevance}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Prière d'Étape & Méditation */}
                {activeStep.complementaryContent && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 to-slate-950 border border-sky-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-sky-400" />
                        <span>Prière & Exhortation d'Étape</span>
                      </span>

                      <button
                        onClick={() => toggleSpeakPrayer(activeStep.complementaryContent.stepPrayer)}
                        className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer"
                      >
                        {speakingPrayer ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        <span>{speakingPrayer ? 'Arrêter' : 'Écouter la prière'}</span>
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300/95 italic font-serif leading-relaxed">
                      « {activeStep.complementaryContent.stepPrayer} »
                    </p>

                    <div className="pt-2 border-t border-sky-500/20 text-[11px] text-slate-400">
                      <strong>Méditation :</strong> {activeStep.complementaryContent.meditation}
                    </div>
                  </div>
                )}

                {/* Navigation Between Steps Buttons */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                  <button
                    disabled={activeStepIndex === 0}
                    onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
                    className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
                  >
                    ← Étape Précédente
                  </button>

                  <span className="text-xs text-slate-500">
                    {activeStepIndex + 1} / {steps.length}
                  </span>

                  <button
                    disabled={activeStepIndex === steps.length - 1}
                    onClick={() => setActiveStepIndex(prev => Math.min(steps.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span>Étape Suivante</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}
      </div>

      {/* Edit Publication Modal for Admin */}
      {isEditPublicationOpen && (
        <EditBookPublicationModal
          book={activeFlagship}
          isOpen={isEditPublicationOpen}
          onClose={() => setIsEditPublicationOpen(false)}
          onBookUpdated={() => {
            if (onBooksChange) onBooksChange();
          }}
          onBookDeleted={() => {
            if (onBooksChange) onBooksChange();
            onNavigate('library');
          }}
        />
      )}

      {/* Dedicated Manage Download Links Modal for the 5 Steps Book */}
      {isManageDownloadsOpen && (
        <ManageFlagshipDownloadsModal
          isOpen={isManageDownloadsOpen}
          onClose={() => setIsManageDownloadsOpen(false)}
          currentBook={activeFlagship}
          onSaved={(updatedBook) => {
            showNotify('success', `Liens de téléchargement enregistrés avec succès pour « ${updatedBook.title} » !`);
            if (onBooksChange) onBooksChange();
          }}
          onNotify={(type, msg) => showNotify(type, msg)}
        />
      )}

      {/* Step Photo Upload Modal for Admin */}
      {isStepPhotoModalOpen && activeStep && (
        <SitePhotoUploadModal
          isOpen={isStepPhotoModalOpen}
          onClose={() => setIsStepPhotoModalOpen(false)}
          slot={`step-${activeStep.stepNumber}` as any}
          slotTitle={`Photo Étape ${activeStep.stepNumber} : ${activeStep.name}`}
          slotDescription="Ajouter ou modifier l'illustration doctrinale pour cette étape"
          currentPhotoUrl={activeStep.image || ''}
          onPhotoSaved={(_slot, url) => {
            setSteps(prev => prev.map((s, idx) => idx === activeStepIndex ? { ...s, image: url } : s));
            showNotify('success', `Photo enregistrée pour l'étape ${activeStep.stepNumber} !`);
            // Persist step photo
            fetch(`/api/admin/steps/${activeStep.id}/photo`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: url })
            }).catch(err => console.warn(err));
          }}
          onNotify={(type, msg) => showNotify(type === 'error' ? 'error' : 'success', msg)}
        />
      )}

    </div>
  );
};
