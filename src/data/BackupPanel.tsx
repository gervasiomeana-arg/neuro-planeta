import React, { useEffect, useRef, useState } from 'react';
import { decryptBackup, encryptBackup, encryptRecovery, MAX_BACKUP_BYTES } from './backups';

function download(text: string, recovery: boolean) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/octet-stream' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = recovery ? 'neuroplaneta-rescate.npbackup' : 'neuroplaneta-copia.npbackup';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

type Props = { profiles: unknown[]; onRestore?: (profiles: unknown[]) => void; recoveryRaw?: string | null };
export default function BackupPanel({ profiles, onRestore, recoveryRaw }: Props) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Array<{ id: string; name: string }> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const recovery = recoveryRaw !== undefined;
  async function exportCopy() {
    if (password !== confirmation) { setPassword(''); setConfirmation(''); setMessage('Las contraseñas no coinciden. Volvé a ingresarlas.'); return; }
    const submittedPassword = password;
    setPassword(''); setConfirmation('');
    setBusy(true); setMessage('');
    try {
      const text = recovery ? await encryptRecovery(recoveryRaw || '', submittedPassword) : await encryptBackup(profiles, submittedPassword);
      if (!mounted.current) return;
      download(text, recovery);
      setMessage('Descarga iniciada. Comprobá que el archivo quedó guardado y conservá la contraseña en un lugar seguro.');
    } catch (error) {
      if (mounted.current) setMessage(error instanceof Error ? error.message : 'No se pudo crear la copia.');
    } finally { if (mounted.current) setBusy(false); }
  }
  async function inspectCopy() {
    if (!file) { setMessage('Elegí un archivo de copia.'); return; }
    const submittedPassword = password;
    setPassword(''); setConfirmation('');
    setBusy(true); setMessage(''); setPreview(null);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('La copia supera el límite de 20 MB.');
      const restored = await decryptBackup(await file.text(), submittedPassword);
      if (mounted.current) setPreview(restored);
    } catch (error) {
      if (mounted.current) setMessage(error instanceof Error ? error.message : 'No se pudo abrir la copia.');
    } finally { if (mounted.current) setBusy(false); }
  }
  return <section className="rounded-2xl border border-[#b8c9be] bg-[#fcf7ed] p-4 space-y-3 text-sm text-[#293b3a]" aria-label="Copias de seguridad">
    <h3 className="font-extrabold">{recovery ? 'Rescatar los datos originales' : 'Copias de seguridad del dispositivo'}</h3>
    <p>{recovery ? 'Este archivo cifrado conserva los datos tal como están para una revisión técnica. No modifica ni repara el original.' : 'La copia incluye todos los perfiles, avances, notas, imágenes y voces de este navegador. Se cifra aquí y no se envía a un servidor.'}</p>
    <p className="text-xs">La contraseña de la copia no es una cuenta de acceso. No podemos recuperarla si la olvidás. El navegador sigue guardando los perfiles sin este cifrado.</p>
    <label className="block font-bold">Contraseña de la copia
      <input type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={12} maxLength={256} autoComplete="off" disabled={busy} className="block w-full rounded-lg border p-2 mt-1 bg-white text-[#293b3a]" />
    </label>
    <p className="text-xs">Usá al menos 12 caracteres; preferí varias palabras que puedas recordar.</p>
    {(profiles.length > 0 || recovery) && <>
      <label className="block font-bold">Repetir contraseña para descargar
        <input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} maxLength={256} autoComplete="off" disabled={busy} className="block w-full rounded-lg border p-2 mt-1 bg-white text-[#293b3a]" />
      </label>
      <button type="button" onClick={exportCopy} disabled={busy || (recovery && recoveryRaw === null)} className="rounded-lg bg-[#27665e] text-white font-bold px-4 py-3 disabled:opacity-50">{busy ? 'Preparando…' : recovery ? 'Descargar rescate cifrado' : 'Descargar copia cifrada'}</button>
    </>}
    {!recovery && onRestore && <div className="border-t pt-3 space-y-3">
      <label className="block font-bold">Archivo de copia cifrada
        <input type="file" accept=".npbackup" disabled={busy} onChange={event => { setFile(event.target.files?.[0] || null); setPreview(null); setMessage(''); }} className="block w-full mt-1 text-xs" />
      </label>
      <button type="button" disabled={busy || !file} onClick={inspectCopy} className="rounded-lg border border-[#27665e] font-bold px-4 py-3 disabled:opacity-50">Revisar copia antes de restaurar</button>
      {preview && <div className="rounded-lg border p-3 space-y-2">
        <p className="font-bold">{preview.length} perfil(es) en la copia</p>
        <ul>{preview.map(profile => <li key={profile.id}>{profile.name}</li>)}</ul>
        <p>Se agregarán como perfiles nuevos con «(copia)» en el nombre. Los perfiles actuales se conservan. Los avances diarios de fechas anteriores se reinician al abrir el perfil, como en el uso habitual.</p>
        <button type="button" disabled={preview.length === 0 || busy} onClick={() => {
          try { onRestore(preview); setPreview(null); setFile(null); setMessage('Perfiles restaurados como copias y guardados en este dispositivo.'); }
          catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo guardar. Los perfiles actuales se conservaron.'); }
        }} className="rounded-lg bg-[#27665e] text-white font-bold px-4 py-3">Agregar perfiles como copias</button>
        <button type="button" onClick={() => { setPreview(null); setFile(null); setMessage('Restauración cancelada.'); }} className="rounded-lg border px-4 py-3 ml-2">Cancelar restauración</button>
      </div>}
    </div>}
    {message && <p role="status" className="font-bold">{message}</p>}
  </section>;
}
