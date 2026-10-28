import { adminServices, type Account } from './store';
import type { CommercialConfig } from './config';
export type DiagnosticResult = { checkedAt: string; checks: { name: string; ok: boolean }[]; writesTested: false; deletionsTested: false; billingEnabled: boolean };
export async function serverDiagnostics(account: Account, config: CommercialConfig, services = adminServices()): Promise<DiagnosticResult> {
  if (!account.admin) throw Error('Acceso reservado.');
  const checks: { name: string; ok: boolean }[] = [];
  const auth = await Promise.allSettled([services.auth.getUser(account.uid)]);
  checks.push({ name: 'Firebase Authentication: lectura de la cuenta administradora', ok: auth[0].status === 'fulfilled' });
  for (const collection of ['admins', 'supportMessages', 'dataRightsRequests', 'commercialAccounts', 'commercialReceipts', 'accessEvents']) {
    try {
      // Read only document references, never user fields. Do not serialize provider errors.
      await services.db.collection(collection).select().limit(1).get();
      checks.push({ name: `Firestore: lectura de ${collection}`, ok: true });
    } catch { checks.push({ name: `Firestore: lectura de ${collection}`, ok: false }); }
  }
  return { checkedAt: new Date().toISOString(), checks, writesTested: false, deletionsTested: false, billingEnabled: config.enforce };
}
