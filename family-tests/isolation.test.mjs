import { before, after, beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, collection, collectionGroup, query, limit, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

// Demo project + explicit local address: never use production accounts or data.
const projectId = 'demo-neuroplaneta-isolation';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Only the local Firestore emulator is permitted');
let env;
const metadata = uid => ({ ownerUid: uid, schemaVersion: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
const profile = uid => ({ ...metadata(uid), nickname: 'Explorador ficticio', ageRange: '6-8' });
const db = (uid, verified = true) => uid ? env.authenticatedContext(uid, { email_verified: verified }).firestore() : env.unauthenticatedContext().firestore();
before(async () => {
  env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') } });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    for (const uid of ['family-a', 'family-b']) {
      await setDoc(doc(context.firestore(), `families/${uid}`), metadata(uid));
      await setDoc(doc(context.firestore(), `families/${uid}/profiles/child`), profile(uid));
    }
  });
});
after(async () => { await env?.cleanup(); });

test('verified owner can read and update only their family and create their own metadata', async () => {
  const a = db('family-a');
  await assertSucceeds(getDoc(doc(a, 'families/family-a')));
  await assertSucceeds(updateDoc(doc(a, 'families/family-a'), { updatedAt: serverTimestamp() }));
  const c = db('family-c');
  await assertSucceeds(setDoc(doc(c, 'families/family-c'), metadata('family-c')));
});
test('owner can create, read, update, list with a limit and delete their own profile', async () => {
  const a = db('family-a'), ref = doc(a, 'families/family-a/profiles/new');
  await assertSucceeds(setDoc(ref, profile('family-a')));
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(updateDoc(ref, { nickname: 'Otro apodo', updatedAt: serverTimestamp() }));
  await assertSucceeds(getDocs(query(collection(a, 'families/family-a/profiles'), limit(20))));
  await assertSucceeds(deleteDoc(ref));
});
for (const [name, client] of [['other family', () => db('family-b')], ['anonymous', () => db(null)], ['unverified owner', () => db('family-a', false)]]) {
  test(`${name} cannot read, enumerate, create, update or delete family A data`, async () => {
    const a = client(), ref = doc(a, 'families/family-a/profiles/child');
    await assertFails(getDoc(doc(a, 'families/family-a')));
    await assertFails(getDoc(ref));
    await assertFails(getDoc(doc(a, 'families/family-a/profiles/not-present')));
    await assertFails(getDocs(query(collection(a, 'families/family-a/profiles'), limit(20))));
    await assertFails(setDoc(doc(a, 'families/family-a/profiles/injected'), profile('family-a')));
    await assertFails(updateDoc(ref, { nickname: 'Injected', updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(ref));
    await assertFails(updateDoc(doc(a, 'families/family-a'), { updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(a, 'families/family-a'), metadata('family-a')));
    await assertFails(deleteDoc(doc(a, 'families/family-a')));
  });
}
test('owner cannot impersonate another UID, add permissions, or upload unrestricted fields', async () => {
  const a = db('family-a'), ref = doc(a, 'families/family-a/profiles/new');
  for (const extra of [{ ownerUid: 'family-b' }, { role: 'admin' }, { members: ['family-b'] }, { photo: 'data:image/jpeg;base64,AA' }, { clinicalNotes: 'private' }, { nickname: 'x'.repeat(61) }, { ageRange: 'invalid' }, { schemaVersion: 2 }, { createdAt: Timestamp.fromMillis(1) }, { updatedAt: Timestamp.fromMillis(1) }]) {
    await assertFails(setDoc(ref, { ...profile('family-a'), ...extra }));
  }
  await assertFails(updateDoc(doc(a, 'families/family-a'), { role: 'admin', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(a, 'families/family-a/profiles/child'), { createdAt: Timestamp.fromMillis(1), updatedAt: serverTimestamp() }));
});
test('unbounded queries, cross-family collection groups and family enumeration are denied', async () => {
  const a = db('family-a');
  await assertFails(getDocs(collection(a, 'families/family-a/profiles')));
  await assertFails(getDocs(query(collection(a, 'families/family-a/profiles'), limit(21))));
  await assertFails(getDocs(query(collection(a, 'families'), limit(20))));
  await assertFails(getDocs(query(collectionGroup(a, 'profiles'), limit(20))));
});
test('unknown collections, nested child data and direct family deletion stay denied', async () => {
  const a = db('family-a');
  for (const path of ['profiles/child', 'families/family-a/members/guest', 'families/family-a/profiles/child/notes/note', 'admin/config']) {
    await assertFails(setDoc(doc(a, path), { ownerUid: 'family-a' }));
    await assertFails(getDoc(doc(a, path)));
  }
  await assertFails(deleteDoc(doc(a, 'families/family-a')));
});

test('claiming another family or an admin role does not override the authenticated UID', async () => {
  const fake = env.authenticatedContext('family-b', { email_verified: true, familyId: 'family-a', ownerUid: 'family-a', role: 'admin' }).firestore();
  await assertFails(getDoc(doc(fake, 'families/family-a/profiles/child')));
  await assertFails(setDoc(doc(fake, 'families/family-a/profiles/injected'), profile('family-a')));
});
