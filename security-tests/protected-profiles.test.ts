import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decryptBackup, PROFILE_KEY } from '../src/data/backups';
import { prepareProfileProtection, ProtectedProfileStore, unlockProfileProtection } from '../src/data/protectedProfileStore';
const password = 'Protección ficticia de prueba 2026';
const profile = { id: 'ficticio', name: 'Perfil reservado', avatar: '🦊', selectedAge: '6-8', stars: 19, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [{ date: '2026-10-22', emotion: 'Verde', note: 'Nota reservada' }], customPictogramImages: {}, customPictogramVoices: {} };
function storage() {
  let raw = JSON.stringify([profile]);
  let quota = false;
  return { getItem: (_key: string) => raw, setItem: (_key: string, next: string) => { if (quota) throw new Error('QuotaExceeded'); raw = next; }, quota: (value: boolean) => { quota = value; } };
}
test('activation verifies a compatible encrypted backup before replacing plaintext', async () => {
  const s = storage(), original = s.getItem(PROFILE_KEY);
  const prepared = await prepareProfileProtection([profile], password);
  assert.equal(s.getItem(PROFILE_KEY), original);
  assert.deepEqual(await decryptBackup(prepared.encrypted, password), [profile]);
  const opened = prepared.activate(s, () => {});
  assert.doesNotMatch(s.getItem(PROFILE_KEY), /Perfil reservado|Nota reservada|emotionJournal/);
  assert.deepEqual(opened.profiles, [profile]);
  await opened.close();
  assert.throws(() => opened.profiles, /bloqueado/);
  await assert.rejects(opened.save([profile]), /bloqueado/);
});
test('encrypted automatic writes are ordered and locking waits for the newest snapshot', async () => {
  const s = storage(), prepared = await prepareProfileProtection([profile], password);
  const opened = prepared.activate(s, () => {}), first = s.getItem(PROFILE_KEY);
  const a = opened.save([{ ...profile, stars: 20 }]);
  const b = opened.save([{ ...profile, stars: 21 }]);
  const closed = opened.close();
  await Promise.all([a, b, closed]);
  assert.equal((await decryptBackup(s.getItem(PROFILE_KEY), password))[0].stars, 21);
  assert.notEqual(JSON.parse(first).iv, JSON.parse(s.getItem(PROFILE_KEY)).iv);
  assert.doesNotMatch(s.getItem(PROFILE_KEY), /Perfil reservado|Nota reservada/);
  await assert.rejects(unlockProfileProtection(s, 'Contraseña equivocada', () => {}));
  const reopened = await unlockProfileProtection(s, password, () => {});
  assert.equal(reopened.profiles[0].stars, 21);
  await reopened.close();
});
test('quota failure preserves ciphertext and unsaved memory; retry succeeds before locking', async () => {
  const s = storage(), prepared = await prepareProfileProtection([profile], password);
  const opened = prepared.activate(s, () => {}), original = s.getItem(PROFILE_KEY);
  s.quota(true);
  await assert.rejects(opened.save([{ ...profile, stars: 22 }]), /Quota/);
  assert.equal(s.getItem(PROFILE_KEY), original);
  assert.equal(opened.profiles[0].stars, 22); assert.equal(opened.dirty, true);
  await assert.rejects(opened.close());
  s.quota(false);
  await opened.save(opened.profiles); await opened.close();
  assert.equal((await decryptBackup(s.getItem(PROFILE_KEY), password))[0].stars, 22);
});
test('stale activation and migration quota failure cannot overwrite original profiles', async () => {
  const s = storage(), prepared = await prepareProfileProtection([profile], password);
  const changed = JSON.stringify([{ ...profile, stars: 30 }]);
  s.setItem(PROFILE_KEY, changed);
  assert.throws(() => prepared.activate(s, () => {}), /cambiaron/);
  assert.equal(s.getItem(PROFILE_KEY), changed); prepared.cancel();
  const other = storage(), next = await prepareProfileProtection([profile], password), original = other.getItem(PROFILE_KEY);
  other.quota(true);
  assert.throws(() => next.activate(other, () => {}), /Quota/);
  assert.equal(other.getItem(PROFILE_KEY), original); next.cancel();
});
test('another tab cannot be overwritten and a rejected write can be explicitly reverted', async () => {
  const s = storage(), prepared = await prepareProfileProtection([profile], password);
  const opened = prepared.activate(s, () => {});
  const foreign = (await prepareProfileProtection([{ ...profile, stars: 50 }], password)).encrypted;
  s.setItem(PROFILE_KEY, foreign);
  await assert.rejects(opened.save([{ ...profile, stars: 24 }]), /Otra pestaña/);
  assert.equal(s.getItem(PROFILE_KEY), foreign);
  await opened.save([profile]); // Discard the unsaved edit, never write over the other tab.
  await opened.close(); assert.equal(s.getItem(PROFILE_KEY), foreign);
});
test('authentication teardown revokes failed-save memory without touching the saved ciphertext', async () => {
  const s = storage(), prepared = await prepareProfileProtection([profile], password);
  const opened = prepared.activate(s, () => {}), original = s.getItem(PROFILE_KEY);
  s.quota(true);
  await assert.rejects(opened.save([{ ...profile, stars: 80 }]), /Quota/);
  opened.dispose(); opened.dispose();
  assert.throws(() => opened.profiles, /bloqueado/);
  await assert.rejects(opened.save([profile]), /bloqueado/);
  assert.equal(s.getItem(PROFILE_KEY), original);
  assert.deepEqual(await decryptBackup(original, password), [profile]);
});
test('teardown during encryption destroys the key and rejects the late write', async () => {
  let finish!: (value: string) => void, started!: () => void, destroyed = 0, writes = 0;
  const sealing = new Promise<void>(resolve => { started = resolve; });
  const cipher = { profiles: [profile], seal: async () => { started(); return new Promise<string>(resolve => { finish = resolve; }); }, destroy: () => { destroyed++; cipher.profiles = []; } };
  const opened = new ProtectedProfileStore(cipher, { getItem: () => 'original-ciphertext', setItem: () => { writes++; } }, 'original-ciphertext');
  const save = opened.save([{ ...profile, stars: 99 }]);
  await sealing;
  opened.dispose();
  assert.equal(destroyed, 1); assert.deepEqual(cipher.profiles, []);
  finish('late-ciphertext');
  await assert.rejects(save, /Otra pestaña|bloqueado/);
  assert.equal(writes, 0); assert.throws(() => opened.profiles, /bloqueado/);
});
