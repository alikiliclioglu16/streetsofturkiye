'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { buildScene } from '@/engine/scene/buildScene';
import { qualitySettings } from '@/engine/quality/quality';
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
    };
  }, [cityId, enterCity, leaveCity, retryToken]);

  const settings = useMemo(() => qualitySettings(quality), [quality]);
  const scene = useMemo(() => (city ? buildScene(city, quality) : null), [city, quality]);

  const activeHotspot = useMemo(
    () => (city && interaction.hotspotId ? hotspotById(city, interaction.hotspotId) : undefined),
    [city, interaction.hotspotId],
  );

  const interactionKind = activeHotspot
    ? resolveInteractionType(activeHotspot.interaction.type)
    : null;

  const panelOpen =
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

  return (
    <main style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
      <CityCanvas quality={settings} onPerfSample={showPerfOverlay ? setPerf : undefined}>
        <CityScene
          scene={scene}
          quality={settings}
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

      {showPerfOverlay ? <PerfOverlay sample={perf} quality={settings.tier} /> : null}

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
          quality={quality}
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
          onCorrect={() => void answerQuiz(true)}
        />
      ) : null}

      {phase === 'complete' ? (
        <CompletionPanel
          city={city}
          collectedRewardIds={progress.collectedRewardIds}
          locale={locale}
          onLeave={() => router.push('/map')}
        />
      ) : null}

      {settingsOpen ? <SettingsPanel /> : null}
    </main>
  );
}
