import { adultAuth, adultSessionEpoch, adultSessionIsCurrent } from '../auth/firebase';
export async function accountRequest(path: string, body?: object) {
  const user = adultAuth().currentUser, epoch = adultSessionEpoch();
  if (!user || !user.emailVerified) throw new Error('Ingresá con tu cuenta Google verificada.');
  const token = await user.getIdToken();
  if (!adultSessionIsCurrent(user.uid, epoch)) throw new Error('La cuenta cambió.');
  const response = await fetch(`${import.meta.env.BASE_URL}api/${path}`, { method: body ? 'POST' : 'GET', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(25000), credentials: 'same-origin', headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!adultSessionIsCurrent(user.uid, epoch)) throw new Error('La cuenta cambió.');
  let data: any;
  try { data = await response.json(); } catch { throw new Error('El servicio de cuenta todavía no está disponible.'); }
  if (!response.ok) throw new Error(data.error || 'No se pudo confirmar la operación.');
  return data;
}
