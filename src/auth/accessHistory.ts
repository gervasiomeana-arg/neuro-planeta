import { getIdTokenResult, type User } from 'firebase/auth';
import { doc, getFirestore, runTransaction, serverTimestamp } from 'firebase/firestore/lite';
import { adultAuth } from './firebase';

// Explicit successful adult sign-ins only. No child names, activity, IP or tokens.
export async function recordAdultAccess(user: User) {
  if (!user.emailVerified || adultAuth().currentUser?.uid !== user.uid) return;
  const result = await getIdTokenResult(user);
  const provider = (result.claims.firebase as { sign_in_provider?: string } | undefined)?.sign_in_provider;
  const time = result.claims.auth_time;
  if (result.claims.email_verified !== true || typeof time !== 'number' || !Number.isSafeInteger(time)
    || !['password', 'google.com'].includes(provider || '') || adultAuth().currentUser?.uid !== user.uid) return;
  const ref = doc(getFirestore(adultAuth().app), 'accessEvents', `${user.uid}_${time}`);
  await runTransaction(ref.firestore, async transaction => {
    if (adultAuth().currentUser?.uid !== user.uid) throw new Error('Sesión cambiada');
    const existing = await transaction.get(ref);
    if (adultAuth().currentUser?.uid !== user.uid) throw new Error('Sesión cambiada');
    if (!existing.exists()) transaction.set(ref, {
      ownerUid: user.uid, email: result.claims.email, provider, createdAt: serverTimestamp(),
    });
  }, { maxAttempts: 2 });
}
