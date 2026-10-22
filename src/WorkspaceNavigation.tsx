import { Home, ClipboardList, BookOpen, Star, Leaf, Lock, ArrowRight, Sparkles, LogOut, type LucideIcon } from 'lucide-react';

export type WorkspaceDestination = 'inicio' | 'rutinas' | 'social' | 'logros' | 'zona_calma' | 'adultos' | 'salir';
type Props = { activePage: string; onNavigate: (destination: WorkspaceDestination) => void };
const destinations: {id: WorkspaceDestination; label: string; icon: LucideIcon}[] = [
  {id:'inicio',label:'Mi planeta',icon:Home}, {id:'rutinas',label:'Mis rutinas',icon:ClipboardList},
  {id:'social',label:'Mis historias',icon:BookOpen}, {id:'logros',label:'Mis estrellas',icon:Star},
];
export default function WorkspaceNavigation({activePage,onNavigate}:Props) {
  return <aside className="np-workspace-sidebar" aria-label="Mi espacio">
    <button type="button" className="np-workspace-brand" onClick={()=>onNavigate('inicio')}><Sparkles aria-hidden="true"/><span>NeuroPlaneta<small>UN UNIVERSO A TU RITMO</small></span></button>
    <p className="np-workspace-caption">MI ESPACIO</p>
    <nav aria-label="Navegación de escritorio">{destinations.map(({id,label,icon:Icon})=><button type="button" key={id} onClick={()=>onNavigate(id)} aria-current={activePage===id?'page':undefined}><Icon aria-hidden="true"/><span>{label}</span></button>)}</nav>
    <section className="np-workspace-pause"><Leaf aria-hidden="true"/><h2>Está bien hacer una pausa.</h2><p>Tu rincón tranquilo siempre está acá.</p><button type="button" onClick={()=>onNavigate('zona_calma')}>Ir a mi calma <ArrowRight aria-hidden="true"/></button></section>
    <div className="np-workspace-tools"><button type="button" onClick={()=>onNavigate('adultos')}><Lock aria-hidden="true"/> Espacio de adultos</button><button type="button" onClick={()=>onNavigate('salir')}><LogOut aria-hidden="true"/> Salir al acceso</button><p>Hecho para acompañarte ♡</p></div>
  </aside>;
}
