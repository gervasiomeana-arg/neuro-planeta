import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serverDiagnostics } from '../server/commercial/diagnostics';
import { commercialConfig } from '../server/commercial/config';
import { createApiApp } from '../server/app';
import type { PrivacyRepository } from '../server/commercial/privacy';
import { POLICY_VERSION } from '../commercial/policy';
const account = { uid: 'fictional-adult', email: 'adult@example.invalid', admin: true, authTime: Date.now() };
test('private diagnostics uses projected bounded reads, no writes/deletions and no provider details', async () => {
  const queries: string[] = [];
  const services = {
    auth: { async getUser(uid: string) { assert.equal(uid, account.uid); return { private: 'must-not-appear' }; } },
    db: { collection(name: string) { queries.push(name); return { select(...fields: unknown[]) { assert.deepEqual(fields, []); return { limit(n: number) { assert.equal(n, 1); return { async get() { if (name === 'commercialAccounts') throw Error('private-project-secret'); return { private: 'must-not-appear' }; } }; } }; } }; } },
  };
  const result = await serverDiagnostics(account, commercialConfig({}), services as any);
  assert.equal(result.checks.length, 7); assert.equal(queries.length, 6);
  assert.equal(result.checks.filter(c => !c.ok).length, 1);
  assert.equal(result.writesTested, false); assert.equal(result.deletionsTested, false); assert.equal(result.billingEnabled, false);
  assert.doesNotMatch(JSON.stringify(result), /private-project-secret|must-not-appear|adult@example/);
  await assert.rejects(serverDiagnostics({ ...account, admin: false }, commercialConfig({}), services as any));
});
test('privacy routes scope request history, validate rectification detail and require a resolution', async () => {
  let listed: any, recorded: any, closed = 0, diagnosed = 0;
  const privacy: PrivacyRepository = { async consume() { return true; }, async request(a, kind, version, details) { recorded = { uid: a.uid, kind, version, details }; return 'a'.repeat(64); }, async export() { return {}; }, async list(a) { listed = a; return []; }, async close() { closed++; }, async suppress() {}, async maintain() { return 0; } };
  const config = commercialConfig({ COMMERCIAL_APP_URL: 'https://example.invalid' });
  const app = createApiApp({ production: false, commercial: { config, deps: { privacy, async verify(token) { return { ...account, admin: token.startsWith('admin') }; }, async diagnose() { diagnosed++; return { checkedAt: new Date().toISOString(), checks: [], writesTested: false, deletionsTested: false, billingEnabled: false }; } } } });
  const server = app.listen(0,'127.0.0.1'); await new Promise<void>(r => server.once('listening', r));
  const addr = server.address(); assert.ok(addr && typeof addr !== 'string');
  const request = (path: string, body?: object, admin = false) => fetch(`http://127.0.0.1:${addr.port}/api/privacy/${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${admin ? 'admin' : 'valid'}-fictional-token-00000`, Origin: config.origin, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    assert.equal((await request('requests')).status,200); assert.equal(listed.uid, account.uid);
    const payload = { kind:'rectification', version: POLICY_VERSION, understood: true };
    assert.equal((await request('requests', payload)).status,400);
    assert.equal((await request('requests', { ...payload, details:'x'.repeat(501) })).status,400);
    assert.equal((await request('requests', { ...payload, details:'Corregir el correo de mi cuenta.' })).status,202);
    assert.equal(recorded.uid, account.uid); assert.equal(recorded.details,'Corregir el correo de mi cuenta.');
    const close = { action:'close', confirmation:'GESTION COMPLETADA' };
    assert.equal((await request('admin/requests/'+'a'.repeat(64),close,true)).status,400);
    assert.equal(closed,0);
    assert.equal((await request('admin/requests/'+'a'.repeat(64),{ ...close, resolution:'Se informó al solicitante cómo corregir su cuenta.' },true)).status,200);
    assert.equal(closed,1);
    assert.equal((await request('admin/diagnostics')).status,403); assert.equal(diagnosed,0);
    assert.equal((await request('admin/diagnostics',undefined,true)).status,200); assert.equal(diagnosed,1);
  } finally { await new Promise<void>(r => server.close(() => r())); }
});

test('privacy repository preserves previous resolutions and cannot close a suppression without executing it', async () => {
  const { FirestorePrivacyRepository } = await import('../server/commercial/privacy');
  const rows = new Map<string, any>();
  const db = { doc: (id: string) => ({ path:id }), async runTransaction(fn: any) {
    return fn({ async get(ref: any) { return { data:() => rows.get(ref.path) }; }, set(ref: any, data: any) { rows.set(ref.path,data); }, create(ref: any, data: any) { assert.equal(rows.has(ref.path),false); rows.set(ref.path,data); }, update(ref: any, data: any) { rows.set(ref.path,{ ...rows.get(ref.path),...data }); } });
  } };
  const repo = new FirestorePrivacyRepository((() => ({ db })) as any);
  const id = await repo.request(account,'access',POLICY_VERSION);
  await repo.close(id,'Se entregó una copia de los datos solicitados.');
  const previous = structuredClone(rows.get(`dataRightsRequests/${id}`));
  const second = await repo.request(account,'access',POLICY_VERSION);
  assert.notEqual(second,id);
  assert.equal(rows.get(`dataRightsRequests/${id}`).status,'closed');
  assert.equal([...rows.values()].filter(r => r.kind).length,2);
  assert.equal([...rows.values()].filter(r => r.status === 'closed').length,1);
  assert.equal([...rows.values()].find(r => r.status === 'closed').resolution,previous.resolution);
  const suppression = await repo.request(account,'suppression',POLICY_VERSION);
  await assert.rejects(repo.close(suppression,'Marcar completa sin borrar no está permitido.'));
  assert.equal(rows.get(`dataRightsRequests/${suppression}`).status,'open');
  const rectification = await repo.request(account,'rectification',POLICY_VERSION,'Corregir cuenta.');
  await assert.rejects(repo.request(account,'rectification',POLICY_VERSION,'Otra modificación.'));
  assert.equal(rows.get(`dataRightsRequests/${rectification}`).details,'Corregir cuenta.');
});
