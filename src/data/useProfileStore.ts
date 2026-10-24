import { useEffect, useRef, useState } from 'react';
import { loadProfiles, persistProfiles, PROFILE_KEY, validateProfiles } from './backups';
import { useDeviceProtection } from './DeviceProtection';

export function useProfileStore<T extends { id: string; name: string }>() {
  const protection = useDeviceProtection();
  const vault = protection?.session;
  const [initial] = useState(() => {
    if (vault) { const profiles = vault.profiles; return { profiles, raw: JSON.stringify(profiles), error: '' }; }
    try { return loadProfiles(localStorage); }
    catch { return { profiles: [], raw: null, error: 'El navegador no permite leer los datos locales.' }; }
  });
  const [profiles, setProfiles] = useState<T[]>(initial.profiles as unknown as T[]);
  const [error, setError] = useState(initial.error);
  const [attempt, setAttempt] = useState(0);
  const expected = useRef(initial.raw);
  const blocked = useRef(!!initial.error);
  useEffect(() => {
    if (blocked.current) return;
    if (vault) {
      let alive = true;
      void vault.save(profiles).then(() => { if (alive) setError(''); }, () => {
        if (alive) setError('No se pudieron guardar los últimos cambios cifrados. Siguen en esta sesión: reintentá o descargá una copia antes de cerrar.');
      });
      return () => { alive = false; };
    }
    try {
      expected.current = persistProfiles(localStorage, profiles, expected.current);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error && cause.message.startsWith('Otra pestaña') ? cause.message : 'No se pudieron guardar los últimos cambios. Siguen en esta sesión: descargá una copia antes de cerrar.');
    }
  }, [profiles, attempt, vault]);
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key !== PROFILE_KEY && event.key !== null) return;
      if (event.newValue === expected.current && event.key !== null) return;
      blocked.current = true;
      setError('Otra pestaña cambió los perfiles. Descargá una copia de esta sesión antes de recargar.');
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  async function restoreCopies(incoming: unknown[]) {
    if (blocked.current) throw new Error('El guardado está detenido. Conservá una copia antes de recargar o pedir ayuda.');
    validateProfiles(incoming);
    const copies = incoming.map(profile => ({ ...profile, id: `restored_${crypto.randomUUID()}`, name: `${profile.name.slice(0, 105)} (copia)` }));
    const combined: unknown = JSON.parse(JSON.stringify([...profiles, ...copies]));
    validateProfiles(combined);
    if (vault && protection) await protection.exclusive(async () => {
      await vault.save(combined as unknown[]);
      setProfiles(combined as unknown as T[]); setError('');
    });
    else {
      expected.current = persistProfiles(localStorage, combined as unknown[], expected.current);
      setProfiles(combined as unknown as T[]); setError('');
    }
  }
  return { profiles, setProfiles, error, fatal: !!initial.error, recoveryRaw: initial.raw, restoreCopies, retry: () => setAttempt(value => value + 1) };
}
