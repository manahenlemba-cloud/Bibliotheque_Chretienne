import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Volume1,
  Headphones,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Sparkles,
  Layers,
  Radio
} from 'lucide-react';
import { VoiceOption } from '../utils/textToSpeech';

export interface AudioReaderPlayerProps {
  bookTitle: string;
  chapterTitle: string;
  chapterIndex: number;
  totalChapters: number;
  isPlaying: boolean;
  isPaused: boolean;
  currentSentenceIdx: number;
  totalSentences: number;
  activeSentenceText: string;
  playbackRate: number;
  pitch: number;
  volume: number;
  selectedVoice: SpeechSynthesisVoice | null;
  availableVoices: VoiceOption[];
  autoAdvance: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSeekSentence: (index: number) => void;
  onNextSentence: () => void;
  onPrevSentence: () => void;
  onRateChange: (rate: number) => void;
  onPitchChange: (pitch: number) => void;
  onVolumeChange: (volume: number) => void;
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
  onToggleAutoAdvance: () => void;
  onClosePlayer: () => void;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export const AudioReaderPlayer: React.FC<AudioReaderPlayerProps> = ({
  bookTitle,
  chapterTitle,
  chapterIndex,
  totalChapters,
  isPlaying,
  isPaused,
  currentSentenceIdx,
  totalSentences,
  activeSentenceText,
  playbackRate,
  pitch,
  volume,
  selectedVoice,
  availableVoices,
  autoAdvance,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSeekSentence,
  onNextSentence,
  onPrevSentence,
  onRateChange,
  onPitchChange,
  onVolumeChange,
  onVoiceChange,
  onToggleAutoAdvance,
  onClosePlayer,
  onNextChapter,
  onPrevChapter
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);

  const speedRates = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  const handleToggleMute = () => {
    if (isMuted) {
      onVolumeChange(prevVolume || 1);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  const progressPercent = totalSentences > 0 
    ? Math.min(100, Math.round(((currentSentenceIdx + 1) / totalSentences) * 100))
    : 0;

  // Render minimized floating pill
  if (isMinimized) {
    return (
      <aside 
        aria-label="Lecteur audio de l'ouvrage (réduit)"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-2.5 px-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-sky-500/40 shadow-2xl shadow-sky-500/10 transition-all hover:scale-102"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Headphones className="w-4 h-4" />
            {isPlaying && !isPaused && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <div className="max-w-[150px] sm:max-w-[200px]">
            <p className="text-xs font-bold text-slate-100 truncate">{chapterTitle}</p>
            <p className="text-[10px] text-sky-400 font-medium">
              {isPlaying && !isPaused ? 'Lecture audio en cours' : isPaused ? 'En pause' : 'Prêt'} • {progressPercent}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
          {isPlaying && !isPaused ? (
            <button
              onClick={onPause}
              aria-label="Mettre en pause la lecture audio"
              className="p-2 rounded-xl bg-sky-500 text-slate-950 font-bold hover:bg-sky-400 cursor-pointer shadow-md transition-all"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={isPaused ? onResume : onPlay}
              aria-label="Lancer la lecture audio"
              className="p-2 rounded-xl bg-sky-500 text-slate-950 font-bold hover:bg-sky-400 cursor-pointer shadow-md transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={() => setIsMinimized(false)}
            aria-label="Agrandir le lecteur audio"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside 
      aria-label="Lecteur audio Text-to-Speech de l'ouvrage"
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-slate-950/95 backdrop-blur-2xl border-t border-sky-500/30 shadow-[0_-10px_35px_rgba(0,0,0,0.5)] transition-all animate-in slide-in-from-bottom duration-300"
    >
      <div className="max-w-5xl mx-auto space-y-3">
        
        {/* Progress Bar & Seeker */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-sky-400 font-semibold">
                Phrase {Math.min(currentSentenceIdx + 1, totalSentences)} / {totalSentences}
              </span>
              <span>•</span>
              <span className="text-slate-300">
                Chapitre {chapterIndex + 1}/{totalChapters}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>{progressPercent}%</span>
              <span>•</span>
              <span className="text-sky-400 font-bold">{playbackRate}x</span>
            </div>
          </div>

          <div 
            onClick={(e) => {
              if (totalSentences <= 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              const targetIdx = Math.floor(ratio * totalSentences);
              onSeekSentence(targetIdx);
            }}
            className="group relative h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer hover:h-2.5 transition-all"
            title="Cliquer pour sauter à un moment précis du chapitre"
          >
            <div 
              className="h-full bg-gradient-to-r from-sky-500 via-sky-400 to-indigo-400 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Hover thumb */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow border border-sky-400 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>
        </div>

        {/* Main Controls Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          
          {/* Chapter / Sentence info */}
          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
            <div className="relative p-2.5 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex-shrink-0">
              <Headphones className="w-5 h-5" />
              {isPlaying && !isPaused && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
                  Audio TTS
                </span>
                <span className="text-xs font-bold text-slate-100 truncate">
                  {chapterTitle}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate max-w-md mt-0.5 italic">
                {activeSentenceText ? `« ${activeSentenceText} »` : bookTitle}
              </p>
            </div>
          </div>

          {/* Central Playback Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Prev Chapter */}
            {onPrevChapter && (
              <button
                onClick={onPrevChapter}
                disabled={chapterIndex <= 0}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Chapitre précédent"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            {/* Prev Sentence */}
            <button
              onClick={onPrevSentence}
              disabled={currentSentenceIdx <= 0}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Phrase précédente"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Play / Pause / Resume */}
            {isPlaying && !isPaused ? (
              <button
                onClick={onPause}
                className="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/25 cursor-pointer transition-all hover:scale-102"
                title="Mettre en pause (Espace)"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span className="hidden sm:inline">Pause</span>
              </button>
            ) : (
              <button
                onClick={isPaused ? onResume : onPlay}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/30 cursor-pointer transition-all hover:scale-102"
                title="Écouter (Espace)"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>{isPaused ? 'Reprendre' : 'Écouter'}</span>
              </button>
            )}

            {/* Stop button */}
            <button
              onClick={onStop}
              disabled={!isPlaying && !isPaused}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-rose-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Arrêter et revenir au début"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            {/* Next Sentence */}
            <button
              onClick={onNextSentence}
              disabled={currentSentenceIdx >= totalSentences - 1}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Phrase suivante"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Next Chapter */}
            {onNextChapter && (
              <button
                onClick={onNextChapter}
                disabled={chapterIndex >= totalChapters - 1}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Chapitre suivant"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Secondary Options */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
            {/* Speed Selector quick pills */}
            <div className="hidden md:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              {speedRates.slice(1, 5).map((r) => (
                <button
                  key={r}
                  onClick={() => onRateChange(r)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                    playbackRate === r 
                      ? 'bg-sky-500 text-slate-950 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}x
                </button>
              ))}
            </div>

            {/* Volume toggle */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <button
                onClick={handleToggleMute}
                className="text-slate-400 hover:text-sky-400 cursor-pointer"
                title={isMuted ? "Activer le son" : "Couper le son"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onVolumeChange(val);
                  if (val > 0) setIsMuted(false);
                }}
                className="w-16 accent-sky-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                title="Volume de la voix"
              />
            </div>

            {/* Detailed Settings Toggle Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                showSettings 
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' 
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
              title="Paramètres de la voix et options"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Minimize button */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
              title="Réduire le lecteur en bulle flottante"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={onClosePlayer}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
              title="Fermer le lecteur audio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Detailed Settings Drawer (Collapsible) */}
        {showSettings && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in fade-in duration-200">
            {/* Voice selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-sky-400" />
                <span>Choix de la Voix ({availableVoices.length})</span>
              </label>
              <select
                value={selectedVoice?.voiceURI || ''}
                onChange={(e) => {
                  const target = availableVoices.find(v => v.voice.voiceURI === e.target.value);
                  if (target) onVoiceChange(target.voice);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 text-xs cursor-pointer truncate"
              >
                {availableVoices.length === 0 ? (
                  <option value="">Voix système par défaut</option>
                ) : (
                  availableVoices.map((v) => (
                    <option key={v.voice.voiceURI} value={v.voice.voiceURI}>
                      {v.displayName} {v.isDefault ? '★' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Speed & Pitch */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>Vitesse de narration : {playbackRate}x</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={playbackRate}
                  onChange={(e) => onRateChange(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Auto Advance to next chapter */}
            <div className="space-y-1.5 flex flex-col justify-center">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Options de lecture continue</span>
              </label>
              <button
                type="button"
                onClick={onToggleAutoAdvance}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                  autoAdvance 
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' 
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>Enchaîner le chapitre suivant</span>
                <span className={`w-4 h-4 rounded-md flex items-center justify-center border ${autoAdvance ? 'bg-sky-500 border-sky-400 text-slate-950 font-bold' : 'border-slate-700'}`}>
                  {autoAdvance && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
              </button>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
};
