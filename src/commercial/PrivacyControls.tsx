import { useEffect, useRef, useState } from 'react';
import { POLICY_VERSION } from '../../commercial/policy';
import { accountRequest } from './api';
import LegalLinks from './LegalLinks';
import { useCommercial } from './CommercialContext';
import { adultAuth } from '../auth/firebase';
type Profile = { id: string; name: string };
export default function PrivacyControls({ profiles, onErase }: { profiles: Profile[]; onErase?: (id: string) => Promise<void> }) {
  const { config } = useCommercial();
  const [selected, setSelected] = useState(''), [confirmation, setConfirmation] = useState(''), [ack, setAck] = useState(false);
  const [kind, setKind] = useState('access'), [understood, setUnderstood] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const mounted = useRef(false), running = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const profile = profiles.find(p => p.id === selected);
  async function perform(action: 'erase' | 'export' | 'request') {
    if (running.current) return;
    running.current = true; setBusy(true); setMessage('');
    try {
      if (action === 'erase') {
        if (!profile || !ack || confirmation !== 'ELIMINAR PERFIL' || !onErase) throw new Error('Revisá la confirmación del perfil.');
        await onErase(profile.id);
        if (mounted.current) { setSelected(''); setConfirmation(''); setAck(false); setMessage('Perfil eliminado de este espacio del navegador. Las copias y otros dispositivos no se modificaron.'); }
      } else if (action === 'export') {
        const data = await accountRequest('privacy/export');
        if (!mounted.current) return;
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = 'neuroplaneta-datos-cuenta.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
        setMessage('Descarga de datos de la cuenta iniciada. Los perfiles locales se exportan desde Copias de seguridad.');
      } else {
        if (!understood) throw new Error('Revisá el alcance de la solicitud.');
        const result = await accountRequest('privacy/requests', { kind, version: POLICY_VERSION, understood: true });
        if (mounted.current) setMessage(`Solicitud registrada: ${result.id}. Está pendiente de gestión; todavía no se eliminaron datos ni se emitió una devolución.`);
      }
    } catch (e) { if (mounted.current) setMessage(e instanceof Error ? e.message : 'No se pudo confirmar la operación.'); }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  return <section className="np-commercial-panel" aria-label="Privacidad y control de datos">
    <h3>Privacidad y control de datos</h3><LegalLinks />
    <p>Los perfiles cifrados de este navegador, las fichas vinculadas en servidores y las copias descargadas se gestionan por separado. Cancelar la suscripción conserva tus perfiles.</p>
    <button type="button" className="np-account-button" disabled={busy} onClick={() => {
      const uid = adultAuth().currentUser?.uid || 'legacy';
      try {
        localStorage.setItem(`np_privacy_revoked:${uid}`, 'true');
        localStorage.removeItem(`np_privacy_consent:${uid}:${POLICY_VERSION}`);
        window.dispatchEvent(new Event('np-privacy-revoked'));
      } catch { setMessage('No se pudo guardar la revocación local. Cerrá la app y contactá a soporte.'); }
    }}>Revocar permiso de registro en este navegador</button>
    <p>Revocar detiene el uso de actividades en este navegador y conserva los perfiles para descargar o eliminar. No cancela PayPal ni elimina las fichas vinculadas: esas gestiones se solicitan por separado.</p>
    {onErase && profiles.length > 0 && <fieldset disabled={busy} className="np-local-deletion"><legend>Eliminar un perfil de este dispositivo</legend>
      <p>Esta acción elimina sus actividades, avances, notas, fotos, voces, historias y rutinas del espacio actual. Descargá antes una copia cifrada desde la sección anterior si querés conservarlos. No elimina fichas vinculadas, archivos descargados ni datos de otros equipos.</p>
      <label>Perfil que quiero eliminar<select value={selected} onChange={e => { setSelected(e.target.value); setAck(false); setConfirmation(''); }}><option value="">Elegí un perfil</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} />Entiendo qué datos de este perfil se eliminarán de este navegador y revisé si necesito una copia.</label>
      <label>Escribí ELIMINAR PERFIL<input value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" /></label>
      <button type="button" className="np-account-button" disabled={!profile || !ack || confirmation !== 'ELIMINAR PERFIL'} onClick={() => void perform('erase')}>Eliminar solo el perfil elegido</button>
    </fieldset>}
    <h4>Datos de la cuenta en servidores</h4>
    <button type="button" className="np-account-button" disabled={busy} onClick={() => void perform('export')}>Descargar datos de mi cuenta</button>
    <label>Tipo de solicitud<select value={kind} disabled={busy} onChange={e => { setKind(e.target.value); setUnderstood(false); }}><option value="access">Acceso a mis datos</option><option value="rectification">Rectificación</option><option value="suppression">Cerrar cuenta y solicitar supresión</option><option value="revocation">Revocar consentimiento de datos del niño</option><option value="refund">Solicitar devolución o ejercer revocación de la compra</option></select></label>
    <p>{kind === 'suppression' ? 'Antes de cerrar la cuenta, cancelá la renovación y descargá tus copias. Al eliminar la cuenta Google de NeuroPlaneta podés perder la asociación con perfiles de este navegador; no se elimina tu cuenta Google general. Las copias descargadas y otros dispositivos no se borran a distancia. Los comprobantes sujetos a conservación legal se mantienen restringidos.' : kind === 'revocation' ? 'Podés dejar de registrar actividades y eliminar perfiles de este navegador. Esta solicitud pide al responsable retirar las fichas vinculadas del niño en servidores; no cancela por sí sola una renovación de PayPal.' : 'La solicitud se registra para gestión del responsable. No equivale a un borrado inmediato ni confirma una devolución.'}</p>
    <label><input type="checkbox" checked={understood} disabled={busy} onChange={e => setUnderstood(e.target.checked)} />Comprendí el alcance de esta solicitud y quiero registrarla con mi cuenta adulta.</label>
    <button type="button" className="np-account-button" disabled={busy || !understood} onClick={() => void perform('request')}>Registrar solicitud</button>
    {config.supportEmail && <p>También podés escribir a <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>. No envíes contraseñas, fotos, voces ni informes del niño para pedir soporte.</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}
