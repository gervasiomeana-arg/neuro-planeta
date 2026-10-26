import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { policySections } from '../../commercial/policy';
import { useCommercial } from './CommercialContext';
export default function LegalLinks() {
  const { config } = useCommercial(), [kind, setKind] = useState<'privacy' | 'terms' | null>(null);
  const box = useRef<HTMLDivElement>(null), opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!kind) return;
    box.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => opener.current?.focus({ preventScroll: true });
  }, [kind]);
  return <div className="np-legal-links">
    <button type="button" className="np-learning-link" onClick={e => { opener.current = e.currentTarget; setKind('privacy'); }}>Privacidad y datos</button>
    <button type="button" className="np-learning-link" onClick={e => { opener.current = e.currentTarget; setKind('terms'); }}>Condiciones de suscripción</button>
    {config.supportEmail && <a href={`mailto:${config.supportEmail}`}>Contactar a soporte</a>}
    {kind && createPortal(<div className="np-legal-overlay"><div ref={box} className="np-legal-dialog" role="dialog" aria-modal="true" aria-labelledby="np-legal-title" onKeyDown={e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setKind(null); }
      if (e.key === 'Tab') {
        const items = Array.from(box.current?.querySelectorAll<HTMLElement>('button,a[href]') || []), first = items[0], last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }}><button type="button" className="np-account-button" onClick={() => setKind(null)}>Cerrar información</button><h2 id="np-legal-title">{kind === 'privacy' ? 'Privacidad y gestión de datos' : 'Condiciones de suscripción'}</h2>
      {!config.legalReady && <p role="status">Los datos comerciales del responsable todavía están incompletos. La contratación no está habilitada.</p>}
      {policySections(config, kind).map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}
      <p><a href="https://www.argentina.gob.ar/aaip/datospersonales/derechos" target="_blank" rel="noopener noreferrer">Derechos y reclamos ante la AAIP</a> · <a href="https://www.paypal.com/ar/legalhub/paypal/privacy-full" target="_blank" rel="noopener noreferrer">Privacidad de PayPal</a> · <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacidad de Google</a></p>
    </div></div>, document.body)}
  </div>;
}
