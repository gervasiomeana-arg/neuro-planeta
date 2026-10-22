import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ADULT_IDLE_MS, clearAdultActivity, watchAdultIdle, type IdleEnvironment } from '../src/auth/idleSession';
function harness() {
  let now = 1_000_000, hidden = false, expired = 0, timerId = 0;
  const data = new Map<string, string>(), events = new EventTarget(), visibilityEvents = new EventTarget();
  const adultEvents = new WeakSet<Event>();
  const timers = new Map<number, { at: number; callback: () => void }>();
  const env: IdleEnvironment = {
    storage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); }, removeItem: key => { data.delete(key); } },
    events, visibilityEvents, hidden: () => hidden, adultInteraction: event => adultEvents.has(event), now: () => now,
    schedule: (callback, ms) => { const id = ++timerId; timers.set(id, { at: now + ms, callback }); return id as unknown as ReturnType<typeof setTimeout>; },
    cancel: timer => { timers.delete(timer as unknown as number); },
  };
  return { env, data, timers, events,
    start: (uid = 'adult-a') => watchAdultIdle(uid, () => { expired++; }, env),
    expired: () => expired,
    elapse: (ms: number, fireTimers = true) => { now += ms; if (fireTimers) for (const [id, task] of [...timers]) if (task.at <= now) { timers.delete(id); task.callback(); } },
    click: (adult: boolean, type = 'pointerdown') => { const event = new Event(type); if (adult) adultEvents.add(event); events.dispatchEvent(event); },
    hide: () => { hidden = true; },
    show: () => { hidden = false; visibilityEvents.dispatchEvent(new Event('visibilitychange')); },
  };
}
test('adult idle deadline expires once and stops listeners/timers', () => {
  const h = harness(); h.start();
  h.elapse(ADULT_IDLE_MS - 1); assert.equal(h.expired(), 0);
  h.elapse(1); assert.equal(h.expired(), 1); assert.equal(h.timers.size, 0);
  h.click(true); h.elapse(ADULT_IDLE_MS); assert.equal(h.expired(), 1);
});
test('child interactions do not prolong an adult session', () => {
  const h = harness(); h.start(); h.elapse(10 * 60_000); h.click(false);
  h.elapse(5 * 60_000); assert.equal(h.expired(), 1);
});
test('visible adult keyboard interaction renews an unexpired deadline', () => {
  const h = harness(); h.start(); h.elapse(10 * 60_000); h.click(true, 'keydown');
  h.elapse(5 * 60_000); assert.equal(h.expired(), 0);
  h.elapse(10 * 60_000); assert.equal(h.expired(), 1);
});
test('return from a suspended hidden tab checks elapsed time without renewing', () => {
  const h = harness(); h.start(); h.hide(); h.elapse(10 * 60_000, false); h.click(true);
  h.elapse(6 * 60_000, false); h.show(); assert.equal(h.expired(), 1);
});
test('reload resumes the original deadline and expired clicks cannot revive it', () => {
  const h = harness(); const stop = h.start(); h.elapse(10 * 60_000); stop(); h.start();
  h.elapse(5 * 60_000, false); h.click(true); assert.equal(h.expired(), 1);
});
test('invalid or future activity metadata and unavailable storage fail closed', () => {
  for (const value of ['invalid', '', '9999999999999']) {
    const h = harness(); h.data.set('np_adult_last_activity:adult-a', value); h.start(); assert.equal(h.expired(), 1);
  }
  const h = harness(); h.env.storage.setItem = () => { throw new Error('quota'); }; h.start(); assert.equal(h.expired(), 1);
});
test('activity timestamps are separate per adult and cleanup preserves other data', () => {
  const h = harness(); h.data.set('np_patients', 'original local profiles');
  const stop = h.start(); stop(); h.elapse(2 * 60_000); h.start('adult-b');
  clearAdultActivity('adult-a', h.env.storage);
  assert.equal(h.data.has('np_adult_last_activity:adult-a'), false);
  assert.equal(h.data.has('np_adult_last_activity:adult-b'), true);
  assert.equal(h.data.get('np_patients'), 'original local profiles');
});
