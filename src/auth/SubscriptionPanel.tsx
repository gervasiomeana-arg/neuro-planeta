import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore/lite';
import { adultAuth, adultSessionEpoch, adultSessionIsCurrent } from './firebase';
import { monthlyPriceCents } from './subscription';
export default function SubscriptionPanel({ user }: { user: User }) {
  const [amount, setAmount] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [loaded, setLoaded] = useState(false);
  const mounted = useRef(false), running = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function perform(save: boolean) {
    if (running.current) return;
    const epoch = adultSessionEpoch();
    const current = () => mounted.current && !document.hidden && adultSessionIsCurrent(user.uid, epoch);
    running.current = true; setBusy(true); setMessage('');
    try {
      if (!current() || !user.emailVerified) throw new Error('Sesión cambiada');
      const ref = doc(getFirestore(adultAuth().app), 'billingConfig', 'monthly');
      if (save) {
        const amountCents = monthlyPriceCents(amount);
        await setDoc(ref, { amountCents, currency: 'ARS', period: 'month', updatedBy: user.uid, updatedAt: serverTimestamp() });
        if (current()) setMessage('Valor mensual guardado. Esta configuración no realiza cobros.');
      } else {
        const result = await getDoc(ref);
        if (current()) {
          const data = result.data();
          setAmount(result.exists() && Number.isSafeInteger(data?.amountCents) ? (data!.amountCents / 100).toFixed(2).replace('.', ',') : '');
          setLoaded(true); setMessage(result.exists() ? 'Valor vigente cargado.' : 'Todavía no hay un valor mensual definido.');
        }
      }
    } catch (error) { if (current()) setMessage(error instanceof Error && error.message.startsWith('Ingresá') ? error.message : 'No se pudo confirmar la operación. Revisá permisos y conexión.'); }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  return <section aria-label="Suscripción mensual" className="space-y-3">
    <h3 className="font-bold">Valor de la suscripción mensual</h3>
    <p>Pesos argentinos (ARS), sin separador de miles; por ejemplo, 15000,00. Guardar este valor no activa pagos ni débitos automáticos.</p>
    <button className="np-account-button np-admin-price" type="button" disabled={busy} onClick={() => perform(false)}>Consultar valor vigente</button>
    <label className="block">Importe mensual en pesos<input className="block w-full border rounded-lg p-2" inputMode="decimal" maxLength={10} value={amount} disabled={busy || !loaded} onChange={event => setAmount(event.target.value)} /></label>
    <button className="np-account-button np-account-primary" type="button" disabled={busy || !loaded || !amount.trim()} onClick={() => perform(true)}>Guardar valor mensual</button>
    {message && <p role="status">{message}</p>}
  </section>;
}
