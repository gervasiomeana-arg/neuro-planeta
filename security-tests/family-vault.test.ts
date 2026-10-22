import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFamilyVault, saveFamilyVault } from '../src/data/familyVault';
import { PROFILE_KEY, decryptBackup } from '../src/data/backups';

const password = 'Contraseña privada de prueba 2026';
const profile = { id: 'ficticio', name: 'Nombre ficticio reservado', avatar: '🦊', selectedAge: '6-8', stars: 5, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [], customPictogramImages: {}, customPictogramVoices: {} };
const allowed = () => true;
function storage() {
  const data = new Map([[PROFILE_KEY, JSON.stringify([profile])]]);
  return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}

test('family vault encrypts records without changing existing device profiles', async () => {
  const s = storage(), original = s.getItem(PROFILE_KEY);
  const revision = await saveFamilyVault(s, 'adult-a', [profile], password, null, allowed);
  assert.doesNotMatch(revision, /Nombre ficticio|emotionJournal|ficticio/);
  assert.deepEqual((await readFamilyVault(s, 'adult-a', password, allowed)).profiles, [profile]);
  assert.equal(s.getItem(PROFILE_KEY), original);
  assert.equal(s.data.size, 2);
  await assert.rejects(decryptBackup(revision, password)); // Not an ordinary transferable backup.
});

test('moving ciphertext to another UID fails even with the same password', async () => {
  const s = storage();
  const revision = await saveFamilyVault(s, 'adult-a', [profile], password, null, allowed);
  s.setItem('np_family_vault:v1:adult-b', revision);
  await assert.rejects(readFamilyVault(s, 'adult-b', password, allowed));
  await assert.rejects(readFamilyVault(s, 'adult-a', 'Otra contraseña ficticia', allowed));
  await assert.rejects(saveFamilyVault(s, 'adult-a', [], 'Otra contraseña ficticia', revision, allowed));
  assert.equal(s.getItem('np_family_vault:v1:adult-a'), revision);
});

test('stale revisions and quota errors cannot replace the previous encrypted vault', async () => {
  const s = storage();
  const revision = await saveFamilyVault(s, 'adult-a', [profile], password, null, allowed);
  await assert.rejects(saveFamilyVault(s, 'adult-a', [], password, null, allowed), /Otra pestaña/);
  const quota = { getItem: s.getItem, setItem: () => { throw new Error('QuotaExceeded'); } };
  await assert.rejects(saveFamilyVault(quota, 'adult-a', [], password, revision, allowed), /Quota/);
  assert.equal(s.getItem('np_family_vault:v1:adult-a'), revision);
});

test('session changes during cryptography block late reads and writes', async () => {
  const s = storage();
  let active = true;
  const saving = saveFamilyVault(s, 'adult-a', [profile], password, null, () => active);
  active = false;
  await assert.rejects(saving, /sesión adulta/);
  assert.equal(s.data.size, 1);
  const revision = await saveFamilyVault(s, 'adult-a', [profile], password, null, allowed);
  active = true;
  const reading = readFamilyVault(s, 'adult-a', password, () => active);
  active = false;
  await assert.rejects(reading, /sesión adulta/);
  assert.equal(s.getItem('np_family_vault:v1:adult-a'), revision);
  await assert.rejects(readFamilyVault(s, 'adult-a', password, () => false), /sesión adulta/);
  await assert.rejects(saveFamilyVault(s, '../adult', [], password, null, allowed), /no válida/);
});
