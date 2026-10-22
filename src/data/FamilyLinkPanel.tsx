import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { linkFamilyProfile } from './linkFamilyProfile';
import type { LocalLinkProfile } from './familyLinkData';
export default function FamilyLinkPanel({ user, profile }: { user: User; profile: LocalLinkProfile }) {
  const [nickname, setNickname] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const mounted = useRef(true), running = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function link() {
    if (!consent || !nickname.trim() || running.current) return;
    running.current = true; setBusy(true); setMessage('');
    try {
      const result = await linkFamilyProfile(profile, nickname, user.uid, () => mounted.current && !document.hidden);
      if (mounted.current) { setConsent(false); setMessage(result === 'created' ? 'Ficha mínima vinculada a tu familia. El perfil original sigue en este dispositivo.' : 'Esta ficha ya estaba vinculada. No se duplicó ni se sobrescribió.'); }
    } catch {
      if (mounted.current) setMessage('No se confirmó la vinculación. Revisá conexión, correo verificado y sesión. Si se interrumpió, podés reintentar con el mismo apodo sin duplicar la ficha. Una ficha existente con otro apodo no se sobrescribe.');
    } finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  return <section aria-label="Vincular perfil a mi familia" className="rounded-xl border p-3 space-y-3">
    <h4 className="font-bold">Vincular perfil a mi familia</h4>
    <p>Perfil local seleccionado: <strong>{profile.name}</strong>. Cuenta destino: <strong>{user.email}</strong>.</p>
    <label className="block">Apodo para la ficha en la nube<input className="block w-full border rounded-lg p-2" value={nickname} maxLength={60} disabled={busy} onChange={event => { setNickname(event.target.value); setConsent(false); }} placeholder="Evitá el nombre completo" /></label>
    <p>Se enviarán únicamente el apodo que escribas y el rango de edad {profile.selectedAge}. No se enviarán fotos, voces, notas, historias ni avances. Esta ficha todavía no sincroniza el perfil completo ni lo protege en este navegador.</p>
    <label className="flex gap-2"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} />Autorizo guardar esta ficha mínima en Firebase, en mi cuenta adulta.</label>
    <button className="np-account-button np-account-primary" type="button" disabled={busy || !consent || !nickname.trim()} onClick={link}>{busy ? 'Vinculando…' : 'Confirmar vínculo de ficha mínima'}</button>
    {message && <p role="status">{message}</p>}
  </section>;
}
