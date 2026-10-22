import { ArrowLeft, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
type Props = {
  title: string; label: string; icon: LucideIcon; tone: string;
  onBack: () => void; children?: ReactNode;
};
/** Same predictable back action and visual hierarchy in every child activity. */
export default function ActivityHeader({title,label,icon:Icon,tone,onBack,children}:Props) {
  return <header className="np-activity-header" data-tone={tone}>
    <button type="button" className="np-module-back" aria-label="Volver al inicio" onClick={onBack}><ArrowLeft aria-hidden="true"/></button>
    <span className="np-module-symbol"><Icon aria-hidden="true"/></span>
    <div className="np-module-heading"><p>{label}</p><h2>{title}</h2></div>
    {children&&<div className="np-module-progress" aria-live="polite">{children}</div>}
  </header>;
}
