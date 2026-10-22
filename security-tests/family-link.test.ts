import { test } from 'node:test';
import assert from 'node:assert/strict';
import { familyProfileId, minimalFamilyDraft } from '../src/data/familyLinkData';
const profile = { id: 'local-child', name: 'Nombre que no se debe enviar', selectedAge: '6-8', stars: 30, clinicalNotes: 'private', customPictogramImages: { photo: 'private' } };
test('family link sends only explicit alias, age and ownership metadata', () => {
  const data = minimalFamilyDraft('family-a', profile, '  Astro  ');
  assert.deepEqual(data, { ownerUid: 'family-a', schemaVersion: 1, nickname: 'Astro', ageRange: '6-8' });
  assert.doesNotMatch(JSON.stringify(data), /Nombre|clinical|private|stars|local-child/);
});
test('link identity is stable per family/profile without revealing local identifiers', async () => {
  const a = await familyProfileId('family-a', profile.id);
  assert.equal(a, await familyProfileId('family-a', profile.id));
  assert.notEqual(a, await familyProfileId('family-b', profile.id));
  assert.notEqual(a, await familyProfileId('family-a', 'another-child'));
  assert.match(a, /^[a-f0-9]{64}$/);
});
test('link validation rejects unsafe IDs, invalid ages and invalid aliases', async () => {
  for (const alias of ['', 'x'.repeat(61), 'bad\u0000name']) assert.throws(() => minimalFamilyDraft('family-a', profile, alias));
  assert.throws(() => minimalFamilyDraft('../foreign', profile, 'Astro'));
  assert.throws(() => minimalFamilyDraft('family-a', { ...profile, selectedAge: 'adult' }, 'Astro'));
  await assert.rejects(familyProfileId('family-a', ''));
});
