'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { buildScene } from '@/engine/scene/buildScene';
import { assetTier, qualitySettings } from '@/engine/quality/quality';
import type { HeroStatus } from '@/components/three/HeroCharacter';
import { onCityUnmount } from '@/engine/heroes/heroCache';
import { heroForGuide, isDelivered, type HeroId } from '@/engine/heroes/registry';
import {
  BEAT_MS,
  FRAMING_MS,
  celebrationPlan,
  celebrationReducer,
  currentCelebrationClip,
  initialCelebration,
  type CelebrationContext,
} from '@/engine/heroes/celebration';
import { CAMERA_SETTLE_TIMEOUT_MS, CELEBRATION_TIMEOUT_MS } from '@/engine/heroes/watchdog';
import { useClientEnvironment } from '@/engine/quality/useEnvironment';
import { hotspotById } from '@/engine/interactions/machine';
import { useKeyboardControls } from '@/engine/controls/inputState';
import { loadPresentation } from '@/content/loaders/loadCity';
import { unlockAudio, stopAudio } from '@/engine/audio/engine';
import { speak, stopSpeaking, stopNarration } from '@/engine/audio/speech';
import {
  playCollect,
  playCityComplete,
  startMusic,
  stopMusic,
} from '@/engine/audio/cues';
import { t, ui } from '@/content/i18n';
import type { Presentation } from '@/content/schemas/presentation';
import { CityCanvas, type PerfSample } from '@/components/three/CityCanvas';
import { CityScene } from '@/components/three/CityScene';
import { Hud } from '@/components/game-ui/Hud';
import { IntroPanel } from '@/components/game-ui/IntroPanel';
import { FactCard } from '@/components/game-ui/FactCard';
import { CaptionOverlay } from '@/components/game-ui/CaptionOverlay';
import { SkipButton } from '@/components/game-ui/SkipButton';
import { loadTimeWindows, windowForStop } from '@/content/loaders/loadTimeWindows';
import type { CityTimeWindows } from '@/content/schemas/timewindow';
import { windowEligibility } from '@/engine/timewindow/eligibility';
import { ambienceLevel, musicLevel } from '@/engine/audio/engine';
import { useTimeWindow } from '@/engine/timewindow/useTimeWindow';
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
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const status = useGameStore((state) => state.status);
  const city = useGameStore((state) => state.city);
  const progress = useGameStore((state) => state.progress);
  const interaction = useGameStore((state) => state.interaction);
  const phase = useGameStore((state) => state.phase);
  const resumeExploring = useGameStore((state) => state.resumeExploring);
  const reviewCompletion = useGameStore((state) => state.reviewCompletion);
  const quizIndex = useGameStore((state) => state.quizIndex);
  const errorMessage = useGameStore((state) => state.errorMessage);
  const errorIssues = useGameStore((state) => state.errorIssues);
  const settingsOpen = useGameStore((state) => state.settingsOpen);

  const enterCity = useGameStore((state) => state.enterCity);
  const leaveCity = useGameStore((state) => state.leaveCity);
  const skipIntro = useGameStore((state) => state.skipIntro);
  const dispatchInteraction = useGameStore((state) => state.dispatchInteraction);
  const claimReward = useGameStore((state) => state.claimReward);
  const markWindowWatched = useGameStore((state) => state.markWindowWatched);
  const openQuiz = useGameStore((state) => state.openQuiz);
  const answerQuiz = useGameStore((state) => state.answerQuiz);
  const toggleSettings = useGameStore((state) => state.toggleSettings);

  const [perf, setPerf] = useState<PerfSample | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  /**
   * The city's Time Windows, if it has any.
   *
   * Loaded beside the city rather than with it, and failing softly: one city
   * out of nineteen has windows today, and a city without them is the normal
   * case rather than an error. A malformed file does throw, and is reported
   * here rather than swallowed — a stop that silently loses its window would
   * look finished while doing nothing.
   */
  const [timeWindows, setTimeWindows] = useState<CityTimeWindows | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    loadTimeWindows(cityId, controller.signal)
      .then((loaded) => {
        if (!controller.signal.aborted) setTimeWindows(loaded);
      })
      .catch((cause: Error) => {
        if (!controller.signal.aborted) console.warn('[timewindow]', cause.message);
      });
    return () => controller.abort();
  }, [cityId]);
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

  const settings = qualitySettings();
  const tier = assetTier();
  const scene = useMemo(() => (city ? buildScene(city, tier) : null), [city, tier]);
  const [heroStatus, setHeroStatus] = useState<HeroStatus | null>(null);
  const [heroHeight, setHeroHeight] = useState<number | null>(null);
  const [heroDraws, setHeroDraws] = useState<{ meshes: number; perFrame: number } | null>(null);
  const [heroMotion, setHeroMotion] = useState<{ weight: number; advancing: boolean; revivals: number } | null>(null);
  const [presentation, setPresentation] = useState<Presentation | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadPresentation(controller.signal)
      .then(setPresentation)
      .catch(() => {
        // Badges and the welcome degrade to plain text; the city still plays.
      });
    return () => controller.abort();
  }, []);
  const [celebration, setCelebration] = useState<CelebrationContext>(initialCelebration);
  /**
   * Forces a one-shot to re-run when the state has not changed.
   *
   * It used to be bumped by the "another dance" button as well; that button is
   * gone with the dance (D-113), and this is now only touched by the
   * celebration itself.
   */
  const [performanceToken] = useState(0);
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


  // The celebration owns the screen: movement and hotspot input are locked.
  const celebrating = celebration.state !== 'idle';

  const panelOpen =
    celebration.inputLocked ||
    phase !== 'explore' ||
    settingsOpen ||
    ['entering', 'active', 'retry', 'success', 'reward'].includes(interaction.state);

  // The keyboard drives the player only when no panel owns it.
  useKeyboardControls(phase === 'explore' && !panelOpen);

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
   * celebration. Progress is written first and awaited, so a performance that never
   * finishes cannot cost the child the province star.
   */
  const finishQuizAnswer = useCallback(async () => {
    const wasLast = quizIndex + 1 >= (city?.quiz.length ?? 0);
    await answerQuiz(true);
    if (!wasLast) return;
    playCityComplete();
    dispatchCelebration({ type: 'CITY_COMPLETED' });
    dispatchCelebration({ type: 'PROGRESS_SAVED' });
  }, [answerQuiz, city?.quiz.length, quizIndex, dispatchCelebration]);

  /**
   * The only one-shot the guide performs is the city celebration. Stops present
   * and hand over the collectible; they do not applaud.
   */
  const celebrationClip = currentCelebrationClip(celebration, plan);
  const performingClip = celebrationClip;

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
    const timer = window.setTimeout(() => {
      dispatchCelebration({ type: 'CLIP_FINISHED' });
    }, BEAT_MS);
    return () => window.clearTimeout(timer);
  }, [celebration.state, celebration.step, dispatchCelebration]);

  /**
   * The camera reports when it has framed the guide. If that report is late or
   * never comes, the celebration must still happen — the earlier backstop
   * skipped straight to the summary, so a stalled camera meant no celebration
   * at all.
   */
  useEffect(() => {
    if (celebration.state !== 'framing') return;
    const timer = window.setTimeout(() => {
      dispatchCelebration({ type: 'CAMERA_FRAMED' });
    }, FRAMING_MS);
    return () => window.clearTimeout(timer);
  }, [celebration.state, dispatchCelebration]);

  /** Backstop for the whole sequence, whatever went wrong inside it. */
  useEffect(() => {
    if (celebration.state === 'idle' || celebration.state === 'summary') return;
    const timer = window.setTimeout(() => {
      dispatchCelebration({ type: 'SKIP' });
    }, CELEBRATION_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [celebration.state, dispatchCelebration]);

  /**
   * Collecting is the whole interaction: read, take the item, walk on. The
   * machine still passes through its states so progress and the guide's nod
   * stay in step, but the player only ever sees one panel.
   */
  /**
   * The intro button is the one gesture the browser needs before it will let
   * anything make a sound. Opening the context any earlier leaves it suspended
   * for the whole session, which is silence with nothing to explain it.
   */
  const musicUrl = scene?.musicUrl ?? null;

  /**
   * Sound needs a gesture, and a finished city has no intro button to give one.
   *
   * Re-entering a completed city goes straight to the street, so the first
   * touch or key press anywhere becomes the gesture instead. Without this, a
   * child revisiting a city they had finished would find it silent with nothing
   * to explain why.
   */
  const audioStarted = useRef(false);
  const startAudioOnce = useCallback(() => {
    if (audioStarted.current) return;
    audioStarted.current = true;
    void unlockAudio().then((ready) => {
      if (!ready) return;
      if (musicUrl) startMusic(musicUrl);
    });
  }, [musicUrl]);

  useEffect(() => {
    if (phase === 'intro') return;
    const open = () => startAudioOnce();
    window.addEventListener('pointerdown', open, { once: true });
    window.addEventListener('keydown', open, { once: true });
    return () => {
      window.removeEventListener('pointerdown', open);
      window.removeEventListener('keydown', open);
    };
  }, [phase, startAudioOnce]);

  const beginCity = useCallback(() => {
    startAudioOnce();
    skipIntro();
  }, [skipIntro, startAudioOnce]);

  useEffect(
    () => () => {
      stopSpeaking();
      stopMusic();
      stopAudio();
    },
    [],
  );

  /**
   * The guide reads the stop aloud as it opens.
   *
   * Keyed on the hotspot rather than on the panel's own state, so walking on to
   * the next stop replaces the line instead of queueing behind it.
   */
  const narratedHotspotId = useRef<string | null>(null);
  useEffect(() => {
    const open = ['entering', 'active'].includes(interaction.state);
    if (!open || !activeHotspot) {
      if (narratedHotspotId.current) {
        stopSpeaking();
        narratedHotspotId.current = null;
      }
      return;
    }
    if (narratedHotspotId.current === activeHotspot.id) return;
    narratedHotspotId.current = activeHotspot.id;
    speak(
      stopNarration({
        guideLine: t(activeHotspot.fact.guideLine, locale),
        title: t(activeHotspot.fact.title, locale),
        description: t(activeHotspot.fact.body, locale),
      }),
    );
  }, [interaction.state, activeHotspot, locale]);

  /**
   * Does this stop play a Time Window, or show the card?
   *
   * One answer, read from one place. `windowEligibility` folds together the
   * three reasons a window does not run — no window written, reduced motion,
   * or an asset still graybox — so there is never a second opinion about it
   * somewhere else in the tree.
   */
  const activeWindow = useMemo(
    () => windowForStop(timeWindows, activeHotspot?.stopId ?? null),
    [timeWindows, activeHotspot?.stopId],
  );
  const eligibility = useMemo(
    () => windowEligibility(activeWindow, { reducedMotion }),
    [activeWindow, reducedMotion],
  );

  /**
   * A finished stop does not replay on its own.
   *
   * Walking back through a ring you have already completed should not take the
   * controls away again; the window is offered rather than imposed.
   */
  const stopCompleted = activeHotspot
    ? progress.completedHotspotIds.includes(activeHotspot.id)
    : false;

  const collectFromStop = useCallback(() => {
    playCollect();
    dispatchInteraction({ type: 'ANSWER', correct: true });
    void claimReward().then(() => dispatchInteraction({ type: 'DISMISS' }));
  }, [dispatchInteraction, claimReward]);

  const onFocusSettled = useCallback(() => {
    dispatchInteraction({ type: 'CAMERA_SETTLED' });
  }, [dispatchInteraction]);

  /**
   * The window runner.
   *
   * `sources` and `targets` are read as functions rather than captured as
   * values, because they are called at start and restore time — which, for a
   * route change, is after this component has begun tearing down. A captured
   * object would be a snapshot of the wrong moment.
   *
   * The camera is not in either list: `PlayerRig` already restores it the frame
   * `focus` goes null, and a second writer would fight it. Everything else a
   * window can touch is.
   */
  const windowSources = useCallback(
    () => ({
      camera: null,
      lights: {},
      colours: {
        sky: { top: scene?.sky.top ?? '', horizon: scene?.sky.horizon ?? '' },
        water: scene?.water?.color ?? null,
        ground: scene?.ground.color ?? '',
      },
      audio: { music: musicLevel(), ambience: ambienceLevel() },
      hudVisible: true,
      controlsEnabled: true,
    }),
    [scene],
  );
  const windowTargets = useCallback(
    () => ({
      camera: null,
      lights: {},
      objects: {},
      materials: {},
      setColours: () => {},
      setAudio: () => {},
      setHudVisible: () => {},
      setControlsEnabled: () => {},
    }),
    [],
  );

  const onWindowComplete = useCallback(() => {
    if (!activeHotspot) return;
    markWindowWatched(activeHotspot.stopId);
    // The one reward path. A completed window pays exactly what the card does.
    collectFromStop();
  }, [activeHotspot, markWindowWatched, collectFromStop]);

  const onWindowCancel = useCallback(() => {
    // Nothing is earned, and the stop stays open for another try.
    dispatchInteraction({ type: 'DISMISS' });
  }, [dispatchInteraction]);

  const runner = useTimeWindow({
    window: eligibility.eligible ? activeWindow : null,
    sources: windowSources,
    targets: windowTargets,
    onComplete: onWindowComplete,
    onCancel: onWindowCancel,
  });

  /**
   * Auto-play on the first visit only.
   *
   * A stop already completed offers the window instead of imposing it; that
   * offer is the prompt button the street already has, so nothing new appears
   * on screen for it.
   */
  const windowRunning = runner.context.state === 'playing' || runner.context.state === 'starting';
  useEffect(() => {
    if (!eligibility.eligible || stopCompleted) return;
    if (interaction.state !== 'active') return;
    if (runner.context.state !== 'idle') return;
    runner.start();
  }, [eligibility.eligible, stopCompleted, interaction.state, runner]);

  /**
   * Where the camera looks.
   *
   * The stop's authored anchor, except while a Time Window is running — then
   * the window's own `camera` block supplies a wider, higher framing, built
   * from the same target the stop already names so it cannot be pointed at a
   * coordinate that holds nothing.
   *
   * `PlayerRig` lerps to whatever this is and restores the follow rig when it
   * goes null, which is why a window needs no camera code of its own and why
   * the camera is not in the snapshot: the rig already puts it back.
   */
  const focus = (() => {
    if (!activeHotspot) return null;
    if (windowRunning && activeWindow) {
      const [ox, oy, oz] = activeWindow.camera.offset;
      const anchor = activeHotspot.transform.position as [number, number, number];
      const target: [number, number, number] = [anchor[0] + ox, anchor[1] + oy, anchor[2] + oz];
      return {
        // Pulled back along +z and lifted, so the square and the sky are both in.
        position: [
          target[0] + 1.5,
          target[1] + activeWindow.camera.height,
          target[2] + activeWindow.camera.distance,
        ] as [number, number, number],
        target,
        durationMs: reducedMotion ? 0 : 1400,
      };
    }
    if (['entering', 'active', 'retry', 'success'].includes(interaction.state)) {
      return {
        position: activeHotspot.camera.position as [number, number, number],
        target: activeHotspot.camera.target as [number, number, number],
        durationMs: reducedMotion ? 0 : activeHotspot.camera.durationMs,
      };
    }
    return null;
  })();



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
          timeWindow={
            windowRunning && activeWindow && runner.snapshot
              ? {
                  data: activeWindow,
                  elapsed: runner.elapsed,
                  snapshot: runner.snapshot,
                  registry: runner.registry,
                }
              : null
          }
          scene={scene}
          quality={settings}
          guideId={effectiveGuideId}
          heroReady={status === 'ready' && phase !== 'intro'}
          interacting={['active', 'retry', 'success'].includes(interaction.state)}
          performing={performingClip}
          performanceLocked={celebrationClip !== null}
          framingCelebration={celebration.state === 'framing'}
          onCelebrationFramed={() => dispatchCelebration({ type: 'CAMERA_FRAMED' })}
          performanceToken={performanceToken}
          onHeroStatus={setHeroStatus}
          onHeroMeasured={setHeroHeight}
          onHeroDrawCount={setHeroDraws}
          onHeroMotion={setHeroMotion}
          reducedMotion={reducedMotion}
          frozen={panelOpen}
          completedHotspotIds={progress.completedHotspotIds}
          activeHotspotId={interaction.hotspotId}
          focus={focus}
          onFocusSettled={onFocusSettled}
          onNearestChange={onNearestChange}
        />
      </CityCanvas>

      <Hud
        onReviewCompletion={progress.cityCompleted ? reviewCompletion : undefined}
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
          heroDraws={heroDraws}
          heroMotion={heroMotion}
        />
      ) : null}

      {phase === 'intro' && city.intro ? (
        <IntroPanel
          city={city}
          locale={locale}
          presentation={presentation}
          onStart={beginCity}
        />
      ) : null}

      {/*
        The fact card, for every stop the window does not take.

        Three cases reach it and all three are designed rather than residual:
        a stop with no window written yet, a player with reduced motion on, and
        a stop whose art is still graybox. It is also what a replayed stop
        shows, so walking back through a finished ring still says what it was.
      */}
      {phase === 'explore' &&
      activeHotspot &&
      !windowRunning &&
      (!eligibility.eligible || stopCompleted) &&
      ['active', 'retry', 'success', 'reward'].includes(interaction.state) ? (
        <FactCard
          hotspot={activeHotspot}
          locale={locale}
          presentation={presentation}
          onCollect={collectFromStop}
        />
      ) : null}

      {windowRunning ? (
        <>
          <CaptionOverlay
            text={runner.caption?.text ?? null}
            locale={locale}
            visible={runner.caption?.visible ?? false}
          />
          <SkipButton visible={runner.canSkip} locale={locale} onSkip={() => runner.cancel('skip')} />
        </>
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

      {/* `idle` covers re-entering a finished city: the summary, with no beat. */}
      {phase === 'complete' && (celebration.state === 'summary' || celebration.state === 'idle') ? (
        <CompletionPanel
          onKeepExploring={resumeExploring}
          city={city}
          collectedRewardIds={progress.collectedRewardIds}
          locale={locale}
          onLeave={() => router.push('/map')}
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
