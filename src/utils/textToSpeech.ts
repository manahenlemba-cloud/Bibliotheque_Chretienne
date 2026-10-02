/**
 * Text-to-Speech (TTS) engine and utilities for the Christian Library reader
 * Works with native browser SpeechSynthesis with robust chunking, voice detection,
 * sentence tracking, and auto-continuation.
 */

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  displayName: string;
  lang: string;
  isDefault: boolean;
}

/**
 * Splits text into natural sentence-level chunks for smooth, timeout-proof playback
 */
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  const clean = text.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  // Split by sentence terminators (. ! ? … \n)
  const rawSegments = clean.split(/(?<=[.!?…\n])\s+/);
  const result: string[] = [];

  for (const seg of rawSegments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;

    // If a segment is very long (> 200 chars) without sentence terminators, split by clause (comma, colon, semicolon)
    if (trimmed.length > 200) {
      const clauses = trimmed.split(/(?<=[,;:])\s+/);
      for (const clause of clauses) {
        const ct = clause.trim();
        if (ct) result.push(ct);
      }
    } else {
      result.push(trimmed);
    }
  }

  return result.length > 0 ? result : [clean];
}

/**
 * Filters and formats available browser voices for the user's current language
 */
export function getFilteredVoices(langCode: string = 'fr'): VoiceOption[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }

  const allVoices = window.speechSynthesis.getVoices();
  if (!allVoices || allVoices.length === 0) return [];

  // Normalize target language code (e.g. 'fr', 'en', 'sw', 'ln')
  const targetPrefix = langCode.toLowerCase().slice(0, 2);

  // Group matching and other voices
  const matchingVoices: VoiceOption[] = [];
  const fallbackVoices: VoiceOption[] = [];

  for (const v of allVoices) {
    const vLang = (v.lang || '').toLowerCase();
    const isTarget = vLang.startsWith(targetPrefix);

    // Make human friendly name
    let cleanName = v.name
      .replace(/Google /i, '')
      .replace(/Microsoft /i, '')
      .replace(/Apple /i, '')
      .replace(/Desktop/i, '')
      .replace(/French/i, 'Français')
      .trim();

    const option: VoiceOption = {
      voice: v,
      displayName: `${cleanName} (${v.lang})`,
      lang: v.lang,
      isDefault: v.default || false
    };

    if (isTarget) {
      matchingVoices.push(option);
    } else {
      fallbackVoices.push(option);
    }
  }

  // Prioritize premium / natural voices (e.g., Google, Natural, Online, Enhanced)
  matchingVoices.sort((a, b) => {
    const aScore = (a.voice.name.includes('Natural') || a.voice.name.includes('Google') || a.voice.name.includes('Enhanced')) ? 2 : 1;
    const bScore = (b.voice.name.includes('Natural') || b.voice.name.includes('Google') || b.voice.name.includes('Enhanced')) ? 2 : 1;
    return bScore - aScore;
  });

  return matchingVoices.length > 0 ? matchingVoices : fallbackVoices;
}

/**
 * Calculates estimated listening duration in minutes and seconds
 */
export function estimateReadingTime(text: string, rate: number = 1.0): { minutes: number; seconds: number } {
  if (!text) return { minutes: 0, seconds: 0 };
  const words = text.trim().split(/\s+/).length;
  // Standard speech rate is roughly 140 words per minute at 1.0x
  const wordsPerMinute = 140 * Math.max(0.5, rate);
  const totalSeconds = Math.round((words / wordsPerMinute) * 60);
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60
  };
}
