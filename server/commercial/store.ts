import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Json } from './paypal';
export function adminServices() {
  const app = getApps().find(a => a.name === 'neuroplaneta-server') || initializeApp({ credential: applicationDefault(), projectId: 'neuroplaneta-bdaf9' }, 'neuroplaneta-server');
  return { auth: getAuth(app), db: getFirestore(app) };
}
export type Account = { uid: string; email: string; authTime: number; admin: boolean };
export async function verifiedAccount(token: string): Promise<Account> {
  const { auth, db } = adminServices(), claims = await auth.verifyIdToken(token, true);
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(claims.uid) || claims.email_verified !== true || claims.firebase?.sign_in_provider !== 'google.com') throw new Error('Cuenta no válida.');
  const role = await db.doc(`admins/${claims.uid}`).get();
  return { uid: claims.uid, email: claims.email || '', authTime: claims.auth_time * 1000, admin: role.data()?.active === true };
}
export interface BillingRepository {
  get(uid: string): Promise<Json | null>;
  change(uid: string, update: (current: Json | null) => Json): Promise<Json>;
  bind(customId: string, subscriptionId: string, uid: string): Promise<void>;
  owner(subscriptionId: string, customId?: string): Promise<string | null>;
  eventDone(id: string): Promise<boolean>;
  finishEvent(id: string, type: string): Promise<void>;
  receipt(uid: string, record: Json): Promise<void>;
  paymentOwner(id: string): Promise<string | null>;
}
export class FirestoreBillingRepository implements BillingRepository {
  constructor(private mode: string) {}
  private get db() { return adminServices().db; }
  private account(uid: string) { return this.db.doc(`commercialAccounts/${this.mode}_${uid}`); }
  async get(uid: string) { return (await this.account(uid).get()).data() || null; }
  async change(uid: string, update: (current: Json | null) => Json) {
    return this.db.runTransaction(async tx => {
      const ref = this.account(uid), snap = await tx.get(ref), old = snap.data() || null;
      const next = update(old); tx.set(ref, { ...next, uid, environment: this.mode });
      return next;
    });
  }
  async bind(customId: string, subscriptionId: string, uid: string) {
    const custom = this.db.doc(`commercialBindings/${this.mode}_custom_${customId}`), sub = subscriptionId ? this.db.doc(`commercialBindings/${this.mode}_sub_${subscriptionId}`) : null;
    await this.db.runTransaction(async tx => {
      const a = await tx.get(custom), b = sub ? await tx.get(sub) : null;
      if ((a.exists && a.data()?.uid !== uid) || (b?.exists && b.data()?.uid !== uid)) throw new Error('Vínculo de pago distinto.');
      tx.set(custom, { uid }); if (sub) tx.set(sub, { uid, customId });
    });
  }
  async owner(id: string, custom?: string) {
    const sub = (await this.db.doc(`commercialBindings/${this.mode}_sub_${id}`).get()).data();
    if (sub?.uid) return sub.uid;
    return custom ? (await this.db.doc(`commercialBindings/${this.mode}_custom_${custom}`).get()).data()?.uid || null : null;
  }
  async eventDone(id: string) { return (await this.db.doc(`commercialWebhookEvents/${this.mode}_${id}`).get()).exists; }
  async finishEvent(id: string, type: string) { await this.db.doc(`commercialWebhookEvents/${this.mode}_${id}`).set({ type, completedAt: Timestamp.now(), expiresAt: Timestamp.fromMillis(Date.now() + 90 * 86400000) }); }
  async receipt(uid: string, r: Json) {
    if (!r.paymentId) return;
    await this.db.doc(`commercialReceipts/${this.mode}_${r.paymentId}`).set({ uid, environment: this.mode, subscriptionId: r.subscriptionId, amountCents: 2000, currency: 'USD', paidAt: r.paidAt, paidThrough: r.paidThrough, termsVersion: r.termsVersion, privacyVersion: r.privacyVersion });
  }
  async paymentOwner(id: string) { return (await this.db.doc(`commercialReceipts/${this.mode}_${id}`).get()).data()?.uid || null; }
}
