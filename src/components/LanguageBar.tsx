import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, Globe, Loader2, Plus, Check, ChevronDown } from 'lucide-react';
import { Language } from '../types';

interface LanguageBarProps {
  variant?: 'header' | 'mobile' | 'floating' | 'banner';
}

const ADDITIONAL_LANGUAGES = [
  { code: 'pt', name: 'Português', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'kg', name: 'Kikongo', nativeName: 'Kikôngo', flag: '🇨🇩' },
  { code: 'lu', name: 'Tshiluba', nativeName: 'Tshiluba', flag: '🇨🇩' }
];

export const LanguageBar: React.FC<LanguageBarProps> = ({ variant = 'header' }) => {
  const { language, setLanguage, languages, isTranslating, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeCustomLang, setActiveCustomLang] = useState<string | null>(null);

  const handleSelectLang = (code: string) => {
    setActiveCustomLang(null);
    setLanguage(code as Language);
  };

  const handleSelectExtraLang = (code: string) => {
    setActiveCustomLang(code);
    setLanguage(code as Language);
    setDropdownOpen(false);
  };

  if (variant === 'mobile') {
    return (
      <div className="pt-3 pb-2 border-t border-slate-200">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
            <Globe className="w-3.5 h-3.5" />
            <span>{t('langBarLabel')}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full font-semibold">
            {isTranslating ? (
              <Loader2 className="w-2.5 h-2.5 animate-spin text-sky-600" />
            ) : (
              <Sparkles className="w-2.5 h-2.5 text-sky-600" />
            )}
            <span>IA Synchronisée</span>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 px-1">
          {languages.map((lang) => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLang(lang.code)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-700 text-white font-bold shadow-xs ring-2 ring-sky-400'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title={`${lang.name} — ${t('aiConfiguredForLanguage')}`}
              >
                <span className="text-base leading-none mb-0.5">{lang.flag}</span>
                <span className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-1">
                  <span>{lang.code}</span>
                  <span className={`text-[9px] px-1 rounded font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'}`}>IA</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-1 bg-white/90 p-1 rounded-xl border border-sky-200 shadow-xs">
      {/* Subtle indicator showing AI is locked to this language bar */}
      <div 
        className="hidden sm:flex items-center gap-1 pl-1.5 pr-1 text-[11px] font-semibold text-sky-700"
        title="L'IA Gemini et l'interface s'adaptent instantanément à la langue sélectionnée"
      >
        {isTranslating ? (
          <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
        ) : (
          <Sparkles className="w-3 h-3 text-sky-600" />
        )}
      </div>

      {/* Main Standard Language Buttons with Integrated AI Badge */}
      <div className="flex items-center gap-1">
        {languages.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleSelectLang(lang.code)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-700 text-white shadow-xs ring-1 ring-sky-500'
                  : 'text-slate-600 hover:text-sky-900 hover:bg-sky-50'
              }`}
              title={`${lang.nativeName} (${lang.name}) — ${t('aiConfiguredForLanguage')}`}
            >
              <span className="text-xs leading-none">{lang.flag}</span>
              <span className="uppercase text-[11px] font-extrabold tracking-wider">{lang.code}</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold flex items-center gap-0.5 ${
                isActive ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'
              }`}>
                <Sparkles className="w-2 h-2" />
                <span>IA</span>
              </span>
            </button>
          );
        })}

        {/* Extra Language Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCustomLang
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-sky-800 hover:bg-sky-50'
            }`}
            title="Choisir une autre langue pour l'interface et l'IA"
          >
            {activeCustomLang ? (
              <span className="uppercase text-[10px] font-extrabold">{activeCustomLang} • IA</span>
            ) : (
              <span className="flex items-center gap-0.5 text-[11px]">
                <Plus className="w-3 h-3" />
                <span>IA</span>
              </span>
            )}
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                <span>Autres langues</span>
                <span className="text-sky-600 font-extrabold">Config IA</span>
              </div>
              {ADDITIONAL_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleSelectExtraLang(l.code)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-sky-50 text-xs text-slate-700 font-medium transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <span>{l.flag}</span>
                    <span>{l.name}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-sky-100 text-sky-800 font-bold">IA</span>
                  </span>
                  {language === l.code && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
