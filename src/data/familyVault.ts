import { decryptBackup, encryptBackup } from './backups';

// Storage foundation only. Existing device profiles are never migrated implicitly.
// UID namespaces are not authorization: the password and authenticated encryption
// protect the content. Firebase session checks belong to the integration layer.
type VaultStorage = Pick<Storage, 'getItem' | 'setItem'>;
const namespace = (uid: string) => {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('Cuenta adulta no válida.');
  return `np_family_vault:v1:${uid}`;
};

export async function readFamilyVault(storage: VaultStorage, uid: string, password: string, stillAuthorized: () => boolean) {
  if (!stillAuthorized()) throw new Error('La sesión adulta cambió.');
  const key = namespace(uid), raw = storage.getItem(key);
  if (raw === null) return { profiles: [], revision: null };
  const profiles = await decryptBackup(raw, password, key);
  if (!stillAuthorized()) throw new Error('La sesión adulta cambió.');
  if (storage.getItem(key) !== raw) throw new Error('La copia privada cambió. Volvé a abrirla.');
  return { profiles, revision: raw };
}

export async function saveFamilyVault(
  storage: VaultStorage, uid: string, profiles: unknown[], password: string,
  expected: string | null, stillAuthorized: () => boolean,
) {
  const key = namespace(uid);
  const check = () => {
    if (!stillAuthorized()) throw new Error('La sesión adulta cambió. No se guardó la copia privada.');
    if (storage.getItem(key) !== expected) throw new Error('Otra pestaña cambió la copia privada. No se sobrescribió.');
  };
  check();
  // A caller must first unlock an existing vault. Never replace it using only
  // knowledge of its revision or silently change its password.
  if (expected !== null) await decryptBackup(expected, password, key);
  check();
  const encrypted = await encryptBackup(profiles, password, key);
  check(); // Recheck after expensive crypto, immediately before the atomic write.
  storage.setItem(key, encrypted);
  return encrypted;
}
