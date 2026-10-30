import { randomUUID } from 'node:crypto';
import { POLICY_VERSION, TRIAL_DURATION_MS } from '../../commercial/policy';
import type { CommercialConfig } from './config';
import { paidSnapshot, validatePlan, type Json, type PayPalClient } from './paypal';
import type { Account, BillingRepository } from './store';
export class BillingService {
  constructor(readonly config: CommercialConfig, private paypal: Pick<PayPalClient, 'request' | 'verify'>, private repo: BillingRepository, private now = Date.now) {}
  private async plan() { validatePlan(await this.paypal.request(`/v1/billing/plans/${this.config.planId}`)); }
  view(record: Json | null, account?: Account) {
    const allowed = !!record && record.environment === this.config.mode && !record.reviewRequired && ['ACTIVE', 'CANCELLED', 'SUSPENDED', 'EXPIRED'].includes(record.status) && record.paidThrough > this.now();
    const now = this.now(), started = record?.trialStartedAt, ends = record?.trialEndsAt;
    const trialUsed = Number.isSafeInteger(started) && Number.isSafeInteger(ends) && ends - started === TRIAL_DURATION_MS;
    const trialEligible = this.config.checkoutReady && !!account && !account.admin && !trialUsed && !record?.subscriptionId && !record?.checkoutKey && !record?.reviewRequired && !record?.paymentId && !record?.paidThrough;
    const trialActive = !!account && !account.admin && this.config.mode !== 'off' && record?.environment === this.config.mode && !record?.reviewRequired && trialUsed && started <= now && ends > now;
    return { mode: this.config.mode, enforced: this.config.enforce, hasAccess: !this.config.enforce || !!account?.admin || allowed || trialActive, paid: allowed, trialActive, trialUsed, trialEligible, trialEndsAt: trialUsed ? ends : 0, accessUntil: Math.max(allowed ? record!.paidThrough : 0, trialActive ? ends : 0), status: record?.status || 'NONE', paidThrough: record?.paidThrough || 0, renewalCancelled: record?.status === 'CANCELLED', reviewRequired: record?.reviewRequired === true, hasSubscription: !!record?.subscriptionId, approvalUrl: record?.status === 'APPROVAL_PENDING' ? record?.approvalUrl || '' : '', checkedAt: record?.checkedAt || 0 };
  }
  async startTrial(account: Account, consent: Json) {
    if (!this.config.checkoutReady || account.admin || consent.termsVersion !== POLICY_VERSION || consent.privacyVersion !== POLICY_VERSION || consent.adultResponsible !== true) throw new Error('Revisá las condiciones antes de iniciar la prueba.');
    const now = this.now();
    const record = await this.repo.change(account.uid, old => {
      // Never reset an existing trial, including after expiry, failed payments or cancellation.
      if (old?.trialStartedAt !== undefined || old?.trialEndsAt !== undefined || old?.subscriptionId || old?.checkoutKey || old?.reviewRequired || old?.paymentId || old?.paidThrough) return old!;
      return { ...old, environment: this.config.mode, status: old?.status || 'NONE', paidThrough: 0, trialStartedAt: now, trialEndsAt: now + TRIAL_DURATION_MS, trialTermsVersion: POLICY_VERSION, trialPrivacyVersion: POLICY_VERSION };
    });
    return this.view(record, account);
  }
  async status(account: Account, force = false) {
    let record = await this.repo.get(account.uid);
    if (this.config.mode !== 'off' && record?.subscriptionId && (force || this.now() - (record.checkedAt || 0) > 60000)) record = await this.refresh(account.uid);
    return this.view(record, account);
  }
  async checkout(account: Account, consent: Json) {
    if (!this.config.checkoutReady || consent.termsVersion !== POLICY_VERSION || consent.privacyVersion !== POLICY_VERSION || consent.adultResponsible !== true || consent.recurringPayment !== true) throw new Error('Revisá las condiciones y la configuración antes de contratar.');
    await this.plan();
    const now = this.now();
    let record = await this.repo.change(account.uid, old => {
      if (old && (old.subscriptionId || old.checkoutKey)) {
        if (!['CANCELLED', 'EXPIRED'].includes(old.status) || old.paidThrough > now) return old;
      }
      return { ...(old?.trialStartedAt !== undefined ? { trialStartedAt: old.trialStartedAt, trialEndsAt: old.trialEndsAt, trialTermsVersion: old.trialTermsVersion, trialPrivacyVersion: old.trialPrivacyVersion } : {}), checkoutKey: randomUUID(), createdAt: now, status: 'CREATING', checkedAt: 0, paidThrough: 0, termsVersion: POLICY_VERSION, privacyVersion: POLICY_VERSION, consentedAt: now };
    });
    if (record.subscriptionId) {
      const refreshed = await this.refresh(account.uid);
      if (!refreshed) throw new Error('No se pudo consultar la suscripción.');
      record = refreshed;
      if (record.status === 'APPROVAL_PENDING' && record.approvalUrl) return { approvalUrl: record.approvalUrl };
      throw new Error('Ya hay una suscripción. Revisá su estado antes de iniciar otra.');
    }
    // PayPal retains idempotency keys for 72 hours. Never retry an uncertain
    // creation after that window with a new key and risk a second subscription.
    if (now - record.createdAt > 70 * 3600000) throw new Error('El alta pendiente necesita revisión de soporte. No se creó otra suscripción.');
    await this.repo.bind(record.checkoutKey, '', account.uid);
    const created = await this.paypal.request('/v1/billing/subscriptions', 'POST', { plan_id: this.config.planId, custom_id: record.checkoutKey, application_context: { brand_name: 'NeuroPlaneta', locale: 'es-AR', shipping_preference: 'NO_SHIPPING', user_action: 'SUBSCRIBE_NOW', return_url: `${this.config.origin}/?subscription=return`, cancel_url: `${this.config.origin}/?subscription=cancel` } }, record.checkoutKey);
    const link = created.links?.find((l: Json) => l.rel === 'approve')?.href;
    const url = new URL(link || 'https://invalid.invalid');
    const expectedHost = this.config.mode === 'live' ? 'www.paypal.com' : 'www.sandbox.paypal.com';
    if (!/^I-[A-Z0-9]{6,40}$/.test(created.id) || url.protocol !== 'https:' || url.hostname !== expectedHost || url.username || url.password || url.port || url.pathname !== '/webapps/billing/subscriptions') throw new Error('PayPal devolvió un enlace inesperado.');
    await this.repo.bind(record.checkoutKey, created.id, account.uid);
    await this.repo.change(account.uid, old => {
      if (!old || old.checkoutKey !== record!.checkoutKey || (old.subscriptionId && old.subscriptionId !== created.id)) throw new Error('El alta cambió.');
      return { ...old, subscriptionId: created.id, approvalUrl: url.href, status: old.status === 'CREATING' ? 'APPROVAL_PENDING' : old.status };
    });
    return { approvalUrl: url.href };
  }
  async refresh(uid: string) {
    const record = await this.repo.get(uid); if (!record?.subscriptionId) return record;
    if (record.environment !== this.config.mode) throw new Error('Entorno de pago distinto.');
    const observedAt = this.now(), id = record.subscriptionId;
    if (!/^I-[A-Z0-9]{6,40}$/.test(id)) throw new Error('Suscripción no válida.');
    const subscription = await this.paypal.request(`/v1/billing/subscriptions/${id}`);
    if (subscription.id !== id || subscription.plan_id !== this.config.planId || subscription.custom_id !== record.checkoutKey || subscription.plan_overridden === true || Number(subscription.quantity || 1) !== 1 || Number(subscription.shipping_amount?.value || 0) !== 0) throw new Error('La suscripción no coincide con la cuenta y el plan.');
    await this.plan();
    const query = new URLSearchParams({ start_time: new Date(observedAt - 62 * 86400000).toISOString(), end_time: new Date(observedAt).toISOString() });
    const transactions = await this.paypal.request(`/v1/billing/subscriptions/${id}/transactions?${query}`);
    const snapshot = paidSnapshot(subscription, transactions, observedAt);
    const result = await this.repo.change(uid, current => {
      if (!current) throw new Error('La suscripción cambió.');
      if (current.subscriptionId !== id || (current.checkedAt || 0) > observedAt) return current;
      if (current.status === 'CANCELLED' && snapshot.status !== 'CANCELLED') return current;
      const paidThrough = snapshot.paymentId && current.paymentId === snapshot.paymentId && current.paidThrough > 0 ? current.paidThrough : snapshot.paidThrough;
      return { ...current, ...snapshot, paidThrough, checkedAt: observedAt };
    });
    await this.repo.receipt(uid, result);
    return result;
  }
  async cancel(account: Account) {
    const record = await this.repo.get(account.uid);
    if (!record?.subscriptionId) return this.view(record, account);
    if (record.status !== 'CANCELLED') await this.paypal.request(`/v1/billing/subscriptions/${record.subscriptionId}/cancel`, 'POST', { reason: 'El titular solicitó cancelar la renovación de NeuroPlaneta.' });
    const confirmed = await this.refresh(account.uid);
    if (confirmed?.status !== 'CANCELLED') throw new Error('Todavía no se confirmó la cancelación. Consultá PayPal antes de cerrar.');
    return this.view(confirmed, account);
  }
  async webhook(event: Json, headers: Record<string, string | undefined>) {
    if (!/^[A-Za-z0-9_-]{3,100}$/.test(event.id) || typeof event.event_type !== 'string' || !await this.paypal.verify(event, headers)) return false;
    if (await this.repo.eventDone(event.id)) return true;
    const resource = event.resource || {};
    const id = event.event_type.startsWith('BILLING.SUBSCRIPTION.') ? resource.id : resource.billing_agreement_id;
    let uid: string | null = null;
    if (typeof id === 'string' && /^I-[A-Z0-9]{6,40}$/.test(id)) {
      const subscription = await this.paypal.request(`/v1/billing/subscriptions/${id}`);
      if (subscription.plan_id === this.config.planId && typeof subscription.custom_id === 'string' && /^[a-f0-9-]{36}$/.test(subscription.custom_id)) {
        uid = await this.repo.owner(id, subscription.custom_id);
        if (uid) {
          await this.repo.bind(subscription.custom_id, id, uid);
          await this.repo.change(uid, current => {
            if (!current || current.checkoutKey !== subscription.custom_id) return current || {};
            return { ...current, subscriptionId: id };
          });
        }
      }
    }
    if (!uid && typeof resource.sale_id === 'string' && /^[A-Za-z0-9_-]{3,80}$/.test(resource.sale_id)) uid = await this.repo.paymentOwner(resource.sale_id);
    if (uid) {
      if (/PAYMENT\.SALE\.(REFUNDED|REVERSED)$/.test(event.event_type)) await this.repo.change(uid, r => ({ ...r, reviewRequired: true }));
      await this.refresh(uid);
    }
    await this.repo.finishEvent(event.id, event.event_type);
    return true;
  }
}
