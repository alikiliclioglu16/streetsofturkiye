import type { LocalizedText } from '@/content/schemas/canonical';

/**
 * The product ships in English (D-014).
 *
 * The audience is American children being introduced to Türkiye, and the
 * canonical content is English throughout. A Turkish interface wrapped around
 * English content was the worst of both, so the interface is English too.
 *
 * The locale layer stays in place: canonical records still carry a `tr` field
 * and the fallback chain still runs, so a translated edition is a content job
 * rather than a rewrite.
 */
export const LOCALES = ['en', 'tr'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
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
  | 'estimated'
  | 'on'
  | 'off'
  | 'language'
  | 'audioMusic'
  | 'audioAmbient'
  | 'audioInterface'
  | 'audioGuide'
  | 'turnLeft'
  | 'turnRight'
  | 'inspectHint'
  | 'anotherDance'
  | 'comingSoon'
  | 'inProgress'
  | 'notOpenYet'
  | 'walkStick'
  | 'preparingGuide'
  | 'playableNote';

const UI: Record<UiKey, Record<Locale, string>> = {
  appTitle: { tr: 'Türkiye Sokakları', en: 'Streets of Türkiye' },
  appTagline: { tr: 'Küçük Kâşifler, Koca Türkiye', en: 'Little Explorers, Big Türkiye' },
  startCity: { tr: 'Şehre gir', en: 'Enter city' },
  backToMap: { tr: 'Haritaya dön', en: 'Back to map' },
  progress: { tr: 'İlerleme', en: 'Progress' },
  collection: { tr: 'Koleksiyon', en: 'Collection' },
  settings: { tr: 'Ayarlar', en: 'Settings' },
  close: { tr: 'Kapat', en: 'Close' },
  skipIntro: { tr: 'Girişi geç', en: "Let's go" },
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
    tr: 'WASD veya ok tuşlarıyla yürü, halkaya yaklaş',
    en: 'Walk with the arrow keys or WASD, then step into the ring',
  },
  hotspotsDone: { tr: 'durak tamamlandı', en: 'stops completed' },
  unverified: { tr: 'Editör onayı bekliyor', en: 'Pending editorial review' },
  resetProgress: { tr: 'İlerlemeyi sıfırla', en: 'Reset progress' },
  estimated: { tr: 'dakika', en: 'min' },
  on: { tr: 'Açık', en: 'On' },
  off: { tr: 'Kapalı', en: 'Off' },
  language: { tr: 'Dil', en: 'Language' },
  audioMusic: { tr: 'Müzik', en: 'Music' },
  audioAmbient: { tr: 'Ortam', en: 'Ambient' },
  audioInterface: { tr: 'Arayüz', en: 'Interface' },
  audioGuide: { tr: 'Rehber', en: 'Guide' },
  turnLeft: { tr: 'Sola çevir', en: 'Turn left' },
  turnRight: { tr: 'Sağa çevir', en: 'Turn right' },
  inspectHint: { tr: 'Çevir, sonra doğru şeye dokun', en: 'Turn it, then tap the right one' },
  anotherDance: { tr: 'Başka bir kutlama dansı', en: 'Another celebration dance' },
  comingSoon: { tr: 'yakında', en: 'coming soon' },
  inProgress: { tr: 'Başlandı', en: 'In progress' },
  notOpenYet: { tr: 'Henüz açılmadı', en: 'Not open yet' },
  walkStick: { tr: 'Yürüme kolu', en: 'Walking stick' },
  preparingGuide: { tr: 'hazırlanıyor', en: 'is getting ready' },
  playableNote: { tr: 'durak', en: 'stops to explore' },
};

export function ui(key: UiKey, locale: Locale): string {
  return UI[key][locale];
}
