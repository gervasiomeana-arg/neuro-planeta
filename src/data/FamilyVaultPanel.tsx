import { useEffect, useRef, useState } from 'react';
import { getIdTokenResult, type User } from 'firebase/auth';
import { adultSessionEpoch, adultSessionIsCurrent } from '../auth/firebase';
import { validateProfiles } from './backups';
import { readFamilyVault, saveFamilyVault } from './familyVault';

export default function FamilyVaultPanel({ user, profile }: { user: User; profile: unknown }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<Array<{ id: string; name: string }> | null>(null);
  const [message, setMessage] = useState('');
  const mounted = useRef(false), running = useRef(false), version = useRef(0);
  function lock() {
    version.current++;
    setOpened(null); setPassword(''); setConfirmation(''); setConsent(false); setMessage('Copia privada cerrada.');
  }
  useEffect(() => {
    mounted.current = true;
    const hidden = () => { if (document.hidden) lock(); };
    const changed = (event: StorageEvent) => { if (event.key === null || event.key?.startsWith('np_family_vault:')) lock(); };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', lock);
    window.addEventListener('storage', changed);
    return () => {
      mounted.current = false; version.current++;
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', lock); window.removeEventListener('storage', changed);
    };
  }, []);
  async function perform(save: boolean) {
    if (running.current) return;
    if (save && (!consent || password !== confirmation)) {
      setPassword(''); setConfirmation(''); setConsent(false);
      setMessage('Confirmá el consentimiento y repetí la misma contraseña.'); return;
    }
    const submitted = password, epoch = adultSessionEpoch(), operation = version.current;
    const current = () => mounted.current && !document.hidden && version.current === operation
      && user.emailVerified && adultSessionIsCurrent(user.uid, epoch);
    running.current = true; setBusy(true); setOpened(null); setMessage('');
    setPassword(''); setConfirmation(''); setConsent(false);
    try {
      if (!current()) throw new Error('Sesión inválida');
      const selected: unknown = save ? JSON.parse(JSON.stringify([profile])) : null;
      if (save) validateProfiles(selected);
      const token = await getIdTokenResult(user);
      if (!current() || token.claims.email_verified !== true) throw new Error('Sesión inválida');
      const existing = await readFamilyVault(localStorage, user.uid, submitted, current);
      let profiles = existing.profiles;
      if (save) {
        const incoming = (selected as typeof profiles)[0];
        profiles = [...profiles.filter(item => item.id !== incoming.id), incoming];
        await saveFamilyVault(localStorage, user.uid, profiles, submitted, existing.revision, current);
        // Verify the persisted ciphertext before displaying a success message.
        profiles = (await readFamilyVault(localStorage, user.uid, submitted, current)).profiles;
      }
      if (current()) {
        setOpened(profiles);
        setMessage(save ? 'Copia privada cifrada guardada y comprobada. El original sigue sin cifrar.'
          : existing.revision === null ? 'Todavía no hay una copia privada para esta cuenta.' : 'Copia privada abierta en esta sesión.');
      }
    } catch {
      if (mounted.current && version.current === operation) setMessage('No se pudo confirmar la operación. Revisá contraseña, sesión y espacio del navegador. Los originales no se modificaron.');
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return <section aria-label="Copia privada por cuenta" className="rounded-xl border p-3 space-y-3">
    <h4 className="font-bold">Copia privada por cuenta</h4>
    <p>Guarda una copia cifrada del perfil seleccionado en este navegador, separada por cuenta adulta. No se envía a Firebase ni se actualiza automáticamente al jugar.</p>
    <p className="font-bold">Los perfiles originales siguen sin cifrar. Esta función todavía no protege el listado habitual ni reemplaza su guardado.</p>
    <p>Usá una contraseña propia de 12 a 256 caracteres, distinta de la cuenta adulta. No podemos recuperarla. Conservá también una copia cifrada descargada.</p>
    <label className="block">Contraseña de la copia privada<input className="block w-full border rounded-lg p-2" type="password" autoComplete="off" maxLength={256} disabled={busy} value={password} onChange={event => setPassword(event.target.value)} /></label>
    <label className="block">Repetir contraseña de la copia privada<input className="block w-full border rounded-lg p-2" type="password" autoComplete="off" maxLength={256} disabled={busy} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
    <label className="flex gap-2"><input type="checkbox" disabled={busy} checked={consent} onChange={event => setConsent(event.target.checked)} />Confirmo guardar o actualizar este perfil en mi copia privada. El original continúa sin cifrar.</label>
    <div className="flex flex-wrap gap-2">
      <button type="button" className="np-account-button np-account-primary" disabled={busy || !consent || password.trim().length < 12 || password !== confirmation} onClick={() => perform(true)}>Guardar perfil en copia privada</button>
      <button type="button" className="np-account-button" disabled={busy || password.trim().length < 12} onClick={() => perform(false)}>Abrir copia privada</button>
      <button type="button" className="np-account-button" onClick={lock}>Cerrar copia privada</button>
    </div>
    {busy && <p role="status">Procesando cifrado local…</p>}
    {opened && <div aria-label="Contenido de copia privada"><p>{opened.length} perfil(es) en la copia privada</p><ul>{opened.map(item => <li key={item.id}>{item.name}</li>)}</ul></div>}
    {message && <p role="status">{message}</p>}
  </section>;
}
