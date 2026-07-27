'use client';

import { useEffect } from 'react';

/**
 * Mutable input snapshot shared between DOM listeners and the render loop.
 * Deliberately outside React: movement must not trigger a state update per
 * frame (PERFORMANCE_BUDGET, engineering checks).
 */
export interface InputState {
  forward: number;
  strafe: number;
  yawDelta: number;
  pitchDelta: number;
  interactPressed: boolean;
  /** Shift: the guide breaks into a run. */
  running: boolean;
  /** Space: a hop, consumed by the rig on the frame it is read. */
  jumpRequested: boolean;
}

export const inputState: InputState = {
  forward: 0,
  strafe: 0,
  yawDelta: 0,
  pitchDelta: 0,
  interactPressed: false,
  running: false,
  jumpRequested: false,
};

export function resetInput(): void {
  inputState.forward = 0;
  inputState.strafe = 0;
  inputState.yawDelta = 0;
  inputState.pitchDelta = 0;
  inputState.interactPressed = false;
  inputState.running = false;
  inputState.jumpRequested = false;
}

const FORWARD_KEYS = new Set(['w', 'W', 'ArrowUp']);
const BACK_KEYS = new Set(['s', 'S', 'ArrowDown']);
const LEFT_KEYS = new Set(['a', 'A', 'ArrowLeft']);
const RIGHT_KEYS = new Set(['d', 'D', 'ArrowRight']);

/**
 * Keyboard adapter. Disabled while a modal panel owns the keyboard so that
 * arrow keys move focus through UI options instead of the player.
 */
export function useKeyboardControls(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      resetInput();
      return;
    }

    const pressed = new Set<string>();

    const apply = () => {
      let forward = 0;
      let strafe = 0;
      pressed.forEach((key) => {
        if (FORWARD_KEYS.has(key)) forward += 1;
        if (BACK_KEYS.has(key)) forward -= 1;
        // Looking along +z, +x lies to the player's left, so right is negative.
        if (RIGHT_KEYS.has(key)) strafe -= 1;
        if (LEFT_KEYS.has(key)) strafe += 1;
      });
      inputState.forward = forward;
      inputState.strafe = strafe;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'e' || event.key === 'E' || event.key === 'Enter') {
        inputState.interactPressed = true;
      }
      if (event.key === 'Shift') inputState.running = true;
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        inputState.jumpRequested = true;
      }
      if (
        FORWARD_KEYS.has(event.key) ||
        BACK_KEYS.has(event.key) ||
        LEFT_KEYS.has(event.key) ||
        RIGHT_KEYS.has(event.key)
      ) {
        event.preventDefault();
        pressed.add(event.key);
        apply();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') inputState.running = false;
      pressed.delete(event.key);
      apply();
    };

    const onBlur = () => {
      pressed.clear();
      resetInput();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      resetInput();
    };
  }, [enabled]);
}
