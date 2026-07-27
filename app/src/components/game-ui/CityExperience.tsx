'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { buildScene } from '@/engine/scene/buildScene';
import { assetTierForProfile, qualityProfile } from '@/engine/quality/quality';
import type { HeroStatus } from '@/components/three/HeroCharacter';
import { onCityUnmount } from '@/engine/heroes/heroCache';
import { heroForGuide, isDelivered, type HeroId } from '@/engine/heroes/registry';
import {
  celebrationPlan,
  celebrationReducer,
  currentCelebrationClip,
  initialCelebration,
  type CelebrationContext,
} from '@/engine/heroes/celebration';
import { allowsCelebrationReplay, clipDurationCap, resolveClipName } from '@/engine/heroes/registry';
import {
  CAMERA_SETTLE_TIMEOUT_MS,
  CELEBRATION_TIMEOUT_MS,
  clipTimeoutFor,
} from '@/engine/heroes/watchdog';
import { useClientEnvironment } from '@/engine/quality/useEnvironment';
import { hotspotById, resolveInteractionType } from '@/engine/interactions/machine';
import { useKeyboardControls } from '@/engine/controls/inputState';
import { t, ui } from '@/content/i18n';
import { CityCanvas, type PerfSample } from '@/components/three/CityCanvas';
import { CityScene } from '@/components/three/CityScene';
import { Hud } from '@/components/game-ui/Hud';
import { IntroPanel } from '@/components/game-ui/IntroPanel';
import { InteractionPanel } from '@/components/game-ui/InteractionPanel';
import { FactCard } from '@/components/game-ui/FactCard';
import { RewardPanel } from '@/components/game-ui/RewardPanel';
import { QuizPanel } from '@/components/game-ui/QuizPanel';
import { CompletionPanel } from '@/components/game-ui/CompletionPanel';
import { SettingsPanel } from '@/components/game-ui/SettingsPanel';
import { TouchControls } from '@/components/game-ui/TouchControls';
import { PerfOverlay } from '@/components/game-ui/PerfOverlay';
import { ErrorScreen, LoadingScreen, NoWebglScreen } from '@/components/game-ui/StatusScreens';

export function CityExperience({ cityId }: { cityId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hydrate = useSettingsStore((state) => state.hydrate);
  const locale = useSettingsStore((state) => state.locale);
  const quality = useSettingsStore((state) => state.quality);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const status = useGameStore((state) => state.status);
  const city = useGameStore((state) => state.city);
  const progress = useGameStore((state) => state.progress);
  const interaction = useGameStore((state) => state.interaction);
  const phase = useGameStore((state) => state.phase);
  const quizIndex = useGameStore((state) => state.quizIndex);
  const errorMessage = useGameStore((state) => state.errorMessage);
  const errorIssues = useGameStore((state) => state.errorIssues);
  const settingsOpen = useGameStore((state) => state.settingsOpen);

  const enterCity = useGameStore((state) => state.enterCity);
  const leaveCity = useGameStore((state) => state.leaveCity);
  const skipIntro = useGameStore((state) => state.skipIntro);
  const dispatchInteraction = useGameStore((state) => state.dispatchInteraction);
  const claimReward = useGameStore((state) => state.claimReward);
  const openQuiz = useGameStore((state) => state.openQuiz);
  const answerQuiz = useGameStore((state) => state.answerQuiz);
  const toggleSettings = useGameStore((state) => state.toggleSettings);

  const [spin, setSpin] = useState(0);
  const [perf, setPerf] = useState<PerfSample | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const devOverlay = useSettingsStore((state) => state.showPerfOverlay);
  /**
   * `?debug=1` turns the telemetry overlay on in a production build.
   *
   * Without it the overlay is development-only, which meant the numbers could
   * never be read from the deployed site — exactly where they matter. It shows
   * nothing about the player and changes no behaviour.
   */
  const showPerfOverlay = devOverlay || searchParams.get('debug') === '1';
  const { webgl, coarsePointer } = useClientEnvironment();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const controller = new AbortController();
    void enterCity(cityId, controller.signal);
    return () => {
      controller.abort();
      leaveCity();
      // Deliberately keeps the active hero resident; see engine/heroes/heroCache.
      onCityUnmount();
    };
  }, [cityId, enterCity, leaveCity, retryToken]);

  const settings = useMemo(() => qualityProfile(quality), [quality]);
  const assetTier = useMemo(() => assetTierForProfile(quality), [quality]);
  const scene = useMemo(() => (city ? buildScene(city, assetTier) : null), [city, assetTier]);
  const [heroStatus, setHeroStatus] = useState<HeroStatus | null>(null);
  const [heroHeight, setHeroHeight] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<CelebrationContext>(initialCelebration);
  const [performanceToken, setPerformanceToken] = useState(0);
  /** A short one-shot beat after a stop or a correct answer, e.g. an approving nod. */
  const [successBeat, setSuccessBeat] = useState(0);
  const [successPending, setSuccessPending] = useState(false);
  const [loadingExpired, setLoadingExpired] = useState(false);

  /**
   * QA-only guide override: `/city/istanbul?guide=keloglan`.
   *
   * Canonical content decides which guide a city really has, and that order is
   * not touched. This exists so a delivered hero can be inspected in any scene
   * before its own city has one, and it is ignored for unknown values.
   */
  const guideOverride = searchParams.get('guide');
  const effectiveGuideId =
    guideOverride === 'keloglan' || guideOverride === 'nasreddin-hoca'
      ? (guideOverride as HeroId)
      : city?.guideId ?? 'nasreddin-hoca';
  const activeHero = heroForGuide(effectiveGuideId);

  /** The guide's own celebration plan; no per-character branching in the UI. */
  const plan = useMemo(() => celebrationPlan(activeHero), [activeHero]);
  const canReplay = allowsCelebrationReplay(activeHero) && !reducedMotion;

  const dispatchCelebration = useCallback(
    (event: Parameters<typeof celebrationReducer>[1]) => {
      setCelebration((current) =>
        celebrationReducer(current, event, { reducedMotion, planLength: plan.length }),
      );
    },
    [reducedMotion, plan.length],
  );

  const activeHotspot = useMemo(
    () => (city && interaction.hotspotId ? hotspotById(city, interaction.hotspotId) : undefined),
    [city, interaction.hotspotId],
  );

  const interactionKind = activeHotspot
    ? resolveInteractionType(activeHotspot.interaction.type)
    : null;

  // The celebration owns the screen: movement and hotspot input are locked.
  const celebrating = celebration.state !== 'idle';

  const panelOpen =
    celebration.inputLocked ||
    phase !== 'explore' ||
    settingsOpen ||
    ['entering', 'active', 'retry', 'success', 'reward'].includes(interaction.state);

  // The keyboard drives the player only when no panel owns it.
  useKeyboardControls(phase === 'explore' && !panelOpen);

  const focus =
    activeHotspot && ['entering', 'active', 'retry', 'success'].includes(interaction.state)
      ? {
          position: activeHotspot.camera.position as [number, number, number],
          target: activeHotspot.camera.target as [number, number, number],
          durationMs: reducedMotion ? 0 : activeHotspot.camera.durationMs,
        }
      : null;

  const onNearestChange = useCallback(
    (hotspotId: string | null) => {
      if (!hotspotId) {
        dispatchInteraction({ type: 'HOTSPOT_OUT_OF_RANGE' });
        return;
      }
      dispatchInteraction({ type: 'HOTSPOT_IN_RANGE', hotspotId });
      /**
       * Arriving at an unfinished stop starts it.
       *
       * A six-year-old should not have to notice a button for the world to
       * respond to walking up to something. Reaching the ring freezes movement,
       * moves the camera onto the object and opens the panel. Finished stops do
       * not re-trigger; the prompt button is still there if they want another
       * look.
       */
      if (!progress.completedHotspotIds.includes(hotspotId)) {
        dispatchInteraction({ type: 'BEGIN' });
      }
    },
    [dispatchInteraction, progress.completedHotspotIds],
  );

  /**
   * The last correct answer both completes the city and starts the
   * celebration. Progress is written first and awaited, so a dance that never
   * finishes cannot cost the child the province star.
   */
  const playSuccessBeat = useCallback(() => {
    if (!activeHero.successClip) return;
    setSuccessPending(true);
    setSuccessBeat((token) => token + 1);
  }, [activeHero.successClip]);

  const finishQuizAnswer = useCallback(async () => {
    const wasLast = quizIndex + 1 >= (city?.quiz.length ?? 0);
    playSuccessBeat();
    await answerQuiz(true);
    if (!wasLast) return;
    dispatchCelebration({ type: 'CITY_COMPLETED' });
    dispatchCelebration({ type: 'PROGRESS_SAVED' });
  }, [answerQuiz, city?.quiz.length, quizIndex, dispatchCelebration, playSuccessBeat]);

  /**
   * What the guide is performing right now: a celebration step, or the short
   * success beat after a stop or a correct answer. Both are one-shot.
   */
  const celebrationClip = currentCelebrationClip(celebration, plan);
  const performingClip =
    celebrationClip ?? (successPending ? (activeHero.successClip ?? null) : null);

  // A real progress state, so the player never stares at an empty canvas.
  const heroLoadingRaw =
    isDelivered(activeHero) && status === 'ready' && phase !== 'intro' && heroStatus?.state !== 'ready';

  /**
   * The "getting ready" chip is a promise that something is coming. If the
   * model never arrives, the promise has to expire rather than hang there.
   */
  useEffect(() => {
    if (!heroLoadingRaw) return;
    // Only the timer writes state; the reset happens by keying off the city.
    const timer = window.setTimeout(() => setLoadingExpired(true), 15_000);
    return () => window.clearTimeout(timer);
  }, [heroLoadingRaw, cityId]);

  const onClipFinished = useCallback(() => {
    if (celebration.state === 'performing') {
      dispatchCelebration({ type: 'CLIP_FINISHED' });
      return;
    }
    setSuccessPending(false);
  }, [celebration.state, dispatchCelebration]);

  /**
   * Watchdog: the camera reports when it reaches the hotspot anchor. If that
   * report never arrives the interaction sits in `entering` forever with input
   * locked and no panel — a silent freeze. Open it anyway.
   */
  useEffect(() => {
    if (interaction.state !== 'entering') return;
    const timer = window.setTimeout(() => {
      dispatchInteraction({ type: 'CAMERA_SETTLED' });
    }, CAMERA_SETTLE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [interaction.state, interaction.hotspotId, dispatchInteraction]);

  /**
   * Watchdog: a one-shot beat ends when the mixer says so. A placeholder guide
   * has no mixer at all, so without this the completion sequence never reaches
   * the summary panel and the city can never be finished.
   */
  useEffect(() => {
    if (celebration.state !== 'performing') return;
    const clip = currentCelebrationClip(celebration, plan);
    const clipName = clip ? resolveClipName(activeHero, clip) : null;
    const budget = clipName ? clipTimeoutFor(clipDurationCap(activeHero, clipName)) : 1_000;
    const timer = window.setTimeout(() => {
      dispatchCelebration({ type: 'CLIP_FINISHED' });
    }, budget);
    return () => window.clearTimeout(timer);
  }, [celebration, plan, activeHero, dispatchCelebration]);

  /** Backstop for the whole sequence, whatever went wrong inside it. */
  useEffect(() => {
    if (celebration.state === 'idle' || celebration.state === 'summary') return;
    const timer = window.setTimeout(() => {
      dispatchCelebration({ type: 'SKIP' });
    }, CELEBRATION_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [celebration.state, dispatchCelebration]);

  /** The success nod is cosmetic; never let a missing mixer strand it. */
  useEffect(() => {
    if (!successPending) return;
    const timer = window.setTimeout(() => setSuccessPending(false), clipTimeoutFor(null));
    return () => window.clearTimeout(timer);
  }, [successPending, successBeat]);

  const onFocusSettled = useCallback(() => {
    dispatchInteraction({ type: 'CAMERA_SETTLED' });
  }, [dispatchInteraction]);

  const onAnswer = useCallback(
    (correct: boolean) => {
      dispatchInteraction({ type: 'ANSWER', correct });
      if (!correct) {
        window.setTimeout(() => dispatchInteraction({ type: 'RETRY' }), 350);
      }
    },
    [dispatchInteraction],
  );

  // Once every hotspot is done the quiz gate opens on its own.
  useEffect(() => {
    if (!city || phase !== 'explore') return;
    if (interaction.state !== 'idle' && interaction.state !== 'complete') return;
    if (progress.completedHotspotIds.length < city.hotspots.length) return;
    if (progress.quizCompleted) return;
    openQuiz();
  }, [city, phase, interaction.state, progress.completedHotspotIds.length, progress.quizCompleted, openQuiz]);

  if (status === 'loading' || status === 'idle') {
    return <LoadingScreen locale={locale} cityId={cityId} />;
  }

  if (status === 'error') {
    return (
      <ErrorScreen
        locale={locale}
        message={errorMessage ?? 'unknown'}
        issues={errorIssues}
        onRetry={() => setRetryToken((token) => token + 1)}
        onLeave={() => router.push('/map')}
      />
    );
  }

  if (!city || !scene) return <LoadingScreen locale={locale} cityId={cityId} />;

  if (!webgl) {
    return <NoWebglScreen locale={locale} cityName={t(city.name, locale)} onLeave={() => router.push('/map')} />;
  }

  const quizItem = city.quiz[quizIndex];
  const heroLoading = heroLoadingRaw && !loadingExpired;

  return (
    <main style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
      <CityCanvas
        quality={settings}
        skyColor={scene.sky.top}
        onPerfSample={showPerfOverlay ? setPerf : undefined}
      >
        <CityScene
          scene={scene}
          quality={settings}
          guideId={effectiveGuideId}
          heroReady={status === 'ready' && phase !== 'intro'}
          interacting={['active', 'retry', 'success'].includes(interaction.state)}
          performing={performingClip}
          framingCelebration={celebration.state === 'framing'}
          onCelebrationFramed={() => dispatchCelebration({ type: 'CAMERA_FRAMED' })}
          onClipFinished={onClipFinished}
          performanceToken={performanceToken + successBeat}
          onHeroStatus={setHeroStatus}
          onHeroMeasured={setHeroHeight}
          reducedMotion={reducedMotion}
          frozen={panelOpen}
          completedHotspotIds={progress.completedHotspotIds}
          activeHotspotId={interaction.hotspotId}
          focus={focus}
          onFocusSettled={onFocusSettled}
          onNearestChange={onNearestChange}
          inspect={
            activeHotspot &&
            interactionKind?.resolved === 'inspect-and-find' &&
            ['active', 'retry'].includes(interaction.state)
              ? {
                  hotspotId: activeHotspot.id,
                  targetId: activeHotspot.interaction.targetId,
                  spin,
                  onPick: (pickedId) => onAnswer(pickedId === activeHotspot.interaction.targetId),
                }
              : null
          }
        />
      </CityCanvas>

      <Hud
        cityName={t(city.name, locale)}
        locale={locale}
        completed={progress.completedHotspotIds.length}
        total={city.hotspots.length}
        collected={progress.collectedRewardIds.length}
        prompt={
          interaction.state === 'available' && activeHotspot
            ? `${ui('interact', locale)} — ${t(activeHotspot.fact.title, locale)}`
            : null
        }
        onSettings={() => toggleSettings(true)}
        onLeave={() => router.push('/map')}
        onInteract={() => dispatchInteraction({ type: 'BEGIN' })}
      />

      {coarsePointer && !panelOpen && phase === 'explore' ? (
        <TouchControls />
      ) : null}

      {showPerfOverlay ? (
        <PerfOverlay
          sample={perf}
          profile={settings}
          hero={heroStatus}
          interactionState={interaction.state}
          celebrationState={celebration.state}
          heroHeightMeters={heroHeight}
        />
      ) : null}

      {phase === 'intro' && city.intro ? (
        <IntroPanel city={city} locale={locale} onStart={skipIntro} />
      ) : null}

      {phase === 'explore' && activeHotspot && interactionKind && ['active', 'retry'].includes(interaction.state) ? (
        <InteractionPanel
          hotspot={activeHotspot}
          resolvedType={interactionKind.resolved}
          degraded={interactionKind.degraded}
          attempts={interaction.attempts}
          locale={locale}
          onAnswer={onAnswer}
          onRotate={(direction) => setSpin((value) => value + direction * (Math.PI / 4))}
        />
      ) : null}

      {phase === 'explore' && activeHotspot && interaction.state === 'success' ? (
        <FactCard
          hotspot={activeHotspot}
          locale={locale}
          onContinue={() => {
            playSuccessBeat();
            void claimReward();
          }}
        />
      ) : null}

      {phase === 'explore' && activeHotspot && interaction.state === 'reward' ? (
        <RewardPanel
          rewardId={activeHotspot.reward.assetId}
          locale={locale}
          quality={assetTier}
          onContinue={() => dispatchInteraction({ type: 'DISMISS' })}
        />
      ) : null}

      {phase === 'quiz' && quizItem ? (
        <QuizPanel
          key={quizItem.id}
          item={quizItem}
          index={quizIndex}
          total={city.quiz.length}
          locale={locale}
          onCorrect={() => void finishQuizAnswer()}
        />
      ) : null}

      {/* `idle` covers re-entering an already finished city: summary, no dance. */}
      {phase === 'complete' && (celebration.state === 'summary' || celebration.state === 'idle') ? (
        <CompletionPanel
          city={city}
          collectedRewardIds={progress.collectedRewardIds}
          locale={locale}
          onLeave={() => router.push('/map')}
          onAnotherDance={
            canReplay
              ? () => {
                  setPerformanceToken((token) => token + 1);
                  dispatchCelebration({ type: 'REPLAY' });
                }
              : undefined
          }
        />
      ) : null}

      {celebrating && celebration.state !== 'summary' ? (
        <p
          role="status"
          style={{
            position: 'absolute',
            bottom: 'clamp(18px, 5vh, 44px)',
            left: '50%',
            transform: 'translateX(-50%)',
            margin: 0,
            padding: '10px 18px',
            borderRadius: 999,
            background: 'var(--surface)',
            fontWeight: 650,
          }}
        >
          {ui('cityComplete', locale)} ★
        </p>
      ) : null}

      {heroLoading ? (
        <p
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 'clamp(60px, 12vh, 110px)',
            transform: 'translateX(-50%)',
            margin: 0,
            padding: '8px 16px',
            borderRadius: 999,
            background: 'var(--surface)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {activeHero.displayName} {ui('preparingGuide', locale)}…
        </p>
      ) : null}

      {settingsOpen ? <SettingsPanel /> : null}
    </main>
  );
}
