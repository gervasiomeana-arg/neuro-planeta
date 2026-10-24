import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore/lite';
import { adultAuth, adultSessionEpoch, adultSessionIsCurrent } from './firebase';
import AdminAccessPanel from './AdminAccessPanel';
import SubscriptionPanel from './SubscriptionPanel';
// Secondary interface check only. This public digest is not authorization.
const phraseDigest = 'cfe1b5996f42316f9f8fa9d550f2b2b1c3379955898e8f4a0b1452a49da31801';
export default function AdminWorkspace({ user }: { user: User | null }) {
  const [phrase, setPhrase] = useState(''), [allowed, setAllowed] = useState(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [tab, setTab] = useState<'history' | 'price'>('history');
  const version = useRef(0), mounted = useRef(false), running = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const lock = () => { version.current++; setAllowed(false); setPhrase(''); setMessage(''); };
    const hidden = () => { if (document.hidden) lock(); };
    document.addEventListener('visibilitychange', hidden); window.addEventListener('pagehide', lock);
    return () => { mounted.current = false; version.current++; document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', lock); };
  }, []);
  async function unlock() {
    if (!user?.emailVerified || running.current) return;
    const submitted = phrase.trim(), epoch = adultSessionEpoch(), operation = version.current;
    const current = () => mounted.current && !document.hidden && operation === version.current && adultSessionIsCurrent(user.uid, epoch);
    running.current = true; setBusy(true); setPhrase(''); setMessage('');
    let phraseAccepted = false;
    try {
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(submitted));
      const digest = [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
      if (!current()) return;
      if (digest !== phraseDigest) { setMessage('La clave de administración no coincide. Revisá las mayúsculas.'); return; }
      phraseAccepted = true;
      const role = await getDoc(doc(getFirestore(adultAuth().app), 'admins', user.uid));
      if (!current()) return;
      if (role.data()?.active !== true) { setMessage('La clave es correcta, pero esta cuenta Google no está habilitada como administradora. Revisá la cuenta que figura arriba.'); return; }
      setAllowed(true);
    } catch { if (current()) setMessage(phraseAccepted
      ? 'La clave es correcta, pero no pudimos consultar el permiso en Firebase. Revisá la conexión; si persiste, cerrá sesión Google y volvé a ingresar con la cuenta administradora.'
      : 'No se pudo comprobar la clave en este navegador. Actualizá la página e intentá de nuevo.'); }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  if (!user?.emailVerified) return <p>Ingresá con tu cuenta de Google para abrir administración.</p>;
  if (!allowed) return <form onSubmit={event => { event.preventDefault(); void unlock(); }} className="space-y-3">
    <p>Acceso reservado a la cuenta administradora habilitada en Firebase.</p>
    <p>Cuenta Google: <strong>{user.email}</strong></p>
    <p>La clave de esta pantalla es independiente de Google. No ingreses tu contraseña de Google.</p>
    <label className="block">Clave de administración<input autoComplete="off" type="password" maxLength={128} disabled={busy} value={phrase} onChange={event => setPhrase(event.target.value)} className="block w-full border rounded-lg p-2" /></label>
    <button className="np-account-button np-account-primary" disabled={busy || !phrase} type="submit">Ingresar a administración</button>
    {message && <p role="status">{message}</p>}
  </form>;
  return <div className="space-y-4">
    <div role="tablist" aria-label="Administración"><button className="np-account-button np-admin-history" role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>Historial de ingresos</button><button className="np-account-button np-admin-price" role="tab" aria-selected={tab === 'price'} onClick={() => setTab('price')}>Suscripción mensual</button></div>
    {tab === 'history' ? <AdminAccessPanel user={user} /> : <SubscriptionPanel user={user} />}
    <button className="np-account-button np-admin-lock" type="button" onClick={() => { version.current++; setAllowed(false); setPhrase(''); }}>Bloquear administración</button>
  </div>;
}
