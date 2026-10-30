import { createHash, randomUUID } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { adminServices, type Account } from './store';
export const RIGHTS = ['access', 'rectification', 'suppression', 'revocation', 'refund'] as const;
export interface PrivacyRepository {
  consume(uid: string, operation: string): Promise<boolean>;
  request(account: Account, kind: string, version: string, details?: string): Promise<string>;
  export(account: Account): Promise<unknown>;
  list(account?: Account): Promise<unknown[]>;
  close(id: string, resolution: string): Promise<void>;
  suppress(id: string): Promise<void>;
  maintain(): Promise<number>;
}
export class FirestorePrivacyRepository implements PrivacyRepository {
  constructor(private services: typeof adminServices = adminServices) {}
  private get db() { return this.services().db; }
  async consume(uid: string, operation: string) {
    const now = Date.now(), minute = Math.floor(now / 60000), id = createHash('sha256').update(`${uid}:${operation}`).digest('hex');
    const ref = this.db.doc(`commercialLimits/${id}`);
    return this.db.runTransaction(async tx => {
      const snap = await tx.get(ref), data = snap.data(), count = data?.minute === minute ? data.count : 0;
      if (count >= 12) return false;
      tx.set(ref, { minute, count: count + 1, expiresAt: Timestamp.fromMillis(now + 86400000) }); return true;
    });
  }
  async request(account: Account, kind: string, version: string, details = '') {
    const groupId = createHash('sha256').update(`${account.uid}:${kind}`).digest('hex');
    const keyRef = this.db.doc(`dataRightsRequestKeys/${groupId}`);
    return this.db.runTransaction(async tx => {
      const key = (await tx.get(keyRef)).data();
      const currentId = key?.latestId || groupId;
      const existing = (await tx.get(this.db.doc(`dataRightsRequests/${currentId}`))).data();
      if (existing?.status === 'open') {
        if (details && details !== (existing.details || '')) throw Error('Ya existe una solicitud pendiente; conservá el detalle y consultá por Mensajes con su referencia.');
        return currentId;
      }
      // New requests get a new reference; previous requests and their references stay intact.
      const id = key || existing ? createHash('sha256').update(randomUUID()).digest('hex') : groupId;
      tx.set(this.db.doc(`dataRightsRequests/${id}`), { uid: account.uid, email: account.email, kind, policyVersion: version, status: 'open', details, createdAt: Timestamp.now() });
      tx.set(keyRef, { uid: account.uid, latestId: id });
      return id;
    });
  }
  async export(account: Account) {
    const [family, profiles, access, billing, receipts, requests, messages] = await Promise.all([
      this.db.doc(`families/${account.uid}`).get(), this.db.collection(`families/${account.uid}/profiles`).get(),
      this.db.collection('accessEvents').where('ownerUid', '==', account.uid).get(),
      this.db.collection('commercialAccounts').where('uid', '==', account.uid).get(),
      this.db.collection('commercialReceipts').where('uid', '==', account.uid).get(),
      this.db.collection('dataRightsRequests').where('uid', '==', account.uid).get(),
      this.db.collection('supportMessages').where('uid', '==', account.uid).get(),
    ]);
    return { account: { uid: account.uid, email: account.email }, family: family.data() || null, profiles: profiles.docs.map(d => ({ id: d.id, ...d.data() })), accessEvents: access.docs.map(d => d.data()), subscriptions: billing.docs.map(d => { const { checkoutKey, approvalUrl, ...data } = d.data(); return data; }), receipts: receipts.docs.map(d => d.data()), requests: requests.docs.map(d => ({ id: d.id, ...d.data() })), messages: messages.docs.map(d => ({ id: d.id, ...d.data() })), exportedAt: new Date().toISOString() };
  }
  async list(account?: Account) {
    const query = account ? this.db.collection('dataRightsRequests').where('uid', '==', account.uid) : this.db.collection('dataRightsRequests').where('status', '==', 'open');
    return (await query.limit(50).get()).docs.map(d => { const r = d.data(); return { id: d.id, kind: r.kind, status: r.status, details: r.details || '', resolution: r.resolution || '', createdAt: r.createdAt?.toMillis() || 0, closedAt: r.closedAt?.toMillis() || 0, ...(!account ? { email: r.email } : {}) }; });
  }
  private async finish(id: string, resolution: string, suppressed = false) {
    if (resolution.trim().length < 10 || resolution.length > 500) throw Error('Respuesta requerida.');
    const ref = this.db.doc(`dataRightsRequests/${id}`);
    await this.db.runTransaction(async tx => {
      const r = (await tx.get(ref)).data();
      if (!r || r.status !== 'open' || (!suppressed && ['suppression', 'revocation'].includes(r.kind))) throw Error('Solicitud no resuelta.');
      const groupId = createHash('sha256').update(`${r.uid}:${r.kind}`).digest('hex'), keyRef = this.db.doc(`dataRightsRequestKeys/${groupId}`);
      const key = (await tx.get(keyRef)).data(), expiresAt = Timestamp.fromMillis(Date.now() + 90 * 86400000);
      tx.update(ref, { status: 'closed', resolution, closedAt: Timestamp.now(), expiresAt });
      if (key?.latestId === id) tx.update(keyRef, { expiresAt });
    });
  }
  async close(id: string, resolution: string) { await this.finish(id, resolution); }
  async maintain() {
    let deleted = 0;
    for (const [collection, field, cutoff] of [
      ['accessEvents', 'createdAt', Timestamp.fromMillis(Date.now() - 90 * 86400000)],
      ['commercialWebhookEvents', 'expiresAt', Timestamp.now()],
      ['commercialLimits', 'expiresAt', Timestamp.now()],
      ['dataRightsRequests', 'expiresAt', Timestamp.now()],
      ['dataRightsRequestKeys', 'expiresAt', Timestamp.now()],
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
    if (request.kind === 'suppression' && subscriptions.docs.some(d => (d.data().subscriptionId || d.data().checkoutKey) && !['CANCELLED', 'EXPIRED'].includes(d.data().status))) throw new Error('Confirmá primero la cancelación de todas las suscripciones, incluso altas pendientes.');
    await this.db.recursiveDelete(this.db.doc(`families/${uid}`));
    const events = await this.db.collection('accessEvents').where('ownerUid', '==', uid).get();
    for (const doc of events.docs) await doc.ref.delete();
    if (request.kind === 'suppression') {
      try { await this.services().auth.deleteUser(uid); } catch (e) { if ((e as {code?: string}).code !== 'auth/user-not-found') throw e; }
    }
    if (request.kind === 'suppression') {
      const messages = await this.db.collection('supportMessages').where('uid', '==', uid).get();
      for (const message of messages.docs) await message.ref.delete();
    }
    // Keep the minimal billing evidence required for accounting and any dispute.
    await this.finish(id, request.kind === 'suppression' ? 'Supresión de datos vinculados y cuenta de NeuroPlaneta completada. Se conserva la evidencia contable exigible; no se borran otros dispositivos ni descargas.' : 'Se retiraron las fichas vinculadas en servidores. No se canceló la suscripción ni se modificaron perfiles de otros dispositivos.', true);
  }
}
