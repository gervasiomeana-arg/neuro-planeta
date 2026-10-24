import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, startAfter, type QueryDocumentSnapshot } from 'firebase/firestore/lite';
import { adultAuth, adultSessionEpoch, adultSessionIsCurrent } from './firebase';

type Entry = { id: string; email: string; provider: string; date: string };
export default function AdminAccessPanel({ user }: { user: User }) {
  const [opened, setOpened] = useState(false), [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Entry[]>([]), [message, setMessage] = useState('');
  const [more, setMore] = useState(false);
  const cursor = useRef<QueryDocumentSnapshot | null>(null), version = useRef(0), running = useRef(false);
  const mounted = useRef(false);
  function close() { version.current++; setOpened(false); setRows([]); setMore(false); cursor.current = null; setMessage(''); }
  useEffect(() => {
    mounted.current = true;
    const hidden = () => { if (document.hidden) close(); };
    document.addEventListener('visibilitychange', hidden); window.addEventListener('pagehide', close);
    return () => { mounted.current = false; version.current++; document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', close); };
  }, []);
  async function load(append = false) {
    if (running.current) return;
    const operation = version.current, epoch = adultSessionEpoch();
    const current = () => mounted.current && !document.hidden && version.current === operation && adultSessionIsCurrent(user.uid, epoch);
    running.current = true; setBusy(true); setMessage('');
    if (!append) { setRows([]); setOpened(false); cursor.current = null; }
    try {
      const db = getFirestore(adultAuth().app);
      if (!current() || !user.emailVerified) throw new Error('Sesión inválida');
      const role = await getDoc(doc(db, 'admins', user.uid));
      if (!current() || role.data()?.active !== true) throw new Error('Sin permiso');
      const collectionRef = collection(db, 'accessEvents');
      const entries = await getDocs(query(collectionRef, orderBy('createdAt', 'desc'), ...(append && cursor.current ? [startAfter(cursor.current)] : []), limit(50)));
      if (!current()) return;
      const next = entries.docs.map(item => {
        const data = item.data(), date = data.createdAt?.toDate?.();
        return { id: item.id, email: String(data.email || ''), provider: data.provider === 'google.com' ? 'Google' : 'Correo', date: date instanceof Date ? date.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'Fecha no disponible' };
      });
      setRows(previous => append ? [...previous, ...next] : next); setOpened(true);
      cursor.current = entries.docs.at(-1) || null; setMore(entries.size === 50);
      setMessage(next.length ? '' : 'No hay accesos registrados para mostrar.');
    } catch { if (current()) { close(); setMessage('Solo la cuenta administradora habilitada en Firebase puede consultar este historial.'); } }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  return <section aria-label="Administración de accesos" className="rounded-xl border p-3 space-y-3">
    <div role="tablist" aria-label="Sección administradora"><button id="access-admin-tab" type="button" role="tab" aria-selected={opened} aria-controls={opened ? 'access-admin-panel' : undefined} className="np-account-button np-admin-history" disabled={busy} onClick={() => load()}>Administración · accesos</button></div>
    <p>Acceso exclusivo mediante permisos del servidor. Muestra inicios de sesión de adultos; no visitas anónimas ni actividad infantil. Horario de Argentina.</p>
    {busy && <p role="status">Consultando permisos y accesos…</p>}
    {opened && <div id="access-admin-panel" role="tabpanel" aria-label="Historial de accesos" className="overflow-x-auto">
      <table><thead><tr><th>Cuenta adulta</th><th>Día y hora · Argentina</th><th>Acceso</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.email}</td><td>{row.date}</td><td>{row.provider}</td></tr>)}</tbody></table>
      {more && <button type="button" className="np-account-button np-admin-history" disabled={busy} onClick={() => load(true)}>Ver 50 anteriores</button>}
      <button type="button" className="np-account-button" onClick={close}>Cerrar historial</button>
    </div>}
    {message && <p role="status">{message}</p>}
  </section>;
}
