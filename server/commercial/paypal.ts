import type { CommercialConfig } from './config';
export type Json = Record<string, any>;
export class PayPalClient {
  private token = ''; private expires = 0;
  readonly host: string;
  constructor(private config: CommercialConfig, private transport: typeof fetch = fetch) {
    this.host = config.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  }
  private async accessToken() {
    if (this.token && Date.now() < this.expires) return this.token;
    const response = await this.transport(this.host + '/v1/oauth2/token', { method: 'POST', signal: AbortSignal.timeout(12000), redirect: 'error', headers: { Authorization: `Basic ${Buffer.from(`${this.config.clientId}:${this.config.secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
    if (!response.ok) throw new Error('PayPal no disponible.');
    const result = await response.json() as Json;
    if (typeof result.access_token !== 'string' || !Number.isFinite(result.expires_in)) throw new Error('Respuesta no válida.');
    this.token = result.access_token; this.expires = Date.now() + Math.max(0, Math.min(result.expires_in, 3600) - 60) * 1000;
    return this.token;
  }
  async request(path: string, method = 'GET', body?: Json, requestId?: string): Promise<Json> {
    if (!/^\/v1\/(catalogs|billing|notifications)\/[A-Za-z0-9_/?=&.%:-]+$/.test(path)) throw new Error('Ruta PayPal no válida.');
    const response = await this.transport(this.host + path, { method, signal: AbortSignal.timeout(15000), redirect: 'error', headers: { Authorization: `Bearer ${await this.accessToken()}`, 'Content-Type': 'application/json', ...(requestId ? { 'PayPal-Request-Id': requestId, Prefer: 'return=representation' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (!response.ok) { if (response.status === 401) this.token = ''; throw new Error('No se pudo confirmar la operación con PayPal.'); }
    return response.status === 204 ? {} : await response.json() as Json;
  }
  async verify(event: Json, headers: Record<string, string | undefined>) {
    const names = ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time'];
    if (names.some(n => !headers[n] || headers[n]!.length > 4096)) return false;
    const cert = new URL(headers['paypal-cert-url']!);
    if (cert.protocol !== 'https:' || cert.username || cert.password || !/(^|\.)paypal\.com$/.test(cert.hostname)) return false;
    const result = await this.request('/v1/notifications/verify-webhook-signature', 'POST', { auth_algo: headers['paypal-auth-algo'], cert_url: cert.href, transmission_id: headers['paypal-transmission-id'], transmission_sig: headers['paypal-transmission-sig'], transmission_time: headers['paypal-transmission-time'], webhook_id: this.config.webhookId, webhook_event: event });
    return result.verification_status === 'SUCCESS';
  }
}
export function validatePlan(plan: Json) {
  const cycles = plan.billing_cycles;
  if (plan.status !== 'ACTIVE' || !Array.isArray(cycles) || cycles.length !== 1 || cycles[0].tenure_type !== 'REGULAR' || cycles[0].frequency?.interval_unit !== 'MONTH' || cycles[0].frequency?.interval_count !== 1 || cycles[0].total_cycles !== 0 || cycles[0].pricing_scheme?.fixed_price?.currency_code !== 'USD' || !/^20(?:\.0{1,2})?$/.test(String(cycles[0].pricing_scheme?.fixed_price?.value)) || Number(plan.payment_preferences?.setup_fee?.value || 0) !== 0 || Number(plan.taxes?.percentage || 0) !== 0 || plan.quantity_supported === true || plan.payment_preferences?.auto_bill_outstanding === true) throw new Error('El plan de PayPal no coincide con USD 20 mensuales sin cargos adicionales.');
}
export function paidSnapshot(subscription: Json, list: Json, now: number) {
  if (!Array.isArray(list.transactions) || (list.total_pages ?? 1) > 1) throw new Error('Listado de pagos incompleto.');
  const payments = list.transactions.filter((t: Json) => t.status === 'COMPLETED' && /^[A-Za-z0-9_-]{3,80}$/.test(t.id) && t.amount_with_breakdown?.gross_amount?.currency_code === 'USD' && /^20(?:\.0{1,2})?$/.test(String(t.amount_with_breakdown?.gross_amount?.value)) && Number.isFinite(Date.parse(t.time)) && Date.parse(t.time) <= now).sort((a: Json, b: Json) => Date.parse(b.time) - Date.parse(a.time));
  const latest = payments[0];
  const paidAt = latest ? Date.parse(latest.time) : 0;
  let paidThrough = 0;
  if (paidAt) {
    const d = new Date(paidAt), day = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + 1);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); d.setUTCDate(Math.min(day, last)); paidThrough = d.getTime();
    // Preserve a month-end subscription anchor across February renewals.
    const anchor = new Date(subscription.start_time), paid = new Date(paidAt);
    if (Number.isFinite(anchor.getTime())) {
      const boundary = (month: number) => {
        const first = new Date(Date.UTC(paid.getUTCFullYear(), month, 1));
        const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
        return Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(anchor.getUTCDate(), lastDay), anchor.getUTCHours(), anchor.getUTCMinutes(), anchor.getUTCSeconds());
      };
      const current = boundary(paid.getUTCMonth());
      paidThrough = current > paidAt + 300000 ? current : boundary(paid.getUTCMonth() + 1);
    }
    const next = Date.parse(subscription.billing_info?.next_billing_time);
    // A failed cycle must not turn an older payment into another paid month.
    if (next >= paidAt + 20 * 86400000 && next <= paidAt + 35 * 86400000) paidThrough = next;
  }
  const status = String(subscription.status || 'UNKNOWN');
  return { status, paidAt, paidThrough, paymentId: latest?.id || '', hasAccess: ['ACTIVE', 'CANCELLED', 'SUSPENDED', 'EXPIRED'].includes(status) && paidThrough > now };
}
