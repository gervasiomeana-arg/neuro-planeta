import { useEffect, useState, type ReactNode } from 'react';
import { POLICY_VERSION } from '../../commercial/policy';
import { useCommercial } from './CommercialContext';
import { accountRequest } from './api';
import { useDeviceProtection } from '../data/DeviceProtection';
import { useProfileStorage } from '../data/ProfileStorageContext';
import BackupPanel from '../data/BackupPanel';
import BillingPanel from './BillingPanel';
import PrivacyControls from './PrivacyControls';
import MessagesPanel from '../support/MessagesPanel';
import LegalLinks from './LegalLinks';
import { adultAuth } from '../auth/firebase';
export default function CommercialGate({ children }: { children: ReactNode }) {
  const { config, error, loaded, retry } = useCommercial(), protection = useDeviceProtection(), storage = useProfileStorage();
  const consentKey = `np_privacy_consent:${adultAuth().currentUser?.uid || 'legacy'}:${POLICY_VERSION}`;
  const revokedKey = `np_privacy_revoked:${adultAuth().currentUser?.uid || 'legacy'}`;
  const [accepted, setAccepted] = useState(() => { try { return !!localStorage.getItem(consentKey); } catch { return false; } });
  const [revoked, setRevoked] = useState(() => { try { return localStorage.getItem(revokedKey) === 'true'; } catch { return true; } });
  const [consent, setConsent] = useState(false), [consentError, setConsentError] = useState('');
  const [access, setAccess] = useState(false), [message, setMessage] = useState(''), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const changed = () => { setRevoked(true); setAccepted(false); setConsent(false); setConsentError(''); };
    window.addEventListener('np-privacy-revoked', changed);
    return () => window.removeEventListener('np-privacy-revoked', changed);
  }, []);
  useEffect(() => {
    if (!loaded || !config.enforce) return;
    let alive = true, timer: ReturnType<typeof setTimeout> | undefined;
    setAccess(false);
    const check = async () => {
      try {
        const data = await accountRequest('commercial/status');
        if (!alive) return;
        if (data.mode !== config.mode || data.enforced !== true) throw new Error('La configuración comercial cambió. Recargá la página.');
        setAccess(data.hasAccess === true); setMessage(data.hasAccess ? '' : 'El acceso de pago necesita un período vigente confirmado. Tus perfiles se conservan.');
        const wait = data.paidThrough > Date.now() ? Math.min(300000, data.paidThrough - Date.now()) : 300000;
        timer = setTimeout(() => { if (alive) void check(); }, Math.max(1000, wait));
      } catch (e) { if (alive) { setAccess(false); setMessage(e instanceof Error ? e.message : 'No se pudo verificar el acceso.'); } }
    };
    void check();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [loaded, config.enforce, config.mode, attempt]);
  const needsConsent = revoked || (loaded && storage.isolated && !accepted);
  const waiting = !loaded || !!error || needsConsent || (config.enforce && !access);
  if (!waiting) return <>{children}</>;
  const profiles = protection?.session?.profiles || [];
  return <main className="np-theme np-commercial-access"><section className="np-commercial-panel"><h1>Tu cuenta y tus datos</h1>
    {!loaded && !error && <p role="status">Consultando las condiciones de acceso…</p>}
    {error && <p role="alert">{error} <button type="button" className="np-account-button" onClick={retry}>Reintentar condiciones de acceso</button></p>}
    {needsConsent && <div><LegalLinks /><p>El adulto administra los datos del niño que está autorizado a acompañar. Podés usar apodos y evitar información innecesaria.</p><label><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />Soy adulto responsable o estoy autorizado, leí la política y consiento el registro de los datos del niño para estas actividades.</label><button type="button" className="np-account-button np-account-primary" disabled={!consent} onClick={() => {
      try { localStorage.setItem(consentKey, JSON.stringify({ version: POLICY_VERSION, acceptedAt: new Date().toISOString() })); localStorage.removeItem(revokedKey); setRevoked(false); setAccepted(true); setConsentError(''); } catch { setConsentError('No se pudo guardar la aceptación; revisá el almacenamiento del navegador.'); }
    }}>Aceptar y continuar</button>{consentError && <p role="status">{consentError}</p>}</div>}
    {config.enforce && <><p role="status">{message || 'Verificando la suscripción…'}</p><button type="button" className="np-account-button" onClick={() => setAttempt(n => n + 1)}>Revisar acceso</button></>}
    <BillingPanel onAccess={() => setAttempt(n => n + 1)} />
    <BackupPanel profiles={profiles} />
    <MessagesPanel />
    <PrivacyControls profiles={profiles} onErase={protection?.session ? async id => {
      const vault = protection.session!;
      await protection.exclusive(async () => { await vault.save(vault.profiles.filter((p: { id: string }) => p.id !== id)); });
    } : undefined} />
  </section></main>;
}
