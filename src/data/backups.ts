export const PROFILE_KEY = 'np_patients';
export const MAX_BACKUP_BYTES = 20_000_000;
const ITERATIONS = 600_000;
const FORMAT = 'neuroplaneta-backup-v1';
const encoder = new TextEncoder();

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function strings(value: unknown) { return Array.isArray(value) && value.every(item => typeof item === 'string'); }
function cleanTree(value: unknown, depth = 0, budget = { nodes: 0 }) {
  if (++budget.nodes > 200_000 || depth > 14) throw new Error('La copia contiene demasiados datos anidados.');
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (Array.isArray(value)) { value.forEach(item => cleanTree(item, depth + 1, budget)); return; }
  if (record(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('La copia contiene campos no admitidos.');
      cleanTree(item, depth + 1, budget);
    }
    return;
  }
  throw new Error('La copia contiene valores no admitidos.');
}

export function validateProfiles(value: unknown): asserts value is Array<Record<string, unknown> & { id: string; name: string }> {
  if (!Array.isArray(value) || value.length > 100) throw new Error('Se admiten hasta 100 perfiles por dispositivo.');
  cleanTree(value);
  const ids = new Set<string>();
  const fail = (): never => { throw new Error('La copia contiene un perfil no válido. Se conservaron los datos actuales.'); };
  for (const p of value) {
    if (!record(p) || typeof p.id !== 'string' || !p.id || p.id.length > 1000 || ids.has(p.id) ||
      typeof p.name !== 'string' || !p.name.trim() || p.name.length > 500 ||
      typeof p.avatar !== 'string' || !['3-5', '6-8', '9-10'].includes(String(p.selectedAge)) ||
      typeof p.stars !== 'number' || !Number.isInteger(p.stars) || p.stars < 0 || p.stars > 1_000_000_000 ||
      !strings(p.unlockedAchievements) || !strings(p.completedRoutineTasks) || !Array.isArray(p.emotionJournal) ||
      !record(p.customPictogramImages) || !record(p.customPictogramVoices)) fail();
    ids.add(p.id as string);
    for (const key of ['customPictogramImages', 'customPictogramVoices']) {
      if (!Object.values(p[key] as object).every(item => typeof item === 'string')) fail();
    }
    for (const entry of p.emotionJournal as unknown[]) {
      if (!record(entry) || !['date', 'emotion', 'note'].every(key => typeof entry[key] === 'string') ||
        (entry.intensity !== undefined && ![1, 2, 3].includes(Number(entry.intensity))) ||
        (entry.trigger !== undefined && typeof entry.trigger !== 'string')) fail();
    }
    if (p.attentionHighScore !== undefined && (typeof p.attentionHighScore !== 'number' || p.attentionHighScore < 0)) fail();
    if (p.therapeuticObjective !== undefined && typeof p.therapeuticObjective !== 'string') fail();
    if (p.routineDay !== undefined && typeof p.routineDay !== 'string') fail();
    if (p.routineSupportLevel !== undefined && !['detallado', 'clave', 'autonomo'].includes(String(p.routineSupportLevel))) fail();
    if (p.rewardedRoutineTasks !== undefined && !strings(p.rewardedRoutineTasks)) fail();
    if (p.completedMicroSteps !== undefined && (!record(p.completedMicroSteps) || !Object.values(p.completedMicroSteps).every(steps => Array.isArray(steps) && steps.every(step => Number.isInteger(step) && step >= 0)))) fail();
    if (p.routineTasks !== undefined) {
      if (!record(p.routineTasks)) fail();
      for (const tasks of Object.values(p.routineTasks as object)) {
        if (!Array.isArray(tasks) || tasks.some(task => !record(task) || !['id', 'name', 'emoji'].every(key => typeof task[key] === 'string') || (task.steps !== undefined && !strings(task.steps)))) fail();
      }
    }
    if (p.socialStories !== undefined && (!Array.isArray(p.socialStories) || p.socialStories.some((story: unknown) => !record(story) || typeof story.id !== 'string' || typeof story.title !== 'string' || !Array.isArray(story.pages) || story.pages.length !== 5 || story.pages.some((page: unknown) => !record(page) || typeof page.emoji !== 'string' || typeof page.text !== 'string')))) fail();
    for (const field of ['rewardsStore', 'redeemedRewards']) {
      if (p[field] !== undefined && (!Array.isArray(p[field]) || (p[field] as unknown[]).some(reward => !record(reward) || !['id', 'name', 'emoji'].every(key => typeof reward[key] === 'string') || typeof reward.cost !== 'number' || reward.cost < 0 || (field === 'redeemedRewards' && typeof reward.date !== 'string')))) fail();
    }
  }
}

export function loadProfiles(storage: Pick<Storage, 'getItem'>) {
  let raw: string | null = null;
  try {
    raw = storage.getItem(PROFILE_KEY);
    const profiles: unknown = raw === null ? [] : JSON.parse(raw);
    validateProfiles(profiles);
    return { profiles, raw, error: '' };
  } catch {
    return { profiles: [], raw, error: 'No se pudieron leer los perfiles guardados. Se conservaron los datos originales; el guardado está detenido.' };
  }
}

export function persistProfiles(storage: Pick<Storage, 'getItem' | 'setItem'>, profiles: unknown[], expected: string | null): string {
  if (storage.getItem(PROFILE_KEY) !== expected) throw new Error('Otra pestaña cambió los perfiles. Descargá una copia de esta sesión antes de recargar.');
  const next = JSON.stringify(profiles);
  storage.setItem(PROFILE_KEY, next); // native setItem is atomic on quota failure
  return next;
}

function toBase64(bytes: Uint8Array) {
  let text = '';
  for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
}
function fromBase64(value: unknown, length?: number): Uint8Array<ArrayBuffer> {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4) throw new Error('Formato de copia no válido.');
  const decoded = Uint8Array.from(atob(value), c => c.charCodeAt(0));
  if (length !== undefined && decoded.length !== length) throw new Error('Formato de copia no válido.');
  return decoded;
}
async function derive(password: string, salt: Uint8Array<ArrayBuffer>, usage: KeyUsage[]) {
  if (password.trim().length < 12 || password.length > 256) throw new Error('Usá una contraseña de entre 12 y 256 caracteres.');
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, usage);
}
async function seal(payload: unknown, password: string) {
  const bytes = encoder.encode(JSON.stringify(payload));
  if (bytes.length > 12_000_000) throw new Error('Los datos superan el tamaño admitido para esta copia.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(password, salt, ['encrypt']);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(FORMAT), tagLength: 128 }, key, bytes);
  return JSON.stringify({ format: FORMAT, algorithm: 'AES-256-GCM', kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: toBase64(salt), iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) });
}
export async function encryptBackup(profiles: unknown[], password: string) {
  const snapshot: unknown = JSON.parse(JSON.stringify(profiles));
  validateProfiles(snapshot);
  return seal({ format: 'neuroplaneta-profiles-v1', createdAt: new Date().toISOString(), profiles: snapshot }, password);
}
export async function encryptRecovery(raw: string, password: string) {
  return seal({ format: 'neuroplaneta-recovery-v1', raw }, password);
}
export async function decryptBackup(text: string, password: string) {
  if (encoder.encode(text).length > MAX_BACKUP_BYTES) throw new Error('La copia supera el límite de 20 MB.');
  const envelope: unknown = JSON.parse(text);
  if (!record(envelope) || envelope.format !== FORMAT || envelope.algorithm !== 'AES-256-GCM' || envelope.kdf !== 'PBKDF2-SHA256' || envelope.iterations !== ITERATIONS) throw new Error('Formato de copia no admitido.');
  const salt = fromBase64(envelope.salt, 16), iv = fromBase64(envelope.iv, 12), ciphertext = fromBase64(envelope.ciphertext);
  const key = await derive(password, salt, ['decrypt']);
  let plain: ArrayBuffer;
  try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(FORMAT), tagLength: 128 }, key, ciphertext); }
  catch { throw new Error('Contraseña incorrecta o copia dañada. Los perfiles actuales siguen intactos.'); }
  const payload: unknown = JSON.parse(new TextDecoder().decode(plain));
  if (!record(payload) || payload.format !== 'neuroplaneta-profiles-v1') throw new Error('Este archivo de rescate necesita revisión técnica; no se restaura automáticamente.');
  validateProfiles(payload.profiles);
  return payload.profiles;
}
