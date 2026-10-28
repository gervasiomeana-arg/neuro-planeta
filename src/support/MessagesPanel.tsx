import { useEffect, useId, useRef, useState } from 'react';
import { accountRequest } from '../commercial/api';
import type { SupportMessage } from '../../server/commercial/messages';
export default function MessagesPanel({ admin = false }: { admin?: boolean }) {
  const fieldId = useId();
  const [subject, setSubject] = useState(''), [text, setText] = useState('');
  const [rows, setRows] = useState<SupportMessage[]>([]), [next, setNext] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), [status, setStatus] = useState(''), [loaded, setLoaded] = useState(false);
  const running = useRef(false), mounted = useRef(true), pending = useRef<{ id: string; subject: string; message: string } | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const root = admin ? 'support/admin/messages' : 'support/messages';
  async function perform(action: 'send' | 'list' | 'more' | 'read', id?: string) {
    if (running.current) return;
    running.current = true; setBusy(true); setStatus('');
    try {
      if (action === 'send') {
        const message = text.trim(), title = subject.trim();
        if (!title || !message) return;
        if (!pending.current || pending.current.subject !== title || pending.current.message !== message) pending.current = { id: crypto.randomUUID(), subject: title, message };
        const receipt = await accountRequest(root, pending.current);
        if (!mounted.current) return;
        pending.current = null; setSubject(''); setText('');
        setStatus(`Mensaje recibido por NeuroPlaneta. Referencia: ${receipt.id}.`);
      } else if (action === 'read') {
        await accountRequest(`${root}/${id}/read`, {});
        if (mounted.current) setRows(old => old.map(r => r.id === id ? { ...r, read: true } : r));
      } else {
        const result = await accountRequest(root + (action === 'more' && next ? `?cursor=${next}` : ''));
        if (!mounted.current) return;
        setRows(old => action === 'more' ? [...old, ...result.messages] : result.messages); setNext(result.next); setLoaded(true);
      }
    } catch (e) { if (mounted.current) setStatus(e instanceof Error ? e.message : 'No se confirmó la operación.'); }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  return <section className="np-commercial-panel np-messages" aria-label={admin ? 'Bandeja de mensajes' : 'Mensajes a NeuroPlaneta'}>
    <h3>{admin ? 'Bandeja de mensajes' : 'Mensajes'}</h3>
    <p>{admin ? 'Consultas de las cuentas adultas. Solo la administración puede ver esta bandeja. La cuenta remitente aparece junto al mensaje.' : 'Escribí al responsable de NeuroPlaneta desde la app. Tu cuenta Google identifica la consulta y el mensaje queda disponible para la administración. No se envía un correo electrónico externo.'}</p>
    {!admin && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void perform('send'); }}>
      <p>No incluyas contraseñas, datos de pago, nombres de niños ni información de salud. Este canal es para consultas sobre la app.</p>
      <label htmlFor={`${fieldId}-subject`}>Asunto</label><input id={`${fieldId}-subject`} required maxLength={120} disabled={busy} value={subject} onChange={e => setSubject(e.target.value)} />
      <label htmlFor={`${fieldId}-message`}>Mensaje</label><textarea id={`${fieldId}-message`} required rows={6} maxLength={1500} disabled={busy} value={text} onChange={e => setText(e.target.value)} />
      <p>{text.length}/1500 caracteres</p>
      <button type="submit" className="np-account-button np-account-primary" disabled={busy || !subject.trim() || !text.trim()}>Enviar mensaje</button>
    </form>}
    <p role="status" aria-live="polite">{status}</p>
    <button type="button" className="np-account-button" disabled={busy} onClick={() => void perform('list')}>{admin ? 'Actualizar bandeja' : 'Consultar mis mensajes'}</button>
    {loaded && !rows.length && <p>No hay mensajes registrados.</p>}
    {rows.map(row => <article className="np-message" key={row.id}>
      <h4>{row.subject}</h4>
      {admin && <p>Cuenta remitente: {row.email}</p>}
      <p>{new Date(row.createdAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} · {row.read ? 'Leído' : 'Pendiente de lectura'}</p>
      <p className="whitespace-pre-wrap">{row.message}</p>
      <p>Referencia: {row.id}</p>
      {admin && !row.read && <button type="button" className="np-account-button" disabled={busy} onClick={() => void perform('read', row.id)}>Marcar como leído</button>}
    </article>)}
    {next && <button type="button" className="np-account-button" disabled={busy} onClick={() => void perform('more')}>Ver más mensajes</button>}
  </section>;
}
