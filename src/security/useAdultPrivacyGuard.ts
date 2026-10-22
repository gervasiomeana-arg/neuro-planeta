import { useEffect, useRef } from 'react';

// A local privacy precaution, not authentication or account authorization.
export function useAdultPrivacyGuard(onLock: () => void) {
  const lock = useRef(onLock);
  lock.current = onLock;
  useEffect(() => {
    const hidden = () => { if (document.hidden) lock.current(); };
    const leaving = () => lock.current();
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', leaving);
    return () => {
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', leaving);
    };
  }, []);
}
