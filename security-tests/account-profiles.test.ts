import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountProfileKey, accountProfileStorage } from '../src/data/accountProfileStorage';
import { PROFILE_KEY, decryptBackup } from '../src/data/backups';
import { createProtectedAccount, unlockProfileProtection } from '../src/data/protectedProfileStore';

const passA = 'Contraseña ficticia familia A 2026', passB = 'Contraseña ficticia familia B 2026';
const profile = { id: 'ficticio-a', name: 'Solo familia A', avatar: '🦊', selectedAge: '6-8', stars: 7, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [], customPictogramImages: {}, customPictogramVoices: {} };
function memory() {
  const data = new Map<string, string>([[PROFILE_KEY, JSON.stringify([profile])]]);
  let quota = false;
  return { data, getItem: (key: string) => data.get(key) ?? null, setItem(key: string, value: string) { if (quota) throw new Error('QuotaExceeded'); data.set(key, value); }, quota(value: boolean) { quota = value; } };
}
test('account namespaces never fall back to legacy profiles or another adult', () => {
  const base = memory(), a = accountProfileStorage(base, 'adult-a', () => true), b = accountProfileStorage(base, 'adult-b', () => true);
  assert.equal(a.getItem(PROFILE_KEY), null); assert.equal(b.getItem(PROFILE_KEY), null);
  a.setItem(PROFILE_KEY, 'cipher-a'); b.setItem(PROFILE_KEY, 'cipher-b');
  assert.equal(a.getItem(PROFILE_KEY), 'cipher-a'); assert.equal(b.getItem(PROFILE_KEY), 'cipher-b');
  assert.equal(base.data.get(PROFILE_KEY), JSON.stringify([profile]));
  assert.throws(() => b.getItem(accountProfileKey('adult-a')), /Ruta/);
  assert.throws(() => accountProfileKey('../np_patients'), /Cuenta/);
});
test('expired or changed adult sessions reject every physical read and write', () => {
  const base = memory(); let current = true;
  const a = accountProfileStorage(base, 'adult-a', () => current);
  a.setItem(PROFILE_KEY, 'preserved'); current = false;
  assert.throws(() => a.getItem(PROFILE_KEY), /sesión/);
  assert.throws(() => a.setItem(PROFILE_KEY, 'late'), /sesión/);
  assert.equal(base.data.get(accountProfileKey('adult-a')), 'preserved');
});
test('separate encrypted accounts retain their own profiles and passwords; legacy stays untouched', async () => {
  const base = memory(), original = base.getItem(PROFILE_KEY);
  const a = accountProfileStorage(base, 'adult-a', () => true), b = accountProfileStorage(base, 'adult-b', () => true);
  const openedA = await createProtectedAccount(a, passA, () => {});
  await openedA.save([profile]); await openedA.close();
  const cipherA = a.getItem(PROFILE_KEY)!;
  const openedB = await createProtectedAccount(b, passB, () => {});
  assert.deepEqual(openedB.profiles, []); await openedB.close();
  await assert.rejects(unlockProfileProtection(a, passB, () => {}));
  assert.deepEqual(await decryptBackup(a.getItem(PROFILE_KEY)!, passA), [profile]);
  assert.deepEqual(await decryptBackup(b.getItem(PROFILE_KEY)!, passB), []);
  assert.equal(a.getItem(PROFILE_KEY), cipherA); assert.equal(base.getItem(PROFILE_KEY), original);
  assert.doesNotMatch(cipherA, /Solo familia A/);
});
test('quota or session change during account creation cannot replace data', async () => {
  const base = memory(), original = base.getItem(PROFILE_KEY);
  const a = accountProfileStorage(base, 'adult-a', () => true);
  base.quota(true); await assert.rejects(createProtectedAccount(a, passA, () => {}), /Quota/);
  assert.equal(base.data.has(a.physicalKey), false); assert.equal(base.getItem(PROFILE_KEY), original);
  base.quota(false); let current = true;
  const b = accountProfileStorage(base, 'adult-b', () => current);
  const pending = createProtectedAccount(b, passB, () => {}); current = false;
  await assert.rejects(pending, /sesión/); assert.equal(base.data.has(b.physicalKey), false);
});
test('account switch during an encrypted save preserves the last committed snapshot', async () => {
  const base = memory(); let current = true;
  const a = accountProfileStorage(base, 'adult-a', () => current);
  const opened = await createProtectedAccount(a, passA, () => {}), original = base.data.get(a.physicalKey);
  const pending = opened.save([profile]); current = false;
  await assert.rejects(pending, /sesión/);
  assert.equal(base.data.get(a.physicalKey), original);
  current = true; await opened.save([]); await opened.close();
});
test('concurrent setup in two tabs cannot overwrite the space that was created first', async () => {
  const base = memory(), a = accountProfileStorage(base, 'adult-a', () => true);
  const results = await Promise.allSettled([
    createProtectedAccount(a, passA, () => {}), createProtectedAccount(a, passA, () => {}),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected').length, 1);
  for (const result of results) if (result.status === 'fulfilled') await result.value.close();
  assert.deepEqual(await decryptBackup(a.getItem(PROFILE_KEY)!, passA), []);
  assert.equal(base.getItem(PROFILE_KEY), JSON.stringify([profile]));
});
