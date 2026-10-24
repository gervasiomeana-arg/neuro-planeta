import { PROFILE_KEY } from './backups';

export type ProfileStorage = Pick<Storage, 'getItem' | 'setItem'> & { physicalKey: string; isolated: boolean; email?: string };
export function accountProfileKey(uid: string) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('Cuenta no válida.');
  return `np_account_profiles:v1:${uid}`;
}
export function accountProfileStorage(storage: Pick<Storage, 'getItem' | 'setItem'>, uid: string, current: () => boolean, email?: string): ProfileStorage {
  const physicalKey = accountProfileKey(uid);
  function check(key: string) {
    if (!current()) throw new Error('La sesión adulta cambió. No se accedió a los perfiles.');
    if (key !== PROFILE_KEY) throw new Error('Ruta de perfiles no admitida.');
  }
  return {
    physicalKey, isolated: true, email,
    getItem(key) { check(key); return storage.getItem(physicalKey); },
    setItem(key, value) { check(key); storage.setItem(physicalKey, value); },
  };
}
