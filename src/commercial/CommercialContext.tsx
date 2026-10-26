import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_CONFIG, type PublicCommercialConfig } from '../../commercial/policy';
const Context = createContext<{ config: PublicCommercialConfig; error: string; loaded: boolean; retry: () => void }>({ config: DEFAULT_CONFIG, error: '', loaded: false, retry() {} });
export const useCommercial = () => useContext(Context);
export default function CommercialProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    void fetch(import.meta.env.BASE_URL + 'commercial-config.json', { cache: 'no-store', signal: abort.signal }).then(async r => {
      const data = await r.json();
      if (!r.ok || !['off', 'sandbox', 'live'].includes(data.mode) || typeof data.enforce !== 'boolean' || typeof data.legalReady !== 'boolean') throw new Error();
      setConfig(data); setError(''); setLoaded(true);
    }).catch(() => { if (!abort.signal.aborted) setError('No se pudo consultar el estado comercial. Volvé a intentar antes de contratar.'); });
    return () => abort.abort();
  }, [attempt]);
  return <Context.Provider value={{ config, error, loaded, retry: () => setAttempt(n => n + 1) }}>{children}</Context.Provider>;
}
