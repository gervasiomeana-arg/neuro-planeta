import { before, after, beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, collection, collectionGroup, query, limit, orderBy, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

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
    await setDoc(doc(context.firestore(), 'admins/administrator'), { active: true });
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

const accessAuth = (uid = 'adult-a', verified = true, provider = 'password') => env.authenticatedContext(uid, {
  email_verified: verified, email: `${uid}@example.invalid`, auth_time: 1700000000,
  firebase: { sign_in_provider: provider },
}).firestore();
const accessEvent = (uid = 'adult-a', provider = 'password') => ({ ownerUid: uid, email: `${uid}@example.invalid`, provider, createdAt: serverTimestamp() });

test('adult can record exactly their signed-in session without spoofing identity, provider or server time', async () => {
  const a = accessAuth(), ref = doc(a, 'accessEvents/adult-a_1700000000');
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(setDoc(ref, accessEvent()));
  await assertFails(setDoc(ref, accessEvent()));
  await assertFails(updateDoc(ref, { email: 'injected@example.invalid' }));
  await assertFails(deleteDoc(ref));
  for (const extra of [{ ownerUid: 'other' }, { email: 'other@example.invalid' }, { provider: 'google.com' }, { createdAt: Timestamp.fromMillis(1) }, { childName: 'forbidden' }]) {
    await env.withSecurityRulesDisabled(async context => { await deleteDoc(doc(context.firestore(), 'accessEvents/adult-a_1700000000')); });
    await assertFails(setDoc(ref, { ...accessEvent(), ...extra }));
  }
  await assertFails(setDoc(doc(a, 'accessEvents/adult-a_1700000001'), accessEvent()));
  await assertFails(setDoc(doc(a, 'accessEvents/other_1700000000'), accessEvent()));
  const google = accessAuth('google-adult', true, 'google.com');
  await assertSucceeds(setDoc(doc(google, 'accessEvents/google-adult_1700000000'), accessEvent('google-adult', 'google.com')));
});
test('only a provisioned verified administrator can list bounded access history', async () => {
  const a = accessAuth();
  await assertSucceeds(setDoc(doc(a, 'accessEvents/adult-a_1700000000'), accessEvent()));
  for (const client of [a, db(null), accessAuth('administrator', false)]) {
    await assertFails(getDocs(query(collection(client, 'accessEvents'), limit(50))));
  }
  await assertFails(getDoc(doc(accessAuth('adult-b'), 'accessEvents/adult-a_1700000000')));
  const admin = accessAuth('administrator');
  await assertSucceeds(getDocs(query(collection(admin, 'accessEvents'), orderBy('createdAt', 'desc'), limit(50))));
  await assertSucceeds(getDoc(doc(admin, 'accessEvents/adult-a_1700000000')));
  await assertFails(getDocs(collection(admin, 'accessEvents')));
  await assertFails(getDocs(query(collection(admin, 'accessEvents'), limit(101))));
});
test('client cannot self-assign administrator privileges or enumerate administrator identities', async () => {
  const a = accessAuth();
  await assertSucceeds(getDoc(doc(a, 'admins/adult-a')));
  await assertFails(setDoc(doc(a, 'admins/adult-a'), { active: true }));
  await assertFails(getDoc(doc(a, 'admins/administrator')));
  await assertFails(getDocs(query(collection(a, 'admins'), limit(50))));
  const admin = accessAuth('administrator');
  await assertFails(updateDoc(doc(admin, 'admins/administrator'), { active: false }));
  await assertFails(deleteDoc(doc(admin, 'admins/administrator')));
  const unverified = accessAuth('adult-a', false);
  await assertFails(setDoc(doc(unverified, 'accessEvents/adult-a_1700000000'), accessEvent()));
});

test('only the provisioned administrator can read or change a valid monthly USD or legacy ARS price', async () => {
  const admin = accessAuth('administrator'), ref = doc(admin, 'billingConfig/monthly');
  const price = { amountCents: 2000, currency: 'USD', period: 'month', updatedBy: 'administrator', updatedAt: serverTimestamp() };
  await assertSucceeds(setDoc(ref, price));
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(setDoc(ref, { ...price, amountCents: 1500050, currency: 'ARS' }));
  for (const client of [accessAuth(), db(null), accessAuth('administrator', false)]) {
    await assertFails(getDoc(doc(client, 'billingConfig/monthly')));
    await assertFails(setDoc(doc(client, 'billingConfig/monthly'), price));
  }
  for (const invalid of [{ amountCents: -1 }, { amountCents: 1.5 }, { amountCents: 1000000000 }, { currency: 'EUR' }, { period: 'year' }, { updatedBy: 'other' }, { updatedAt: Timestamp.fromMillis(1) }, { paymentToken: 'forbidden' }]) {
    await assertFails(setDoc(ref, { ...price, ...invalid }));
  }
  await assertFails(getDocs(query(collection(admin, 'billingConfig'), limit(10))));
  await assertFails(deleteDoc(ref));
});
