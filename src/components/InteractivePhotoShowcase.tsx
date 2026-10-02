import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Maximize2, 
  X, 
  Sparkles, 
  Camera, 
  BookOpen, 
  Share2, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { ShowcasePhoto } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface InteractivePhotoShowcaseProps {
  photos: ShowcasePhoto[];
  onNavigate?: (view: string) => void;
  onNavigateToAdmin?: () => void;
  isAdmin?: boolean;
}

export const InteractivePhotoShowcase: React.FC<InteractivePhotoShowcaseProps> = ({
  photos = [],
  onNavigate,
  onNavigateToAdmin,
  isAdmin = false
}) => {
  const { t } = useLanguage();
  const activePhotos = photos.filter(p => p.active !== false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const SLIDE_DURATION = 6000; // 6 seconds per photo

  const handleNext = useCallback(() => {
    if (activePhotos.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % activePhotos.length);
    setProgress(0);
  }, [activePhotos.length]);

  const handlePrev = useCallback(() => {
    if (activePhotos.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + activePhotos.length) % activePhotos.length);
    setProgress(0);
  }, [activePhotos.length]);

  const goToIndex = (idx: number) => {
    setCurrentIndex(idx);
    setProgress(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape' && isLightboxOpen) setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isLightboxOpen]);

  // Auto-play timer with fine-grained progress bar
  useEffect(() => {
    if (!isPlaying || activePhotos.length <= 1 || isLightboxOpen) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const intervalStep = 50; // update progress every 50ms
    const stepIncrement = (intervalStep / SLIDE_DURATION) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress(old => {
        if (old >= 100) {
          handleNext();
          return 0;
        }
        return old + stepIncrement;
      });
    }, intervalStep);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, activePhotos.length, handleNext, isLightboxOpen]);

  const currentPhoto = activePhotos[currentIndex];

  const handleShare = () => {
    if (navigator.clipboard && currentPhoto) {
      navigator.clipboard.writeText(
        `« ${currentPhoto.title} » - ${currentPhoto.caption || 'Bibliothèque Chrétienne de la Dernière Heure'} : ${window.location.origin}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!activePhotos.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-sm">
        <Camera className="w-12 h-12 text-sky-400 mx-auto mb-3" />
        <h3 className="font-display font-semibold text-slate-800 text-lg">Vitrine Interactive de Photos</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
          Aucune photo n'est encore affichée. L'administrateur peut importer des photos avec leurs noms et légendes dans le panneau d'administration.
        </p>
        {onNavigateToAdmin && (
          <button
            onClick={onNavigateToAdmin}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Accéder à l'administration pour importer des photos</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="relative my-8 sm:my-12">
      {/* Decorative subtle aura */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-sky-900/30 via-slate-800/40 to-indigo-950/40 rounded-3xl blur-xl opacity-70 pointer-events-none" />

      <div className="relative bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden transition-all">
        
        {/* Top Header of the Showcase - Dark Minimalist */}
        <div className="px-5 sm:px-8 pt-6 pb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/90 bg-black">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('photoShowcaseBadgeDefault')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-900 text-slate-300 border border-slate-700">
                  {currentIndex + 1} / {activePhotos.length}
                </span>
              </div>
              <h2 className="font-display font-bold text-white text-lg sm:text-xl">
                {t('photoShowcaseTitle')}
              </h2>
            </div>
          </div>

          {/* Quick controls: play/pause, prev, next, manage */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(p => !p)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
              <span className="hidden sm:inline">{isPlaying ? "Pause" : "Play"}</span>
            </button>

            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-400 transition-all cursor-pointer"
              title={t('photoShowcasePrev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-400 transition-all cursor-pointer"
              title={t('photoShowcaseNext')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {isAdmin && onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold border border-amber-300 text-xs shadow-xs transition-all cursor-pointer"
                title={t('showcaseManageAdminBtn')}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                <span>{t('showcaseManageAdminBtn')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-900 h-1 relative overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-amber-300 transition-all duration-75 ease-linear"
            style={{ width: `${isPlaying ? progress : 0}%` }}
          />
        </div>

        {/* Main Stage Grid: Interactive Photo (left/top) + Information Panel with Photo Name (right/bottom) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* Photo Visual Container - Dark Minimalist */}
          <div className="lg:col-span-7 xl:col-span-8 bg-black relative group min-h-[340px] sm:min-h-[440px] md:min-h-[500px] flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
            
            {/* Background subtle soft aura */}
            <div 
              className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-15 scale-110 transition-all duration-700 pointer-events-none"
              style={{ backgroundImage: `url(${currentPhoto.url})` }}
            />

            {/* Current Photo */}
            <img
              key={currentPhoto.id}
              src={currentPhoto.url}
              alt={currentPhoto.title}
              className="relative z-10 max-h-[500px] w-auto max-w-full object-contain p-4 sm:p-6 transition-all duration-500 transform group-hover:scale-[1.02] drop-shadow-2xl cursor-pointer"
              onClick={() => setIsLightboxOpen(true)}
            />

            {/* Floating Quick Action Overlay */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white shadow-md border border-slate-700 transition-all cursor-pointer"
                title="Agrandir en plein écran"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white shadow-md border border-slate-700 transition-all cursor-pointer"
                title="Partager cette photo"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>

            {/* In-photo navigation arrows */}
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-2xl bg-black/80 hover:bg-black text-white shadow-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="w-5 h-5 text-amber-400" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-2xl bg-black/80 hover:bg-black text-white shadow-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              aria-label="Photo suivante"
            >
              <ChevronRight className="w-5 h-5 text-amber-400" />
            </button>

            {/* Bottom bar pill inside image */}
            <div className="absolute bottom-3 left-4 z-20">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/80 text-slate-300 backdrop-blur-md border border-slate-700 shadow-sm">
                Photo {currentIndex + 1} sur {activePhotos.length}
              </span>
            </div>
          </div>

          {/* Photo Details & Name Panel (Dark Minimalist) */}
          <div className="lg:col-span-5 xl:col-span-4 p-6 sm:p-8 flex flex-col justify-between bg-slate-950">
            
            <div className="space-y-4">
              
              {/* Badge & Category */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {currentPhoto.badge || "Vitrine Chrétienne"}
                </span>
                {currentPhoto.authorOrSource && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700">
                    {currentPhoto.authorOrSource}
                  </span>
                )}
              </div>

              {/* Photo Name (TITLE) - Highlighted prominently as requested! */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Nom de la photo :
                </span>
                <h3 className="font-display font-bold text-2xl sm:text-3xl text-white leading-snug tracking-tight">
                  {currentPhoto.title}
                </h3>
              </div>

              {/* Spiritual description / caption */}
              {currentPhoto.caption && (
                <div className="p-4 rounded-2xl bg-black border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Description & Méditation Spirituelle</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-light">
                    {currentPhoto.caption}
                  </p>
                </div>
              )}

              {/* Spiritual affirmation */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  « Le Dieu de toute grâce vous perfectionnera lui-même, vous affermira, vous fortifiera. » — 1 Pierre 5:10
                </span>
              </div>
            </div>

            {/* Bottom Actions & Thumbnail Selector */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              
              {/* Thumbnail Strip */}
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-2">
                  Sélection rapide ({activePhotos.length} photos disponibles) :
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                  {activePhotos.map((photo, idx) => (
                    <button
                      key={photo.id}
                      onClick={() => goToIndex(idx)}
                      className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        idx === currentIndex
                          ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105 shadow-md'
                          : 'border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                      }`}
                      title={photo.title}
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                      {idx === currentIndex && (
                        <div className="absolute inset-0 bg-amber-400/20 pointer-events-none" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>Agrandir la photo</span>
                </button>

                <button
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  title="Copier le lien"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copié !' : 'Partager'}</span>
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Bottom indicator dots */}
        <div className="bg-black px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {activePhotos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex 
                    ? 'w-8 bg-amber-400' 
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                aria-label={`Aller à la photo ${idx + 1}`}
              />
            ))}
          </div>

          <div className="text-xs text-slate-400">
            Astuce : utilisez les touches <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300">←</kbd> et <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300">→</kbd> pour naviguer.
          </div>
        </div>
      </div>

      {/* Lightbox / Fullscreen Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          
          {/* Lightbox Header */}
          <div className="flex items-center justify-between gap-4 text-white z-20 pb-4 border-b border-white/10">
            <div>
              <span className="text-[11px] uppercase font-bold text-sky-400 tracking-wider">
                Photo {currentIndex + 1} sur {activePhotos.length}
              </span>
              <h4 className="font-display font-bold text-lg sm:text-xl text-white">
                {currentPhoto.title}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLightboxZoom(z => Math.max(0.6, z - 0.25))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Zoom arrière"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLightboxZoom(1)}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition-all cursor-pointer"
                title="Réinitialiser le zoom"
              >
                {Math.round(lightboxZoom * 100)}%
              </button>
              <button
                onClick={() => setLightboxZoom(z => Math.min(2.5, z + 0.25))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Zoom avant"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 transition-all cursor-pointer ml-2"
                title="Fermer (Échap)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image with Nav */}
          <div className="relative flex-1 flex items-center justify-center overflow-auto my-4">
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 z-30 p-3 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer"
              title="Précédent"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={currentPhoto.url}
              alt={currentPhoto.title}
              className="max-h-[80vh] max-w-[90vw] object-contain transition-transform duration-200 rounded-lg shadow-2xl"
              style={{ transform: `scale(${lightboxZoom})` }}
            />

            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-30 p-3 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer"
              title="Suivant"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Footer with Caption */}
          <div className="text-center max-w-3xl mx-auto pt-3 border-t border-white/10 text-white/90 text-sm">
            {currentPhoto.caption && <p className="font-light italic">{currentPhoto.caption}</p>}
            <p className="text-xs text-white/50 mt-1">
              {currentPhoto.authorOrSource || "Bibliothèque Chrétienne de la Dernière Heure"}
            </p>
          </div>

        </div>
      )}
    </section>
  );
};
