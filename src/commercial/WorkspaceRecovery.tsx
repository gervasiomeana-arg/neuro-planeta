import { useDeviceProtection } from '../data/DeviceProtection';
import { useProfileStorage } from '../data/ProfileStorageContext';
import { loadProfiles, PROFILE_KEY } from '../data/backups';
import BackupPanel from '../data/BackupPanel';
export default function WorkspaceRecovery() {
  const protection = useDeviceProtection(), storage = useProfileStorage();
  let profiles: unknown[] = [], recoveryRaw: string | null | undefined;
  try { profiles = protection?.session ? protection.session.profiles : loadProfiles(storage).profiles; }
  catch { try { recoveryRaw = storage.getItem(PROFILE_KEY); } catch { recoveryRaw = null; } }
  return <main className="np-theme np-commercial-access"><section className="np-commercial-panel" role="alert" aria-label="Recuperar acceso al espacio">
    <h1>No pudimos abrir el espacio</h1><p>Revisá la conexión y permití las cookies necesarias para ingresar. Podés conservar una copia de los perfiles antes de volver a cargar la app.</p>
    <BackupPanel profiles={profiles} recoveryRaw={recoveryRaw} />
    <p>Una actividad en curso puede quedar sin registrar. Si hay cambios pendientes, descargá la copia antes de recargar.</p>
    <button type="button" className="np-account-button" onClick={() => window.location.reload()}>Volver a cargar NeuroPlaneta</button>
  </section></main>;
}
