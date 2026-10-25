import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore/lite';
import { adultAuth, adultSessionEpoch, adultSessionIsCurrent } from './firebase';
import { FAMILY_PLAN } from './commercial';
export default function SubscriptionPanel({ user }: { user: User }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
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
        const amountCents = FAMILY_PLAN.amountCents;
        await setDoc(ref, { amountCents, currency: 'USD', period: 'month', updatedBy: user.uid, updatedAt: serverTimestamp() });
        if (current()) setMessage('Valor mensual guardado. Esta configuración no realiza cobros.');
      } else {
        const result = await getDoc(ref);
        if (current()) {
          const data = result.data();
          const validUSD = data?.currency === 'USD' && Number.isSafeInteger(data?.amountCents);
          setLoaded(true); setMessage(validUSD ? `Configuración remota: USD ${(data!.amountCents / 100).toFixed(2)}. El botón guarda el precio elegido de USD 20.` : result.exists() ? 'El registro anterior usa otra moneda o formato. No se convierte automáticamente; el botón guarda USD 20 explícitamente.' : 'Precio definido: USD 20 mensuales. Todavía no fue guardado en la configuración remota.');
        }
      }
    } catch (error) { if (current()) setMessage(error instanceof Error && error.message.startsWith('Ingresá') ? error.message : 'No se pudo confirmar la operación. Revisá permisos y conexión.'); }
    finally { running.current = false; if (mounted.current) setBusy(false); }
  }
  return <section aria-label="Suscripción mensual" className="space-y-3">
    <h3 className="font-bold">Valor de la suscripción mensual</h3>
    <p><strong>{FAMILY_PLAN.name}: {FAMILY_PLAN.display}.</strong> Guardar un importe en USD no convierte valores anteriores en pesos ni activa pagos o débitos automáticos.</p>
    <button className="np-account-button np-admin-price" type="button" disabled={busy} onClick={() => perform(false)}>Consultar valor vigente</button>
    <label className="block">Importe mensual en dólares (USD)<input className="block w-full border rounded-lg p-2" value={(FAMILY_PLAN.amountCents / 100).toFixed(2)} readOnly /></label>
    <button className="np-account-button np-account-primary" type="button" disabled={busy || !loaded} onClick={() => perform(true)}>Guardar USD 20 mensuales</button>
    {message && <p role="status">{message}</p>}
  </section>;
}
