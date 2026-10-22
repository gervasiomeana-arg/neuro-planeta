import { initializeApp } from 'firebase/app';
import { initializeAuth, browserSessionPersistence, type Auth } from 'firebase/auth';

// Public web-app identifiers. No admin SDK, service-account key or billing API.
let auth: Auth | undefined;
export function adultAuth() {
  if (!auth) {
    const app = initializeApp({
      apiKey: 'AIzaSyAjnF0-SAQIpmPTgidYY11fjNHrOHkjdpk',
      authDomain: 'neuroplaneta-bdaf9.firebaseapp.com',
      projectId: 'neuroplaneta-bdaf9',
      appId: '1:329476093246:web:aa8c325ef2c8e1ede6686f',
    }, 'neuroplaneta-adults');
    auth = initializeAuth(app, { persistence: browserSessionPersistence });
  }
  return auth;
}
