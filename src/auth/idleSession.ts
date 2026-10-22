export const ADULT_IDLE_MS = 15 * 60 * 1000;
const keyFor = (uid: string) => `np_adult_last_activity:${encodeURIComponent(uid)}`;
type Timer = ReturnType<typeof setTimeout>;
export interface IdleEnvironment {
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  events: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;
  visibilityEvents: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;
  hidden: () => boolean;
  adultInteraction: (event: Event) => boolean;
  now: () => number;
  schedule: (callback: () => void, ms: number) => Timer;
  cancel: (timer: Timer) => void;
}
export function clearAdultActivity(uid: string, storage: IdleEnvironment['storage']) {
  try { storage.removeItem(keyFor(uid)); } catch { /* Auth also handles unavailable persistence. */ }
}
export function watchAdultIdle(uid: string, expire: () => void, env: IdleEnvironment): () => void {
  let stopped = false;
  let timer: Timer | undefined;
  let last: number;
  const key = keyFor(uid);
  function stop() {
    stopped = true;
    if (timer !== undefined) env.cancel(timer);
    env.events.removeEventListener('pointerdown', activity);
    env.events.removeEventListener('keydown', activity);
    env.events.removeEventListener('focus', check);
    env.visibilityEvents.removeEventListener('visibilitychange', check);
  }
  function close() { if (!stopped) { stop(); expire(); } }
  function persist() {
    try { env.storage.setItem(key, String(last)); return true; } catch { close(); return false; }
  }
  function check() {
    if (stopped) return;
    const elapsed = env.now() - last;
    if (!Number.isFinite(last) || elapsed < 0 || elapsed >= ADULT_IDLE_MS) { close(); return; }
    if (timer !== undefined) env.cancel(timer);
    timer = env.schedule(check, ADULT_IDLE_MS - elapsed);
  }
  function activity(event: Event) {
    // Check first: an expired session cannot be revived by the next click.
    check();
    if (stopped || env.hidden() || !env.adultInteraction(event)) return;
    last = env.now();
    if (persist()) check();
  }
  try {
    const saved = env.storage.getItem(key);
    last = saved === null ? env.now() : saved.trim() ? Number(saved) : NaN;
  } catch { last = NaN; }
  env.events.addEventListener('pointerdown', activity);
  env.events.addEventListener('keydown', activity);
  env.events.addEventListener('focus', check);
  env.visibilityEvents.addEventListener('visibilitychange', check);
  if (persist()) check();
  return stop;
}
