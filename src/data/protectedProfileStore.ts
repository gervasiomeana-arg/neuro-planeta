import { encryptBackup, openBackupSession, PROFILE_KEY, validateProfiles } from './backups';

type StorageAdapter = Pick<Storage, 'getItem' | 'setItem'>;
type Cipher = Awaited<ReturnType<typeof openBackupSession>>;
function snapshot(profiles: unknown[]) {
  const serialized = JSON.stringify(profiles);
  validateProfiles(JSON.parse(serialized));
  return serialized;
}
export class ProtectedProfileStore {
  private queue: Promise<void> = Promise.resolve();
  private closed = false;
  private revision: string;
  private saved: string;
  private latest: string;
  pending = 0;
  error = '';
  constructor(private cipher: Cipher, private storage: StorageAdapter, revision: string, private notify = () => {}) {
    this.revision = revision;
    this.saved = this.latest = snapshot(cipher.profiles);
  }
  get profiles() { if (this.closed) throw new Error('Almacenamiento bloqueado.'); return JSON.parse(this.latest); }
  get dirty() { return this.latest !== this.saved || this.pending > 0; }
  save(profiles: unknown[]): Promise<void> {
    if (this.closed) return Promise.reject(new Error('Almacenamiento bloqueado.'));
    let raw: string;
    try { raw = snapshot(profiles); } catch (error) { return Promise.reject(error); }
    this.latest = raw;
    if (raw === this.saved && this.pending === 0) {
      this.error = ''; this.queue = Promise.resolve(); this.notify(); return this.queue;
    }
    this.pending++; this.notify();
    const work = this.queue.catch(() => {}).then(async () => {
      if (this.closed) throw new Error('Almacenamiento bloqueado.');
      if (this.storage.getItem(PROFILE_KEY) !== this.revision) throw new Error('Otra pestaña cambió los perfiles. No se sobrescribieron.');
      const encrypted = await this.cipher.seal(JSON.parse(raw));
      if (this.closed || this.storage.getItem(PROFILE_KEY) !== this.revision) throw new Error('Otra pestaña cambió los perfiles. No se sobrescribieron.');
      this.storage.setItem(PROFILE_KEY, encrypted);
      this.revision = encrypted; this.saved = raw; this.error = '';
    }).catch(error => {
      this.error = error instanceof Error ? error.message : 'No se pudo guardar el cifrado.';
      throw error;
    }).finally(() => { this.pending--; this.notify(); });
    this.queue = work;
    return work;
  }
  async close() {
    await this.queue;
    if (this.dirty) throw new Error('Hay cambios sin guardar. Descargá una copia antes de cerrar.');
    this.closed = true; this.cipher.destroy(); this.saved = ''; this.latest = '';
  }
}
export async function prepareProfileProtection(profiles: unknown[], password: string) {
  const raw = snapshot(profiles);
  const encrypted = await encryptBackup(JSON.parse(raw), password);
  const cipher = await openBackupSession(encrypted, password);
  if (snapshot(cipher.profiles) !== raw) { cipher.destroy(); throw new Error('No se pudo comprobar la copia cifrada.'); }
  return {
    encrypted,
    cancel: () => cipher.destroy(),
    activate(storage: StorageAdapter, notify: () => void) {
      if (storage.getItem(PROFILE_KEY) !== raw) throw new Error('Los perfiles cambiaron. Prepará una nueva copia antes de activar.');
      // Atomic replacement only after successful encryption + readback and consent.
      storage.setItem(PROFILE_KEY, encrypted);
      return new ProtectedProfileStore(cipher, storage, encrypted, notify);
    },
  };
}
export async function unlockProfileProtection(storage: StorageAdapter, password: string, notify: () => void) {
  const encrypted = storage.getItem(PROFILE_KEY);
  if (encrypted === null) throw new Error('No se encontró el almacenamiento protegido.');
  const cipher = await openBackupSession(encrypted, password);
  if (storage.getItem(PROFILE_KEY) !== encrypted) { cipher.destroy(); throw new Error('Los datos cambiaron. Volvé a desbloquear.'); }
  return new ProtectedProfileStore(cipher, storage, encrypted, notify);
}
