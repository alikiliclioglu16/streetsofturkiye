'use client';

import { create } from 'zustand';
import type { RuntimeCity as CityDefinition } from '@/content/compose';
import { ContentError, loadCity } from '@/content/loaders/loadCity';
import {
  initialInteractionContext,
  interactionReducer,
  type InteractionContext,
  type InteractionEvent,
} from '@/engine/interactions/machine';
import { progressRepository } from '@/engine/progress/localStorageRepository';
import {
  emptyCityProgress,
  emptyProfile,
  type CityProgress,
  type PlayerProfile,
} from '@/engine/progress/types';
import {
  completeHotspot,
  completeQuiz,
  quizUnlocked,
  recordCityCompletion,
  recordVisit,
} from '@/engine/progress/rules';

export type SessionStatus = 'idle' | 'loading' | 'ready' | 'error';
export type CityPhase = 'intro' | 'explore' | 'quiz' | 'complete';

interface GameState {
  status: SessionStatus;
  errorMessage: string | null;
  errorIssues: string[];
  city: CityDefinition | null;
  progress: CityProgress;
  profile: PlayerProfile;
  interaction: InteractionContext;
  phase: CityPhase;
  quizIndex: number;
  saveWarning: boolean;
  settingsOpen: boolean;

  enterCity: (cityId: string, signal?: AbortSignal) => Promise<void>;
  leaveCity: () => void;
  skipIntro: () => void;
  dispatchInteraction: (event: InteractionEvent) => void;
  claimReward: () => Promise<void>;
  answerQuiz: (correct: boolean) => Promise<void>;
  openQuiz: () => void;
  toggleSettings: (open?: boolean) => void;
  loadProfile: () => Promise<void>;
  resetAllProgress: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'idle',
  errorMessage: null,
  errorIssues: [],
  city: null,
  progress: emptyCityProgress('unknown'),
  profile: emptyProfile(),
  interaction: initialInteractionContext,
  phase: 'intro',
  quizIndex: 0,
  saveWarning: false,
  settingsOpen: false,

  enterCity: async (cityId, signal) => {
    set({ status: 'loading', errorMessage: null, errorIssues: [], city: null });
    try {
      const city = await loadCity(cityId, signal);
      if (signal?.aborted) return;

      const [profile, stored] = await Promise.all([
        progressRepository.loadProfile(),
        progressRepository.loadCityProgress(cityId),
      ]);
      if (signal?.aborted) return;

      const progress = stored ?? emptyCityProgress(cityId);
      const nextProfile = recordVisit(profile, cityId);
      await progressRepository.saveProfile(nextProfile);

      set({
        status: 'ready',
        city,
        progress,
        profile: nextProfile,
        interaction: initialInteractionContext,
        phase: progress.cityCompleted ? 'complete' : 'intro',
        quizIndex: 0,
      });
    } catch (error) {
      if (signal?.aborted) return;
      const contentError = error instanceof ContentError ? error : null;
      set({
        status: 'error',
        errorMessage: contentError?.message ?? (error as Error).message,
        errorIssues: contentError?.issues ?? [],
      });
    }
  },

  leaveCity: () =>
    set({
      status: 'idle',
      city: null,
      interaction: initialInteractionContext,
      phase: 'intro',
      quizIndex: 0,
      progress: emptyCityProgress('unknown'),
    }),

  skipIntro: () => set({ phase: 'explore' }),

  dispatchInteraction: (event) => {
    const { interaction, phase } = get();
    if (phase !== 'explore') return;
    const next = interactionReducer(interaction, event);
    if (next !== interaction) set({ interaction: next });
  },

  /**
   * Reward is granted once, from the store, after the interaction succeeded.
   * Re-entering a completed hotspot re-runs this without duplicating anything.
   */
  claimReward: async () => {
    const { city, progress, interaction, profile } = get();
    if (!city || !interaction.hotspotId) return;

    const hotspot = city.hotspots.find((item) => item.id === interaction.hotspotId);
    if (!hotspot) return;

    const nextProgress = completeHotspot(progress, hotspot.id, hotspot.reward.assetId);
    set({
      progress: nextProgress,
      interaction: interactionReducer(interaction, { type: 'CLAIM_REWARD' }),
    });

    await progressRepository.saveCityProgress(nextProgress);
    if (profile.displayName === null) await progressRepository.saveProfile(profile);
  },

  openQuiz: () => {
    const { city, progress } = get();
    if (!city || !quizUnlocked(city, progress)) return;
    set({ phase: 'quiz', quizIndex: 0, interaction: initialInteractionContext });
  },

  /** Advances through the quiz; the city completes only after the last item. */
  answerQuiz: async (correct) => {
    if (!correct) return;
    const { city, progress, profile, quizIndex } = get();
    if (!city) return;

    const nextIndex = quizIndex + 1;
    if (nextIndex < city.quiz.length) {
      set({ quizIndex: nextIndex });
      return;
    }

    const nextProgress = completeQuiz(city, progress);
    const nextProfile = recordCityCompletion(profile, city);
    set({ progress: nextProgress, profile: nextProfile, phase: 'complete' });

    await progressRepository.saveCityProgress(nextProgress);
    await progressRepository.saveProfile(nextProfile);
  },

  toggleSettings: (open) => set((state) => ({ settingsOpen: open ?? !state.settingsOpen })),

  loadProfile: async () => {
    const profile = await progressRepository.loadProfile();
    set({ profile });
  },

  resetAllProgress: async () => {
    await progressRepository.clear();
    set({
      profile: emptyProfile(),
      progress: emptyCityProgress(get().city?.id ?? 'unknown'),
      interaction: initialInteractionContext,
      phase: 'intro',
      quizIndex: 0,
    });
  },
}));
