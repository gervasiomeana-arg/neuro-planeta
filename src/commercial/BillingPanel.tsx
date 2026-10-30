import { useEffect, useRef, useState } from 'react';
import { POLICY_VERSION } from '../../commercial/policy';
import { useCommercial } from './CommercialContext';
import { accountRequest } from './api';
import LegalLinks from './LegalLinks';
export default function BillingPanel({ onAccess }: { onAccess?: (allowed: boolean) => void }) {
  const { config, error, retry } = useCommercial();
  const [status, setStatus] = useState<any>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [privacy, setPrivacy] = useState(false), [terms, setTerms] = useState(false), [recurring, setRecurring] = useState(false), [cancel, setCancel] = useState(false);
  const mounted = useRef(false), running = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function perform(action: 'status' | 'refresh' | 'checkout' | 'cancel' | 'trial') {
    if (running.current) return;
    running.current = true; setBusy(true); setMessage('');
    try {
      const body = action === 'checkout' ? { privacyVersion: privacy && POLICY_VERSION, termsVersion: terms && POLICY_VERSION, adultResponsible: privacy, recurringPayment: recurring } : action === 'trial' ? { privacyVersion: privacy && POLICY_VERSION, termsVersion: terms && POLICY_VERSION, adultResponsible: privacy } : action === 'cancel' ? { confirmation: 'CANCELAR RENOVACION' } : {};
      const result = await accountRequest(`commercial/${action}`, action === 'status' ? undefined : body);
      if (!mounted.current) return;
      if (action === 'checkout') {
        const url = new URL(result.approvalUrl), host = config.mode === 'live' ? 'www.paypal.com' : 'www.sandbox.paypal.com';
        if (url.protocol !== 'https:' || url.hostname !== host || url.username || url.password || url.port) throw new Error('No se pudo verificar el enlace de PayPal.');
        window.location.assign(url.href); return;
      }
      setStatus(result); onAccess?.(result.hasAccess === true);
      setMessage(action === 'cancel' ? 'PayPal confirmó la cancelación de la renovación.' : result.paid ? 'Pago verificado en el servidor.' : result.trialActive ? 'Prueba gratuita activa. No se generó una suscripción ni un cobro.' : result.trialUsed ? 'La prueba gratuita finalizó. Podés contratar el Plan Familia para continuar.' : config.mode === 'off' ? 'Los cobros todavía no están habilitados.' : 'Todavía no hay un período pagado vigente confirmado.');
      setCancel(false);
    } catch (e) { if (mounted.current) setMessage(e instanceof Error ? e.message : 'No se pudo confirmar la operación.'); }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  useEffect(() => { void perform('status'); }, []);
  const labels: Record<string, string> = { NONE: 'Sin suscripción', CREATING: 'Alta en comprobación', APPROVAL_PENDING: 'Pendiente de autorización', APPROVED: 'Autorización recibida; falta confirmar el pago', ACTIVE: 'Suscripción activa', CANCELLED: 'Renovación cancelada', SUSPENDED: 'Renovación suspendida', EXPIRED: 'Suscripción finalizada' };
  return <section className="np-commercial-panel" aria-label="Mi suscripción">
    <h3>Mi suscripción · Plan Familia</h3><p>USD 20 por mes. La renovación requiere tu autorización en PayPal.</p>
    {config.mode === 'sandbox' && <p role="status">Modo de prueba de PayPal: usá únicamente cuentas de prueba. No habilita acceso de pago en producción.</p>}
    {config.mode === 'off' && <p>La contratación todavía no está habilitada. Ingresar no genera un cargo.</p>}
    <p>Probá gratis durante 2 días (48 horas), una sola vez por cuenta adulta. Sin tarjeta ni PayPal y sin cobro automático al finalizar.</p>
    <LegalLinks />
    {error && <p role="alert">{error} <button type="button" className="np-account-button" onClick={retry}>Reintentar consulta comercial</button></p>}
    <button type="button" disabled={busy} className="np-account-button" onClick={() => void perform('status')}>Consultar mi suscripción</button>
    {status && <div>{status.trialUsed && <p>{status.trialActive ? 'Prueba gratuita disponible hasta' : 'Prueba gratuita finalizada el'}: {new Date(status.trialEndsAt).toLocaleString('es-AR', { hour12: false })}.</p>}<p>{labels[status.status] || 'Estado pendiente de verificar'}</p>{status.paidThrough > 0 && <p>Período pagado hasta: {new Date(status.paidThrough).toLocaleString('es-AR', { hour12: false })}.</p>}{status.reviewRequired && <p>El pago necesita revisión de soporte. No inicies otra compra.</p>}
      {status.hasSubscription && <button type="button" disabled={busy} className="np-account-button" onClick={() => void perform('refresh')}>Verificar pago con PayPal</button>}
    </div>}
    {config.checkoutReady && (!status || !status.hasSubscription || status.status === 'APPROVAL_PENDING' || (['CANCELLED', 'EXPIRED'].includes(status.status) && status.paidThrough <= Date.now())) && <div className="np-commercial-consents">
      <label><input type="checkbox" checked={privacy} onChange={e => setPrivacy(e.target.checked)} disabled={busy} />Soy adulto responsable, estoy autorizado a gestionar los datos del niño y acepto la política de privacidad.</label>
      <label><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} disabled={busy} />Leí y acepto las condiciones de uso, prueba gratuita y suscripción.</label>
      {status?.trialEligible && <button type="button" className="np-account-button np-account-primary" disabled={busy || !privacy || !terms || !!error} onClick={() => void perform('trial')}>Iniciar prueba gratuita · 2 días</button>}
      <label><input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} disabled={busy} />Autorizo USD 20 mensuales hasta cancelar la renovación en NeuroPlaneta o PayPal.</label>
      <button type="button" className="np-account-button np-account-primary" disabled={busy || !privacy || !terms || !recurring || !!error} onClick={() => void perform('checkout')}>Continuar a PayPal · USD 20 mensuales</button>
    </div>}
    {status?.approvalUrl && <p>Hay un alta pendiente. Consultá PayPal y verificá su estado antes de volver a contratar.</p>}
    {status?.hasSubscription && !status.renewalCancelled && <div>
      <label><input type="checkbox" checked={cancel} onChange={e => setCancel(e.target.checked)} disabled={busy} />Quiero cancelar la renovación; conservaré el período ya pagado y mis perfiles.</label>
      <button type="button" className="np-account-button" disabled={busy || !cancel} onClick={() => void perform('cancel')}>Cancelar renovación en PayPal</button>
    </div>}
    <p><a href="https://www.paypal.com/myaccount/autopay" target="_blank" rel="noopener noreferrer">Gestionar pagos automáticos en PayPal</a></p>
    {message && <p role="status">{message}</p>}
  </section>;
}
