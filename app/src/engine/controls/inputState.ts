'use client';

import { useEffect } from 'react';

/**
 * Mutable input snapshot shared between DOM listeners and the render loop.
 * Deliberately outside React: movement must not trigger a state update per
 * frame (PERFORMANCE_BUDGET, engineering checks).
 */
export interface InputState {
  forward: number;
  /** Turn rate, -1 to 1. Left and right rotate the guide rather than sidestep. */
  turn: number;
  yawDelta: number;
  pitchDelta: number;
  interactPressed: boolean;
  /** Shift: the guide breaks into a run. */
  running: boolean;
}

/**
 * Where the child tapped, if they tapped the ground.
 *
 * Kept beside the stick rather than inside it: the guide walks towards a tap
 * and is steered by a stick, and either one can arrive at any moment.
 */
export const inputState: InputState = {
  forward: 0,
  turn: 0,
  yawDelta: 0,
  pitchDelta: 0,
  interactPressed: false,
  running: false,
};

/** Set by the canvas when a child taps the ground; cleared once acted on. */
export const pendingTap: { point: { x: number; z: number } | null } = { point: null };

export function resetInput(): void {
  inputState.forward = 0;
  inputState.turn = 0;
  inputState.yawDelta = 0;
  inputState.pitchDelta = 0;
  inputState.interactPressed = false;
  inputState.running = false;
}

/**
 * Physical key codes, not characters.
 *
 * `event.key` changes with Shift and keyboard layout: holding Shift turns 'w'
 * into 'W', so the key released never matched the key pressed and the guide
 * walked forever. `event.code` is the physical key and is immune to both.
 */
const FORWARD_CODES = new Set(['KeyW', 'ArrowUp']);
const BACK_CODES = new Set(['KeyS', 'ArrowDown']);
const TURN_LEFT_CODES = new Set(['KeyA', 'ArrowLeft']);
const TURN_RIGHT_CODES = new Set(['KeyD', 'ArrowRight']);
const RUN_CODES = new Set(['ShiftLeft', 'ShiftRight']);
const MOVEMENT_CODES = new Set([
  ...FORWARD_CODES,
  ...BACK_CODES,
  ...TURN_LEFT_CODES,
  ...TURN_RIGHT_CODES,
]);

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
      let turn = 0;
      pressed.forEach((code) => {
        if (FORWARD_CODES.has(code)) forward += 1;
        if (BACK_CODES.has(code)) forward -= 1;
        if (TURN_LEFT_CODES.has(code)) turn += 1;
        if (TURN_RIGHT_CODES.has(code)) turn -= 1;
      });
      inputState.forward = forward;
      inputState.turn = turn;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'e' || event.key === 'E' || event.key === 'Enter') {
        inputState.interactPressed = true;
      }
      if (RUN_CODES.has(event.code)) inputState.running = true;
      if (MOVEMENT_CODES.has(event.code)) {
        event.preventDefault();
        pressed.add(event.code);
        apply();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (RUN_CODES.has(event.code)) inputState.running = false;
      pressed.delete(event.code);
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
