import { createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { adminServices, type Account } from './store';
export const RIGHTS = ['access', 'rectification', 'suppression', 'revocation', 'refund'] as const;
export interface PrivacyRepository {
  consume(uid: string, operation: string): Promise<boolean>;
  request(account: Account, kind: string, version: string): Promise<string>;
  export(account: Account): Promise<unknown>;
  list(): Promise<unknown[]>;
  close(id: string): Promise<void>;
  suppress(id: string): Promise<void>;
  maintain(): Promise<number>;
}
export class FirestorePrivacyRepository implements PrivacyRepository {
  private get db() { return adminServices().db; }
  async consume(uid: string, operation: string) {
    const now = Date.now(), minute = Math.floor(now / 60000), id = createHash('sha256').update(`${uid}:${operation}`).digest('hex');
    const ref = this.db.doc(`commercialLimits/${id}`);
    return this.db.runTransaction(async tx => {
      const snap = await tx.get(ref), data = snap.data(), count = data?.minute === minute ? data.count : 0;
      if (count >= 12) return false;
      tx.set(ref, { minute, count: count + 1, expiresAt: Timestamp.fromMillis(now + 86400000) }); return true;
    });
  }
  async request(account: Account, kind: string, version: string) {
    const id = createHash('sha256').update(`${account.uid}:${kind}`).digest('hex'), ref = this.db.doc(`dataRightsRequests/${id}`);
    await this.db.runTransaction(async tx => {
      const existing = await tx.get(ref); if (existing.data()?.status === 'open') return;
      tx.set(ref, { uid: account.uid, email: account.email, kind, policyVersion: version, status: 'open', createdAt: Timestamp.now() });
    });
    return id;
  }
  async export(account: Account) {
    const [family, profiles, access, billing, receipts, requests] = await Promise.all([
      this.db.doc(`families/${account.uid}`).get(), this.db.collection(`families/${account.uid}/profiles`).get(),
      this.db.collection('accessEvents').where('ownerUid', '==', account.uid).get(),
      this.db.collection('commercialAccounts').where('uid', '==', account.uid).get(),
      this.db.collection('commercialReceipts').where('uid', '==', account.uid).get(),
      this.db.collection('dataRightsRequests').where('uid', '==', account.uid).get(),
    ]);
    return { account: { uid: account.uid, email: account.email }, family: family.data() || null, profiles: profiles.docs.map(d => ({ id: d.id, ...d.data() })), accessEvents: access.docs.map(d => d.data()), subscriptions: billing.docs.map(d => { const { checkoutKey, approvalUrl, ...data } = d.data(); return data; }), receipts: receipts.docs.map(d => d.data()), requests: requests.docs.map(d => ({ id: d.id, ...d.data() })), exportedAt: new Date().toISOString() };
  }
  async list() { return (await this.db.collection('dataRightsRequests').where('status', '==', 'open').limit(50).get()).docs.map(d => ({ id: d.id, ...d.data() })); }
  async close(id: string) { await this.db.doc(`dataRightsRequests/${id}`).update({ status: 'closed', closedAt: Timestamp.now(), expiresAt: Timestamp.fromMillis(Date.now() + 90 * 86400000) }); }
  async maintain() {
    let deleted = 0;
    for (const [collection, field, cutoff] of [
      ['accessEvents', 'createdAt', Timestamp.fromMillis(Date.now() - 90 * 86400000)],
      ['commercialWebhookEvents', 'expiresAt', Timestamp.now()],
      ['commercialLimits', 'expiresAt', Timestamp.now()],
      ['dataRightsRequests', 'expiresAt', Timestamp.now()],
    ] as const) {
      const rows = await this.db.collection(collection).where(field, '<', cutoff).limit(200).get();
      if (!rows.empty) { const batch = this.db.batch(); rows.docs.forEach(d => batch.delete(d.ref)); await batch.commit(); deleted += rows.size; }
    }
    return deleted;
  }
  async suppress(id: string) {
    const ref = this.db.doc(`dataRightsRequests/${id}`), request = (await ref.get()).data();
    if (!request || request.status !== 'open' || !['suppression', 'revocation'].includes(request.kind)) throw new Error('Solicitud de supresión no válida.');
    const uid = request.uid;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || (await this.db.doc(`admins/${uid}`).get()).data()?.active === true) throw new Error('Requiere revisión del responsable.');
    const subscriptions = await this.db.collection('commercialAccounts').where('uid', '==', uid).get();
    if (request.kind === 'suppression' && subscriptions.docs.some(d => !['CANCELLED', 'EXPIRED'].includes(d.data().status))) throw new Error('Confirmá primero la cancelación de todas las suscripciones, incluso altas pendientes.');
    await this.db.recursiveDelete(this.db.doc(`families/${uid}`));
    const events = await this.db.collection('accessEvents').where('ownerUid', '==', uid).get();
    for (const doc of events.docs) await doc.ref.delete();
    if (request.kind === 'suppression') {
      try { await adminServices().auth.deleteUser(uid); } catch (e) { if ((e as {code?: string}).code !== 'auth/user-not-found') throw e; }
    }
    // Keep the minimal billing evidence required for accounting and any dispute.
    await this.close(id);
  }
}
