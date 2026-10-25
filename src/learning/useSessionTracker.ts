import { useEffect, useRef } from 'react';
import type { GameId } from './curriculum';
export type SessionMeasurement = { startedAt: string; endedAt: string; activeSeconds: number; firstResponseSeconds: number[]; timingVersion: 1 };
export type ActivitySession = SessionMeasurement & { id: string; gameId: GameId; level: number; variant: string; status: 'completed' | 'paused'; roundsCompleted: number; independentCorrect: number; attempts: number };

// Device-local activity measurement, never a diagnostic reaction-time test.
export function useSessionTracker() {
  const clock = useRef({ enabled: false, running: false, startedAt: '', activeMs: 0, segment: 0, roundStart: 0, responded: false, samples: [] as number[] });
  const elapsed = () => clock.current.activeMs + (clock.current.running ? Math.max(0, performance.now() - clock.current.segment) : 0);
  const pause = () => { const c = clock.current; if (!c.running) return; c.activeMs = elapsed(); c.running = false; };
  const resume = () => { const c = clock.current; if (c.enabled && !c.running && !document.hidden && document.hasFocus()) { c.segment = performance.now(); c.running = true; } };
  useEffect(() => {
    const changed = () => { if (document.hidden) pause(); else resume(); };
    document.addEventListener('visibilitychange', changed); window.addEventListener('blur', pause); window.addEventListener('focus', resume);
    return () => { pause(); clock.current.enabled = false; document.removeEventListener('visibilitychange', changed); window.removeEventListener('blur', pause); window.removeEventListener('focus', resume); };
  }, []);
  return {
    start() { clock.current = { enabled: true, running: !document.hidden && document.hasFocus(), startedAt: new Date().toISOString(), activeMs: 0, segment: performance.now(), roundStart: 0, responded: false, samples: [] }; },
    beginRound() { clock.current.roundStart = elapsed(); clock.current.responded = false; },
    firstResponse() { const c = clock.current; if (!c.enabled || c.responded) return; c.responded = true; c.samples.push(Math.round(Math.max(0, elapsed() - c.roundStart) / 100) / 10); },
    discard() { pause(); clock.current.enabled = false; },
    finish(): SessionMeasurement | null {
      const c = clock.current; if (!c.enabled) return null;
      pause(); c.enabled = false;
      return { startedAt: c.startedAt, endedAt: new Date().toISOString(), activeSeconds: Math.round(c.activeMs / 100) / 10, firstResponseSeconds: [...c.samples], timingVersion: 1 };
    },
  };
}
