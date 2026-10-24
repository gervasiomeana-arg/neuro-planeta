import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { adultSessionEpoch, adultSessionIsCurrent } from '../auth/firebase';
import { PROFILE_KEY } from './backups';
import { accountProfileStorage, type ProfileStorage } from './accountProfileStorage';

// Legacy mode is used only when the Google gate is explicitly disabled (isolated CI).
const legacy: ProfileStorage = { physicalKey: PROFILE_KEY, isolated: false,
  getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
const Context = createContext<ProfileStorage>(legacy);
export const useProfileStorage = () => useContext(Context);
export function AccountProfileBoundary({ user, children }: { user: User; children: ReactNode }) {
  const epoch = adultSessionEpoch();
  const storage = useMemo(() => accountProfileStorage(localStorage, user.uid,
    () => adultSessionIsCurrent(user.uid, epoch), user.email || undefined), [user.uid, user.email, epoch]);
  return <Context.Provider value={storage}>{children}</Context.Provider>;
}
