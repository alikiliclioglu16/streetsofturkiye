import type { LocalizedText } from '@/content/schemas/canonical';

/**
 * Bilingual-ready per DECISION_LOG D-010.
 * The legacy dataset is English-only (`tr` is null on all 249 stops), so the
 * fallback chain is load-bearing rather than a later concern.
 */
export const LOCALES = ['tr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'tr';
export const FALLBACK_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Resolves a localized field. Returns the requested locale, then the
 * documented fallback locale, then an empty string. Never returns null so
 * that UI components do not have to branch on missing translations.
 */
export function t(text: LocalizedText | undefined, locale: Locale): string {
  if (!text) return '';
  const preferred = text[locale];
  if (preferred && preferred.trim().length > 0) return preferred;
  const fallback = text[FALLBACK_LOCALE];
  if (fallback && fallback.trim().length > 0) return fallback;
  return '';
}

/** True when the string shown came from the fallback locale, for editorial tooling. */
export function isFallback(text: LocalizedText | undefined, locale: Locale): boolean {
  if (!text) return false;
  const preferred = text[locale];
  return !(preferred && preferred.trim().length > 0);
}

type UiKey =
  | 'appTitle'
  | 'appTagline'
  | 'startCity'
  | 'backToMap'
  | 'progress'
  | 'collection'
  | 'settings'
  | 'close'
  | 'skipIntro'
  | 'guidedMode'
  | 'exploreMode'
  | 'reducedMotion'
  | 'audio'
  | 'quality'
  | 'qualityLow'
  | 'qualityMedium'
  | 'qualityHigh'
  | 'interact'
  | 'continue'
  | 'hint'
  | 'tryAgain'
  | 'correct'
  | 'rewardEarned'
  | 'quizTitle'
  | 'cityComplete'
  | 'loading'
  | 'loadError'
  | 'retry'
  | 'noWebgl'
  | 'moveHint'
  | 'hotspotsDone'
  | 'unverified'
  | 'resetProgress'
  | 'estimated';

const UI: Record<UiKey, Record<Locale, string>> = {
  appTitle: { tr: 'Türkiye Sokakları', en: 'Streets of Türkiye' },
  appTagline: { tr: 'Küçük Kâşifler, Koca Türkiye', en: 'Little Explorers, Big Türkiye' },
  startCity: { tr: 'Şehre gir', en: 'Enter city' },
  backToMap: { tr: 'Haritaya dön', en: 'Back to map' },
  progress: { tr: 'İlerleme', en: 'Progress' },
  collection: { tr: 'Koleksiyon', en: 'Collection' },
  settings: { tr: 'Ayarlar', en: 'Settings' },
  close: { tr: 'Kapat', en: 'Close' },
  skipIntro: { tr: 'Girişi geç', en: 'Skip intro' },
  guidedMode: { tr: 'Rehberli mod', en: 'Guided mode' },
  exploreMode: { tr: 'Keşif modu', en: 'Explore mode' },
  reducedMotion: { tr: 'Hareketi azalt', en: 'Reduce motion' },
  audio: { tr: 'Ses', en: 'Audio' },
  quality: { tr: 'Kalite', en: 'Quality' },
  qualityLow: { tr: 'Düşük', en: 'Low' },
  qualityMedium: { tr: 'Orta', en: 'Medium' },
  qualityHigh: { tr: 'Yüksek', en: 'High' },
  interact: { tr: 'İncele', en: 'Inspect' },
  continue: { tr: 'Devam et', en: 'Continue' },
  hint: { tr: 'İpucu', en: 'Hint' },
  tryAgain: { tr: 'Tekrar dene', en: 'Try again' },
  correct: { tr: 'Doğru!', en: 'Correct!' },
  rewardEarned: { tr: 'Yeni parça kazandın', en: 'You earned a new piece' },
  quizTitle: { tr: 'Şehir sorusu', en: 'City question' },
  cityComplete: { tr: 'Şehri tamamladın', en: 'City complete' },
  loading: { tr: 'Şehir yükleniyor', en: 'Loading city' },
  loadError: { tr: 'Şehir içeriği yüklenemedi', en: 'City content could not be loaded' },
  retry: { tr: 'Yeniden dene', en: 'Retry' },
  noWebgl: {
    tr: 'Bu cihazda 3B görüntü açılamadı. Şehir bilgilerini yine de okuyabilirsin.',
    en: '3D view is unavailable on this device. You can still read the city information.',
  },
  moveHint: {
    tr: 'WASD veya ok tuşlarıyla yürü, sarı halkaya yaklaş',
    en: 'Walk with WASD or arrow keys, step into the yellow ring',
  },
  hotspotsDone: { tr: 'durak tamamlandı', en: 'stops completed' },
  unverified: { tr: 'Editör onayı bekliyor', en: 'Pending editorial review' },
  resetProgress: { tr: 'İlerlemeyi sıfırla', en: 'Reset progress' },
  estimated: { tr: 'dakika', en: 'min' },
};

export function ui(key: UiKey, locale: Locale): string {
  return UI[key][locale];
}
