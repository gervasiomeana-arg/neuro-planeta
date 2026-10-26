import { useEffect, useRef, useState, type ReactNode } from 'react';
import { GoogleAuthProvider, getIdTokenResult, onAuthStateChanged, signInWithPopup, type User } from 'firebase/auth';
import { adultAuth, adultSessionEpoch, adultSessionIsCurrent, endAdultSession } from './firebase';
import { recordAdultAccess } from './accessHistory';
import AdminWorkspace from './AdminWorkspace';
import { AccountProfileBoundary } from '../data/ProfileStorageContext';
import { FAMILY_PLAN } from './commercial';
import { useCommercial } from '../commercial/CommercialContext';
import LegalLinks from '../commercial/LegalLinks';
export default function GoogleAccessShell({ children }: { children: ReactNode }) {
  const { config } = useCommercial();
  const [required, setRequired] = useState<boolean | null>(null), [policyError, setPolicyError] = useState(false);
  const [user, setUser] = useState<User | null>(null), [googleVerified, setGoogleVerified] = useState(false), [ready, setReady] = useState(false);
  const [consent, setConsent] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [administration, setAdministration] = useState(false);
  const mounted = useRef(false), running = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void fetch(import.meta.env.BASE_URL + 'access-policy.json', { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Política no disponible');
      const policy = await response.json();
      if (typeof policy?.requireGoogle !== 'boolean') throw new Error('Política inválida');
      if (mounted.current) setRequired(policy.requireGoogle);
    }).catch(() => { if (mounted.current && !controller.signal.aborted) setPolicyError(true); });
    const open = () => setAdministration(true);
    const lock = () => { setUser(null); setGoogleVerified(false); setAdministration(false); setConsent(false); };
    const signoutFailed = () => setMessage('No se pudo cerrar la sesión. Cerrá la pestaña antes de compartirla.');
    window.addEventListener('np-open-administration', open);
    window.addEventListener('np-adult-lock', lock);
    window.addEventListener('np-adult-signout-failed', signoutFailed);
    let unsubscribe: (() => void) | undefined, version = 0;
    try {
      const auth = adultAuth();
      unsubscribe = onAuthStateChanged(auth, account => {
        const currentVersion = ++version;
        setUser(null); setGoogleVerified(false); setReady(false); setAdministration(false); setConsent(false);
        if (!account) { setReady(true); return; }
        const epoch = adultSessionEpoch();
        void getIdTokenResult(account).then(result => {
          if (!mounted.current || currentVersion !== version || !adultSessionIsCurrent(account.uid, epoch)) return;
          const provider = (result.claims.firebase as { sign_in_provider?: string } | undefined)?.sign_in_provider;
          setUser(account); setGoogleVerified(account.emailVerified && result.claims.email_verified === true && provider === 'google.com');
          setReady(true);
          if (account.emailVerified && provider === 'google.com') void recordAdultAccess(account).catch(() => {
            if (mounted.current && currentVersion === version) setMessage('No se pudo confirmar el registro del acceso.');
          });
        }).catch(() => { if (mounted.current && currentVersion === version) setReady(true); });
      });
    } catch { setReady(true); }
    return () => { mounted.current = false; version++; controller.abort(); unsubscribe?.(); window.removeEventListener('np-open-administration', open); window.removeEventListener('np-adult-lock', lock); window.removeEventListener('np-adult-signout-failed', signoutFailed); };
  }, []);
  async function login() {
    if (!consent || running.current) return;
    running.current = true; setBusy(true); setMessage('');
    try {
      const provider = new GoogleAuthProvider(); provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(adultAuth(), provider);
    } catch { if (mounted.current) setMessage('No se pudo ingresar con Google. Permití la ventana emergente y revisá que el acceso esté habilitado para esta app.'); }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  const entry = <section aria-label="Ingreso con Google" className="np-theme max-w-lg mx-auto rounded-2xl border bg-[#fcf7ed] p-6 space-y-4 text-[#293b3a]">
    <h1 className="text-2xl font-bold">Bienvenido a NeuroPlaneta</h1>
    <p>Un adulto debe ingresar con Google para abrir la app. Google solicita sus credenciales en su propia ventana.</p>
    <p><strong>{FAMILY_PLAN.name}: {FAMILY_PLAN.display}.</strong> {config.checkoutReady ? 'La contratación y la renovación se autorizan en PayPal; ingresar no genera un cargo.' : 'El cobro de suscripciones todavía no está habilitado; ingresar no genera un cargo.'}</p>
    <LegalLinks />
    <p>Registramos correo adulto, método de acceso y fecha del servidor para administración. No se registran actividades ni datos del niño.</p>
    <label className="flex gap-2"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={busy} />Soy adulto y acepto ingresar con Google y registrar este acceso.</label>
    <button className="np-account-button np-account-primary" type="button" disabled={busy || !consent || !ready || required === null} onClick={login}>{busy ? 'Ingresando…' : 'Continuar con Google'}</button>
    {user && !googleVerified && <p>Esta sesión necesita autenticación con Google.</p>}
    {policyError && <p role="alert">No se pudo verificar la política de acceso. Revisá la conexión y recargá la página.</p>}
    {message && <p role="status">{message}</p>}
  </section>;
  const canEnter = required === false || (required === true && ready && googleVerified);
  return <>
    <div inert={administration}>
      {canEnter ? <>{required && <div className="np-theme p-2 flex flex-wrap gap-2"><button className="np-account-button" onClick={() => setAdministration(true)}>Administración</button><button className="np-account-button" onClick={() => void endAdultSession().catch(() => setMessage('No se pudo cerrar la sesión. Cerrá la pestaña antes de compartirla.'))}>Cerrar sesión Google</button>{message && <p role="status">{message}</p>}</div>}{required && user ? <AccountProfileBoundary key={user.uid} user={user}>{children}</AccountProfileBoundary> : children}</> : <main className="np-theme min-h-dvh bg-[#e8ede3] p-5 pt-20"><button type="button" className="np-account-button absolute top-4 left-4" onClick={() => setAdministration(true)}>Administración</button>{entry}</main>}
    </div>
    {administration && <div role="dialog" aria-modal="true" aria-label="Administración" id="np-administration" data-adult-secure="true" className="np-theme fixed inset-0 z-[200] bg-[#e8ede3] p-5 overflow-y-auto text-[#293b3a]">
      <div className="max-w-3xl mx-auto space-y-4"><h2 className="text-2xl font-bold">Administración</h2><button className="np-account-button np-admin-return" onClick={() => setAdministration(false)}>Volver a la app</button>
        {(!user?.emailVerified || (required && !googleVerified)) ? entry : <AdminWorkspace key={user.uid} user={user} />}
      </div>
    </div>}
  </>;
}
