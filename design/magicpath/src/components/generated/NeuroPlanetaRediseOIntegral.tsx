import React, { useEffect, useState } from 'react';
import './NeuroPlanetaRediseOIntegral.css';
type IconName = 'home' | 'star' | 'heart' | 'smile' | 'focus' | 'wind' | 'spark' | 'chat' | 'book' | 'list' | 'arrow' | 'back' | 'lock' | 'sun' | 'moon' | 'sound' | 'check' | 'plus' | 'close' | 'settings' | 'leaf' | 'gift' | 'play' | 'pause' | 'people';
const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="m3 11 9-8 9 8v10H4V11M9 21v-7h6v7" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />,
  heart: <path d="M20.5 5.5c-2.4-2.4-6-1.4-8.5 1-2.5-2.4-6.1-3.4-8.5-1-4.5 5 3 11 8.5 15 5.5-4 13-10 8.5-15Z" />,
  smile: <><circle cx="12" cy="12" r="9" /><path d="M8 14c1 4 7 4 8 0M8 9h.1M16 9h.1" /></>,
  focus: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /><circle cx="12" cy="12" r="4" /></>,
  wind: <><path d="M3 8h12c5 0 4-6 1-5M3 12h16c5 0 4 6 1 5M3 16h8c4 0 3 5 0 5" /></>,
  spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4" /></>,
  chat: <path d="M21 15a3 3 0 0 1-3 3H9l-6 4V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3ZM7 8h10M7 12h7" />,
  book: <><path d="M12 5c-3-2-7-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1v15" /></>,
  list: <><rect x="5" y="4" width="15" height="18" rx="3" /><path d="M9 2h7v5H9zM9 12h7M9 17h7" /></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  back: <path d="M20 12H4m6-6-6 6 6 6" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" /></>,
  moon: <path d="M21 14A9 9 0 0 1 10 3a9 9 0 1 0 11 11Z" />,
  sound: <><path d="m11 4-6 5H2v6h3l6 5ZM16 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" /></>,
  check: <path d="m5 12 4 4L20 5" />,
  plus: <path d="M12 4v16M4 12h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  settings: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2" /></>,
  leaf: <path d="M20 3C7 1-1 14 7 19 17 26 23 9 20 3ZM5 22l10-12" />,
  gift: <><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M2 12h20M12 8v13M12 8C2 8 5 0 9 4l3 4c10 0 7-8 3-4Z" /></>,
  play: <path d="m8 4 13 8-13 8Z" />,
  pause: <><path d="M8 4v16M16 4v16" /></>,
  people: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-3c0-6 14-6 14 0v3M17 5c5 0 5 7 1 8m1 2c3 1 3 3 3 6" /></>
};
function Icon({
  name,
  size = 22
}: {
  name: IconName;
  size?: number;
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
function Planet({
  large = false
}: {
  large?: boolean;
}) {
  return <svg className={large ? 'np-planet large' : 'np-planet'} viewBox="0 0 280 220" fill="none" aria-hidden="true"><path d="M30 160c41 42 176 42 219-21" stroke="#ACC6B1" strokeWidth="1" strokeDasharray="3 8" /><path d="m43 42 3 9 9 3-9 3-3 9-3-9-9-3 9-3Zm187 133 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#D6A35D" /><circle cx="231" cy="53" r="5" fill="#D7BAAE" /><circle cx="58" cy="185" r="3" fill="#70958A" /><ellipse cx="143" cy="111" rx="72" ry="70" fill="#B9D0BA" /><path d="M84 112c5-58 59-83 94-55-54-16-82 26-94 55Z" fill="#D6E4CF" /><ellipse cx="142" cy="124" rx="112" ry="24" transform="rotate(-21 142 124)" stroke="#D9AF72" strokeWidth="15" /><path d="M77 113c4 45 30 70 66 68 40 1 68-26 72-62-32-6-104-13-138-6Z" fill="#B9D0BA" /><ellipse cx="118" cy="112" rx="4" ry="6" fill="#294C43" /><ellipse cx="158" cy="102" rx="4" ry="6" fill="#294C43" /><path d="M132 124c5 5 13 4 16-2" stroke="#294C43" strokeWidth="3" strokeLinecap="round" /><ellipse cx="106" cy="124" rx="7" ry="4" fill="#D8B3A2" /><ellipse cx="174" cy="111" rx="7" ry="4" fill="#D8B3A2" /><path d="m212 92 13-6m-15 16 18-1" stroke="#294C43" strokeWidth="2" strokeLinecap="round" /></svg>;
}
const modules: {
  id: string;
  name: string;
  desc: string;
  icon: IconName;
  color: string;
  detail: string;
}[] = [{
  id: 'emociones',
  name: '¿Cómo me siento?',
  desc: 'Todas las emociones tienen lugar.',
  icon: 'smile',
  color: 'peach',
  detail: 'Emociones'
}, {
  id: 'atencion',
  name: 'Vamos a descubrir',
  desc: 'Juegos para mirar y encontrar.',
  icon: 'focus',
  color: 'blue',
  detail: 'Atención'
}, {
  id: 'calma',
  name: 'Mi momento de calma',
  desc: 'Una pausa, a mi ritmo.',
  icon: 'wind',
  color: 'lavender',
  detail: 'Zona calma'
}, {
  id: 'sensorial',
  name: 'Exploro mis sentidos',
  desc: 'Colores y formas para explorar.',
  icon: 'spark',
  color: 'pink',
  detail: 'Sensorial'
}, {
  id: 'comunicar',
  name: 'Quiero decir algo',
  desc: 'Mis imágenes también hablan.',
  icon: 'chat',
  color: 'sky',
  detail: 'Comunicación'
}, {
  id: 'social',
  name: 'Historias para mí',
  desc: 'Conozco lo que va a pasar.',
  icon: 'book',
  color: 'sand',
  detail: 'Historias sociales'
}, {
  id: 'rutinas',
  name: 'Mi día, paso a paso',
  desc: 'Una cosa a la vez. Tú puedes.',
  icon: 'list',
  color: 'sage',
  detail: 'Rutinas'
}];
const storySteps = ['El lunes voy a una escuela nueva.', 'Puedo ir con alguien que me cuida.', 'Voy a conocer a mi maestra y mi aula.', 'Si necesito una pausa, puedo pedir ayuda.', 'Al terminar, regreso con mi familia.'];
const pictos = [{
  label: 'Agua',
  emoji: '💧',
  cat: 'Necesito'
}, {
  label: 'Comer',
  emoji: '🍎',
  cat: 'Necesito'
}, {
  label: 'Baño',
  emoji: '🚽',
  cat: 'Necesito'
}, {
  label: 'Una pausa',
  emoji: '🍃',
  cat: 'Necesito'
}, {
  label: 'Ayuda',
  emoji: '🙋',
  cat: 'Necesito'
}, {
  label: 'Abrazo',
  emoji: '🫂',
  cat: 'Siento'
}, {
  label: 'Feliz',
  emoji: '🙂',
  cat: 'Siento'
}, {
  label: 'Triste',
  emoji: '😔',
  cat: 'Siento'
}, {
  label: 'Jugar',
  emoji: '🧩',
  cat: 'Quiero'
}, {
  label: 'Salir',
  emoji: '🌳',
  cat: 'Quiero'
}, {
  label: 'Música',
  emoji: '🎵',
  cat: 'Quiero'
}, {
  label: 'Descansar',
  emoji: '🛏️',
  cat: 'Quiero'
}];
function speak(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-AR';
    window.speechSynthesis.speak(u);
  }
}
export const NeuroPlanetaRediseOIntegral = () => {
  const [screen, setScreen] = useState('inicio'),
    [notice, setNotice] = useState(''),
    [sound, setSound] = useState(false),
    [help, setHelp] = useState(false),
    [stars, setStars] = useState(24),
    [reward, setReward] = useState('');
  const [feeling, setFeeling] = useState(''),
    [intensity, setIntensity] = useState(0),
    [breathing, setBreathing] = useState(false),
    [breathTick, setBreathTick] = useState(0);
  const [target, setTarget] = useState(1),
    [gameMode, setGameMode] = useState('Números'),
    [bubble, setBubble] = useState(0),
    [sensoryColor, setSensoryColor] = useState('sage');
  const [phrase, setPhrase] = useState<string[]>([]),
    [category, setCategory] = useState('Todos'),
    [query, setQuery] = useState('');
  const [story, setStory] = useState(false),
    [step, setStep] = useState(0),
    [routine, setRoutine] = useState('Mañana'),
    [checked, setChecked] = useState<number[]>([]),
    [timer, setTimer] = useState(false),
    [seconds, setSeconds] = useState(60);
  const [adultTab, setAdultTab] = useState('Resumen'),
    [draft, setDraft] = useState('El lunes empezamos una escuela nueva'),
    [draftReady, setDraftReady] = useState(false),
    [editedStory, setEditedStory] = useState(storySteps.join('\n')),
    [savedStory, setSavedStory] = useState(false);
  const [adultGate, setAdultGate] = useState(false),
    [answer, setAnswer] = useState('');
  const [demoName, setDemoName] = useState('Alex');
  const [nameDraft, setNameDraft] = useState('Alex');
  const [emotionRecords, setEmotionRecords] = useState<{feeling:string;intensity:number}[]>([]);
  const [savedSteps, setSavedSteps] = useState(storySteps);
  const [routineSteps, setRoutineSteps] = useState<Record<string,string[]>>({Mañana:['Me despierto','Me lavo los dientes','Me visto','Desayuno'],Tarde:['Almuerzo','Descanso un momento','Juego o hago una actividad','Preparo mi mochila'],Noche:['Ceno','Me lavo los dientes','Elijo una historia','Me preparo para dormir']});
  const readAloud = (text:string) => {setSound(true);speak(text)};
  const go = (s: string) => {
    setScreen(s);
    setNotice('');
    setStory(false);
    setBreathing(false);
    setTimer(false);
    window.scrollTo({
      top: 0
    });
  };
  const toast = (s: string) => setNotice(s);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    if (!breathing) return;
    const id = setInterval(() => setBreathTick(x => x + 1), 1000);
    return () => clearInterval(id);
  }, [breathing]);
  useEffect(() => {
    if (seconds === 0) {setTimer(false); return;}
    if (!timer) return;
    const id = setInterval(() => setSeconds(x => x - 1), 1000);
    return () => clearInterval(id);
  }, [timer, seconds]);
  const current = modules.find(m => m.id === screen);
  const activitySteps = routineSteps[routine];
  const toggleCheck = (i: number) => setChecked(x => x.includes(i) ? x.filter(n => n !== i) : [...x, i]);
  const heading = (eyebrow: string, title: string, desc: string) => <div className="np-page-title"><span className="np-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{desc}</p></div>;
  const button = (text: string, action: () => void, icon: IconName = 'arrow', secondary = false) => <button className={secondary ? 'np-btn secondary' : 'np-btn'} onClick={action}>{text}<Icon name={icon} size={19} /></button>;
  const nav = (id: string, label: string, icon: IconName) => <button className={'np-nav-item ' + (screen === id ? 'active' : '')} onClick={() => go(id)} aria-current={screen === id ? 'page' : undefined}><Icon name={icon} /><span>{label}</span>{screen === id && <i />}</button>;
  return <div className="np-design">
  <aside className="np-sidebar"><button className="np-brand" onClick={() => go('inicio')}><span className="np-brand-mark"><Icon name="spark" size={24} /></span><span>Neuro<span className="np-brand-light">Planeta</span><small>UN UNIVERSO A TU RITMO</small></span></button><div className="np-sidebar-label">MI ESPACIO</div>{nav('inicio', 'Mi planeta', 'home')}{nav('rutinas', 'Mis rutinas', 'list')}{nav('social', 'Mis historias', 'book')}{nav('logros', 'Mis estrellas', 'star')}<div className="np-side-pause"><span className="np-small-icon"><Icon name="leaf" /></span><h3>Está bien hacer una pausa.</h3><p>Tu rincón tranquilo siempre está aquí.</p><button onClick={() => go('calma')}>Ir a mi calma <Icon name="arrow" size={16} /></button><div className="np-pause-leaf" /></div><div className="np-sidebar-bottom"><button onClick={() => setAdultGate(true)}><Icon name="lock" size={18} /> Espacio de adultos <Icon name="arrow" size={16} /></button><small>Hecho para acompañarte ♡</small></div></aside>
  <div className="np-shell"><header className="np-topbar"><div className="np-breadcrumb"><span className="np-mobile-brand">✳ NeuroPlaneta</span><span className="np-desktop-crumb">Mi espacio <span>/</span> {screen === 'inicio' ? 'Mi planeta' : screen === 'adultos' ? 'Espacio de adultos' : screen === 'logros' ? 'Mis estrellas' : current?.detail}</span></div><div className="np-header-actions"><button className="np-sound" onClick={() => {
            if(sound && 'speechSynthesis' in window) window.speechSynthesis.cancel();
            setSound(!sound);
            toast(sound ? 'Lectura desactivada' : 'Lectura activada. Toca un botón de lectura para escuchar.');
          }} aria-label={sound ? 'Desactivar lectura' : 'Activar lectura'} aria-pressed={sound}><Icon name="sound" size={19} /><span>{sound ? 'Lectura activa' : 'Sin sonido'}</span>{!sound && <i />}</button><button className="np-star-pill" onClick={() => go('logros')}><Icon name="star" size={18} />{stars}<span>estrellas</span></button><button className="np-avatar" aria-label="Abrir perfil de demostración" onClick={() => setAdultGate(true)}>{demoName[0]}</button></div></header>
  <main className="np-main">
  {screen !== 'inicio' && <button className="np-back" onClick={() => story ? setStory(false) : go('inicio')}><Icon name="back" size={18} />{story ? 'Mis historias' : 'Volver a mi planeta'}</button>}
  {screen === 'inicio' && <>
   <div className="np-greeting"><div><span className="np-eyebrow"><span className="np-dot" /> HOY ES UN BUEN DÍA PARA EXPLORAR</span><h1>Hola, {demoName} <span className="np-wave">✦</span></h1><p>Este es tu espacio. Vamos a tu ritmo.</p></div><div className="np-profile-tag"><span>🌱</span><div>Pequeños pasos<small>Grandes descubrimientos</small></div></div></div>
   <section className="np-welcome"><div className="np-welcome-copy"><span className="np-eyebrow">COSMO TE ACOMPAÑA</span><h2>Un universo de cosas<br />por descubrir.</h2><p>Podemos jugar, expresar lo que sentimos<br className="np-desktop-crumb" /> o simplemente hacer una pausa.</p><button className="np-btn" onClick={() => go('emociones')}>¿Cómo te sientes hoy? <Icon name="arrow" size={19} /></button></div><Planet large /><div className="np-cosmo-caption">Aquí, cada pequeño paso cuenta.</div></section>
   <div className="np-section-heading"><div><h2>¿Qué te gustaría hacer?</h2><p>Elige lo que necesitas en este momento.</p></div><span className="np-soft-label"><Icon name="heart" size={15} /> Sin prisa</span></div>
   <div className="np-module-grid">{modules.map(m => <button key={m.id} onClick={() => go(m.id)} className={'np-module ' + m.color}><div className="np-card-top"><span className="np-module-icon"><Icon name={m.icon} size={28} /></span><Icon name="arrow" size={20} /></div><span className="np-module-category">{m.detail}</span><h3>{m.name}</h3><p>{m.desc}</p><div className="np-card-decoration"><Icon name={m.icon} size={110} /></div></button>)}<button className="np-module np-routine-preview" onClick={() => go('rutinas')}><div><span className="np-eyebrow">MI SIGUIENTE PASO</span><h3>Preparar mi mochila</h3><p>Un paso pequeño para mañana.</p></div><span className="np-preview-check"><Icon name="list" size={27} /></span><span className="np-preview-link">Ver mi rutina <Icon name="arrow" size={17} /></span></button></div>
   <div className="np-bottom-note"><Icon name="leaf" size={17} /> No tienes que hacerlo todo. Elige una cosa que te haga bien.</div>
  </>}
  {screen === 'emociones' && <>{heading('EMOCIONES', '¿Cómo está tu cuerpo hoy?', 'Puedes elegir lo que más se parece a lo que sientes.')}<section className="np-panel"><div className="np-feelings">{[{
                name: 'Con poca energía',
                emoji: '😴',
                color: 'blue'
              }, {
                name: 'Tranquilo',
                emoji: '🙂',
                color: 'sage'
              }, {
                name: 'Inquieto',
                emoji: '😬',
                color: 'peach'
              }, {
                name: 'Muy intenso',
                emoji: '😣',
                color: 'pink'
              }].map(f => <button key={f.name} className={'np-feeling ' + f.color + (feeling === f.name ? ' selected' : '')} onClick={() => {
                setFeeling(f.name);
                setIntensity(0);
              }} aria-pressed={feeling === f.name}><span>{f.emoji}</span><strong>{f.name}</strong>{feeling === f.name && <Icon name="check" />}</button>)}</div>{feeling ? <div className="np-intensity"><h2>¿Cuánto lo sientes?</h2><p>Elige la intensidad. No hay respuestas incorrectas.</p><div className="np-three">{['Un poquito', 'Bastante', 'Mucho'].map((x, i) => <button className={'np-choice ' + (intensity === i + 1 ? 'selected' : '')} onClick={() => setIntensity(i + 1)} aria-pressed={intensity === i + 1} key={x}><span className={'np-intensity-bars level-' + i}><i /><i /><i /></span>{x}</button>)}</div><div className="np-action-row"><button className="np-btn" disabled={!intensity} onClick={()=>{setEmotionRecords(r=>[...r,{feeling,intensity}]);setFeeling('');setIntensity(0);toast('Listo, te escuchamos. Tu emoción quedó registrada en esta demostración.')}}>Guardar cómo me siento <Icon name="check" size={19}/></button>{button('Quiero una pausa', () => go('calma'), 'wind', true)}</div></div> : <div className="np-gentle-hint"><Icon name="heart" /> Todas las emociones están bien. Puedes cambiar de idea.</div>}</section></>}
  {screen === 'atencion' && <>{heading('ATENCIÓN', 'Pequeños descubrimientos', 'Mira con calma. Puedes intentarlo todas las veces que quieras.')}<div className="np-tabs">{['Números', 'Imágenes'].map(x => <button className={gameMode === x ? 'selected' : ''} onClick={() => {
              setGameMode(x);
              setTarget(1);
            }} key={x}>{x}</button>)}</div><section className="np-panel np-game"><span className="np-soft-label">A tu ritmo · Sin reloj</span><h2>{target > 6 ? '¡Lo descubriste!' : gameMode === 'Números' ? `Encuentra el número ${target}` : `Encuentra ${['la manzana', 'el árbol', 'la luna', 'el sol', 'la flor', 'la estrella'][target - 1]}`}</h2><p>{target > 6 ? 'Gracias por jugar. Puedes repetir o elegir otra actividad.' : 'Toca la tarjeta que estás buscando.'}</p>{target > 6 ? <div className="np-game-done"><Icon name="star" size={90} />{button('Jugar otra vez', () => setTarget(1), 'play')}</div> : <div className="np-game-grid">{[4, 1, 6, 3, 2, 5].map(n => <button key={n} onClick={() => {
                if (n === target) {
                  setTarget(t => t + 1);
                  toast('¡Lo encontraste!');
                } else toast('Probemos otra vez. Tómate tu tiempo.');
              }}>{gameMode === 'Números' ? n : ['🍎', '🌳', '🌙', '☀️', '🌸', '⭐'][n - 1]}</button>)}</div>}<div className="np-progress-dots">{[1, 2, 3, 4, 5, 6].map(n => <i key={n} className={target > n ? 'done' : ''} />)}</div></section></>}
  {screen === 'calma' && <>{heading('MI RINCÓN TRANQUILO', 'Podemos hacer una pausa', 'No necesitas hacer nada perfecto. Quédate aquí el tiempo que necesites.')}<section className="np-calm-scene"><div className={'np-breath-orbit ' + (breathing ? 'running' : '')}><div className="np-breath-core"><Icon name="leaf" size={38} /><strong>{breathing ? breathTick % 10 < 4 ? 'Toma aire' : breathTick % 10 < 6 ? 'Una pausa' : 'Suelta el aire' : 'Estoy aquí'}</strong><span>{breathing ? 'Suave, sin forzar' : 'A tu lado'}</span></div></div><h2>{breathing ? 'Sigue tu propio ritmo' : 'Una respiración a la vez'}</h2><p>Puedes respirar conmigo o simplemente mirar.</p>{button(breathing ? 'Terminar respiración' : 'Empezar despacio', () => {
              setBreathing(!breathing);
              setBreathTick(0);
            }, breathing ? 'pause' : 'play')}<div className="np-calm-options"><button onClick={() => setHelp(true)}><Icon name="heart" /> Necesito ayuda ahora</button><button onClick={() => go('comunicar')}><Icon name="chat" /> Quiero pedir algo</button></div></section></>}
  {screen === 'sensorial' && <>{heading('SENSORIAL', 'Un jardín de colores', 'Toca el jardín para descubrir una nueva forma. Tú eliges cuándo parar.')}<section className={'np-sensory ' + sensoryColor}><button className="np-sensory-field" onClick={() => setBubble(x => x + 1)} aria-label="Crear una nueva forma en el jardín"><div className={'np-sensory-flower variant-' + bubble % 3}><i /><i /><i /><i /><span><Icon name="spark" size={42} /></span></div><span>{bubble === 0 ? 'Toca para explorar' : `Has creado ${bubble} ${bubble === 1 ? 'forma' : 'formas'}`}</span></button><div className="np-sensory-controls"><span>Elige un color</span>{['sage', 'blue', 'lavender', 'peach'].map(x => <button key={x} className={'np-color-dot ' + x + (sensoryColor === x ? ' selected' : '')} onClick={() => setSensoryColor(x)} aria-label={{
                sage: 'Verde',
                blue: 'Azul',
                lavender: 'Lavanda',
                peach: 'Durazno'
              }[x]} aria-pressed={sensoryColor === x} />)}<button className="np-text-btn" onClick={() => setBubble(0)}>Volver a empezar</button></div></section></>}
  {screen === 'comunicar' && <>{heading('COMUNICACIÓN', 'Mi voz, a mi manera', 'Toca las imágenes para contar lo que necesitas.')}<section className="np-phrase"><div>{phrase.length ? phrase.map((x, i) => <button key={i} onClick={() => setPhrase(p => p.filter((_, n) => n !== i))}>{x} <Icon name="close" size={13} /></button>) : <p>Quiero… <span>Elige una imagen de abajo</span></p>}</div><button className="np-btn" disabled={!phrase.length} onClick={() => {
              readAloud('Quiero ' + phrase.join(', '));
              toast('Leyendo tu frase');
            }}><Icon name="sound" /> Leer</button><button className="np-text-btn" disabled={!phrase.length} onClick={() => setPhrase([])}>Borrar</button></section><div className="np-toolbar"><div className="np-tabs">{['Todos', 'Necesito', 'Siento', 'Quiero'].map(x => <button key={x} className={category === x ? 'selected' : ''} onClick={() => setCategory(x)}>{x}</button>)}</div><input aria-label="Buscar imágenes" placeholder="Buscar una imagen…" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="np-picto-grid">{pictos.filter(p => (category === 'Todos' || category === p.cat) && p.label.toLowerCase().includes(query.toLowerCase())).map(p => <button key={p.label} className="np-picto" onClick={() => {setPhrase(x => [...x, p.label]);if(sound)speak(p.label)}}><span>{p.emoji}</span><strong>{p.label}</strong><Icon name="plus" size={16} /></button>)}</div>{!pictos.some(p => (category === 'Todos' || category === p.cat) && p.label.toLowerCase().includes(query.toLowerCase())) && <p>No encontré esa imagen. Prueba con otra palabra.</p>}</>}
  {screen === 'social' && !story && <>{heading('HISTORIAS SOCIALES', 'Conozco lo que viene', 'Historias cortitas para descubrir nuevas situaciones.')}<div className="np-stories"><button className="np-story-card" onClick={() => {
              setStory(true);
              setStep(0);
            }}><div className="np-story-art"><SchoolArt /></div><div className="np-story-card-copy"><span className="np-eyebrow">5 PASOS · PARA LEER JUNTOS</span><h2>Mi nueva escuela</h2><p>Un lugar nuevo, un paso a la vez.</p><span className="np-story-link">Leer mi historia <Icon name="arrow" size={19} /></span></div></button><div className="np-story-aside"><Icon name="book" size={35} /><h3>Las historias me acompañan.</h3><p>Puedo leerlas muchas veces, hacer preguntas y pedir una pausa.</p><button className="np-text-btn" onClick={() => setAdultGate(true)}>Crear una historia con un adulto <Icon name="plus" size={17} /></button></div></div></>}
  {screen === 'social' && story && <section className="np-story-reader"><span className="np-eyebrow">MI NUEVA ESCUELA · PASO {step + 1} DE 5</span><SchoolArt /><h1>{savedSteps[step]}</h1><button className="np-text-btn" onClick={() => readAloud(savedSteps[step])}><Icon name="sound" /> Escuchar este paso</button><div className="np-story-controls"><button className="np-btn secondary" disabled={step === 0} onClick={() => setStep(x => x - 1)}><Icon name="back" /> Anterior</button><div className="np-progress-dots">{storySteps.map((_, i) => <i key={i} className={step >= i ? 'done' : ''} />)}</div>{button(step === 4 ? 'Terminar' : 'Siguiente', () => step === 4 ? setStory(false) : setStep(x => x + 1), step === 4 ? 'check' : 'arrow')}</div></section>}
  {screen === 'rutinas' && <>{heading('MIS RUTINAS', 'Mi día, paso a paso', 'Sé lo que viene. Hago una cosa a la vez.')}<div className="np-tabs">{['Mañana', 'Tarde', 'Noche'].map((x, i) => <button key={x} className={routine === x ? 'selected' : ''} onClick={() => {
              setRoutine(x);
              setChecked([]);
              setSeconds(60);
              setTimer(false);
            }}><Icon name={i === 2 ? 'moon' : 'sun'} size={18} />{x}</button>)}</div><div className="np-routine-layout"><section className="np-panel"><div className="np-section-heading"><h2>Mi {routine.toLowerCase()}</h2><span>{checked.length} de 4 pasos</span></div><div className="np-progress-track"><i style={{
                  width: `${checked.length * 25}%`
                }} /></div>{activitySteps.map((x, i) => <button key={x} className={'np-routine-step ' + (checked.includes(i) ? 'complete' : '')} onClick={() => toggleCheck(i)} aria-pressed={checked.includes(i)}><span className="np-step-number">{checked.includes(i) ? <Icon name="check" size={19} /> : i + 1}</span><span className="np-step-emoji">{['🌤️', '🪥', '👕', '🍎'][i]}</span><strong>{x}</strong><span className="np-check-square">{checked.includes(i) && <Icon name="check" size={16} />}</span></button>)}{checked.length === 4 && <div className="np-gentle-hint"><Icon name="star" /> Terminaste tu rutina. ¡Cada paso cuenta!</div>}</section><aside className="np-routine-right"><div className="np-first-next"><span className="np-eyebrow">PRIMERO</span><h3>{activitySteps.find((_, i) => !checked.includes(i)) || '¡Rutina completa!'}</h3><div className="np-first-arrow"><Icon name="arrow" /></div><span className="np-eyebrow">DESPUÉS</span><h3>{activitySteps.filter((_, i) => !checked.includes(i))[1] || 'Un momento para ti'}</h3></div><div className="np-timer"><Icon name="sun" /><h3>Una pequeña pausa</h3><div>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</div>{button(seconds === 0 ? 'Otra pausa' : timer ? 'Pausar' : 'Empezar', () => {
                  if (seconds === 0) setSeconds(60);
                  setTimer(!timer);
                }, timer ? 'pause' : 'play', true)}</div></aside></div></>}
  {screen === 'logros' && <>{heading('MIS ESTRELLAS', 'Cada pequeño paso cuenta', 'Celebro lo que voy descubriendo, a mi manera.')}<section className="np-stars-banner"><div className="np-star-medal"><Icon name="star" size={50} /></div><div><span className="np-eyebrow">MI CONSTELACIÓN</span><h2>{stars} estrellas</h2><p>Por explorar, intentarlo y aprender.</p></div><div className="np-constellation">✧<span>✦</span>✧<span>✦</span></div></section><div className="np-section-heading"><div><h2>Momentos para compartir</h2><p>Elige un premio y acuerda con tu adulto cuándo disfrutarlo.</p></div></div><div className="np-rewards">{[{
              name: 'Elegir un cuento',
              cost: 5,
              emoji: '📚'
            }, {
              name: 'Paseo al parque',
              cost: 10,
              emoji: '🌳'
            }, {
              name: 'Cocinar juntos',
              cost: 15,
              emoji: '🧁'
            }].map(r => <article className="np-panel" key={r.name}><span className="np-reward-emoji">{r.emoji}</span><h3>{r.name}</h3><p><Icon name="star" size={17} />{r.cost} estrellas</p>{button('Elegir este momento', () => setReward(r.name), 'gift', true)}</article>)}</div><div className="np-gentle-hint"><Icon name="heart" /> Descansar, pedir ayuda y sentirse mal también están bien. Tus estrellas no se quitan.</div></>}
  {screen === 'adultos' && <>{heading('ESPACIO DE ADULTOS', 'Acompañar, comprender, conectar', 'Una mirada amable sobre los pequeños pasos de ' + demoName + '.')}<div className="np-demo-note"><Icon name="lock" size={16} /> Prototipo de diseño · Datos ficticios · Sin conexión a perfiles reales</div><div className="np-adult-tabs">{['Resumen', 'Perfiles', 'Historias', 'Rutinas', 'Premios', 'Ajustes'].map(x => <button key={x} onClick={() => setAdultTab(x)} className={adultTab === x ? 'selected' : ''}>{x}</button>)}</div>
   {adultTab === 'Resumen' && <><div className="np-adult-stats"><article className="np-panel"><Icon name="smile" /><span>Registro de emociones</span><h2>{emotionRecords.length} momentos</h2><small>Registrados en esta sesión de prueba</small></article><article className="np-panel"><Icon name="list" /><span>Rutinas acompañadas</span><h2>3 de 5 días</h2><small>Cada día tiene su ritmo</small></article><article className="np-panel"><Icon name="book" /><span>Historias favoritas</span><h2>Mi nueva escuela</h2><small>Leída 2 veces · Ejemplo</small></article></div><div className="np-adult-columns"><section className="np-panel"><div className="np-section-heading"><h2>Momentos de regulación</h2><span className="np-soft-label">Últimos 7 días</span></div><p>Gráfico ilustrativo. Los nuevos registros aparecen debajo.</p>{emotionRecords.map((r,i)=><div className="np-trigger" key={i}><span>{r.feeling}</span><strong>Intensidad {r.intensity} de 3</strong></div>)}<div className="np-chart">{[2, 1, 3, 2, 4, 1, 2].map((v, i) => <div key={i}><div style={{
                      height: v * 30
                    }} className={v > 2 ? 'peach' : 'sage'} /><span>{['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}</span></div>)}</div><div className="np-chart-legend"><span><i className="sage" /> Menor intensidad</span><span><i className="peach" /> Mayor intensidad</span></div></section><section className="np-panel"><h2>Lo que puede influir</h2><p>Contextos anotados por la familia.</p>{['Cambios en la rutina', 'Mucho ruido', 'Cansancio'].map((x, i) => <div className="np-trigger" key={x}><span>{x}</span><strong>{3 - i} registros</strong></div>)}<div className="np-adult-tip"><Icon name="leaf" /><p>Observa el contexto y lo que ayudó. Este resumen no realiza diagnósticos.</p></div></section></div></>}
   {adultTab === 'Historias' && <section className="np-panel np-story-editor"><span className="np-eyebrow">PREPARAR UNA NUEVA SITUACIÓN</span><h2>Una historia para anticipar</h2><p>Describe una situación. Revisa cada frase antes de compartirla.</p><label>¿Qué va a pasar?<textarea value={draft} onChange={e => setDraft(e.target.value)} /></label>{button('Ver ejemplo de borrador', () => {
              setDraftReady(true);
              toast('Ejemplo de diseño: todavía no se llamó a un servicio de IA.');
            }, 'spark')}{draftReady && <><div className="np-demo-note">Ejemplo predefinido sobre una escuela nueva. La generación con IA se conectará al implementar.</div><label>Revisa y corrige los cinco pasos<textarea className="np-long-text" value={editedStory} onChange={e => setEditedStory(e.target.value)} /></label><p>Comprueba que las frases, los apoyos y las imágenes representen a tu niño.</p>{button('Guardar historia revisada', () => {
                const steps=editedStory.split('\n').map(x=>x.trim()).filter(Boolean);if(steps.length!==5){toast('Revisa el borrador: debe tener cinco pasos, uno por línea.');return;}setSavedSteps(steps);setSavedStory(true);
                toast('Historia disponible en la sección infantil de esta demostración.');
              }, 'check')}{savedStory && button('Ver como niño', () => go('social'), 'book', true)}</>}</section>}
   {adultTab === 'Perfiles' && <section className="np-panel"><div className="np-profile-card"><span className="np-avatar big">{demoName[0]}</span><div><h2>{demoName}</h2><p>Perfil ficticio · 6 a 8 años</p></div><span className="np-soft-label">Activo</span></div><div className="np-settings-grid"><label>Nombre para mostrar<input value={nameDraft} maxLength={30} onChange={e=>setNameDraft(e.target.value)} /></label><div className="np-gentle-hint"><Icon name="leaf"/> Imágenes y texto, con lectura opcional.</div></div>{button('Guardar preferencias de ejemplo', () => {if(!nameDraft.trim()){toast('Escribe un nombre para mostrar.');return;}setDemoName(nameDraft.trim());toast('Nombre actualizado en la demostración.');}, 'check')}<div className="np-gentle-hint">Los cambios de este prototipo se reinician al recargar.</div></section>}
   {adultTab === 'Rutinas' && <section className="np-panel"><h2>Una rutina que se pueda anticipar</h2><p>Divide cada actividad en pasos simples y concretos.</p>{activitySteps.map((x, i) => <label className="np-edit-row" key={i}><span>{i + 1}</span><input value={x} onChange={e=>setRoutineSteps(r=>({...r,[routine]:r[routine].map((v,n)=>n===i?e.target.value:v)}))} aria-label={'Paso ' + (i + 1)} /></label>)}{button('Probar rutina infantil', () => go('rutinas'), 'play')}</section>}
   {adultTab === 'Premios' && <section className="np-panel"><h2>Momentos compartidos, elegidos juntos</h2><p>Ofrece opciones posibles y confirma el canje con el niño.</p>{['Elegir un cuento', 'Paseo al parque', 'Cocinar juntos'].map((x, i) => <div className="np-trigger" key={x}><span>{x}</span><strong>{(i + 1) * 5} estrellas</strong></div>)}<div className="np-gentle-hint"><Icon name="heart" /> Los apoyos esenciales, la comida y el descanso no son premios.</div>{button('Ver tienda infantil', () => go('logros'), 'gift')}</section>}
   {adultTab === 'Ajustes' && <section className="np-panel"><h2>Un espacio cómodo para {demoName}</h2><div className="np-setting-row"><div><h3>Lectura en voz alta</h3><p>Solo comienza al tocar el botón de lectura.</p></div><button className={'np-toggle ' + (sound ? 'on' : '')} onClick={() => setSound(!sound)} aria-label="Activar lectura en voz alta" aria-pressed={sound}><i /></button></div><div className="np-setting-row"><div><h3>Movimiento suave</h3><p>Se respeta la preferencia de movimiento reducido del dispositivo.</p></div><Icon name="leaf" /></div><div className="np-setting-row"><div><h3>Copias de seguridad</h3><p>En la app actual, los adultos pueden exportar una copia cifrada. Este prototipo no accede a esos datos.</p></div><Icon name="lock" /></div></section>}
  </>}
  </main><footer className="np-footer"><span>Un universo a tu ritmo.</span><span>NeuroPlaneta <Icon name="spark" size={14} /></span></footer></div>
  <button className="np-floating-calm" onClick={() => {
      setHelp(true);
      setBreathing(false);
    }}><Icon name="heart" size={21} /><span>Mi calma</span></button>
  <nav className="np-mobile-nav" aria-label="Navegación principal">{nav('inicio', 'Mi planeta', 'home')}{nav('rutinas', 'Rutinas', 'list')}{nav('logros', 'Estrellas', 'star')}<button className="np-nav-item" onClick={() => setAdultGate(true)}><Icon name="lock" /><span>Adultos</span></button></nav>
  {notice && <div className="np-toast" role="status"><Icon name="check" size={18} />{notice}<button aria-label="Cerrar aviso" onClick={() => setNotice('')}><Icon name="close" size={15} /></button></div>}
  {adultGate && <div className="np-overlay"><section className="np-modal" role="dialog" aria-modal="true" aria-labelledby="np-gate-title"><button className="np-modal-close" aria-label="Cerrar acceso de adultos" onClick={() => setAdultGate(false)}><Icon name="close" /></button><span className="np-modal-symbol"><Icon name="lock" size={28} /></span><h2 id="np-gate-title">Espacio de adultos</h2><p>Para ver el panel de ejemplo, resuelve:</p><label>¿Cuánto es 7 + 5?<input type="number" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Tu respuesta" /></label><p className="np-fine-print">Acceso de demostración. Esta pregunta no reemplaza una contraseña.</p><button className="np-btn" disabled={answer !== '12'} onClick={() => {
          setAdultGate(false);
          setAnswer('');
          go('adultos');
        }}>Entrar al panel <Icon name="arrow" size={18} /></button></section></div>}
  {help && <div className="np-overlay"><section className="np-modal np-help-modal" role="dialog" aria-modal="true" aria-labelledby="np-help-title"><button className="np-modal-close" aria-label="Cerrar mi calma" onClick={() => setHelp(false)}><Icon name="close" /></button><span className="np-modal-symbol"><Icon name="heart" size={32} /></span><h2 id="np-help-title">Estoy aquí contigo.</h2><p>No tienes que hacer todo. Elige un pequeño paso.</p><button onClick={() => {
          setHelp(false);
          go('calma');
        }}><span>1</span><div><strong>Busco un lugar tranquilo</strong><small>Puedo bajar la luz y el ruido.</small></div><Icon name="leaf" /></button><button onClick={() => {
          setHelp(false);
          go('comunicar');
        }}><span>2</span><div><strong>Pido compañía</strong><small>Busco a un adulto de confianza.</small></div><Icon name="people" /></button><button onClick={() => {
          setHelp(false);
          go('calma');
          setBreathing(true);
        }}><span>3</span><div><strong>Respiro si quiero</strong><small>Despacio, sin forzar.</small></div><Icon name="wind" /></button></section></div>}
  {reward && <div className="np-overlay"><section className="np-modal" role="dialog" aria-modal="true" aria-labelledby="np-reward-title"><button className="np-modal-close" onClick={() => setReward('')} aria-label="Cancelar canje"><Icon name="close" /></button><span className="np-modal-symbol"><Icon name="gift" size={32} /></span><h2 id="np-reward-title">{reward}</h2><p>Vamos a acordar este momento con tu adulto.</p><p className="np-fine-print">Canje de ejemplo. Se descuentan {reward === 'Elegir un cuento' ? 5 : reward === 'Paseo al parque' ? 10 : 15} estrellas al confirmar.</p><button className="np-btn" disabled={stars < (reward === 'Elegir un cuento' ? 5 : reward === 'Paseo al parque' ? 10 : 15)} onClick={() => {
          setStars(s => s - (reward === 'Elegir un cuento' ? 5 : reward === 'Paseo al parque' ? 10 : 15));
          setReward('');
          toast('Momento elegido. Acuerden juntos cuándo disfrutarlo.');
        }}>Confirmar juntos <Icon name="check" /></button>{button('Elegir después', () => setReward(''), 'back', true)}</section></div>}
 </div>;
};
function SchoolArt() {
  return <svg className="np-school-art" viewBox="0 0 400 260" fill="none" aria-hidden="true"><circle cx="325" cy="48" r="24" fill="#E4BE78" /><path d="M0 218c95-37 229-35 400 0v42H0Z" fill="#BED0AC" /><path d="M45 212v-47m-15 14c-18-32 39-48 45-16 6 27-28 29-45 16ZM353 218v-45m-16 3c-14-29 32-43 41-15 9 27-23 31-41 15Z" fill="#8EAF91" /><rect x="95" y="110" width="210" height="108" rx="5" fill="#E3C8A6" /><path d="m78 112 122-75 122 75Z" fill="#A4B8A8" /><rect x="179" y="149" width="44" height="69" rx="20" fill="#64877B" /><path d="M122 141h27v30h-27zm130 0h27v30h-27Z" fill="#F9F3DF" /><path d="M135 141v30m130-30v30M122 156h27m103 0h27" stroke="#C5AB87" strokeWidth="3" /><circle cx="200" cy="92" r="15" fill="#F9F3DF" /><path d="M200 82v11h8" stroke="#64877B" strokeWidth="3" strokeLinecap="round" /><path d="m200 218-23 42h60l-18-42Z" fill="#F1E7CE" /><path d="M53 48c18-18 30-18 43 0m-15 17c14-14 24-14 36 0" stroke="#A2B7AB" strokeWidth="3" strokeLinecap="round" /></svg>;
}