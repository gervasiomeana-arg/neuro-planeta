/** Private Cloud Shell lab. No Firebase, production routes or real billing. */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, renameSync, openSync, closeSync, unlinkSync, fsyncSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BillingService } from '../server/commercial/service';
import { PayPalClient, type Json } from '../server/commercial/paypal';
import type { CommercialConfig } from '../server/commercial/config';
import type { BillingRepository } from '../server/commercial/store';
import { DEFAULT_CONFIG, POLICY_VERSION } from '../commercial/policy';

const PROJECT = 'gen-lang-client-0958943545';
const UID = 'sandbox-lab-only';
export function previewOrigin(webHost: string) {
  if (!/^[a-z0-9][a-z0-9.-]*\.(cloudshell\.dev|cloudshell\.googleusercontent\.com)$/.test(webHost)) throw Error('Cloud Shell requerido.');
  return `https://8080-${webHost}`;
}
function secret(name: string) {
  let value: string;
  try { value = execFileSync('gcloud', ['secrets', 'versions', 'access', 'latest', '--secret=' + name, '--project=' + PROJECT, '--quiet'], { encoding: 'utf8', timeout: 45000, stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch { throw Error('No se pudieron leer las credenciales de prueba. Revisá la autorización de Google.'); }
  if (!/^[A-Za-z0-9_-]{20,512}$/.test(value)) throw Error('Formato de credenciales de prueba no válido.');
  return value;
}
export class LabRepository implements BillingRepository {
  private record: Json | null;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private directory: string, private fingerprint: string, private planId: string) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const file = join(directory, 'lab-account.json');
    let state: Json | null = null;
    try { state = JSON.parse(readFileSync(file, 'utf8')); }
    catch (e: any) { if (e.code !== 'ENOENT') throw Error('Estado de prueba ilegible. Conservalo para revisión.'); }
    if (state && (state.environment !== 'sandbox' || state.fingerprint !== fingerprint || state.planId !== planId)) throw Error('Estado de otra aplicación o plan. No se inició otra suscripción.');
    this.record = state?.record || null;
  }
  async get(uid: string) { if (uid !== UID) throw Error('Cuenta distinta.'); return structuredClone(this.record); }
  async change(uid: string, update: (r: Json | null) => Json) {
    const work = this.queue.then(async () => {
      const next = { ...update(await this.get(uid)), uid, environment: 'sandbox' };
      const temp = join(this.directory, 'lab-account.tmp');
      const fd = openSync(temp, 'wx', 0o600);
      try { writeFileSync(fd, JSON.stringify({ environment: 'sandbox', fingerprint: this.fingerprint, planId: this.planId, record: next })); fsyncSync(fd); } finally { closeSync(fd); }
      renameSync(temp, join(this.directory, 'lab-account.json'));
      this.record = next;
      return structuredClone(next);
    });
    this.queue = work.catch(() => {}); return work;
  }
  async bind(custom: string, sub: string, uid: string) {
    const r = await this.get(uid);
    if (!r || custom !== r.checkoutKey || (sub && r.subscriptionId && sub !== r.subscriptionId)) throw Error('Vínculo distinto.');
  }
  async owner(sub: string, custom?: string) { return this.record && (this.record.subscriptionId === sub || this.record.checkoutKey === custom) ? UID : null; }
  async eventDone(_id: string) { return false; }
  async finishEvent(_id: string, _type: string): Promise<void> { throw Error('Webhooks no habilitados en Cloud Shell.'); }
  async receipt(_uid: string, _record: Json) { /* No separate receipts or personal data in this lab. */ }
  async paymentOwner(id: string) { return this.record?.paymentId === id ? UID : null; }
}
export function labConfig(origin: string, clientId: string, secretValue: string, planId: string): CommercialConfig {
  if (!/^P-[A-Z0-9]{10,40}$/.test(planId)) throw Error('Plan de prueba no válido.');
  // Explicit test seam: bypass legal/production readiness only in this separate executable.
  // Enforcement here tests the real BillingService decision on one synthetic account.
  return { ...DEFAULT_CONFIG, mode: 'sandbox', origin, clientId, secret: secretValue, planId,
    webhookId: '', assetSecret: '', checkoutReady: true, legalReady: false, enforce: true };
}
export function labHandler(service: BillingService, origin: string, csrf = randomBytes(32).toString('hex')) {
  let busy = false;
  return async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${csrf}'; style-src 'nonce-${csrf}'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`);
    const reply = (code: number, body: unknown) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
    const account = { uid: UID, email: '', admin: false, authTime: Date.now() };
    try {
      const url = new URL(req.url || '/', origin);
      if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(page(csrf)); return;
      }
      if (req.method !== 'POST' || !['/checkout', '/refresh', '/cancel'].includes(url.pathname)) return reply(404, { error: 'Ruta no disponible.' });
      if (req.headers.origin !== origin || req.headers['x-lab-token'] !== csrf || req.headers['sec-fetch-site'] === 'cross-site' || req.headers['content-type'] !== 'application/json') return reply(403, { error: 'Solicitud no autorizada.' });
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 2048) return reply(413, { error: 'Solicitud demasiado grande.' }); }
      let body: Json;
      try { body = JSON.parse(raw); } catch { return reply(400, { error: 'Solicitud no válida.' }); }
      if (!body || Array.isArray(body) || typeof body !== 'object') return reply(400, { error: 'Solicitud no válida.' });
      if (busy) return reply(409, { error: 'Esperá a que termine la operación anterior.' });
      busy = true;
      try {
        if (url.pathname === '/checkout') {
          if (Object.keys(body).some(k => k !== 'consent') || body.consent !== true) return reply(400, { error: 'Confirmá que usás una cuenta Sandbox.' });
          // One subscription per lab state, including cancellation. No reset endpoint.
          const existing = await service.status(account);
          if (existing.hasSubscription) return reply(409, { error: 'Ya existe un alta. Consultá su estado; no se inició otra.' });
          return reply(200, await service.checkout(account, { termsVersion: POLICY_VERSION, privacyVersion: POLICY_VERSION, adultResponsible: true, recurringPayment: true }));
        }
        if (url.pathname === '/cancel') {
          if (Object.keys(body).some(k => k !== 'confirmation') || body.confirmation !== 'CANCELAR PRUEBA') return reply(400, { error: 'Falta la confirmación de cancelación de prueba.' });
          return reply(200, await service.cancel(account));
        }
        if (Object.keys(body).length) return reply(400, { error: 'Solicitud no válida.' });
        return reply(200, await service.status(account, true));
      } finally { busy = false; }
    } catch { reply(503, { error: 'No se confirmó la operación Sandbox. Consultá el estado antes de reintentar. Conservá los archivos de prueba.' }); }
  };
}
function page(nonce: string) {
  return `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NeuroPlaneta · Prueba PayPal</title>
<style nonce="${nonce}">body{font:18px system-ui;background:#f4f5ec;color:#264e43;margin:0}main{max-width:700px;margin:32px auto;padding:24px}button,input{font:inherit}button{padding:14px;margin:10px 4px 10px 0;border:1px solid #547864;border-radius:12px;background:#e3ebdb;color:#264e43}button:disabled{opacity:.5}label{display:block;padding:16px 0}output{display:block;white-space:pre-wrap;padding:20px;border:1px solid #aaa;border-radius:12px}small{display:block;line-height:1.5}</style>
<main><p>SOLO SANDBOX · SIN DINERO REAL</p><h1>Prueba de suscripción</h1><p>USD 20 por mes, con cuenta compradora ficticia.</p><small>Esta pantalla privada usa el motor de cobros de NeuroPlaneta con una cuenta técnica separada. No accede a Firebase ni a perfiles de familias. No verifica todavía notificaciones automáticas ni Google dentro de la app.</small>
<label><input type="checkbox" id="consent"> Confirmo que voy a usar únicamente mi cuenta Personal Sandbox para autorizar una suscripción mensual de prueba.</label>
<button id="checkout" disabled>Crear suscripción de prueba</button><button id="refresh">Consultar estado en PayPal</button>
<p id="resume"></p><output id="status" aria-live="polite">Consultá el estado para comenzar. Volver de PayPal no confirma el pago.</output>
<h2>Cancelar la prueba</h2><label>Escribí CANCELAR PRUEBA <input id="confirmation" autocomplete="off"></label><button id="cancel" disabled>Cancelar renovación de prueba</button><p>La cancelación conserva el período de prueba ya pagado. No borres los archivos hasta confirmar CANCELLED.</p></main>
<script nonce="${nonce}">
const token=${JSON.stringify(nonce)};const $=id=>document.getElementById(id);let working=false,hasSubscription=false;
function controls(){ $('checkout').disabled=working||hasSubscription||!$('consent').checked;$('refresh').disabled=working;$('cancel').disabled=working||!hasSubscription||$('confirmation').value!=='CANCELAR PRUEBA'; }
$('consent').onchange=controls;$('confirmation').oninput=controls;
async function action(path,body){working=true;controls();$('status').textContent='Consultando…';try{const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Lab-Token':token},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(data.error||'No se confirmó la operación.');
if(data.approvalUrl&&path==='/checkout'){location.assign(data.approvalUrl);return;}
hasSubscription=!!data.hasSubscription;$('resume').replaceChildren();if(data.approvalUrl&&data.status==='APPROVAL_PENDING'){const link=document.createElement('a');link.textContent='Continuar la aprobación pendiente en PayPal Sandbox';link.href=data.approvalUrl;$('resume').append(link);}
$('status').textContent='Estado: '+data.status+'\\nPago confirmado: '+(data.paid?'sí':'no')+'\\nAcceso de la cuenta técnica: '+(data.hasAccess?'habilitado':'sin habilitar')+'\\nRenovación cancelada: '+(data.renewalCancelled?'sí':'no')+(data.paidThrough?'\\nPeríodo hasta: '+new Date(data.paidThrough).toLocaleString('es-AR'):'');
}catch(e){$('status').textContent=e.message;}finally{working=false;controls();}}
$('checkout').onclick=()=>action('/checkout',{consent:$('consent').checked});$('refresh').onclick=()=>action('/refresh',{});$('cancel').onclick=()=>action('/cancel',{confirmation:$('confirmation').value});action('/refresh',{});
</script></html>`;
}
export function main() {
  if (!['off', 'sandbox'].includes(process.env.PAYPAL_MODE || 'off')) throw Error('El laboratorio no admite live.');
  const origin = previewOrigin(process.env.WEB_HOST || '');
  const directory = join(homedir(), '.local/state/neuroplaneta-paypal-sandbox');
  const plan = JSON.parse(readFileSync(join(directory, 'plan.json'), 'utf8'));
  const clientId = secret('neuroplaneta-paypal-sandbox-client-id');
  const fingerprint = createHash('sha256').update(clientId).digest('hex');
  if (plan.fingerprint !== fingerprint) throw Error('Las credenciales no coinciden con el plan conservado.');
  const config = labConfig(origin, clientId, secret('neuroplaneta-paypal-sandbox-client-secret'), plan.plan_id);
  const lock = join(directory, 'lab.lock');
  const fd = openSync(lock, 'wx', 0o600); closeSync(fd);
  const clean = () => { try { unlinkSync(lock); } catch {} };
  process.once('exit', clean);
  process.once('SIGINT', () => process.exit(0)); process.once('SIGTERM', () => process.exit(0));
  const repo = new LabRepository(directory, fingerprint, plan.plan_id);
  const service = new BillingService(config, new PayPalClient(config), repo);
  const server = createServer(labHandler(service, origin));
  server.requestTimeout = 30000; server.headersTimeout = 10000;
  server.once('error', () => { console.error('No se pudo abrir el puerto 8080.'); process.exit(1); });
  server.listen(8080, '127.0.0.1', () => console.log('Laboratorio Sandbox listo. Abrí Vista previa web, puerto 8080. No se creó ninguna suscripción al iniciar.'));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch { console.error('No se pudo iniciar el laboratorio. Revisá Cloud Shell, autorización y estado conservado; no borres los archivos.'); process.exitCode = 1; }
}
