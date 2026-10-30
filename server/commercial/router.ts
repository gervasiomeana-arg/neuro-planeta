import express from 'express';
import type { Request } from 'express';
import { POLICY_VERSION } from '../../commercial/policy';
import { publicConfig, type CommercialConfig } from './config';
import { PayPalClient } from './paypal';
import { BillingService } from './service';
import { FirestoreBillingRepository, verifiedAccount, type Account } from './store';
import { FirestorePrivacyRepository, RIGHTS, type PrivacyRepository } from './privacy';
import { FirestoreMessageRepository, type MessageRepository } from './messages';
import { serverDiagnostics, type DiagnosticResult } from './diagnostics';
import { verificationResponse } from './verification';
import { setAssetAccess } from './assets';
export type CommercialDependencies = { diagnose?: (account: Account) => Promise<DiagnosticResult>; messages?: MessageRepository; service?: BillingService; verify?: (token: string) => Promise<Account>; privacy?: PrivacyRepository; now?: () => number };
export function commercialRouter(config: CommercialConfig, deps: CommercialDependencies = {}) {
  const router = express.Router(), service = deps.service || new BillingService(config, new PayPalClient(config), new FirestoreBillingRepository(config.mode));
  const messages = deps.messages || new FirestoreMessageRepository();
  const privacy = deps.privacy || new FirestorePrivacyRepository(), verify = deps.verify || verifiedAccount, now = deps.now || Date.now;
  router.get('/commercial/config', (_req, res) => res.json(publicConfig(config)));
  router.post('/commercial/paypal/webhook', express.json({ limit: '64kb', strict: true }), async (req, res) => {
    if (config.mode === 'off' || !config.webhookId) return res.sendStatus(503);
    try {
      const headers = Object.fromEntries(Object.entries(req.headers).filter(([,v]) => typeof v === 'string')) as Record<string,string>;
      if (!await service.webhook(req.body, headers)) return res.sendStatus(401);
      res.sendStatus(200);
    } catch { res.sendStatus(503); } // PayPal retries. Do not acknowledge unfinished work.
  });
  router.use('/support', express.json({ limit: '8kb', strict: true }));
  router.use(['/commercial', '/privacy'], express.json({ limit: '2kb', strict: true }));
  router.use(['/commercial', '/privacy', '/support'], async (req, res, next) => {
    const expectedOrigin = config.origin || (req.baseUrl.endsWith('/support') ? 'https://neuroplaneta.ai.studio' : '');
    if (req.method !== 'GET' && (req.get('origin') !== expectedOrigin || !expectedOrigin || req.get('sec-fetch-site') === 'cross-site')) return res.status(403).json({ error: 'Origen no permitido.' });
    const match = /^Bearer ([A-Za-z0-9._-]{20,10000})$/.exec(req.get('authorization') || '');
    if (!match) return res.status(401).json({ error: 'Volvé a ingresar con Google.' });
    try { res.locals.account = await verify(match[1]); }
    catch (error) { const failure = verificationResponse(error); return res.status(failure.status).json(failure.body); }
    try {
      if (!await privacy.consume(res.locals.account.uid, req.method === 'GET' ? 'read' : 'write')) return res.status(429).json({ error: 'Esperá un minuto antes de volver a intentar.' });
      if (req.method !== 'GET' && !req.baseUrl.endsWith('/support') && now() - res.locals.account.authTime > 10 * 60000) return res.status(401).json({ error: 'Para esta operación, cerrá la sesión Google y volvé a ingresar.' });
      next();
    } catch { res.status(503).json({ error: 'El servicio de cuenta no está disponible. Tus perfiles no se modificaron.' }); }
  });
  function body(req: Request, allowed: string[]) { return req.body && typeof req.body === 'object' && !Array.isArray(req.body) && Object.keys(req.body).every(k => allowed.includes(k)); }
  router.post('/support/messages', async (req, res) => {
    if (!body(req, ['id', 'subject', 'message']) || typeof req.body.id !== 'string' || !/^[a-f0-9-]{36}$/.test(req.body.id) || typeof req.body.subject !== 'string' || typeof req.body.message !== 'string') return res.sendStatus(400);
    const subject = req.body.subject.trim(), message = req.body.message.trim();
    if (!subject || subject.length > 120 || !message || message.length > 1500) return res.sendStatus(400);
    try { res.status(201).json({ id: await messages.send(res.locals.account, req.body.id, subject, message) }); }
    catch { res.status(503).json({ error: 'No se pudo confirmar el envío. Conservá el texto y volvé a intentar.' }); }
  });
  router.get('/support/messages', async (req, res) => {
    const cursor = req.query.cursor;
    if (cursor !== undefined && (typeof cursor !== 'string' || !/^[a-f0-9]{64}$/.test(cursor))) return res.sendStatus(400);
    try { res.json(await messages.list({ ...res.locals.account, admin: false }, cursor as string | undefined)); }
    catch { res.status(503).json({ error: 'No se pudieron consultar los mensajes.' }); }
  });
  router.get('/support/admin/messages', async (req, res) => {
    if (!res.locals.account.admin) return res.sendStatus(403);
    const cursor = req.query.cursor;
    if (cursor !== undefined && (typeof cursor !== 'string' || !/^[a-f0-9]{64}$/.test(cursor))) return res.sendStatus(400);
    try { res.json(await messages.list(res.locals.account, cursor as string | undefined)); }
    catch { res.status(503).json({ error: 'No se pudo cargar la bandeja.' }); }
  });
  router.post('/support/admin/messages/:id/read', async (req, res) => {
    if (!res.locals.account.admin) return res.sendStatus(403);
    if (!body(req, []) || !/^[a-f0-9]{64}$/.test(req.params.id)) return res.sendStatus(400);
    try { await messages.markRead(req.params.id); res.json({ done: true }); }
    catch { res.status(503).json({ error: 'No se pudo marcar el mensaje como leído.' }); }
  });
  router.get('/commercial/status', async (_req, res) => {
    try { const data = await service.status(res.locals.account); setAssetAccess(res, config, res.locals.account.uid, data.hasAccess, data.accessUntil); res.json(data); } catch { res.status(503).json({ error: 'No se pudo verificar la suscripción. No vuelvas a pagar sin consultar su estado.' }); }
  });
  router.post('/commercial/refresh', async (req, res) => {
    if (!body(req, [])) return res.sendStatus(400);
    try { const data = await service.status(res.locals.account, true); setAssetAccess(res, config, res.locals.account.uid, data.hasAccess, data.accessUntil); res.json(data); } catch { res.status(503).json({ error: 'El pago todavía no pudo confirmarse. Consultá PayPal antes de intentar otra compra.' }); }
  });
  router.post('/commercial/trial', async (req, res) => {
    if (!body(req, ['termsVersion', 'privacyVersion', 'adultResponsible'])) return res.sendStatus(400);
    try { const data = await service.startTrial(res.locals.account, req.body); setAssetAccess(res, config, res.locals.account.uid, data.hasAccess, data.accessUntil); res.json(data); }
    catch { res.status(409).json({ error: 'No se pudo iniciar la prueba gratuita. Revisá las condiciones y volvé a consultar tu acceso.' }); }
  });
  router.post('/commercial/checkout', async (req, res) => {
    if (!body(req, ['termsVersion', 'privacyVersion', 'adultResponsible', 'recurringPayment'])) return res.sendStatus(400);
    try { res.json(await service.checkout(res.locals.account, req.body)); } catch { res.status(409).json({ error: 'No se inició otra suscripción. Revisá la aceptación, la configuración y el estado del alta anterior antes de reintentar.' }); }
  });
  router.post('/commercial/cancel', async (req, res) => {
    if (!body(req, ['confirmation']) || req.body.confirmation !== 'CANCELAR RENOVACION') return res.sendStatus(400);
    try { const data = await service.cancel(res.locals.account); setAssetAccess(res, config, res.locals.account.uid, data.hasAccess, data.accessUntil); res.json(data); } catch { res.status(503).json({ error: 'No se confirmó la cancelación. Podés cancelarla en los pagos automáticos de PayPal o contactar a soporte.' }); }
  });
  router.get('/privacy/admin/diagnostics', async (_req, res) => {
    if (!res.locals.account.admin) return res.sendStatus(403);
    try { res.json(await (deps.diagnose ? deps.diagnose(res.locals.account) : serverDiagnostics(res.locals.account, config))); }
    catch { res.status(503).json({ error: 'No se pudo completar el diagnóstico de lectura. No se modificaron datos.' }); }
  });
  router.get('/privacy/requests', async (_req, res) => {
    try { res.json({ requests: await privacy.list(res.locals.account) }); } catch { res.status(503).json({ error: 'No se pudieron consultar tus solicitudes.' }); }
  });
  router.get('/privacy/export', async (_req, res) => {
    try { res.set('Content-Disposition', 'attachment; filename="neuroplaneta-datos-cuenta.json"').json(await privacy.export(res.locals.account)); } catch { res.status(503).json({ error: 'No se pudo preparar la copia de datos de la cuenta.' }); }
  });
  router.post('/privacy/requests', async (req, res) => {
    if (!body(req, ['kind', 'version', 'understood', 'details']) || !RIGHTS.includes(req.body.kind) || req.body.version !== POLICY_VERSION || req.body.understood !== true || (req.body.details !== undefined && (typeof req.body.details !== 'string' || req.body.details.length > 500))) return res.sendStatus(400);
    if (req.body.kind === 'rectification' && !req.body.details?.trim()) return res.status(400).json({ error: 'Indicá qué dato de tu cuenta querés corregir, sin incluir información del niño.' });
    try { res.status(202).json({ id: await privacy.request(res.locals.account, req.body.kind, POLICY_VERSION, req.body.details?.trim()), status: 'open' }); } catch { res.status(503).json({ error: 'La solicitud no pudo registrarse. Usá el contacto de soporte.' }); }
  });
  router.get('/privacy/admin/requests', async (_req, res) => {
    if (!res.locals.account.admin) return res.sendStatus(403);
    try { res.json({ requests: await privacy.list() }); } catch { res.sendStatus(503); }
  });
  router.post('/privacy/admin/maintenance', async (req, res) => {
    if (!res.locals.account.admin) return res.sendStatus(403);
    if (!body(req, ['confirmation']) || req.body.confirmation !== 'DEPURAR REGISTROS VENCIDOS') return res.sendStatus(400);
    try { res.json({ deleted: await privacy.maintain() }); } catch { res.sendStatus(503); }
  });
  router.post('/privacy/admin/requests/:id', async (req, res) => {
    if (!res.locals.account.admin) return res.sendStatus(403);
    if (!/^[a-f0-9]{64}$/.test(req.params.id) || !body(req, ['action', 'confirmation', 'resolution'])) return res.sendStatus(400);
    try {
      if (req.body.action === 'suppress' && req.body.confirmation === 'ELIMINAR DATOS SOLICITADOS') await privacy.suppress(req.params.id);
      else if (req.body.action === 'close' && req.body.confirmation === 'GESTION COMPLETADA' && typeof req.body.resolution === 'string' && req.body.resolution.trim().length >= 10 && req.body.resolution.length <= 500) await privacy.close(req.params.id, req.body.resolution.trim());
      else return res.sendStatus(400);
      res.json({ done: true });
    } catch { res.status(409).json({ error: 'No se completó la gestión. Verificá la solicitud y cancelá cualquier suscripción antes de eliminar la cuenta.' }); }
  });
  return router;
}
