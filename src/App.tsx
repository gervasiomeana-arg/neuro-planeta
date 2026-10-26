import { lazy, Suspense } from 'react';
import GoogleAccessShell from './auth/GoogleAccessShell';
import DeviceProtection from './data/DeviceProtection';
import CommercialProvider from './commercial/CommercialContext';
import CommercialGate from './commercial/CommercialGate';
import ActivityErrorBoundary from './ActivityErrorBoundary';
import WorkspaceRecovery from './commercial/WorkspaceRecovery';
const ImportedApp = lazy(() => import('./ImportedApp'));
export default function App() {
  return <CommercialProvider><GoogleAccessShell><DeviceProtection><CommercialGate><ActivityErrorBoundary fallback={<WorkspaceRecovery />}><Suspense fallback={<p role="status">Abriendo NeuroPlaneta…</p>}><ImportedApp /></Suspense></ActivityErrorBoundary></CommercialGate></DeviceProtection></GoogleAccessShell></CommercialProvider>;
}
