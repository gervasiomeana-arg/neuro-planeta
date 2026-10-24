import { lazy, Suspense } from 'react';
import GoogleAccessShell from './auth/GoogleAccessShell';
import DeviceProtection from './data/DeviceProtection';
const ImportedApp = lazy(() => import('./ImportedApp'));
export default function App() {
  return <GoogleAccessShell><DeviceProtection><Suspense fallback={<p role="status">Abriendo NeuroPlaneta…</p>}><ImportedApp /></Suspense></DeviceProtection></GoogleAccessShell>;
}
