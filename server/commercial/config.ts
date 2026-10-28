import { DEFAULT_CONFIG, type PublicCommercialConfig } from '../../commercial/policy';
export type CommercialConfig = PublicCommercialConfig & { origin: string; clientId: string; secret: string; planId: string; webhookId: string; assetSecret: string };
export function commercialConfig(env: NodeJS.ProcessEnv = process.env): CommercialConfig {
  const mode = env.PAYPAL_MODE || 'off';
  if (!['off', 'sandbox', 'live'].includes(mode)) throw new Error('PAYPAL_MODE no válido.');
  let origin = '';
  if (env.COMMERCIAL_APP_URL) {
    const u = new URL(env.COMMERCIAL_APP_URL);
    if (u.protocol !== 'https:' || u.username || u.password || u.pathname !== '/' || u.search || u.hash) throw new Error('COMMERCIAL_APP_URL requiere un origen HTTPS.');
    origin = u.origin;
  }
  const address = env.LEGAL_ADDRESS?.trim() || '', supportEmail = env.SUPPORT_EMAIL?.trim() || '';
  const legalReady = address.length >= 8 && address.length <= 250 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail);
  const clientId = env.PAYPAL_CLIENT_ID || '', secret = env.PAYPAL_CLIENT_SECRET || '', planId = env.PAYPAL_PLAN_ID || '', webhookId = env.PAYPAL_WEBHOOK_ID || '';
  const checkoutReady = mode !== 'off' && legalReady && !!origin && !!clientId && !!secret && /^P-[A-Z0-9]{10,40}$/.test(planId) && !!webhookId;
  const enforce = env.BILLING_ENFORCE === 'true';
  const assetSecret = env.BILLING_ASSET_SECRET || '';
  if (enforce && (mode !== 'live' || !checkoutReady || env.COMMERCIAL_LIVE_REVIEWED !== 'true' || assetSecret.length < 32)) throw new Error('No se puede exigir pago sin configuración live, firma de acceso y revisión confirmada.');
  return { ...DEFAULT_CONFIG, mode: mode as CommercialConfig['mode'], origin, address, supportEmail, legalReady, checkoutReady, enforce, clientId, secret, planId, webhookId, assetSecret };
}
export function publicConfig(c: CommercialConfig): PublicCommercialConfig {
  const { version, mode, enforce, checkoutReady, legalReady, responsible, country, address, supportEmail } = c;
  return { version, mode, enforce, checkoutReady, legalReady, responsible, country, address: '', supportEmail: '' };
}
