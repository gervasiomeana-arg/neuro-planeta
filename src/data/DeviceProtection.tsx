import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { isProtectedProfileData, PROFILE_KEY } from './backups';
import { createProtectedAccount, prepareProfileProtection, unlockProfileProtection, type ProtectedProfileStore } from './protectedProfileStore';

import { useProfileStorage } from './ProfileStorageContext';

type Prepared = Awaited<ReturnType<typeof prepareProfileProtection>>;
type ContextValue = { session: ProtectedProfileStore | null; activate: (prepared: Prepared) => void; lock: () => Promise<void>; exclusive: (work: () => Promise<void>) => Promise<void>; closing: boolean };
const Context = createContext<ContextValue | null>(null);
export const useDeviceProtection = () => useContext(Context);
function download(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/octet-stream' }));
  const link = document.createElement('a'); link.href = url; link.download = 'neuroplaneta-perfiles-protegidos.npbackup'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
export default function DeviceProtection({ children }: { children: ReactNode }) {
  const storage = useProfileStorage();
  const [legacyEncrypted] = useState(() => { try { const raw = localStorage.getItem(PROFILE_KEY); return storage.isolated && isProtectedProfileData(raw) ? raw : null; } catch { return null; } });
  const [needsSetup, setNeedsSetup] = useState(() => { try { return storage.isolated && storage.getItem(PROFILE_KEY) === null; } catch { return false; } });
  const [confirmation, setConfirmation] = useState('');
  const [protectedMode, setProtectedMode] = useState(() => { try { return storage.isolated || isProtectedProfileData(storage.getItem(PROFILE_KEY)); } catch { return true; } });
  const [session, setSession] = useState<ProtectedProfileStore | null>(null);
  const [, refresh] = useState(0), [closing, setClosing] = useState(false), [busy, setBusy] = useState(false);
  const [password, setPassword] = useState(''), [message, setMessage] = useState('');
  const running = useRef(false), mounted = useRef(false);
  const notify = () => { if (mounted.current) refresh(value => value + 1); };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (session?.dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [session]);
  async function lock() {
    if (!session || running.current) return;
    running.current = true; setClosing(true); setMessage('');
    try { await session.close(); setSession(null); setPassword(''); }
    catch { setMessage('No se pudo bloquear: hay cambios sin guardar. Reintentá el guardado o descargá una copia antes de cerrar.'); }
    finally { running.current = false; setClosing(false); }
  }
  async function unlock() {
    if (running.current) return;
    const submitted = password; setPassword(''); setMessage(''); setBusy(true); running.current = true;
    try { const opened = await unlockProfileProtection(storage, submitted, notify); if (mounted.current) setSession(opened); else await opened.close(); }
    catch { if (mounted.current) setMessage('Contraseña incorrecta, copia dañada o almacenamiento no disponible. Los datos guardados no se modificaron.'); }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  async function createSpace() {
    if (running.current) return;
    if (password !== confirmation) { setPassword(''); setConfirmation(''); setMessage('Las contraseñas no coinciden.'); return; }
    const submitted = password; setPassword(''); setConfirmation(''); setMessage(''); setBusy(true); running.current = true;
    try {
      const opened = await createProtectedAccount(storage, submitted, notify);
      if (mounted.current) { setSession(opened); setNeedsSetup(false); setProtectedMode(true); }
      else await opened.close();
    } catch { if (mounted.current) setMessage('No se pudo crear el espacio. Los datos anteriores se conservaron. Revisá la sesión, el espacio disponible y una contraseña de 12 a 256 caracteres.'); }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  if (needsSetup) return <main className="np-theme min-h-dvh bg-[#e8ede3] p-5 flex items-center justify-center text-[#293b3a]">
    <section aria-label="Crear espacio de perfiles" className="max-w-lg w-full rounded-2xl border bg-[#fcf7ed] p-6 space-y-4">
      <h1 className="text-2xl font-bold">Tus perfiles, separados por cuenta</h1>
      <p>Cuenta: <strong>{storage.email}</strong></p>
      <p>Elegí una contraseña propia de 12 a 256 caracteres para cifrar los perfiles de esta cuenta. Es independiente de Google y no se guarda. No podemos recuperarla si la olvidás.</p>
      <p>Los perfiles anteriores de este navegador se conservan sin asignar. No se muestran ni se copian automáticamente. Si tenés un respaldo cifrado, podrás revisarlo y restaurarlo en tu espacio después de crearlo.</p>
      {legacyEncrypted && <button type="button" className="np-account-button" disabled={busy} onClick={() => download(legacyEncrypted)}>Descargar respaldo anterior sin asignar</button>}
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); void createSpace(); }}>
        <label className="block">Nueva contraseña de perfiles<input type="password" autoComplete="off" maxLength={256} disabled={busy} value={password} onChange={event => setPassword(event.target.value)} className="block w-full border rounded-lg p-3" /></label>
        <label className="block">Repetir contraseña de perfiles<input type="password" autoComplete="off" maxLength={256} disabled={busy} value={confirmation} onChange={event => setConfirmation(event.target.value)} className="block w-full border rounded-lg p-3" /></label>
        <button type="submit" className="np-account-button np-account-primary" disabled={busy || password.trim().length < 12 || !confirmation}>{busy ? 'Preparando…' : 'Crear mi espacio protegido'}</button>
      </form>
      {message && <p role="status">{message}</p>}
    </section>
  </main>;
  const value: ContextValue = { session, closing, lock, async exclusive(work) {
    if (running.current) throw new Error('Hay una operación protegida pendiente.');
    running.current = true; setClosing(true);
    try { await work(); } finally { running.current = false; setClosing(false); }
  }, activate(prepared) {
    if (protectedMode || running.current) throw new Error('La protección ya está activa o hay una operación pendiente.');
    const opened = prepared.activate(storage, notify);
    setSession(opened); setProtectedMode(true); setMessage('Protección activada. El guardado principal ahora está cifrado.');
  } };
  if (protectedMode && !session) return <main className="np-theme min-h-dvh bg-[#e8ede3] p-5 flex items-center justify-center text-[#293b3a]">
    <section aria-label="Desbloquear perfiles protegidos" className="max-w-lg w-full rounded-2xl border bg-[#fcf7ed] p-6 space-y-4">
      <h1 className="text-2xl font-bold">Tus perfiles están protegidos</h1>
      {storage.isolated && <p>Cuenta: <strong>{storage.email}</strong></p>}
      <p>Ingresá la contraseña de protección de tus perfiles. Es distinta de tu cuenta Google. No podemos recuperarla si la olvidás.</p>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); void unlock(); }}>
        <label className="block">Contraseña de protección<input autoComplete="off" type="password" maxLength={256} disabled={busy} value={password} onChange={event => setPassword(event.target.value)} className="block w-full rounded-lg border p-3" /></label>
        <button type="submit" className="np-account-button np-account-primary" disabled={busy || password.trim().length < 12}>{busy ? 'Desbloqueando…' : 'Desbloquear perfiles'}</button>
      </form>
      <button type="button" className="np-account-button" disabled={busy} onClick={() => { try { const raw = storage.getItem(PROFILE_KEY); if (raw) download(raw); } catch { setMessage('No se pudo descargar el archivo guardado.'); } }}>Descargar archivo cifrado guardado</button>
      <p>No se borran ni se reinician los perfiles desde esta pantalla. Con una copia y su contraseña podés recuperarlos en otro dispositivo.</p>
      {message && <p role="status">{message}</p>}
    </section>
  </main>;
  return <Context.Provider value={value}>
    {session && <p role="status" aria-label="Guardado protegido" className="np-theme bg-[#e8ede3] text-[#293b3a] text-sm p-2">{session.pending ? 'Guardando cifrado… Esperá antes de cerrar.' : session.error ? 'Hay cambios sin guardar. Conservá una copia antes de cerrar.' : 'Guardado cifrado completo.'}</p>}
    {message && <p role="status" className="np-theme p-2">{message}</p>}
    <div inert={closing}>{children}</div>
    {closing && <p role="status">Terminando el guardado protegido…</p>}
  </Context.Provider>;
}

export function DeviceProtectionControls({ profiles }: { profiles: unknown[] }) {
  const context = useDeviceProtection();
  const storage = useProfileStorage();
  const [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState('');
  const [prepared, setPrepared] = useState<Prepared | null>(null), [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const preparedRef = useRef<Prepared | null>(null), mounted = useRef(false), running = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; preparedRef.current?.cancel(); }; }, []);
  async function prepare() {
    if (running.current || !context || context.session) return;
    if (password !== confirmation) { setPassword(''); setConfirmation(''); setMessage('Las contraseñas de protección no coinciden.'); return; }
    const submitted = password; setPassword(''); setConfirmation(''); setMessage(''); setBusy(true); running.current = true;
    preparedRef.current?.cancel(); preparedRef.current = null; setPrepared(null); setChecked(false);
    try {
      const result = await prepareProfileProtection(profiles, submitted);
      if (!mounted.current) { result.cancel(); return; }
      download(result.encrypted); preparedRef.current = result; setPrepared(result);
      setMessage('Copia cifrada comprobada; descarga iniciada. Verificá que el archivo se haya guardado antes de activar.');
    } catch { if (mounted.current) setMessage('No se pudo preparar la protección. Los perfiles actuales se conservaron. Usá una contraseña de 12 a 256 caracteres.'); }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  if (!context) return null;
  if (context.session) return <section aria-label="Protección principal de perfiles" className="rounded-xl border p-3 space-y-3">
    <h3 className="font-bold">Guardado principal protegido</h3>
    <p>Los perfiles, notas, imágenes, voces y avances se guardan cifrados en este navegador. Mientras está desbloqueado, quien use esta pestaña puede verlos. {storage.isolated ? 'Este espacio pertenece a tu cuenta Google; otras cuentas abren un espacio distinto.' : 'Esta contraseña protege todo el dispositivo; todavía no separa adultos por cuenta.'}</p>
    <button type="button" className="np-account-button" disabled={context.closing} onClick={() => void context.lock()}>Bloquear perfiles ahora</button>
    <p>Recargar o cerrar la pestaña vuelve a pedir la contraseña. Conservá respaldos cifrados actualizados. El bloqueo no elimina capturas, descargas ni copias antiguas que hayas guardado.</p>
  </section>;
  return <section aria-label="Protección principal de perfiles" className="rounded-xl border p-3 space-y-3">
    <h3 className="font-bold">Proteger el guardado principal</h3>
    <p>Se cifrarán todos los perfiles ({profiles.length}) de este navegador. Primero descargá y comprobá el respaldo. Nadie puede recuperar una contraseña olvidada.</p>
    <label className="block">Nueva contraseña de protección<input type="password" autoComplete="off" maxLength={256} disabled={busy || !!prepared} value={password} onChange={event => setPassword(event.target.value)} className="block w-full border rounded-lg p-2" /></label>
    <label className="block">Repetir nueva contraseña de protección<input type="password" autoComplete="off" maxLength={256} disabled={busy || !!prepared} value={confirmation} onChange={event => setConfirmation(event.target.value)} className="block w-full border rounded-lg p-2" /></label>
    <button type="button" className="np-account-button" disabled={busy || !!prepared || !profiles.length || password.trim().length < 12 || !confirmation} onClick={prepare}>Preparar y descargar respaldo de protección</button>
    {prepared && <>
      <label className="flex gap-2"><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} />Comprobé que el respaldo cifrado se descargó, guardé la contraseña y autorizo cifrar todos los perfiles de este navegador.</label>
      <button type="button" className="np-account-button np-account-primary" disabled={!checked} onClick={() => {
        try { context.activate(prepared); preparedRef.current = null; setPrepared(null); }
        catch (error) { prepared.cancel(); preparedRef.current = null; setPrepared(null); setChecked(false); setMessage(error instanceof Error && error.message.startsWith('Los perfiles') ? error.message : 'No se pudo activar. Los originales se conservaron. Revisá el espacio disponible en el navegador.'); }
      }}>Activar protección de perfiles</button>
      <button type="button" className="np-account-button" onClick={() => { prepared.cancel(); preparedRef.current = null; setPrepared(null); setChecked(false); setMessage('Activación cancelada. Los originales se conservaron.'); }}>Cancelar activación</button>
    </>}
    {message && <p role="status">{message}</p>}
  </section>;
}
