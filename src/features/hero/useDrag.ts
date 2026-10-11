import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

export interface DragState<T> { item: T; x: number; y: number; moved: boolean }

/**
 * Ziehen mit dem Finger: Das Teil folgt dem Finger, beim Loslassen wird `onDrop` mit der Position gerufen.
 * Ohne Bewegung zählt es als Antippen (`moved` = false).
 */
export function useDrag<T>(onDrop: (item: T, x: number, y: number, moved: boolean) => void) {
  const [drag, setDrag] = useState<DragState<T> | null>(null);
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;
  const cleanup = useRef<() => void>(() => undefined);
  useEffect(() => () => cleanup.current(), []);

  const start = (item: T) => (e: ReactPointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    setDrag({ item, x: sx, y: sy, moved: false });
    const move = (ev: PointerEvent) => {
      const moved = Math.hypot(ev.clientX - sx, ev.clientY - sy) > 10;
      setDrag((d) => (d ? { ...d, x: ev.clientX, y: ev.clientY, moved: d.moved || moved } : d));
    };
    const up = (ev: PointerEvent) => {
      cleanup.current();
      setDrag(null);
      dropRef.current(item, ev.clientX, ev.clientY, Math.hypot(ev.clientX - sx, ev.clientY - sy) > 10);
    };
    const cancel = () => { cleanup.current(); setDrag(null); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    cleanup.current = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  };
  return { drag, start };
}

/** Position relativ zu einem Element in Prozent, oder null, wenn außerhalb. */
export function relativePos(el: HTMLElement | null, x: number, y: number): { px: number; py: number } | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
  return { px: ((x - r.left) / r.width) * 100, py: ((y - r.top) / r.height) * 100 };
}
