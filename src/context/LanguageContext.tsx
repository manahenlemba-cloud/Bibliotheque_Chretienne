import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language } from '../types';
import { TRANSLATIONS, TranslationDict, LANGUAGES } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationDict, fallback?: string) => string;
  translateDynamicText: (text: string, targetLang?: Language) => Promise<string>;
  translateBatch: (texts: string[], targetLang?: Language) => Promise<string[]>;
  isTranslating: boolean;
  languages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// In-memory translation cache to make UI instant and responsive
const memoryCache = new Map<string, string>();

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language') as Language;
      if (saved && typeof saved === 'string') {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'fr';
  });

  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const currentTitle = TRANSLATIONS[language]?.siteName || TRANSLATIONS.fr.siteName;
    document.title = currentTitle;
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('app_language', lang);
    } catch {
      // Ignore
    }
  };

  const t = useCallback((key: keyof TranslationDict, fallback?: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.fr;
    return dict[key] || TRANSLATIONS.fr[key] || fallback || String(key);
  }, [language]);

  const translateDynamicText = useCallback(async (text: string, targetLang?: Language): Promise<string> => {
    const target = targetLang || language;
    if (!text || !text.trim() || target === 'fr') {
      return text;
    }

    const cacheKey = `${target}:${text.slice(0, 100)}:${text.length}`;
    if (memoryCache.has(cacheKey)) {
      return memoryCache.get(cacheKey)!;
    }

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage: target,
          sourceLanguage: 'fr'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.translatedText) {
          memoryCache.set(cacheKey, data.translatedText);
          return data.translatedText;
        }
      }
    } catch (err) {
      console.warn('Translation with Gemini API failed, keeping original:', err);
    } finally {
      setIsTranslating(false);
    }

    return text;
  }, [language]);

  const translateBatch = useCallback(async (texts: string[], targetLang?: Language): Promise<string[]> => {
    const target = targetLang || language;
    if (!Array.isArray(texts) || texts.length === 0 || target === 'fr') {
      return texts;
    }

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts,
          targetLanguage: target,
          sourceLanguage: 'fr'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.translations)) {
          return data.translations;
        }
      }
    } catch (e) {
      console.warn('Batch translate failed:', e);
    } finally {
      setIsTranslating(false);
    }
    return texts;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translateDynamicText,
        translateBatch,
        isTranslating,
        languages: LANGUAGES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Component helper for dynamic translation of user-generated content (comments, testimonies)
export const TranslatedContent: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const { language, translateDynamicText } = useLanguage();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    let isCurrent = true;
    if (language === 'fr') {
      setTranslated(text);
      return;
    }

    translateDynamicText(text).then(res => {
      if (isCurrent) setTranslated(res);
    });

    return () => { isCurrent = false; };
  }, [text, language, translateDynamicText]);

  return <span className={className}>{translated}</span>;
};
