import { useRef, useState } from 'react';
import { accountRequest } from './api';
export default function PrivacyAdminPanel() {
  const [rows, setRows] = useState<any[]>([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [confirmation, setConfirmation] = useState(''), [selected, setSelected] = useState('');
  const running = useRef(false);
  const [maintenanceConfirm, setMaintenanceConfirm] = useState('');
  async function perform(action: 'list' | 'close' | 'suppress' | 'maintain') {
    if (running.current) return;
    running.current = true; setBusy(true); setMessage('');
    try {
      if (action === 'list') setRows((await accountRequest('privacy/admin/requests')).requests);
      else if (action === 'maintain') {
        const result = await accountRequest('privacy/admin/maintenance', { confirmation: maintenanceConfirm });
        setMaintenanceConfirm(''); setMessage(`Registros vencidos eliminados: ${result.deleted}. Si quedaban más de 200 por grupo, repetí la depuración.`);
      }
      else { await accountRequest(`privacy/admin/requests/${selected}`, { action, confirmation }); setRows(rows.filter(r => r.id !== selected)); setSelected(''); setConfirmation(''); setMessage('Gestión confirmada por el servidor.'); }
    } catch (e) { setMessage(e instanceof Error ? e.message : 'No se confirmó la gestión.'); }
    finally { running.current = false; setBusy(false); }
  }
  return <section className="np-commercial-panel" aria-label="Solicitudes de privacidad y devoluciones"><h3>Solicitudes de privacidad y devoluciones</h3><p>Solo el rol administrador verificado en el servidor puede consultar o gestionar solicitudes. Una solicitud de devolución requiere comprobar y tramitar el reintegro en PayPal antes de marcarla completada.</p><button type="button" className="np-account-button" disabled={busy} onClick={() => void perform('list')}>Consultar solicitudes pendientes</button>
    {rows.map(r => <article key={r.id}><p>{r.email} · {r.kind} · referencia {r.id}</p><button type="button" className="np-account-button" disabled={busy} onClick={() => { setSelected(r.id); setConfirmation(''); }}>Gestionar esta solicitud</button></article>)}
    {selected && <div><p>La supresión elimina fichas vinculadas y accesos. Para una solicitud de cierre también elimina la cuenta de Firebase Auth de NeuroPlaneta. No elimina la cuenta Google, descargas ni dispositivos ajenos. Deben estar canceladas todas sus suscripciones antes de cerrar la cuenta.</p><label>Confirmación de la gestión<input disabled={busy} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label><button type="button" className="np-account-button" disabled={busy || confirmation !== 'ELIMINAR DATOS SOLICITADOS'} onClick={() => void perform('suppress')}>Ejecutar supresión solicitada</button><button type="button" className="np-account-button" disabled={busy || confirmation !== 'GESTION COMPLETADA'} onClick={() => void perform('close')}>Marcar gestión completada</button><p>Escribí ELIMINAR DATOS SOLICITADOS o GESTION COMPLETADA según la acción. Cerrar una solicitud no ejecuta un reembolso.</p></div>}
    <fieldset><legend>Conservación de registros</legend><p>Depura accesos de más de 90 días y notificaciones, límites y solicitudes cerradas cuyo plazo venció. No elimina perfiles, solicitudes abiertas ni comprobantes contables. Este control no programa una tarea automática.</p><label>Escribí DEPURAR REGISTROS VENCIDOS<input disabled={busy} value={maintenanceConfirm} onChange={e => setMaintenanceConfirm(e.target.value)} /></label><button type="button" className="np-account-button" disabled={busy || maintenanceConfirm !== 'DEPURAR REGISTROS VENCIDOS'} onClick={() => void perform('maintain')}>Depurar registros vencidos</button></fieldset>
    {message && <p role="status">{message}</p>}
  </section>;
}
