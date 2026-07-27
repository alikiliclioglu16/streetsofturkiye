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
  celebrationReducer,
  initialCelebration,
  type CelebrationContext,
} from '@/engine/heroes/celebration';
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
  const controlMode = useSettingsStore((state) => state.controlMode);

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
  const showPerfOverlay = useSettingsStore((state) => state.showPerfOverlay);
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
  const [celebration, setCelebration] = useState<CelebrationContext>(initialCelebration);
  const [danceToken, setDanceToken] = useState(0);

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

  const hasDanceClips = activeHero.animation.danceClips.length > 0;
  const dispatchCelebration = useCallback(
    (event: Parameters<typeof celebrationReducer>[1]) => {
      setCelebration((current) =>
        celebrationReducer(current, event, { reducedMotion, hasDanceClips }),
      );
    },
    [reducedMotion, hasDanceClips],
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
  useKeyboardControls(phase === 'explore' && !panelOpen && controlMode === 'explore');

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
      dispatchInteraction(
        hotspotId
          ? { type: 'HOTSPOT_IN_RANGE', hotspotId }
          : { type: 'HOTSPOT_OUT_OF_RANGE' },
      );
    },
    [dispatchInteraction],
  );

  /**
   * The last correct answer both completes the city and starts the
   * celebration. Progress is written first and awaited, so a dance that never
   * finishes cannot cost the child the province star.
   */
  const finishQuizAnswer = useCallback(async () => {
    const wasLast = quizIndex + 1 >= (city?.quiz.length ?? 0);
    await answerQuiz(true);
    if (!wasLast) return;
    dispatchCelebration({ type: 'CITY_COMPLETED' });
    dispatchCelebration({ type: 'PROGRESS_SAVED' });
  }, [answerQuiz, city?.quiz.length, quizIndex, dispatchCelebration]);

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
  // A real progress state, so the player never stares at an empty canvas.
  const heroLoading =
    isDelivered(activeHero) && status === 'ready' && phase !== 'intro' && heroStatus?.state !== 'ready';

  return (
    <main style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
      <CityCanvas quality={settings} onPerfSample={showPerfOverlay ? setPerf : undefined}>
        <CityScene
          scene={scene}
          quality={settings}
          guideId={effectiveGuideId}
          heroReady={status === 'ready' && phase !== 'intro'}
          interacting={['active', 'retry', 'success'].includes(interaction.state)}
          celebrating={celebration.state === 'dancing'}
          framingCelebration={celebration.state === 'framing'}
          onCelebrationFramed={() => dispatchCelebration({ type: 'CAMERA_FRAMED' })}
          onDanceFinished={() => dispatchCelebration({ type: 'DANCE_FINISHED' })}
          danceToken={danceToken}
          onHeroStatus={setHeroStatus}
          reducedMotion={reducedMotion}
          guided={controlMode === 'guided'}
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
        guided={controlMode === 'guided'}
        prompt={
          interaction.state === 'available' && activeHotspot
            ? `${ui('interact', locale)} — ${t(activeHotspot.fact.title, locale)}`
            : null
        }
        onSettings={() => toggleSettings(true)}
        onLeave={() => router.push('/map')}
        onInteract={() => dispatchInteraction({ type: 'BEGIN' })}
      />

      {coarsePointer && controlMode === 'explore' && !panelOpen && phase === 'explore' ? (
        <TouchControls />
      ) : null}

      {showPerfOverlay ? (
        <PerfOverlay sample={perf} profile={settings} hero={heroStatus} />
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
        <FactCard hotspot={activeHotspot} locale={locale} onContinue={() => void claimReward()} />
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
            hasDanceClips && !reducedMotion
              ? () => {
                  setDanceToken((token) => token + 1);
                  dispatchCelebration({ type: 'ANOTHER_DANCE' });
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
          {activeHero.displayName} hazırlanıyor…
        </p>
      ) : null}

      {settingsOpen ? <SettingsPanel /> : null}
    </main>
  );
}
