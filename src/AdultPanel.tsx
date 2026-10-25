import { useEffect, useRef, type ReactNode, type KeyboardEvent } from 'react';
import { Users, ClipboardList, Gift, BookOpen, Images, Volume2, ChartNoAxesCombined, type LucideIcon } from 'lucide-react';

export type AdultSection = 'pacientes'|'rutinas'|'recompensas'|'historias'|'pictogramas'|'sonido'|'reportes';
const sections: {id:AdultSection;label:string;description:string;icon:LucideIcon}[]=[
 {id:'pacientes',label:'Perfiles',description:'Personas y copias',icon:Users},
 {id:'rutinas',label:'Rutinas',description:'Pasos para el día',icon:ClipboardList},
 {id:'recompensas',label:'Premios Reales',description:'Momentos compartidos',icon:Gift},
 {id:'historias',label:'Historias',description:'Anticipar y acompañar',icon:BookOpen},
 {id:'pictogramas',label:'Pictogramas',description:'Imágenes y voces',icon:Images},
 {id:'sonido',label:'Audio Sensorial',description:'Volumen y preferencias',icon:Volume2},
 {id:'reportes',label:'Informe de uso',description:'Compartir con un profesional',icon:ChartNoAxesCombined},
];
export function AdultPanelNavigation({value,onChange}:{value:AdultSection;onChange:(section:AdultSection)=>void}){
 return <div className="np-adult-navigation">
   <nav className="np-adult-desktop-menu" aria-label="Secciones del panel de adultos"><p>ACOMPAÑAR SU DÍA</p>{sections.map(({id,label,description,icon:Icon})=><button type="button" key={id} onClick={()=>onChange(id)} aria-current={value===id?'page':undefined}><Icon aria-hidden="true"/><span><strong>{label}</strong><small>{description}</small></span></button>)}</nav>
   <label className="np-adult-mobile-menu">Sección del panel<select aria-label="Sección del panel" value={value} onChange={e=>onChange(e.target.value as AdultSection)}>{sections.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
 </div>;
}
export function AdultDialog({authenticated,onClose,children}:{authenticated:boolean;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null);
 const priorFocus=useRef(document.activeElement as HTMLElement|null);
 const focusable=()=>Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary,[tabindex="0"]')||[]).filter(el=>el.getClientRects().length>0);
 useEffect(()=>()=>{const before=priorFocus.current;if(before?.isConnected)before.focus({preventScroll:true})},[]);
 useEffect(()=>{if(!ref.current?.contains(document.activeElement))focusable()[0]?.focus()},[authenticated]);
 function keys(event:KeyboardEvent<HTMLDivElement>){
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose();return;}
  if(event.key!=='Tab')return;
  const items=focusable(),first=items[0],last=items[items.length-1];
  if(!first){event.preventDefault();return;}
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
 return <div ref={ref} id="adult-panel-dialog" data-authenticated={authenticated} role="dialog" aria-modal="true" aria-labelledby="adult-panel-title" onKeyDown={keys} className="np-adult-dialog">{children}</div>;
}
