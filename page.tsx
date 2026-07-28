'use client';

import { useEffect, useRef, useState } from 'react';
import { inputState } from '@/engine/controls/inputState';

const SIZE = 132;
const KNOB = 54;
const MAX_OFFSET = (SIZE - KNOB) / 2;

/**
 * Virtual joystick for touch devices. Writes directly to the shared input
 * snapshot so dragging never re-renders the scene.
 */
export function TouchControls() {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);

  // The parent unmounts this control when touch input is not active, so the
  // only job left here is releasing the shared input snapshot on the way out.
  useEffect(
    () => () => {
      inputState.forward = 0;
      inputState.turn = 0;
    },
    [],
  );

  const update = (clientX: number, clientY: number) => {
    const rect = baseRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(distance, MAX_OFFSET);
    const nx = (dx / distance) * clamped;
    const ny = (dy / distance) * clamped;
    setKnob({ x: nx, y: ny });
    // Pushing the stick sideways turns the guide, matching the keyboard.
    inputState.turn = -nx / MAX_OFFSET;
    inputState.forward = -ny / MAX_OFFSET;
  };

  const release = () => {
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    inputState.forward = 0;
    inputState.turn = 0;
  };

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Walking stick"
      onPointerDown={(event) => {
        pointerId.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (pointerId.current !== event.pointerId) return;
        update(event.clientX, event.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      style={{
        position: 'absolute',
        left: 'clamp(14px, 4vw, 32px)',
        bottom: 'clamp(14px, 4vh, 32px)',
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        background: 'rgba(255, 248, 231, 0.55)',
        border: '2px solid rgba(22, 50, 79, 0.2)',
        touchAction: 'none',
        zIndex: 20,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: KNOB,
          height: KNOB,
          marginLeft: -KNOB / 2,
          marginTop: -KNOB / 2,
          transform: `translate(${knob.x}px, ${knob.y}px)`,
          borderRadius: '50%',
          background: 'var(--cini-blue)',
          boxShadow: '0 4px 12px rgba(22,50,79,0.3)',
        }}
      />
    </div>
  );
}
