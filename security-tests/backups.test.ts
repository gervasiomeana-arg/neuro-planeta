import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encryptBackup, decryptBackup, encryptRecovery, loadProfiles, persistProfiles, PROFILE_KEY, validateProfiles } from '../src/data/backups';
const password = 'Una copia de prueba 2026';
const profile = { id: 'fictional', name: 'Perfil ficticio', avatar: '🦊', selectedAge: '6-8', stars: 19, unlockedAchievements: ['Prueba'], completedRoutineTasks: ['task'], emotionJournal: [{ date: '2026-10-21', emotion: 'Verde', note: 'Nota ficticia', intensity: 2 }], customPictogramImages: { agua: 'data:image/png;base64,iVBORw0KGgo=' }, customPictogramVoices: { agua: 'data:audio/webm;base64,AAAA' }, completedMicroSteps: { task: [0] }, routineTasks: { Mañana: [{ id: 'task', name: 'Mochila', emoji: '🎒', steps: ['Guardar cuaderno'] }] }, socialStories: [{ id: 'story', title: 'Escuela', pages: Array(5).fill({ emoji: '🏫', text: 'Puedo pedir ayuda.' }) }], rewardsStore: [{ id: 'reward', name: 'Cuento', emoji: '📖', cost: 5 }], redeemedRewards: [{ id: 'redeemed', name: 'Cuento', emoji: '📖', cost: 5, date: '2026-10-21' }] };

test('encrypted backup round trip preserves full fictional profile and hides names/notes', async () => {
  const text = await encryptBackup([profile], password);
  assert.doesNotMatch(text, /Perfil ficticio|Nota ficticia|emotionJournal|data:audio/);
  assert.deepEqual(await decryptBackup(text, password), [profile]);
  assert.notEqual(await encryptBackup([profile], password), text);
});

test('wrong password, tampering, unsupported cost and plaintext are rejected', async () => {
  const text = await encryptBackup([profile], password);
  await assert.rejects(decryptBackup(text, 'Contraseña equivocada de prueba'));
  const tampered = JSON.parse(text); tampered.ciphertext = (tampered.ciphertext[0] === 'A' ? 'B' : 'A') + tampered.ciphertext.slice(1);
  await assert.rejects(decryptBackup(JSON.stringify(tampered), password));
  const inflatedCost = JSON.parse(text); inflatedCost.iterations = 999999999;
  await assert.rejects(decryptBackup(JSON.stringify(inflatedCost), password), /Formato/);
  await assert.rejects(encryptBackup([profile], 'short'), /12/);
  await assert.rejects(decryptBackup(JSON.stringify([profile]), password));
  await assert.rejects(decryptBackup(await encryptRecovery('{damaged-data', password), password), /rescate/);
});

test('malformed stored JSON or schema cannot trigger a destructive replacement during load', () => {
  for (const raw of ['{damaged', '{}', JSON.stringify([{ ...profile, stars: '19' }])]) {
    let writes = 0;
    const storage = { getItem: () => raw, setItem: () => { writes++; } };
    const loaded = loadProfiles(storage);
    assert.ok(loaded.error); assert.equal(loaded.raw, raw); assert.equal(writes, 0);
  }
  assert.deepEqual(loadProfiles({ getItem: () => JSON.stringify([profile]) }).profiles, [profile]);
});

test('storage conflicts and quota failure preserve previous serialized data', () => {
  let raw = JSON.stringify([profile]);
  const storage = { getItem: (_key: string) => raw, setItem: (_key: string, next: string) => { raw = next; } };
  const old = raw;
  raw = JSON.stringify([{ ...profile, stars: 7 }]);
  assert.throws(() => persistProfiles(storage, [profile], old), /Otra pestaña/);
  assert.equal(JSON.parse(raw)[0].stars, 7);
  const quota = { getItem: () => old, setItem: () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); } };
  assert.throws(() => persistProfiles(quota, [{ ...profile, stars: 22 }], old));
  assert.equal(quota.getItem(), old);
  assert.equal(PROFILE_KEY, 'np_patients');
});

test('schema rejects invalid nested records, duplicate IDs and prototype fields', () => {
  for (const profiles of [[profile, profile], [{ ...profile, socialStories: [{}] }], [{ ...profile, emotionJournal: [{}] }], JSON.parse(JSON.stringify([profile]).replace('"stars":19', '"__proto__":{},"stars":19'))]) {
    assert.throws(() => validateProfiles(profiles));
  }
});
