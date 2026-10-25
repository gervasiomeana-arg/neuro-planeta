export type LearningLevel = 1 | 2 | 3;
export type GameId = 'numbers' | 'matching' | 'count' | 'more' | 'add' | 'subtract' | 'next' | 'missing' | 'pattern' | 'size' | 'shapes' | 'colors' | 'category' | 'odd' | 'memory' | 'sequence' | 'instructions' | 'routine' | 'positions' | 'letters' | 'initial' | 'syllables' | 'rhymes' | 'faces' | 'hygiene';
export type LearningRecord = { sessions: number; highestLevel: number; lastPlayed: string; independentCorrect: number; attempts: number };
export type LearningProgress = Partial<Record<GameId, LearningRecord>>;
export type Game = { id: GameId; title: string; icon: string; area: string; objective: string; practice: string };
export const LEARNING_GAMES: readonly Game[] = [
  { id: 'numbers', title: 'Buscar números', icon: '🔢', area: 'Números', objective: 'Reconocer un número entre varios.', practice: 'Busquen el mismo número en una puerta o calendario.' },
  { id: 'matching', title: 'Parejas de imágenes', icon: '🧩', area: 'Atención', objective: 'Reconocer dos imágenes iguales.', practice: 'Emparejen dos objetos iguales en casa.' },
  { id: 'count', title: 'Contar objetos', icon: '🍎', area: 'Números', objective: 'Relacionar una colección con su cantidad.', practice: 'Cuenten cucharas al preparar la mesa.' },
  { id: 'more', title: '¿Dónde hay más?', icon: '⚖️', area: 'Números', objective: 'Comparar dos cantidades distintas.', practice: 'Comparen dos grupos de bloques.' },
  { id: 'add', title: 'Sumar juntando', icon: '➕', area: 'Números', objective: 'Juntar cantidades con apoyo visual.', practice: 'Junten dos grupos pequeños de juguetes.' },
  { id: 'subtract', title: 'Quitar y contar', icon: '➖', area: 'Números', objective: 'Reconocer cuántos quedan al quitar objetos.', practice: 'Retiren una pieza y cuenten las restantes.' },
  { id: 'next', title: 'El número siguiente', icon: '➡️', area: 'Números', objective: 'Continuar la serie numérica.', practice: 'Digan juntos qué número viene después.' },
  { id: 'missing', title: 'El número escondido', icon: '🔎', area: 'Números', objective: 'Completar un hueco en una serie.', practice: 'Ordenen tarjetas y escondan una.' },
  { id: 'pattern', title: 'Trenes de patrones', icon: '🚂', area: 'Atención', objective: 'Continuar patrones AB, AAB y ABC.', practice: 'Hagan patrones con tapitas o bloques.' },
  { id: 'size', title: 'Grande y pequeño', icon: '🐘', area: 'Atención', objective: 'Comparar tamaños de un mismo dibujo.', practice: 'Comparen dos vasos de distinto tamaño.' },
  { id: 'shapes', title: 'Detectives de formas', icon: '🔺', area: 'Atención', objective: 'Reconocer figuras por su nombre.', practice: 'Busquen una forma parecida en la casa.' },
  { id: 'colors', title: 'Taller de colores', icon: '🎨', area: 'Atención', objective: 'Relacionar el nombre del color con una muestra.', practice: 'Busquen un objeto del color elegido; pueden nombrarlo juntos.' },
  { id: 'category', title: 'Cada cosa en su grupo', icon: '🧺', area: 'Atención', objective: 'Clasificar alimentos, animales, transporte y ropa.', practice: 'Agrupen objetos reales por su uso.' },
  { id: 'odd', title: 'El intruso', icon: '🕵️', area: 'Atención', objective: 'Distinguir un elemento de otra categoría.', practice: 'Pongan un juguete entre tres prendas y conversen sobre la diferencia.' },
  { id: 'memory', title: 'Memoria de parejas', icon: '🃏', area: 'Memoria', objective: 'Recordar posiciones y descubrir parejas ocultas.', practice: 'Jueguen con dos o tres pares de tarjetas en papel.' },
  { id: 'sequence', title: 'Recuerdo el camino', icon: '🧠', area: 'Memoria', objective: 'Recordar una secuencia de dos a cuatro dibujos.', practice: 'Muestren una secuencia corta de objetos y repítanla juntos.' },
  { id: 'instructions', title: 'Escucho y hago', icon: '👂', area: 'Memoria', objective: 'Seguir una instrucción visual de uno a tres pasos.', practice: 'Prueben una consigna breve y agreguen un paso cuando resulte cómoda.' },
  { id: 'routine', title: 'Primero, después', icon: '📋', area: 'Vida diaria', objective: 'Ordenar pasos de una actividad cotidiana.', practice: 'Elijan una rutina familiar y acomoden sus pasos.' },
  { id: 'positions', title: 'Arriba, abajo y al lado', icon: '📍', area: 'Atención', objective: 'Reconocer posiciones en una cuadrícula.', practice: 'Pongan un objeto arriba o abajo de una caja.' },
  { id: 'letters', title: 'Encuentro la letra', icon: '🔤', area: 'Lenguaje', objective: 'Reconocer letras; explorar mayúscula y minúscula.', practice: 'Busquen la inicial del nombre en un cartel.' },
  { id: 'initial', title: '¿Con qué letra empieza?', icon: '✏️', area: 'Lenguaje', objective: 'Relacionar una palabra escrita con su inicial.', practice: 'Miren juntos la primera letra de nombres familiares.' },
  { id: 'syllables', title: 'Palabras en palmas', icon: '👏', area: 'Lenguaje', objective: 'Reconocer sílabas con segmentación escrita de apoyo.', practice: 'Digan despacio una palabra y acompañen cada parte con una palma.' },
  { id: 'rhymes', title: 'Palabras que riman', icon: '🎵', area: 'Lenguaje', objective: 'Relacionar palabras con terminaciones parecidas.', practice: 'Inventen una rima breve, sin exigir una respuesta rápida.' },
  { id: 'faces', title: 'Caras y expresiones', icon: '🙂', area: 'Vida diaria', objective: 'Relacionar dibujos de expresiones con sus nombres; no adivinar lo que siente una persona.', practice: 'Pregunten cómo se siente cada uno. Un dibujo no define la emoción real.' },
  { id: 'hygiene', title: 'Me cuido cada día', icon: '🧼', area: 'Vida diaria', objective: 'Reconocer objetos usados en rutinas de higiene.', practice: 'Busquen juntos los elementos de una rutina cotidiana.' },
];
export type Option = { id: string; text: string; visual?: string; size?: number; color?: string };
export type Question = { prompt: string; visual?: string; options: Option[]; answer: string; hint: string; explanation: string; sequence?: string[]; memory?: string[]; grid?: string[] };
const group = (text: string, count: number) => Array.from({ length: count }, () => text).join(' ');
function rotate<T>(items: T[], offset: number): T[] { const n = offset % items.length; return [...items.slice(n), ...items.slice(0, n)]; }
function question(prompt: string, answer: string, choices: string[], round: number, hint: string, explanation: string, visual?: string): Question {
  return { prompt, answer, visual, options: rotate([...new Set([answer, ...choices])].map(text => ({ id: text, text })), round + 1), hint, explanation };
}
const numberChoices = (answer: number, max: number, count: number) => [answer, ...Array.from({ length: max + 1 }, (_, i) => i).filter(i => i !== answer)].slice(0, count).map(String);
const categories = [
  { name: 'fruta', plural: 'frutas', items: ['🍎', '🍐', '🍌', '🍓', '🍇'] },
  { name: 'animal', plural: 'animales', items: ['🐶', '🐱', '🐸', '🐰', '🐢'] },
  { name: 'vehículo', plural: 'vehículos', items: ['🚗', '🚌', '🚲', '🚂', '🚑'] },
  { name: 'prenda', plural: 'prendas', items: ['👕', '🧦', '👗', '🧥', '👖'] },
];
const words = [
  { word: 'LUNA', parts: 'LU · NA', syllables: 2 }, { word: 'SOL', parts: 'SOL', syllables: 1 },
  { word: 'PELOTA', parts: 'PE · LO · TA', syllables: 3 }, { word: 'MARIPOSA', parts: 'MA · RI · PO · SA', syllables: 4 },
  { word: 'CASA', parts: 'CA · SA', syllables: 2 }, { word: 'TOMATE', parts: 'TO · MA · TE', syllables: 3 },
  { word: 'PAN', parts: 'PAN', syllables: 1 }, { word: 'CAMISETA', parts: 'CA · MI · SE · TA', syllables: 4 },
];
export function createLearningQuestion(id: GameId, level: LearningLevel, round: number): Question {
  const count = level + 1, max = [3, 6, 10][level - 1], n = level === 1 ? 1 + round % 3 : level === 2 ? 2 + round % 5 : 6 + round % 5;
  const q = (prompt: string, answer: string, choices: string[], hint: string, explanation: string, visual?: string) => question(prompt, answer, choices, round, hint, explanation, visual);
  const numeric = (prompt: string, answer: number, visual?: string) => q(prompt, String(answer), numberChoices(answer, Math.max(max, answer + 2), count), `Podés contar de a uno. La respuesta es ${answer}.`, `La cantidad es ${answer}.`, visual);
  switch (id) {
    case 'count': return numeric('¿Cuántas manzanas hay?', n, group('🍎', n));
    case 'more': {
      const a = n + (round % 2 ? level : 0), b = n + (round % 2 ? 0 : level); return q('Elegí el grupo que tiene MÁS manzanas.', a > b ? 'A' : 'B', ['A', 'B'], `Contá cada grupo: A tiene ${a}; B tiene ${b}.`, `${Math.max(a, b)} es más que ${Math.min(a, b)}.`, `A: ${group('🍎', a)}\nB: ${group('🍎', b)}`);
    }
    case 'add': { const a = 1 + round % (level + 2), b = 1 + (round + level) % (level + 1); return numeric('Juntamos los dos grupos. ¿Cuántos hay en total?', a + b, `${group('🟢', a)} + ${group('🟢', b)}`); }
    case 'subtract': { const a = level + 2 + round % 3, b = 1 + round % level; return numeric(`Hay ${a} bloques y quitamos ${b}. ¿Cuántos quedan?`, a - b, `${group('🟦', a)}\nQuitamos: ${group('🟦', b)}`); }
    case 'next': return numeric(`¿Qué número viene después de ${n + (level - 1) * 5}?`, n + (level - 1) * 5 + 1);
    case 'missing': { const a = round + (level - 1) * 5; return numeric('¿Qué número falta?', a + 2, `${a} · ${a + 1} · ? · ${a + 3}`); }
    case 'pattern': { const shapes = rotate(['🔴', '🔵', '🟡'], round), cycle = level === 1 ? [shapes[0], shapes[1]] : level === 2 ? [shapes[0], shapes[0], shapes[1]] : shapes; const seq = [...cycle, ...cycle]; return q('¿Qué dibujo sigue en el tren?', cycle[0], shapes, `Se repite este grupo: ${cycle.join(' ')}.`, `El grupo vuelve a empezar con ${cycle[0]}.`, seq.join(' ') + ' ?'); }
    case 'size': { const large = round % 2 === 0; const sizes = level === 1 ? [26, 62] : level === 2 ? [26, 44, 62] : [26, 38, 50, 62]; const answer = String(large ? Math.max(...sizes) : Math.min(...sizes)); return { prompt: `Elegí la estrella MÁS ${large ? 'GRANDE' : 'PEQUEÑA'}.`, options: rotate(sizes.map((size, i) => ({ id: String(size), text: `Estrella ${i + 1}`, visual: '⭐', size })), round), answer, hint: 'Compará el espacio que ocupa cada estrella.', explanation: large ? 'Esta estrella ocupa más espacio.' : 'Esta estrella ocupa menos espacio.' }; }
    case 'shapes': { const shapes = [{ text: 'círculo', visual: '●' }, { text: 'cuadrado', visual: '■' }, { text: 'triángulo', visual: '▲' }, { text: 'estrella', visual: '★' }]; const target = shapes[round % shapes.length]; return { ...q(`Elegí el ${target.text}.`, target.text, [], 'Mirá el contorno de cada figura.', `Encontraste el ${target.text}.`), options: rotate([target, ...shapes.filter(x => x !== target)].slice(0, count).map(x => ({ ...x, id: x.text })), round) }; }
    case 'colors': { const colors = [{ text: 'rojo', color: '#b83037' }, { text: 'azul', color: '#3267ad' }, { text: 'amarillo', color: '#dfba26' }, { text: 'verde', color: '#3e8158' }, { text: 'violeta', color: '#8657a5' }]; const target = colors[round % colors.length]; return { ...q(`Buscá el color ${target.text}.`, target.text, [], 'Podés mirar el nombre junto a la muestra.', `Este color se llama ${target.text}.`), options: rotate([target, ...colors.filter(x => x !== target)].slice(0, count).map(x => ({ ...x, id: x.text })), round) }; }
    case 'category': { const c = categories[round % 4], other = categories[(round + 1) % 4]; return q(`¿Cuál es ${c.name === 'fruta' || c.name === 'prenda' ? 'una' : 'un'} ${c.name}?`, c.items[round % 5], [c.items[round % 5], ...other.items.slice(0, count - 1)], `Buscamos una imagen del grupo de ${c.plural}.`, `Este dibujo pertenece al grupo de ${c.plural}.`); }
    case 'odd': { const c = categories[round % 4], odd = categories[(round + 1) % 4].items[round % 5]; return q(`Todos menos uno son ${c.plural}. ¿Cuál es diferente?`, odd, [odd, ...c.items.slice(0, count)], `Buscá el que no pertenece al grupo de ${c.plural}.`, `${odd} pertenece a otro grupo.`); }
    case 'memory': return { prompt: 'Abrí dos tarjetas y encontrá las parejas.', answer: 'done', options: [], memory: rotate(['🍎', '🐢', '🚗', '⭐', '🎨'], round).slice(0, count), hint: 'Podés volver a mirar cada tarjeta sin apuro.', explanation: 'Encontraste todas las parejas.' };
    case 'sequence': { const sequence = rotate(['🍎', '🐢', '🚗', '⭐', '🎨'], round).slice(0, count); return { prompt: 'Mirá el camino. Después repetí los dibujos en el mismo orden.', sequence, answer: 'done', options: rotate(sequence.map(text => ({ id: text, text })), round + 1), hint: 'Podés volver a mirar el camino.', explanation: 'Repetiste el orden de los dibujos.' }; }
    case 'instructions': { const sequence = rotate(['⭐', '🍎', '🐢', '🚗'], round).slice(0, level); return { prompt: `Tocá en este orden: ${sequence.join(' → ')}.`, sequence, answer: 'done', options: rotate(['⭐', '🍎', '🐢', '🚗'].map(text => ({ id: text, text })), round), hint: 'Leé un paso a la vez y buscá su dibujo.', explanation: 'Seguiste todos los pasos.' }; }
    case 'routine': { const routines = [ ['Abrir la canilla', 'Mojar las manos', 'Usar jabón', 'Enjuagar', 'Secar'], ['Elegir un libro', 'Abrirlo', 'Mirar una página', 'Cerrar el libro', 'Guardarlo'], ['Buscar papel', 'Elegir colores', 'Dibujar', 'Guardar colores', 'Guardar el dibujo'], ['Buscar un vaso', 'Servir agua', 'Beber', 'Llevar el vaso', 'Guardar el vaso'], ['Elegir un juego', 'Preparar piezas', 'Jugar', 'Juntar piezas', 'Guardar el juego'] ]; const sequence = routines[round % 5].slice(0, level + 2); return { prompt: 'Ordená estos pasos. Tocá primero el que va al comienzo.', sequence, answer: 'done', options: rotate(sequence.map(text => ({ id: text, text })), round + 1), hint: `El próximo paso es: ${sequence[0]}.`, explanation: 'Armamos una secuencia posible; tu familia puede hacerlo de otra manera.' }; }
    case 'positions': { const cells = ['arriba a la izquierda', 'arriba en el centro', 'arriba a la derecha', 'en el centro a la izquierda', 'en el centro', 'en el centro a la derecha', 'abajo a la izquierda', 'abajo en el centro', 'abajo a la derecha']; const position = [1, 7, 3, 5, 4][round % 5]; return { ...q('¿Dónde está la estrella?', cells[position], [cells[position], ...rotate(cells.filter(x => x !== cells[position]), round).slice(0, count - 1)], 'Observá su lugar en la cuadrícula.', `La estrella está ${cells[position]}.`), grid: cells.map((_, i) => i === position ? '⭐' : '·') }; }
    case 'letters': { const letters = rotate(['A', 'E', 'I', 'O', 'U', 'M', 'P', 'S'], level - 1); const letter = letters[round % letters.length]; return q(level === 1 ? `Buscá la letra ${letter}.` : `¿Cuál es la mayúscula de «${letter.toLowerCase()}»?`, letter, [letter, ...letters.filter(x => x !== letter).slice(0, count - 1)], `Buscamos la letra ${letter}.`, `Encontraste la ${letter}.`, level === 1 ? letter : letter.toLowerCase()); }
    case 'initial': { const w = words[(round + level - 1) % words.length].word; return q(`¿Con qué letra empieza ${w}?`, w[0], [w[0], ...['A', 'M', 'P', 'S', 'L', 'T'].filter(x => x !== w[0]).slice(0, count - 1)], `Mirá la primera letra: ${w[0]}.`, `${w} empieza con ${w[0]}.`, w); }
    case 'syllables': { const w = words[(round + (level - 1) * 2) % words.length]; return q(`Decí «${w.word.toLowerCase()}» despacio. ¿Cuántas partes tiene?`, String(w.syllables), numberChoices(w.syllables, 4, count), `Las partes son: ${w.parts}.`, `${w.parts}: ${w.syllables} parte(s).`, level === 1 ? w.parts : w.word); }
    case 'rhymes': { const pairs = [['GATO', 'PATO'], ['LUNA', 'CUNA'], ['RATÓN', 'BOTÓN'], ['CASA', 'TAZA'], ['CONEJO', 'ESPEJO']]; const [word, answer] = pairs[round % 5]; return q(`¿Qué palabra rima con ${word}?`, answer, [answer, ...['SOL', 'MESA', 'TREN'].slice(0, count - 1)], `Decilas despacio: ${word.toLowerCase()} y ${answer.toLowerCase()}.`, `${word.toLowerCase()} y ${answer.toLowerCase()} tienen un final parecido.`, word); }
    case 'faces': { const faces = [{ text: 'alegría', visual: '😊' }, { text: 'tristeza', visual: '😢' }, { text: 'enojo', visual: '😠' }, { text: 'sorpresa', visual: '😮' }, { text: 'sueño', visual: '😴' }]; const face = faces[round % 5]; return q('¿Qué expresión representa este dibujo?', face.text, [face.text, ...faces.filter(x => x !== face).slice(0, count - 1).map(x => x.text)], `En este dibujo representamos ${face.text}. Las personas pueden expresarlo de otras maneras.`, `El dibujo representa ${face.text}; no permite saber cómo se siente otra persona.`, face.visual); }
    case 'hygiene': { const items = [['lavar las manos', 'jabón', '🧼'], ['lavar los dientes', 'cepillo de dientes', '🪥'], ['secar las manos', 'toalla', '🧺'], ['peinar el pelo', 'peine', '🪮'], ['sonarse la nariz', 'pañuelo', '🤧']]; const [action, answer, visual] = items[round % 5]; return q(`¿Qué usamos para ${action}?`, answer, [answer, ...['pelota', 'libro', 'zapato'].slice(0, count - 1)], `Para ${action}, usamos ${answer}.`, `Podés buscar ${answer} con un adulto.`, level === 1 ? visual : undefined); }
    default: throw new Error('Este juego usa su actividad original.');
  }
}
