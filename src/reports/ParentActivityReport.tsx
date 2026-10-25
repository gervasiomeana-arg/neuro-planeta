import { useState } from 'react';
import { LEARNING_GAMES } from '../learning/curriculum';
import type { ActivitySession } from '../learning/useSessionTracker';

const day = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const escape = (text: string) => text.replace(/[&<>"']/g, value => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[value]!);
const title = (id: string) => LEARNING_GAMES.find(game => game.id === id)?.title || id;
const dateTime = (value: string) => new Date(value).toLocaleString('es-AR', { hour12: false });
const total = (sessions: ActivitySession[], key: 'activeSeconds' | 'roundsCompleted' | 'independentCorrect' | 'attempts') => sessions.reduce((n, session) => n + session[key], 0);
const limits = [
  'NeuroPlaneta es una app de acompañamiento, entretenimiento y práctica para niños y familias. No realiza diagnósticos ni tratamientos médicos, psicológicos, psiquiátricos o de otras disciplinas.',
  'Este documento solo registra datos de uso y notas voluntarias de la familia. No realiza análisis, evaluaciones, diagnósticos ni recomendaciones de tratamiento. La interpretación corresponde exclusivamente al profesional.',
  'El tiempo activo excluye los intervalos detectados con pestaña oculta o ventana sin foco. Incluye lectura, reflexión, memorización y lectura de las explicaciones. No mide atención continua ni tiempo real mirando la pantalla.',
  'Los tiempos de primera selección corresponden al tiempo visible hasta la primera selección de cada desafío, correcta o incorrecta, incluida la lectura. En memoria se mide hasta abrir la primera tarjeta. Una respuesta más rápida no demuestra mejoría clínica.',
  'Primer intento sin pistas significa sin error previo ni pista de la app; no detecta ayuda humana, distracciones, cansancio o quién tocó la pantalla. En memoria, equivale a resolver el tablero sin parejas fallidas ni mostrar todas.',
  'Los intentos representan selecciones en juegos de opciones, pasos en secuencias y pares abiertos en memoria. No comparar el número de intentos entre mecánicas distintas.',
  'Se conservan las últimas 200 sesiones registradas por perfil, no todo el historial. Solo se registran sesiones finalizadas o pausadas mediante los controles instrumentados. Cerrar la pestaña, cambiar de perfil o salir por otra ruta puede dejar una sesión sin registrar. No se inventan tiempos para el uso anterior a esta función.',
  'Las fechas provienen del reloj y zona horaria del dispositivo. No se comparan resultados ni se emiten conclusiones sobre evolución, capacidad o eficacia.',
];
export default function ParentActivityReport({ profileName, sessions }: { profileName: string; sessions: ActivitySession[] }) {
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 29); return day(d); });
  const [to, setTo] = useState(() => day(new Date()));
  const [context, setContext] = useState(''), [questions, setQuestions] = useState(''), [includeName, setIncludeName] = useState(false), [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');
  const valid = Boolean(from && to && from <= to);
  const filtered = valid ? sessions.filter(s => { const d = day(new Date(s.endedAt)); return d >= from && d <= to; }) : [];
  const completed = filtered.filter(s => s.status === 'completed');
  const recent = [...filtered].sort((a, b) => b.endedAt.localeCompare(a.endedAt));
  function download() {
    if (!valid || !consent) return;
    const heading = `Informe descriptivo de uso y observaciones familiares — ${includeName ? profileName : 'perfil sin apodo'}`;
    const summary = `Período ${from} a ${to}. ${filtered.length} sesiones registradas: ${completed.length} completas y ${filtered.length - completed.length} pausadas. ${(total(filtered, 'activeSeconds') / 60).toFixed(1)} minutos activos aproximados. Zona horaria: ${Intl.DateTimeFormat().resolvedOptions().timeZone}.`;
    const table = `<table><thead><tr>${['Fecha y hora', 'Juego y configuración', 'Estado', 'Tiempo activo', 'Segundos hasta primera selección por desafío', 'Desafíos terminados', 'Intentos', 'Desafíos al primer intento sin pista de la app'].map(t => `<th>${escape(t)}</th>`).join('')}</tr></thead><tbody>${recent.map(s => `<tr>${[dateTime(s.endedAt), `${title(s.gameId)} · ${s.variant}`, s.status === 'completed' ? 'Completa' : 'Pausada', `${s.activeSeconds.toFixed(1)} s`, s.firstResponseSeconds.length ? s.firstResponseSeconds.map(n => n.toFixed(1)).join(' / ') : 'Sin respuesta registrada', String(s.roundsCompleted), String(s.attempts), String(s.independentCorrect)].map(v => `<td>${escape(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>NeuroPlaneta — informe descriptivo</title><style>body{font:15px/1.6 system-ui,sans-serif;color:#253c35;max-width:1100px;margin:auto;padding:28px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #abbeb4;padding:9px;text-align:left;vertical-align:top}th{background:#e8eee4}pre{white-space:pre-wrap;font:inherit}h1{font-size:25px}h2{font-size:18px}li{margin:8px 0}@media print{body{padding:0;max-width:none}thead{display:table-header-group}tr{break-inside:avoid}}</style></head><body><h1>${escape(heading)}</h1><p>${escape(summary)}</p><p>Generado: ${escape(new Date().toLocaleString('es-AR', { hour12: false }))}. Fuente automática: registros locales de este perfil, versión de medición 1. La identidad y la ayuda humana no se verifican.</p><h2>Actividad registrada por la app</h2>${recent.length ? table : '<p>Sin sesiones registradas para este período. Esto no demuestra ausencia de uso.</p>'}<h2>Observaciones aportadas por la familia — no verificadas por la app</h2><pre>${escape(context || 'No se agregaron observaciones.')}</pre><h2>Preguntas para conversar con el profesional</h2><pre>${escape(questions || 'No se agregaron preguntas.')}</pre><h2>Alcance y límites</h2><ul>${limits.map(text => `<li>${escape(text)}</li>`).join('')}</ul><p>Compartido voluntariamente por el adulto. No se incluyen notas de emociones, imágenes, grabaciones, correo Google ni datos de otros perfiles. No se envía automáticamente a ninguna persona.</p><p>Para guardar una copia PDF, abrí este archivo en el navegador y elegí Imprimir → Guardar como PDF.</p></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `neuroplaneta-informe-${day(new Date())}.html`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
    setMessage('Descarga iniciada. Revisá el informe antes de compartirlo. Podés abrirlo e imprimirlo como PDF.');
  }
  return <section className="np-parent-report" aria-label="Informe descriptivo para compartir">
    <header><p className="np-learning-eyebrow">Familia y profesionales</p><h3>Informe de uso y observaciones</h3><p>{limits[0]}</p><p>{limits[1]}</p></header>
    <div className="np-report-dates"><label>Desde<input type="date" value={from} onChange={e => { setFrom(e.target.value); setConsent(false); }} /></label><label>Hasta<input type="date" value={to} onChange={e => { setTo(e.target.value); setConsent(false); }} /></label></div>
    {!valid && <p role="alert">Elegí un período válido; la fecha inicial no puede ser posterior a la final.</p>}
    <p>{filtered.length} sesiones registradas · {completed.length} completas · {filtered.length - completed.length} pausadas · {(total(filtered, 'activeSeconds') / 60).toFixed(1)} minutos activos aproximados.</p>
    {sessions.length > 0 && <p className="np-report-note">Historial disponible en este perfil: {sessions.length} de hasta 200 sesiones. Fecha más antigua conservada: {dateTime(sessions.reduce((a, b) => a.startedAt < b.startedAt ? a : b).startedAt)}.</p>}
    {!recent.length ? <p>No hay sesiones nuevas registradas en este período. No se reconstruyen tiempos del uso anterior.</p> : <div className="np-report-table"><table><caption>Registro de sesiones. Sin análisis ni evaluación.</caption><thead><tr><th>Fecha y hora</th><th>Juego y configuración</th><th>Estado</th><th>Tiempo activo</th><th>Segundos hasta primera selección por desafío</th><th>Desafíos / intentos</th><th>Primer intento sin pista de la app</th></tr></thead><tbody>{recent.map(s => <tr key={s.id}><td>{dateTime(s.endedAt)}</td><th scope="row">{title(s.gameId)} · {s.variant}</th><td>{s.status === 'completed' ? 'Completa' : 'Pausada'}</td><td>{s.activeSeconds.toFixed(1)} s</td><td>{s.firstResponseSeconds.length ? s.firstResponseSeconds.map(n => n.toFixed(1)).join(' / ') : 'Sin respuesta registrada'}</td><td>{s.roundsCompleted} / {s.attempts}</td><td>{s.independentCorrect}</td></tr>)}</tbody></table></div>}
    <label>Observaciones de la familia para este informe<textarea maxLength={2000} value={context} onChange={e => { setContext(e.target.value); setConsent(false); }} placeholder="Por ejemplo: jugó acompañado, hubo ruido, pidió una pausa, prefirió otra actividad o practicó algo fuera de la app." /></label>
    <label>Preguntas para conversar con el profesional<textarea maxLength={1000} value={questions} onChange={e => { setQuestions(e.target.value); setConsent(false); }} placeholder="¿Qué actividades sería útil observar? ¿Qué ayuda conviene registrar?" /></label>
    <p className="np-report-note">Estos textos solo se incluyen en la descarga actual; no se guardan al salir. No agregues diagnósticos, medicación ni datos identificatorios innecesarios.</p>
    <label className="np-report-check"><input type="checkbox" checked={includeName} onChange={e => { setIncludeName(e.target.checked); setConsent(false); }} />Incluir el apodo del perfil ({profileName})</label>
    <details><summary>Cómo se registran los datos y qué límites tienen</summary>{limits.slice(2).map(text => <p key={text}>{text}</p>)}</details>
    <label className="np-report-check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />Revisé los datos y entiendo que descargaré un archivo sin cifrar, que podré compartir voluntariamente con el profesional.</label>
    <button type="button" className="np-learning-primary" disabled={!valid || !consent} onClick={download}>Descargar informe para revisar (.html)</button>
    <p className="np-report-note">No se envía por correo ni se sube a servidores. Abrí el archivo para revisarlo y usá Imprimir → Guardar como PDF si lo necesitás.</p>
    {message && <p role="status">{message}</p>}
  </section>;
}
