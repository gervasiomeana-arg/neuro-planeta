// Run only on the owner's trusted server with environment-managed credentials.
// This creates a product, plan and notification endpoint; it never charges a user.
import 'dotenv/config';
import { commercialConfig } from '../server/commercial/config';
import { PayPalClient, validatePlan } from '../server/commercial/paypal';
const config = commercialConfig();
if (!['sandbox', 'live'].includes(config.mode) || !config.clientId || !config.secret || !config.origin || !config.legalReady) throw new Error('Completá modo, credenciales, origen HTTPS y datos del responsable.');
if (config.mode === 'live' && !process.argv.includes('--live')) throw new Error('Para crear recursos live, ejecutá explícitamente con --live tras probar sandbox.');
const setupKey = process.env.PAYPAL_SETUP_REQUEST_ID || '';
if (!/^[a-f0-9-]{36}$/.test(setupKey)) throw new Error('Definí PAYPAL_SETUP_REQUEST_ID con un UUID y conservá el mismo valor al reintentar durante 72 horas.');
const paypal = new PayPalClient(config);
const product = process.env.PAYPAL_PRODUCT_ID ? { id: process.env.PAYPAL_PRODUCT_ID } : await paypal.request('/v1/catalogs/products', 'POST', { name: 'NeuroPlaneta · Plan Familia', description: 'Acompañamiento, entretenimiento y prácticas con supervisión adulta.', type: 'SERVICE', category: 'SOFTWARE', home_url: config.origin }, `${setupKey}p`);
const plan = config.planId ? await paypal.request(`/v1/billing/plans/${config.planId}`) : await paypal.request('/v1/billing/plans', 'POST', {
  product_id: product.id, name: 'Plan Familia USD 20 mensual', status: 'ACTIVE',
  billing_cycles: [{ frequency: { interval_unit: 'MONTH', interval_count: 1 }, tenure_type: 'REGULAR', sequence: 1, total_cycles: 0, pricing_scheme: { fixed_price: { value: '20.00', currency_code: 'USD' } } }],
  payment_preferences: { auto_bill_outstanding: false, setup_fee: { value: '0', currency_code: 'USD' }, setup_fee_failure_action: 'CANCEL', payment_failure_threshold: 1 },
}, `${setupKey}b`);
validatePlan(plan);
const webhookUrl = `${config.origin}/api/commercial/paypal/webhook`, existing = await paypal.request('/v1/notifications/webhooks');
const events = ['BILLING.SUBSCRIPTION.CREATED', 'BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.CANCELLED', 'BILLING.SUBSCRIPTION.SUSPENDED', 'BILLING.SUBSCRIPTION.EXPIRED', 'BILLING.SUBSCRIPTION.PAYMENT.FAILED', 'PAYMENT.SALE.COMPLETED', 'PAYMENT.SALE.REFUNDED', 'PAYMENT.SALE.REVERSED'];
const hook = existing.webhooks?.find((h: any) => h.url === webhookUrl) || await paypal.request('/v1/notifications/webhooks', 'POST', { url: webhookUrl, event_types: events.map(name => ({ name })) });
if (!events.every(name => hook.event_types?.some((e: any) => e.name === name || e.name === '*'))) throw new Error('El webhook existente necesita habilitar todos los eventos de suscripción y pagos. No se creó un duplicado.');
console.log(JSON.stringify({ mode: config.mode, PAYPAL_PRODUCT_ID: product.id, PAYPAL_PLAN_ID: plan.id, PAYPAL_WEBHOOK_ID: hook.id, chargesCreated: 0 }, null, 2));
