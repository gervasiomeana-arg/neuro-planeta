import { getIdTokenResult } from 'firebase/auth';
import { doc, getFirestore, runTransaction, serverTimestamp } from 'firebase/firestore/lite';
import { adultAuth, adultSessionEpoch, adultSessionIsCurrent } from '../auth/firebase';
import { familyProfileId, minimalFamilyDraft, type LocalLinkProfile } from './familyLinkData';

export async function linkFamilyProfile(profile: LocalLinkProfile, nickname: string, expectedUid: string, stillOpen: () => boolean) {
  const auth = adultAuth(), user = auth.currentUser, epoch = adultSessionEpoch();
  const current = () => {
    if (!stillOpen() || !user || !adultSessionIsCurrent(expectedUid, epoch) || !user.emailVerified) throw new Error('La sesión o el perfil cambió. Volvé a abrir la vinculación.');
  };
  current();
  const claims = await getIdTokenResult(user!);
  current();
  if (claims.claims.email_verified !== true) throw new Error('Verificá tu correo y actualizá el estado antes de vincular.');
  const data = minimalFamilyDraft(expectedUid, profile, nickname);
  const id = await familyProfileId(expectedUid, profile.id);
  current();
  // Lite uses REST without a persistent offline cache or a write queue.
  const db = getFirestore(auth.app);
  const family = doc(db, 'families', expectedUid);
  const child = doc(family, 'profiles', id);
  const result = await runTransaction(db, async transaction => {
    current();
    const familySnapshot = await transaction.get(family);
    current();
    const childSnapshot = await transaction.get(child);
    current();
    if (childSnapshot.exists()) {
      const existing = childSnapshot.data();
      if (existing.ownerUid !== expectedUid || existing.nickname !== data.nickname || existing.ageRange !== data.ageRange) throw new Error('Ya existe una ficha distinta para este vínculo. No se sobrescribió.');
      return 'existing' as const;
    }
    if (!familySnapshot.exists()) transaction.set(family, { ownerUid: expectedUid, schemaVersion: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    transaction.set(child, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return 'created' as const;
  }, { maxAttempts: 3 });
  current(); // Never render another account's late response.
  return result;
}
