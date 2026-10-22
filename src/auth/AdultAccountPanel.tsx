import { useEffect, useRef, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { adultAuth } from './firebase';
import { RECOVERY_MESSAGE, recoveryErrorMessage } from './accountFeedback';

export default function AdultAccountPanel() {
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
      unsubscribe = onAuthStateChanged(adultAuth(), account => { if (mounted.current) { setUser(account); setReady(true); } });
    } catch { setMessage('No se pudo preparar el acceso. Revisá que el navegador permita guardar la sesión.'); }
    return () => { mounted.current = false; unsubscribe?.(); window.removeEventListener('np-adult-signout-failed', signoutFailure); };
  }, []);
  async function perform(action: 'login' | 'register' | 'reset' | 'verify' | 'logout') {
    if (running.current) return;
    if (['login', 'register', 'reset'].includes(action) && !email.trim()) { setMessage('Ingresá tu correo electrónico.'); return; }
    if (action === 'register' && (!consent || password.length < 12)) { setMessage('Confirmá que sos adulto y usá una contraseña de al menos 12 caracteres.'); return; }
    const submittedPassword = password;
    running.current = true; setBusy(true); setPassword(''); setMessage('');
    try {
      const auth = adultAuth();
      if (action === 'login') await signInWithEmailAndPassword(auth, email.trim(), submittedPassword);
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
      if (action === 'logout') {
        await signOut(auth);
        if (mounted.current) { setEmail(''); setConsent(false); setMessage('Sesión adulta cerrada.'); }
      }
    } catch (error) {
      if (mounted.current) setMessage(action === 'reset' ? recoveryErrorMessage(error) : action === 'register'
        ? 'No se pudo completar el registro o enviar la verificación. Si ya tenés cuenta, probá ingresar o recuperar el acceso.'
        : 'No se pudo completar la solicitud. Revisá los datos y la conexión o intentá más tarde.');
    } finally {
      running.current = false;
      if (mounted.current) { setPassword(''); setBusy(false); }
    }
  }
  return <section aria-label="Cuenta adulta" className="np-adult-account rounded-2xl border p-4 space-y-3 text-sm">
    <h3 className="font-bold">Cuenta adulta</h3>
    <p>Esta cuenta identifica al adulto. Los perfiles, fotos y avances de este dispositivo todavía no están vinculados a la cuenta ni se suben a Firebase. No se sincronizan entre dispositivos.</p>
    <p>La sesión adulta se cierra tras 15 minutos sin actividad en este panel. Jugar en el espacio infantil no prolonga la sesión.</p>
    {!ready && <p role="status">Preparando acceso…</p>}
    {user ? <>
      <p>Sesión iniciada: <strong>{user.email}</strong></p>
      <p>{user.emailVerified ? 'Correo verificado.' : 'Falta verificar el correo. Esta sesión no habilita almacenamiento de perfiles en la nube.'}</p>
      {!user.emailVerified && <button className="np-account-button" type="button" disabled={busy} onClick={() => perform('verify')}>Reenviar verificación</button>}
      <button className="np-account-button" type="button" disabled={busy} onClick={() => perform('logout')}>Cerrar sesión adulta</button>
    </> : <form onSubmit={event => { event.preventDefault(); void perform('login'); }} className="space-y-3">
      <label className="block">Correo del adulto<input type="email" required autoComplete="username" maxLength={254} disabled={busy || !ready} value={email} onChange={event => setEmail(event.target.value)} className="block w-full border rounded-lg p-2" /></label>
      <label className="block">Contraseña de la cuenta<input type="password" required autoComplete="current-password" maxLength={4096} disabled={busy || !ready} value={password} onChange={event => setPassword(event.target.value)} className="block w-full border rounded-lg p-2" /></label>
      <label className="flex gap-2"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} />Soy adulto y autorizo usar este correo para crear mi cuenta en Firebase. No ingreso datos del niño.</label>
      <div className="flex flex-wrap gap-3">
        <button className="np-account-button" type="submit" disabled={busy || !ready}>Ingresar a mi cuenta</button>
        <button className="np-account-button np-account-primary" type="button" disabled={busy || !ready || !consent || password.length < 12 || !email.trim()} onClick={() => perform('register')}>Crear cuenta adulta</button>
        <button className="np-account-button" type="button" disabled={busy || !ready || !email.trim()} onClick={() => perform('reset')}>Olvidé mi contraseña</button>
      </div>
      <p>Para crear una cuenta, usá al menos 12 caracteres. La contraseña no se guarda en los perfiles. La sesión queda en esta pestaña; cerrá sesión antes de compartir el dispositivo.</p>
    </form>}
    {message && <p role="status">{message}</p>}
  </section>;
}
