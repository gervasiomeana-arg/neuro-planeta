import { useEffect, useRef, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, reload, getIdToken, GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { adultAuth, endAdultSession } from './firebase';
import FamilyLinkPanel from '../data/FamilyLinkPanel';
import FamilyVaultPanel from '../data/FamilyVaultPanel';
import AdminAccessPanel from './AdminAccessPanel';
import { recordAdultAccess } from './accessHistory';
import type { LocalLinkProfile } from '../data/familyLinkData';
import { RECOVERY_MESSAGE, recoveryErrorMessage } from './accountFeedback';

export default function AdultAccountPanel({ profile, localProfile }: { profile: LocalLinkProfile; localProfile?: unknown }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');
  const mounted = useRef(false);
  const running = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const signoutFailure = () => setMessage('No se pudo cerrar la sesión automáticamente. Cerrá esta pestaña antes de compartir el dispositivo.');
    window.addEventListener('np-adult-signout-failed', signoutFailure);
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChanged(adultAuth(), account => {
        if (!mounted.current) return;
        setUser(account); setReady(true);
        if (!account) { setEmail(''); setPassword(''); setConsent(false); }
      });
    } catch { setMessage('No se pudo preparar el acceso. Revisá que el navegador permita guardar la sesión.'); }
    return () => { mounted.current = false; unsubscribe?.(); window.removeEventListener('np-adult-signout-failed', signoutFailure); };
  }, []);
  async function perform(action: 'login' | 'register' | 'reset' | 'verify' | 'logout' | 'refresh' | 'google') {
    if (running.current) return;
    if (['login', 'register', 'reset'].includes(action) && !email.trim()) { setMessage('Ingresá tu correo electrónico.'); return; }
    if (action === 'register' && (!consent || password.length < 12)) { setMessage('Confirmá que sos adulto y usá una contraseña de al menos 12 caracteres.'); return; }
    if (action === 'google' && !consent) { setMessage('Confirmá que sos adulto antes de continuar con Google.'); return; }
    const submittedPassword = password;
    running.current = true; setBusy(true); setPassword(''); setMessage('');
    try {
      const auth = adultAuth();
      if (action === 'login') {
        const result = await signInWithEmailAndPassword(auth, email.trim(), submittedPassword);
        await recordAdultAccess(result.user).catch(() => { if (mounted.current) setMessage('Sesión iniciada. No se pudo confirmar el registro del acceso.'); });
      }
      if (action === 'google') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        await recordAdultAccess(result.user).catch(() => { if (mounted.current) setMessage('Sesión iniciada. No se pudo confirmar el registro del acceso.'); });
      }
      if (action === 'register') {
        const result = await createUserWithEmailAndPassword(auth, email.trim(), submittedPassword);
        await sendEmailVerification(result.user);
        if (mounted.current) setMessage('Cuenta creada. Revisá tu correo para verificar la dirección.');
      }
      if (action === 'reset') {
        await sendPasswordResetEmail(auth, email.trim());
        if (mounted.current) setMessage(RECOVERY_MESSAGE);
      }
      if (action === 'verify' && auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        if (mounted.current) setMessage('Revisá tu correo para verificar la dirección.');
      }
      if (action === 'refresh' && auth.currentUser) {
        await reload(auth.currentUser); await getIdToken(auth.currentUser, true);
        await recordAdultAccess(auth.currentUser).catch(() => {});
        if (mounted.current) { setUser(auth.currentUser); setMessage(auth.currentUser.emailVerified ? 'Correo confirmado. Ya podés vincular la ficha.' : 'El correo todavía figura sin verificar.'); }
      }
      if (action === 'logout') {
        await endAdultSession();
        if (mounted.current) { setEmail(''); setConsent(false); setMessage('Sesión adulta cerrada.'); }
      }
    } catch (error) {
      if (mounted.current) setMessage(action === 'reset' ? recoveryErrorMessage(error) : action === 'register'
        ? 'No se pudo completar el registro o enviar la verificación. Si ya tenés cuenta, probá ingresar o recuperar el acceso.'
        : action === 'google' ? 'No se pudo iniciar con Google. Permití la ventana emergente; si ya tenés cuenta con contraseña, ingresá con ella. La configuración de Google debe estar habilitada en Firebase.'
        : 'No se pudo completar la solicitud. Revisá los datos y la conexión o intentá más tarde.');
    } finally {
      running.current = false;
      if (mounted.current) { setPassword(''); setBusy(false); }
    }
  }
  return <section aria-label="Cuenta adulta" className="np-adult-account rounded-2xl border p-4 space-y-3 text-sm">
    <h3 className="font-bold">Cuenta adulta</h3>
    <p>Los perfiles de este dispositivo no se vinculan automáticamente. Podés guardar una ficha mínima de apodo y edad con confirmación explícita. Fotos y avances siguen locales; no hay sincronización del perfil completo.</p>
    <p>La sesión adulta se cierra tras 15 minutos sin actividad en este panel. Jugar en el espacio infantil no prolonga la sesión.</p>
    {!ready && <p role="status">Preparando acceso…</p>}
    {user ? <>
      <p>Sesión iniciada: <strong>{user.email}</strong></p>
      <p>{user.emailVerified ? 'Correo verificado.' : 'Falta verificar el correo. Esta sesión no habilita almacenamiento de perfiles en la nube.'}</p>
      {!user.emailVerified && <button className="np-account-button" type="button" disabled={busy} onClick={() => perform('verify')}>Reenviar verificación</button>}
      {!user.emailVerified && <button className="np-account-button" type="button" disabled={busy} onClick={() => perform('refresh')}>Ya verifiqué mi correo</button>}
      {user.emailVerified && profile.id && <FamilyLinkPanel key={`${user.uid}:${profile.id}:${profile.selectedAge}`} user={user} profile={profile} />}
      {user.emailVerified && profile.id && localProfile && <FamilyVaultPanel key={`vault:${user.uid}:${profile.id}`} user={user} profile={localProfile} />}
      {user.emailVerified && <AdminAccessPanel key={`admin:${user.uid}`} user={user} />}
      <button className="np-account-button" type="button" disabled={busy} onClick={() => perform('logout')}>Cerrar sesión adulta</button>
    </> : <form onSubmit={event => { event.preventDefault(); void perform('login'); }} className="space-y-3">
      <label className="block">Correo del adulto<input type="email" required autoComplete="username" maxLength={254} disabled={busy || !ready} value={email} onChange={event => setEmail(event.target.value)} className="block w-full border rounded-lg p-2" /></label>
      <label className="block">Contraseña de la cuenta<input type="password" required autoComplete="current-password" maxLength={4096} disabled={busy || !ready} value={password} onChange={event => setPassword(event.target.value)} className="block w-full border rounded-lg p-2" /></label>
      <label className="flex gap-2"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} />Soy adulto y autorizo usar este correo para crear mi cuenta en Firebase. No ingreso datos del niño.</label>
      <p>Al ingresar se registra tu correo adulto, método de acceso y fecha del servidor, visibles solo para administración. No se registra actividad infantil.</p>
      <div className="flex flex-wrap gap-3">
        <button className="np-account-button np-account-primary" type="button" disabled={busy || !ready || !consent} onClick={() => perform('google')}>Continuar con Google</button>
        <button className="np-account-button" type="submit" disabled={busy || !ready}>Ingresar a mi cuenta</button>
        <button className="np-account-button np-account-primary" type="button" disabled={busy || !ready || !consent || password.length < 12 || !email.trim()} onClick={() => perform('register')}>Crear cuenta adulta</button>
        <button className="np-account-button" type="button" disabled={busy || !ready || !email.trim()} onClick={() => perform('reset')}>Olvidé mi contraseña</button>
      </div>
      <p>Para crear una cuenta, usá al menos 12 caracteres. La contraseña no se guarda en los perfiles. La sesión queda en esta pestaña; cerrá sesión antes de compartir el dispositivo.</p>
    </form>}
    {message && <p role="status">{message}</p>}
  </section>;
}
