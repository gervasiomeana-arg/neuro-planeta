import { useRef, useState } from 'react';
import type { DiagnosticResult } from '../../server/commercial/diagnostics';
import { accountRequest } from './api';
export default function PrivacyAdminPanel() {
  const [rows, setRows] = useState<any[]>([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [confirmation, setConfirmation] = useState(''), [selected, setSelected] = useState('');
  const [resolution, setResolution] = useState(''), [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const running = useRef(false);
  const [maintenanceConfirm, setMaintenanceConfirm] = useState('');
  async function perform(action: 'list' | 'close' | 'suppress' | 'maintain' | 'diagnose') {
    if (running.current) return;
    running.current = true; setBusy(true); setMessage('');
    try {
      if (action === 'diagnose') setDiagnostics(await accountRequest('privacy/admin/diagnostics'));
      else if (action === 'list') setRows((await accountRequest('privacy/admin/requests')).requests);
      else if (action === 'maintain') {
        const result = await accountRequest('privacy/admin/maintenance', { confirmation: maintenanceConfirm });
        setMaintenanceConfirm(''); setMessage(`Registros vencidos eliminados: ${result.deleted}. Si quedaban más de 200 por grupo, repetí la depuración.`);
      }
      else { await accountRequest(`privacy/admin/requests/${selected}`, { action, confirmation, ...(action === 'close' ? { resolution } : {}) }); setRows(rows.filter(r => r.id !== selected)); setSelected(''); setConfirmation(''); setResolution(''); setMessage('Gestión confirmada por el servidor.'); }
    } catch (e) { setMessage(e instanceof Error ? e.message : 'No se confirmó la gestión.'); }
    finally { running.current = false; setBusy(false); }
  }
  return <section className="np-commercial-panel" aria-label="Solicitudes de privacidad y devoluciones"><h3>Solicitudes de privacidad y devoluciones</h3><p>Solo el rol administrador verificado en el servidor puede consultar o gestionar solicitudes. Una solicitud de devolución requiere comprobar y tramitar el reintegro en PayPal antes de marcarla completada.</p><button type="button" className="np-account-button" disabled={busy} onClick={() => void perform('list')}>Consultar solicitudes pendientes</button>
    {rows.map(r => <article key={r.id}><p>{r.email} · {r.kind} · referencia {r.id}</p><p>Recibida: {new Date(r.createdAt).toLocaleString('es-AR')}</p><p>{r.kind === 'access' ? 'Responder dentro de diez días corridos.' : ['rectification', 'suppression', 'revocation'].includes(r.kind) ? 'Controlar plazo de cinco días hábiles y feriados aplicables.' : 'Gestionar reclamo de compra según su fecha y alcance.'}</p>{r.details && <p className="whitespace-pre-wrap">{r.details}</p>}<button type="button" className="np-account-button" disabled={busy} onClick={() => { setSelected(r.id); setConfirmation(''); setResolution(''); }}>Gestionar esta solicitud</button></article>)}
    {selected && <div><p>La supresión elimina fichas vinculadas y accesos. Para una solicitud de cierre también elimina la cuenta de Firebase Auth de NeuroPlaneta. No elimina la cuenta Google, descargas ni dispositivos ajenos. Deben estar canceladas todas sus suscripciones antes de cerrar la cuenta.</p><label>Respuesta para el solicitante<textarea aria-label="Respuesta para el solicitante" maxLength={500} rows={3} value={resolution} disabled={busy} onChange={e => setResolution(e.target.value)} /></label><label>Confirmación de la gestión<input disabled={busy} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label><button type="button" className="np-account-button" disabled={busy || confirmation !== 'ELIMINAR DATOS SOLICITADOS'} onClick={() => void perform('suppress')}>Ejecutar supresión solicitada</button><button type="button" className="np-account-button" disabled={busy || confirmation !== 'GESTION COMPLETADA' || resolution.trim().length < 10 || rows.some(r => r.id === selected && ['suppression','revocation'].includes(r.kind))} onClick={() => void perform('close')}>Marcar gestión completada</button><p>Escribí ELIMINAR DATOS SOLICITADOS o GESTION COMPLETADA según la acción. Cerrar una solicitud no ejecuta un reembolso. Las solicitudes de supresión o revocación solo se cierran al completar su ejecución.</p></div>}
    <fieldset><legend>Conservación de registros</legend><p>Depura accesos de más de 90 días y notificaciones, límites y solicitudes cerradas cuyo plazo venció. No elimina perfiles, solicitudes abiertas ni comprobantes contables. Este control no programa una tarea automática.</p><label>Escribí DEPURAR REGISTROS VENCIDOS<input disabled={busy} value={maintenanceConfirm} onChange={e => setMaintenanceConfirm(e.target.value)} /></label><button type="button" className="np-account-button" disabled={busy || maintenanceConfirm !== 'DEPURAR REGISTROS VENCIDOS'} onClick={() => void perform('maintain')}>Depurar registros vencidos</button></fieldset>
    <h4>Servidor y Firebase</h4><p>Comprobación privada de lectura. No escribe, borra ni muestra datos de familias y no confirma permisos de escritura o eliminación.</p>
    <button type="button" className="np-account-button" disabled={busy} onClick={() => void perform('diagnose')}>Comprobar conexión del servidor</button>
    {diagnostics && <div><p>Comprobado: {new Date(diagnostics.checkedAt).toLocaleString('es-AR')}</p><ul>{diagnostics.checks.map(c => <li key={c.name}>{c.ok ? 'Correcto' : 'No verificado'} · {c.name}</li>)}</ul><p>Escrituras y borrados: sin ejecutar. Cobros: {diagnostics.billingEnabled ? 'habilitados' : 'desactivados'}.</p></div>}
    {message && <p role="status">{message}</p>}
  </section>;
}
