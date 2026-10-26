import { initializeApp } from 'firebase/app';
import { initializeAuth, browserSessionPersistence, browserPopupRedirectResolver, onAuthStateChanged, signOut, type Auth } from 'firebase/auth';

import { clearAdultActivity, watchAdultIdle } from './idleSession';

// Public web-app identifiers. No admin SDK, service-account key or billing API.
let auth: Auth | undefined;
let epoch = 0;
let sessionActive = false;
export const adultSessionEpoch = () => epoch;
export const adultSessionIsCurrent = (uid: string, version: number) => sessionActive && epoch === version && auth?.currentUser?.uid === uid;
export async function endAdultSession() {
  sessionActive = false; epoch++;
  window.dispatchEvent(new Event('np-adult-lock'));
  await signOut(adultAuth());
}
export function adultAuth() {
  if (!auth) {
    const app = initializeApp({
      apiKey: 'AIzaSyAjnF0-SAQIpmPTgidYY11fjNHrOHkjdpk',
      authDomain: 'neuroplaneta-bdaf9.firebaseapp.com',
      projectId: 'neuroplaneta-bdaf9',
      appId: '1:329476093246:web:aa8c325ef2c8e1ede6686f',
    }, 'neuroplaneta-adults');
    auth = initializeAuth(app, { persistence: browserSessionPersistence, popupRedirectResolver: browserPopupRedirectResolver });
    const sessionAuth = auth;
    const tabStorage = {
      getItem: (key: string) => window.sessionStorage.getItem(key),
      setItem: (key: string, value: string) => window.sessionStorage.setItem(key, value),
      removeItem: (key: string) => window.sessionStorage.removeItem(key),
    };
    let stopIdle: (() => void) | undefined;
    let previousUid: string | undefined;
    // Installed once with Auth, not tied to the mounted account form.
    onAuthStateChanged(sessionAuth, account => {
      stopIdle?.();
      epoch++; sessionActive = Boolean(account);
      if (!account) {
        if (previousUid) clearAdultActivity(previousUid, tabStorage);
        previousUid = undefined;
        return;
      }
      if (previousUid && previousUid !== account.uid) clearAdultActivity(previousUid, tabStorage);
      previousUid = account.uid;
      stopIdle = watchAdultIdle(account.uid, () => {
        void endAdultSession().catch(() => {
          window.dispatchEvent(new Event('np-adult-signout-failed'));
        });
      }, {
        storage: tabStorage, events: window, visibilityEvents: document,
        hidden: () => document.hidden,
        adultInteraction: event => event.target instanceof Element
          && Boolean(event.target.closest('#adult-panel-dialog[data-authenticated="true"], #np-administration[data-adult-secure="true"]')),
        now: Date.now,
        schedule: (callback, ms) => setTimeout(callback, ms), cancel: timer => clearTimeout(timer),
      });
    });
  }
  return auth;
}
