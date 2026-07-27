'use client';

import { create } from 'zustand';
import { prefersReducedMotion } from '@/engine/quality/quality';
import { DEFAULT_LOCALE, type Locale } from '@/content/i18n';

interface SettingsState {
  locale: Locale;
  reducedMotion: boolean;
  reducedMotionAuto: boolean;
  muteAmbient: boolean;
  muteUi: boolean;
  muteGuide: boolean;
  showPerfOverlay: boolean;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  setReducedMotion: (value: boolean) => void;
  toggleAudio: (channel: 'ambient' | 'ui' | 'guide') => void;
  togglePerfOverlay: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'sot.settings.v1';

type Persisted = Pick<
  SettingsState,
  'locale' | 'reducedMotion' | 'reducedMotionAuto' | 'muteAmbient' | 'muteUi' | 'muteGuide'
>;

function persist(state: SettingsState): void {
  if (typeof window === 'undefined') return;
  const payload: Persisted = {
    locale: state.locale,
    reducedMotion: state.reducedMotion,
    reducedMotionAuto: state.reducedMotionAuto,
    muteAmbient: state.muteAmbient,
    muteUi: state.muteUi,
    muteGuide: state.muteGuide,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Settings are non-critical; a storage failure must not break the session.
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  locale: DEFAULT_LOCALE,
  reducedMotion: false,
  reducedMotionAuto: true,
  muteAmbient: false,
  muteUi: false,
  muteGuide: false,
  showPerfOverlay: process.env.NODE_ENV === 'development',
  hydrated: false,

  setLocale: (locale) => {
    set({ locale });
    persist(get());
  },
  setReducedMotion: (reducedMotion) => {
    set({ reducedMotion, reducedMotionAuto: false });
    persist(get());
  },
  toggleAudio: (channel) => {
    if (channel === 'ambient') set((s) => ({ muteAmbient: !s.muteAmbient }));
    if (channel === 'ui') set((s) => ({ muteUi: !s.muteUi }));
    if (channel === 'guide') set((s) => ({ muteGuide: !s.muteGuide }));
    persist(get());
  },
  togglePerfOverlay: () => set((s) => ({ showPerfOverlay: !s.showPerfOverlay })),

  /**
   * Runs once on the client. Stored choices win; anything the user has not
   * chosen is detected from the device (quality) or the OS (reduced motion).
   */
  hydrate: () => {
    if (get().hydrated) return;
    let stored: Partial<Persisted> = {};
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) stored = JSON.parse(raw) as Partial<Persisted>;
    } catch {
      stored = {};
    }

    const reducedMotionAuto = stored.reducedMotionAuto ?? true;

    set({
      ...stored,
      reducedMotion: reducedMotionAuto ? prefersReducedMotion() : (stored.reducedMotion ?? false),
      reducedMotionAuto,
      hydrated: true,
    });
  },
}));
