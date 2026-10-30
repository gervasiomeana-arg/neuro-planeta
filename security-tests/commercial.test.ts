import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiApp } from '../server/app';
import { commercialConfig, publicConfig } from '../server/commercial/config';
import { BillingService } from '../server/commercial/service';
import { paidSnapshot, validatePlan, type Json } from '../server/commercial/paypal';
import type { Account, BillingRepository } from '../server/commercial/store';
import type { PrivacyRepository } from '../server/commercial/privacy';
import { POLICY_VERSION, TRIAL_DURATION_MS } from '../commercial/policy';
const NOW = Date.parse('2026-10-25T20:00:00Z');
const owner: Account = { uid: 'adult-one', email: 'one@example.invalid', authTime: NOW, admin: false };
const consent = { termsVersion: POLICY_VERSION, privacyVersion: POLICY_VERSION, adultResponsible: true, recurringPayment: true };
const config = commercialConfig({ PAYPAL_MODE: 'sandbox', PAYPAL_CLIENT_ID: 'fictional-id', PAYPAL_CLIENT_SECRET: 'fictional-secret-never-public', PAYPAL_PLAN_ID: 'P-FICTIONAL123456789', PAYPAL_WEBHOOK_ID: 'fictional-webhook', COMMERCIAL_APP_URL: 'https://neuro.example.invalid', LEGAL_ADDRESS: 'Domicilio ficticio de prueba', SUPPORT_EMAIL: 'support@example.invalid' });
const plan = () => ({ status: 'ACTIVE', quantity_supported: false, billing_cycles: [{ tenure_type: 'REGULAR', frequency: { interval_unit: 'MONTH', interval_count: 1 }, total_cycles: 0, pricing_scheme: { fixed_price: { value: '20.00', currency_code: 'USD' } } }], payment_preferences: { auto_bill_outstanding: false, setup_fee: { value: '0' } } });
class MemoryRepository implements BillingRepository {
  records = new Map<string, Json>(); bindings = new Map<string, string>(); events = new Set<string>(); receipts = new Map<string, Json>();
  async get(uid: string) { return structuredClone(this.records.get(uid) || null); }
  private queue: Promise<unknown> = Promise.resolve();
  async change(uid: string, update: (current: Json | null) => Json) { const work = this.queue.then(() => { const next = { ...update(structuredClone(this.records.get(uid) || null)), uid, environment: 'sandbox' }; this.records.set(uid, structuredClone(next)); return next; }); this.queue = work.catch(() => {}); return work; }
  async bind(custom: string, sub: string, uid: string) { for (const id of [custom, sub].filter(Boolean)) { if (this.bindings.has(id) && this.bindings.get(id) !== uid) throw Error('owner'); this.bindings.set(id, uid); } }
  async owner(sub: string, custom?: string) { return this.bindings.get(sub) || this.bindings.get(custom || '') || null; }
  async eventDone(id: string) { return this.events.has(id); }
  async finishEvent(id: string) { this.events.add(id); }
  async receipt(uid: string, r: Json) { if (r.paymentId) this.receipts.set(r.paymentId, { uid, ...r }); }
  async paymentOwner(id: string) { return this.receipts.get(id)?.uid || null; }
}
function fixture() {
  const repo = new MemoryRepository(), remote: Json = { id: 'I-FICTIONAL123', status: 'APPROVAL_PENDING', plan_id: config.planId }, transactions: Json[] = [], keys = new Set<string>();
  let clock = NOW, verified = true, created = 0;
  const paypal = {
    async verify() { return verified; },
    async request(path: string, method = 'GET', body?: Json, key?: string): Promise<Json> {
      if (path.startsWith('/v1/billing/plans/')) return plan();
      if (path === '/v1/billing/subscriptions' && method === 'POST') {
        if (!keys.has(key!)) { keys.add(key!); created++; }
        remote.custom_id = body!.custom_id;
        return { id: remote.id, links: [{ rel: 'approve', href: 'https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=fictional' }] };
      }
      if (path.includes('/transactions?')) return { transactions: structuredClone(transactions), total_pages: 1 };
      if (path.endsWith('/cancel')) { remote.status = 'CANCELLED'; return {}; }
      return structuredClone(remote);
    },
  };
  const service = new BillingService(config, paypal, repo, () => clock);
  return { repo, remote, transactions, service, setClock: (n: number) => { clock = n; }, setVerified: (b: boolean) => { verified = b; }, created: () => created };
}
function payment(time = NOW - 1000, status = 'COMPLETED', value = '20.00', currency = 'USD', id = 'PAY-ONE') { return { id, status, time: new Date(time).toISOString(), amount_with_breakdown: { gross_amount: { value, currency_code: currency } } }; }

test('trial starts only with explicit consent, lasts exactly 48 hours and survives repeated/concurrent requests', async () => {
  const f = fixture();
  assert.equal((await f.service.status(owner)).hasAccess, true); // enforcement is off in this sandbox fixture
  assert.equal((await f.service.status(owner)).trialUsed, false);
  assert.equal(f.repo.records.size, 0); // GET never starts the trial
  await assert.rejects(f.service.startTrial(owner, { ...consent, adultResponsible: false }));
  const [a, b] = await Promise.all([f.service.startTrial(owner, consent), f.service.startTrial(owner, consent)]);
  assert.equal(a.trialEndsAt, NOW + TRIAL_DURATION_MS); assert.equal(b.trialEndsAt, a.trialEndsAt);
  assert.equal(a.trialActive, true); assert.equal(a.paid, false); assert.equal(a.hasSubscription, false);
  assert.equal(f.created(), 0); assert.equal(f.repo.receipts.size, 0);
  f.setClock(NOW + TRIAL_DURATION_MS - 1); assert.equal((await f.service.status(owner)).trialActive, true);
  f.setClock(NOW + TRIAL_DURATION_MS); assert.equal((await f.service.status(owner)).trialActive, false);
  const retry = await f.service.startTrial(owner, consent);
  assert.equal(retry.trialEndsAt, a.trialEndsAt); assert.equal(retry.trialActive, false); assert.equal(retry.trialEligible, false);
  const other = await f.service.status({ ...owner, uid: 'other-account' }); assert.equal(other.trialUsed, false);
});
test('enforced trial grants access only within server timestamps, caps assets and never overrides refunds', async () => {
  const f = fixture(), activeConfig = { ...config, enforce: true };
  const enforced = new BillingService(activeConfig, { request: async () => { throw Error('PayPal must not be called'); }, verify: async () => false }, f.repo, () => NOW);
  assert.equal((await enforced.status(owner)).hasAccess, false);
  const trial = await enforced.startTrial(owner, consent);
  assert.equal(trial.hasAccess, true); assert.equal(trial.accessUntil, NOW + TRIAL_DURATION_MS);
  const record = await f.repo.get(owner.uid);
  assert.equal(enforced.view({ ...record, trialStartedAt: NOW + 1, trialEndsAt: NOW + 1 + TRIAL_DURATION_MS }, owner).hasAccess, false);
  assert.equal(enforced.view({ ...record, trialEndsAt: NOW + TRIAL_DURATION_MS + 1 }, owner).hasAccess, false);
  assert.equal(enforced.view({ ...record, environment: 'live' }, owner).hasAccess, false);
  assert.equal(enforced.view({ ...record, reviewRequired: true }, owner).hasAccess, false);
  const expired = new BillingService(activeConfig, { request: async () => ({}), verify: async () => false }, f.repo, () => NOW + TRIAL_DURATION_MS);
  assert.equal((await expired.status(owner)).hasAccess, false);
});
test('checkout and replacement subscriptions retain trial history; paying accounts cannot start a new trial', async () => {
  const f = fixture(); await f.service.startTrial(owner, consent); await f.service.checkout(owner, consent);
  assert.equal((await f.repo.get(owner.uid))!.trialStartedAt, NOW);
  await f.repo.change(owner.uid, old => ({ ...old, status: 'EXPIRED', subscriptionId: '', checkoutKey: '', paidThrough: 0 }));
  await f.service.checkout(owner, consent);
  assert.equal((await f.repo.get(owner.uid))!.trialEndsAt, NOW + TRIAL_DURATION_MS);
  const paid = fixture(); await paid.service.checkout(owner, consent);
  assert.equal((await paid.service.startTrial(owner, consent)).trialUsed, false);
});
test('commercial defaults preserve pilot and keep credentials out of public config', () => {
  assert.equal(commercialConfig({}).enforce, false); assert.equal(commercialConfig({}).checkoutReady, false);
  assert.ok(!JSON.stringify(publicConfig(config)).includes('fictional-secret'));
  assert.throws(() => commercialConfig({ BILLING_ENFORCE: 'true' }));
  assert.throws(() => commercialConfig({ PAYPAL_MODE: 'sandbox', BILLING_ENFORCE: 'true' }));
  assert.throws(() => commercialConfig({ COMMERCIAL_APP_URL: 'https://evil.invalid/redirect' }));
});
test('only a fixed USD20 monthly plan without trial, setup, outstanding billing or tax is accepted', () => {
  validatePlan(plan());
  for (const change of [(p: Json) => { p.billing_cycles[0].pricing_scheme.fixed_price.value = '25'; }, (p: Json) => { p.billing_cycles[0].frequency.interval_unit = 'YEAR'; }, (p: Json) => { p.billing_cycles.push(p.billing_cycles[0]); }, (p: Json) => { p.payment_preferences.auto_bill_outstanding = true; }, (p: Json) => { p.taxes = { percentage: '21' }; }]) { const p = plan(); change(p); assert.throws(() => validatePlan(p)); }
});
test('approval, pending, declined, refunded, incorrect currency/amount and future payments do not grant a period', () => {
  assert.equal(paidSnapshot({ status: 'ACTIVE' }, { transactions: [] }, NOW).hasAccess, false);
  for (const p of [payment(NOW, 'PENDING'), payment(NOW, 'DECLINED'), payment(NOW, 'REFUNDED'), payment(NOW, 'PARTIALLY_REFUNDED'), payment(NOW, 'COMPLETED', '2'), payment(NOW, 'COMPLETED', '20', 'ARS'), payment(NOW + 10000)]) assert.equal(paidSnapshot({ status: 'ACTIVE' }, { transactions: [p] }, NOW).hasAccess, false);
  assert.throws(() => paidSnapshot({ status: 'ACTIVE' }, { transactions: [], total_pages: 2 }, NOW));
});
test('paid periods clamp calendar months, including leap years, without giving extra months on duplicate checks', () => {
  for (const [start, end] of [['2026-01-31T12:00:00Z', '2026-02-28T12:00:00Z'], ['2028-01-31T12:00:00Z', '2028-02-29T12:00:00Z']]) {
    const n = Date.parse(start), r = paidSnapshot({ status: 'ACTIVE' }, { transactions: [payment(n)] }, n);
    assert.equal(new Date(r.paidThrough).toISOString(), new Date(end).toISOString());
  }
});
test('checkout requires explicit versioned recurring consent and stable retries do not create a second subscription', async () => {
  const f = fixture(); await assert.rejects(f.service.checkout(owner, { ...consent, recurringPayment: false })); assert.equal(f.created(), 0);
  const [a, b] = await Promise.all([f.service.checkout(owner, consent), f.service.checkout(owner, consent)]);
  assert.equal(a.approvalUrl, b.approvalUrl); assert.equal(f.created(), 1);
  assert.ok(!f.remote.custom_id.includes(owner.uid));
});
test('an uncertain checkout older than the provider idempotency window is not recreated', async () => {
  const f = fixture(); f.repo.records.set(owner.uid, { checkoutKey: 'previous', createdAt: NOW - 71 * 3600000, status: 'CREATING', paidThrough: 0 });
  await assert.rejects(f.service.checkout(owner, consent)); assert.equal(f.created(), 0);
});
test('verified payment, renewal, cancellation and expired or declined renewal use actual paid periods', async () => {
  const f = fixture(); await f.service.checkout(owner, consent); f.remote.status = 'ACTIVE';
  assert.equal((await f.service.status(owner, true)).paid, false);
  f.transactions.push(payment()); const initial = await f.service.status(owner, true); assert.equal(initial.paid, true);
  const repeated = await f.service.status(owner, true); assert.equal(repeated.paidThrough, initial.paidThrough);
  const later = NOW + 31 * 86400000; f.setClock(later); f.transactions.push(payment(later - 1000, 'COMPLETED', '20.00', 'USD', 'PAY-TWO'));
  const renewal = await f.service.status(owner, true); assert.ok(renewal.paidThrough > initial.paidThrough);
  const cancelled = await f.service.cancel(owner); assert.equal(cancelled.renewalCancelled, true); assert.equal(cancelled.paid, true);
  f.setClock(renewal.paidThrough + 1); f.transactions.push(payment(renewal.paidThrough, 'DECLINED')); assert.equal((await f.service.status(owner, true)).paid, false);
});
test('another account cannot refresh or cancel someone else subscription or use a mismatched plan/custom id', async () => {
  const f = fixture(); await f.service.checkout(owner, consent);
  const other = { ...owner, uid: 'adult-two' }; assert.equal((await f.service.status(other)).hasSubscription, false);
  await f.service.cancel(other); assert.equal(f.remote.status, 'APPROVAL_PENDING');
  f.remote.custom_id = 'different'; await assert.rejects(f.service.status(owner, true));
});
test('verified webhooks fetch provider truth, deduplicate and revoke access on refund rather than trusting payload', async () => {
  const f = fixture(); await f.service.checkout(owner, consent); f.remote.status = 'ACTIVE'; f.transactions.push(payment());
  const event = { id: 'EVENT-ONE', event_type: 'PAYMENT.SALE.COMPLETED', resource: { billing_agreement_id: f.remote.id, amount: { total: '9999' } } };
  f.setVerified(false); assert.equal(await f.service.webhook(event, {}), false); assert.equal(f.repo.events.size, 0);
  f.setVerified(true); assert.equal(await f.service.webhook(event, {}), true);
  const paid = await f.service.status(owner); assert.equal(paid.paid, true);
  await f.service.webhook(event, {}); assert.equal((await f.service.status(owner)).paidThrough, paid.paidThrough); assert.equal(f.repo.receipts.size, 1);
  await f.service.webhook({ id: 'EVENT-REFUND', event_type: 'PAYMENT.SALE.REFUNDED', resource: { sale_id: 'PAY-ONE' } }, {});
  assert.equal((await f.service.status(owner)).paid, false); assert.equal((await f.service.status(owner)).reviewRequired, true);
});
test('sandbox payment records do not grant paid access in live mode', () => {
  const f = fixture(), live = new BillingService({ ...config, mode: 'live', enforce: true }, {} as any, f.repo, () => NOW);
  assert.equal(live.view({ environment: 'sandbox', status: 'ACTIVE', paidThrough: NOW + 100000 }).hasAccess, false);
});

test('real HTTP routes enforce account, origin, recent authentication, payload allowlists and admin rights', async () => {
  const f = fixture(), requests: Json[] = []; let maintenance = 0, suppressed = 0;
  const privacy: PrivacyRepository = {
    async consume() { return true; }, async request(a, kind) { requests.push({ uid: a.uid, kind }); return 'fictional-request'; }, async export(a) { return { uid: a.uid }; }, async list() { return requests; }, async close() {}, async suppress() { suppressed++; }, async maintain() { maintenance++; return 0; },
  };
  const app = createApiApp({ production: false, commercial: { config, deps: { service: f.service, privacy, now: () => NOW, async verify(token) { if (token === 'revoked-token-fictional-000') throw Object.assign(Error('secret'), { code: 'auth/id-token-revoked' }); return { ...owner, admin: token === 'admin-token-fictional-000', authTime: token === 'old-token-fictional-0000' ? NOW - 11 * 60000 : NOW }; } } } });
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string'); const base = `http://127.0.0.1:${address.port}/api/`;
  async function request(path: string, body?: Json, token = 'valid-token-fictional-000', origin = config.origin) { return fetch(base + path, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, Origin: origin, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
  try {
    assert.equal((await fetch(base + 'commercial/status')).status, 401);
    assert.equal((await request('commercial/status', undefined, 'revoked-token-fictional-000')).status, 401);
    assert.equal((await request('commercial/checkout', consent, undefined, 'https://evil.invalid')).status, 403);
    assert.equal((await request('commercial/checkout', consent, 'old-token-fictional-0000')).status, 401);
    assert.equal((await request('commercial/checkout', { ...consent, amount: 1, childNote: 'must-not-store' })).status, 400);
    assert.equal(f.created(), 0);
    const trialConsent = { termsVersion: POLICY_VERSION, privacyVersion: POLICY_VERSION, adultResponsible: true };
    assert.equal((await request('commercial/trial', trialConsent, undefined, 'https://evil.invalid')).status, 403);
    assert.equal((await request('commercial/trial', trialConsent, 'old-token-fictional-0000')).status, 401);
    assert.equal((await request('commercial/trial', { ...trialConsent, trialEndsAt: NOW + 999999999 })).status, 400);
    const trialResponse = await request('commercial/trial', trialConsent);
    assert.equal(trialResponse.status, 200); assert.equal((await trialResponse.json()).trialActive, true);
    assert.equal(f.created(), 0);
    const r = await request('privacy/requests', { kind: 'suppression', version: POLICY_VERSION, understood: true }); assert.equal(r.status, 202); assert.equal(requests[0].uid, owner.uid); assert.equal(suppressed, 0);
    assert.deepEqual(await (await request('privacy/export')).json(), { uid: owner.uid });
    assert.equal((await request('privacy/admin/requests')).status, 403);
    assert.equal((await request('privacy/admin/maintenance', { confirmation: 'DEPURAR REGISTROS VENCIDOS' })).status, 403);
    assert.equal((await request('privacy/admin/maintenance', { confirmation: 'DEPURAR REGISTROS VENCIDOS' }, 'admin-token-fictional-000')).status, 200); assert.equal(maintenance, 1);
    assert.equal((await request('privacy/admin/requests/' + 'a'.repeat(64), { action: 'suppress', confirmation: 'wrong' }, 'admin-token-fictional-000')).status, 400); assert.equal(suppressed, 0);
    assert.equal((await request('commercial/checkout', { ...consent, blob: 'x'.repeat(3000) })).status, 413);
    assert.equal(JSON.stringify(await (await fetch(base + 'commercial/config')).json()).includes('fictional-secret'), false);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('February renewal keeps the original month-end anchor and failed cycles cannot extend old payment', () => {
  const paid = Date.parse('2026-02-28T12:00:00Z');
  const r = paidSnapshot({ status: 'ACTIVE', start_time: '2026-01-31T12:00:00Z' }, { transactions: [payment(paid)] }, paid);
  assert.equal(new Date(r.paidThrough).toISOString(), '2026-03-31T12:00:00.000Z');
  const old = Date.parse('2026-01-31T12:00:00Z');
  const failed = paidSnapshot({ status: 'SUSPENDED', billing_info: { next_billing_time: '2026-03-31T12:00:00Z' } }, { transactions: [payment(old)] }, Date.parse('2026-03-01T00:00:00Z'));
  assert.equal(failed.hasAccess, false);
});

test('native PayPal adapter verifies headers remotely, pins hosts and caches only server OAuth tokens', async () => {
  const { PayPalClient } = await import('../server/commercial/paypal');
  let tokens = 0, verification: Json | undefined;
  const calls: string[] = [];
  const client = new PayPalClient(config, (async (url, init) => {
    calls.push(String(url)); assert.ok(String(url).startsWith('https://api-m.sandbox.paypal.com/'));
    if (String(url).endsWith('/oauth2/token')) { tokens++; return new Response(JSON.stringify({ access_token: 'server-only-token', expires_in: 3600 }), { status: 200 }); }
    if (String(url).endsWith('/verify-webhook-signature')) { verification = JSON.parse(String(init?.body)); return new Response(JSON.stringify({ verification_status: 'SUCCESS' }), { status: 200 }); }
    return new Response(JSON.stringify(plan()), { status: 200 });
  }) as typeof fetch);
  assert.equal(await client.verify({ id: 'EVENT' }, {}), false); assert.equal(calls.length, 0);
  const headers = { 'paypal-auth-algo': 'SHA256withRSA', 'paypal-cert-url': 'https://api.paypal.com/v1/notifications/certs/fake', 'paypal-transmission-id': 'transmission', 'paypal-transmission-sig': 'signature', 'paypal-transmission-time': new Date().toISOString() };
  assert.equal(await client.verify({ id: 'EVENT' }, { ...headers, 'paypal-cert-url': 'https://evil.invalid/cert' }), false);
  assert.equal(await client.verify({ id: 'EVENT' }, headers), true); assert.equal(verification!.webhook_id, config.webhookId);
  await client.request(`/v1/billing/plans/${config.planId}`); assert.equal(tokens, 1);
  await assert.rejects(client.request('https://evil.invalid/steal'));
});

test('paid module delivery rejects missing, forged, expired and encoded-path bypasses with no-store responses', async () => {
  const express = (await import('express')).default;
  const { assetToken, assetTokenValid, protectedAssets } = await import('../server/commercial/assets');
  const signingKey = 'test-only-signing-key-never-use-live-000000';
  const cfg = { ...config, mode: 'live' as const, enforce: true, assetSecret: signingKey };
  const app = express(); app.use(protectedAssets(cfg)); app.get('*', (_req, res) => res.send('fixture module'));
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string'); const base = `http://127.0.0.1:${address.port}`;
  const token = assetToken(owner.uid, Date.now() + 30000, signingKey);
  try {
    for (const path of ['/assets/ImportedApp-test.js', '/%61ssets/ImportedApp-test.js', '/assets/%49mportedApp-test.js', '/assets/sub/%2e%2e/ImportedApp-test.js']) assert.equal((await fetch(base + path)).status, 401, path);
    assert.equal((await fetch(base + '/assets/ImportedApp-test.js', { headers: { Cookie: `np_paid_assets=${token}` } })).status, 200);
    assert.equal((await fetch(base + '/assets/ImportedApp-test.js', { headers: { Cookie: `np_paid_assets=${token}forged` } })).status, 401);
    assert.equal((await fetch(base + '/assets/index-public.js')).status, 200);
    assert.equal(assetTokenValid(assetToken(owner.uid, Date.now() - 100, signingKey), signingKey), false);
    assert.equal(assetTokenValid(token, signingKey + 'wrong'), false);
    assert.match((await fetch(base + '/assets/ImportedApp-test.js')).headers.get('cache-control') || '', /no-store/);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
