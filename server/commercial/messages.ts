import { createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { adminServices, type Account } from './store';
export type SupportMessage = { id: string; email: string; subject: string; message: string; createdAt: number; read: boolean };
export interface MessageRepository {
  send(account: Account, id: string, subject: string, message: string): Promise<string>;
  list(account: Account, cursor?: string): Promise<{ messages: SupportMessage[]; next: string | null }>;
  markRead(id: string): Promise<void>;
}
export class FirestoreMessageRepository implements MessageRepository {
  private get rows() { return adminServices().db.collection('supportMessages'); }
  async send(account: Account, key: string, subject: string, message: string) {
    const id = createHash('sha256').update(`${account.uid}:${key}`).digest('hex'), ref = this.rows.doc(id);
    await adminServices().db.runTransaction(async tx => {
      const previous = await tx.get(ref);
      if (previous.exists) {
        const data = previous.data()!;
        if (data.uid !== account.uid || data.subject !== subject || data.message !== message) throw Error('Solicitud distinta.');
        return;
      }
      tx.set(ref, { uid: account.uid, email: account.email, subject, message, createdAt: Timestamp.now(), read: false });
    });
    return id;
  }
  async list(account: Account, cursor?: string) {
    // Document-ID pagination avoids composite indexes and never leaks another family's messages.
    let query = this.rows.orderBy('__name__').limit(51);
    if (!account.admin) query = query.where('uid', '==', account.uid);
    if (cursor) query = query.startAfter(cursor);
    const snap = await query.get(), page = snap.docs.slice(0, 50);
    return { messages: page.map(doc => {
      const d = doc.data();
      return { id: doc.id, email: d.email, subject: d.subject, message: d.message, createdAt: d.createdAt.toMillis(), read: d.read === true };
    }), next: snap.size > 50 ? page.at(-1)!.id : null };
  }
  async markRead(id: string) { await this.rows.doc(id).update({ read: true }); }
}
