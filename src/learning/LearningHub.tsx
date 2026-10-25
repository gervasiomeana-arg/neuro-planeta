import { useEffect, useRef, useState } from 'react';
import { createLearningQuestion, LEARNING_GAMES, type Game, type GameId, type LearningLevel, type LearningProgress, type Question } from './curriculum';

export type LearningResult = { gameId: GameId; level: LearningLevel; independentCorrect: number; attempts: number };
type Props = { progress: LearningProgress; onLegacy: (id: 'numbers' | 'matching') => void; onComplete: (result: LearningResult) => void; audioEnabled: boolean; volume: number };
const AREAS = ['Todas', 'Números', 'Atención', 'Memoria', 'Lenguaje', 'Vida diaria'];
const LEVELS = ['Explorar', 'Practicar', 'Desafío'];

export default function LearningHub({ progress, onLegacy, onComplete, audioEnabled, volume }: Props) {
  const [area, setArea] = useState('Todas'), [level, setLevel] = useState<LearningLevel>(1);
  const [selected, setSelected] = useState<Game | null>(null), [session, setSession] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  if (selected) return <LearningSession key={`${selected.id}-${level}-${session}`} game={selected} level={level} audioEnabled={audioEnabled} volume={volume} onExit={() => setSelected(null)} onAgain={() => setSession(n => n + 1)} onComplete={onComplete} />;
  return <section className="np-learning" aria-label="Biblioteca de 25 juegos">
    <header className="np-learning-hero"><span aria-hidden="true">🌱</span><div><p className="np-learning-eyebrow">Aprender, descubrir y volver a intentar</p><h3>25 juegos para explorar</h3><p>Elegí una actividad. Sin reloj, sin perder vidas y con ayuda cuando la necesites.</p></div></header>
    <div className="np-learning-levels" role="group" aria-label="Nivel de los juegos nuevos">{LEVELS.map((label, i) => <button type="button" key={label} aria-pressed={level === i + 1} onClick={() => setLevel((i + 1) as LearningLevel)}>{i + 1}. {label}</button>)}</div>
    <p className="np-learning-small">Podés cambiar de nivel libremente. Los dos juegos originales conservan su funcionamiento; los 23 nuevos ofrecen estos tres niveles.</p>
    <div className="np-learning-filters" role="group" aria-label="Área de aprendizaje">{AREAS.map(label => <button type="button" key={label} aria-pressed={area === label} onClick={() => setArea(label)}>{label}</button>)}</div>
    <button type="button" className="np-learning-link" aria-expanded={showGuide} onClick={() => setShowGuide(v => !v)}>Guía para acompañar y ver avances</button>
    {showGuide && <aside className="np-learning-guide"><h4>Una experiencia breve y acompañada</h4><p>Empezá con una actividad, ofrecé ayuda y dejá que el niño elija cuándo descansar. El nivel no es una edad ni una evaluación.</p><p>Se guardan las sesiones completas de los juegos nuevos en el perfil cifrado de este navegador. «Sin ayuda» significa respuesta correcta al primer intento sin abrir la pista; no es un indicador clínico ni garantiza dominio.</p><p>Las sesiones sin terminar no se registran. La memoria y las secuencias se repiten sin límite de tiempo. Las imágenes, el texto y la voz del dispositivo son apoyos; podés leer las consignas en voz alta.</p></aside>}
    <div className="np-learning-grid">{LEARNING_GAMES.filter(game => area === 'Todas' || game.area === area).map(game => {
      const record = progress[game.id];
      return <article key={game.id} className="np-learning-card"><span className="np-learning-icon" aria-hidden="true">{game.icon}</span><p className="np-learning-eyebrow">{game.area}</p><h4>{game.title}</h4><p>{game.objective}</p>{record && <p className="np-learning-progress">{record.sessions} sesión(es) · nivel máximo {record.highestLevel}</p>}<button type="button" onClick={() => { if (game.id === 'numbers' || game.id === 'matching') onLegacy(game.id); else setSelected(game); }}>Jugar: {game.title}</button></article>;
    })}</div>
  </section>;
}

function MemoryBoard({ symbols, onSolved }: { symbols: string[]; onSolved: (attempts: number, assisted: boolean) => void }) {
  const [tiles] = useState(() => {
    const list = [...symbols, ...symbols];
    // Permute once per board; positions stay fixed while playing.
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    return list;
  });
  const [open, setOpen] = useState<number[]>([]), [matched, setMatched] = useState<number[]>([]), [look, setLook] = useState(false);
  const [message, setMessage] = useState('Abrí dos tarjetas para buscar una pareja.');
  const attempts = useRef(0), assisted = useRef(false), finished = useRef(false);
  function choose(index: number) {
    if (look || finished.current || open.length === 2 || open.includes(index) || matched.includes(index)) return;
    const next = [...open, index]; setOpen(next);
    if (next.length !== 2) return;
    attempts.current++;
    if (tiles[next[0]] === tiles[next[1]]) {
      const found = [...matched, ...next]; setMatched(found); setOpen([]); setMessage('¡Encontraste una pareja!');
      if (found.length === tiles.length) { finished.current = true; onSolved(attempts.current, assisted.current || attempts.current > symbols.length); }
    } else setMessage('Son diferentes. Podés ocultarlas y volver a intentar.');
  }
  return <div><div className="np-learning-memory">{tiles.map((symbol, i) => { const revealed = look || open.includes(i) || matched.includes(i); return <button type="button" key={i} aria-label={`Tarjeta ${i + 1}: ${revealed ? symbol : 'oculta'}`} aria-pressed={open.includes(i)} disabled={matched.includes(i) || look || finished.current} onClick={() => choose(i)}>{revealed ? symbol : '✦'}</button>; })}</div><p role="status">{message}</p>{open.length === 2 && <button className="np-learning-primary" type="button" onClick={() => { setOpen([]); setMessage('Buscá otra pareja.'); }}>Volver a ocultar</button>}<button type="button" className="np-learning-secondary" onClick={() => { assisted.current = true; setLook(v => !v); }}>{look ? 'Ocultar para seguir' : 'Mirar todas con ayuda'}</button></div>;
}

function LearningSession({ game, level, onExit, onAgain, onComplete, audioEnabled, volume }: { game: Game; level: LearningLevel; onExit: () => void; onAgain: () => void; onComplete: (result: LearningResult) => void; audioEnabled: boolean; volume: number }) {
  const [round, setRound] = useState(0), [phase, setPhase] = useState<'answer' | 'feedback' | 'done'>('answer');
  const [q, setQuestion] = useState<Question>(() => createLearningQuestion(game.id, level, 0));
  const [hint, setHint] = useState(false), [feedback, setFeedback] = useState(''), [step, setStep] = useState(0), [revealed, setRevealed] = useState(true);
  const attempts = useRef(0), roundAttempts = useRef(0), independent = useRef(0), helped = useRef(false), reported = useRef(false), locked = useRef(false);
  const speech = useRef<SpeechSynthesisUtterance | null>(null);
  const [speechMessage, setSpeechMessage] = useState('');
  useEffect(() => () => { if (speech.current) { speech.current.onend = null; speech.current.onerror = null; window.speechSynthesis?.cancel(); } speech.current = null; }, []);
  function read() {
    if (!audioEnabled) return;
    try {
      if (!('speechSynthesis' in window)) throw new Error('unavailable');
      window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(q.prompt); utterance.lang = 'es-AR'; utterance.volume = Math.min(1, Math.max(0, volume / 100)); speech.current = utterance;
      utterance.onend = () => { if (speech.current === utterance) speech.current = null; };
      utterance.onerror = () => setSpeechMessage('No pudimos leerla. Podés pedirle a un adulto que la lea.');
      setSpeechMessage(''); window.speechSynthesis.speak(utterance);
    } catch { setSpeechMessage('La voz no está disponible. Podés leer la consigna con un adulto.'); }
  }
  function solved() {
    if (locked.current) return;
    locked.current = true;
    if (!helped.current && roundAttempts.current === (q.sequence?.length || 1)) independent.current++;
    setPhase('feedback'); setFeedback(q.explanation);
  }
  function choose(answer: string) {
    if (phase !== 'answer' || locked.current || (game.id === 'sequence' && revealed)) return;
    attempts.current++; roundAttempts.current++;
    const expected = q.sequence ? q.sequence[step] : q.answer;
    if (answer !== expected) { helped.current = true; setFeedback('Podés volver a intentar. Mirá la consigna o pedí una pista.'); return; }
    setFeedback('¡Ese es!');
    if (q.sequence && step < q.sequence.length - 1) setStep(n => n + 1); else { if (q.sequence) setStep(q.sequence.length); solved(); }
  }
  function next() {
    if (phase !== 'feedback') return;
    if (round === 4) {
      if (!reported.current) { reported.current = true; onComplete({ gameId: game.id, level, independentCorrect: independent.current, attempts: attempts.current }); }
      setPhase('done'); return;
    }
    const nextRound = round + 1; setRound(nextRound); setQuestion(createLearningQuestion(game.id, level, nextRound));
    roundAttempts.current = 0; helped.current = false; locked.current = false; setHint(false); setFeedback(''); setStep(0); setRevealed(true); setPhase('answer');
    if (speech.current) window.speechSynthesis?.cancel(); speech.current = null;
  }
  if (phase === 'done') return <section className="np-learning np-learning-finish" aria-label="Sesión educativa completada"><span aria-hidden="true">🌟</span><h3>¡Completaste cinco desafíos!</h3><p>{game.title} · nivel {level}: {LEVELS[level - 1]}.</p><p>{independent.current} de 5 al primer intento sin abrir pistas. También aprender con ayuda está bien.</p><aside><h4>Para llevar a la vida diaria</h4><p>{game.practice}</p></aside><p className="np-learning-small">El registro se incorporó al perfil de esta sesión. Revisá el aviso de guardado cifrado antes de cerrar.</p><div className="np-learning-actions"><button type="button" className="np-learning-primary" onClick={onAgain}>Practicar otra vez</button><button type="button" className="np-learning-secondary" onClick={onExit}>Elegir otro juego</button></div></section>;
  return <section className="np-learning" aria-label={`Juego: ${game.title}`}>
    <div className="np-learning-session-head"><button type="button" className="np-learning-secondary" onClick={onExit}>Pausar y volver</button><span>Desafío {round + 1} de 5 · Nivel {level}</span></div>
    <h3>{game.icon} {game.title}</h3><p className="np-learning-objective">{game.objective}</p>
    <article className="np-learning-question"><h4>{q.prompt}</h4><button className="np-learning-link" type="button" disabled={!audioEnabled} onClick={read}>{audioEnabled ? '🔊 Leer consigna' : 'Sonido desactivado'}</button>{speechMessage && <p role="status">{speechMessage}</p>}
      {q.visual && <div className="np-learning-stimulus">{q.visual}</div>}
      {q.grid && <div className="np-learning-position" role="img" aria-label={`Cuadrícula de tres filas y tres columnas. Estrella ${q.answer}.`}>{q.grid.map((item, i) => <span key={i}>{item}</span>)}</div>}
      {q.sequence && <><p>Pasos realizados: {step} de {q.sequence.length}.</p>{game.id === 'sequence' && <><div className="np-learning-stimulus">{revealed ? q.sequence.join(' → ') : 'Camino oculto'}</div><button className="np-learning-secondary" type="button" disabled={phase !== 'answer'} onClick={() => { if (!revealed) { helped.current = true; setHint(true); } setRevealed(v => !v); }}>{revealed ? 'Estoy listo: ocultar y empezar' : 'Volver a mirar con ayuda'}</button></>}</>}
      {q.memory ? <MemoryBoard key={round} symbols={q.memory} onSolved={(total, assisted) => { if (locked.current) return; attempts.current += total; roundAttempts.current = 1; helped.current = assisted; solved(); }} /> : <div className="np-learning-choices">{q.options.map(option => <button type="button" key={option.id} disabled={phase !== 'answer' || (game.id === 'sequence' && revealed)} onClick={() => choose(option.id)}>{option.color && <span className="np-learning-color" style={{ background: option.color }} aria-hidden="true" />}{option.visual && <span className="np-learning-option-visual" style={{ fontSize: option.size || 42 }} aria-hidden="true">{option.visual}</span>}<span>{option.text}</span></button>)}</div>}
      {phase === 'answer' && !q.memory && <button type="button" className="np-learning-link" onClick={() => { helped.current = true; setHint(true); }}>Necesito una pista</button>}
      {hint && <p className="np-learning-hint">{game.id === 'routine' && q.sequence ? `El próximo paso es: ${q.sequence[step]}.` : q.hint}</p>}
      {feedback && <p role="status" className="np-learning-feedback">{feedback}</p>}
      {phase === 'feedback' && <button type="button" className="np-learning-primary" onClick={next}>{round === 4 ? 'Terminar y guardar avance' : 'Siguiente desafío'}</button>}
    </article><p className="np-learning-small">Podés descansar cuando quieras. No hay penalización ni límite de tiempo.</p>
  </section>;
}
