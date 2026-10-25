import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { encryptBackup, decryptBackup } from '../src/data/backups';
import { accountProfileKey } from '../src/data/accountProfileStorage';

// Fictional SDK session, intercepted network, no real account or child data.
const uid = 'recovery-fictional', apiKey = 'AIzaSyAjnF0-SAQIpmPTgidYY11fjNHrOHkjdpk';
const localPassword = 'Espacio original ficticio 2026', copyPassword = 'Respaldo transportable ficticio 2026', destinationPassword = 'Otro dispositivo ficticio 2026';
const profile = { id: 'recovery-profile', name: 'Recuperación ficticia', avatar: '🦊', selectedAge: '6-8', stars: 19, unlockedAchievements: ['Prueba'], completedRoutineTasks: ['task'], emotionJournal: [{ date: '2026-10-21', emotion: 'Verde', note: 'Nota ficticia', intensity: 2 }], customPictogramImages: { agua: 'data:image/png;base64,iVBORw0KGgo=' }, customPictogramVoices: { agua: 'data:audio/webm;base64,AAAA' }, completedMicroSteps: { task: [0] }, routineTasks: { Mañana: [{ id: 'task', name: 'Mochila', emoji: '🎒', steps: ['Guardar cuaderno'] }] }, socialStories: [{ id: 'story', title: 'Escuela', pages: Array(5).fill({ emoji: '🏫', text: 'Puedo pedir ayuda.' }) }], rewardsStore: [{ id: 'reward', name: 'Cuento', emoji: '📖', cost: 5 }], redeemedRewards: [{ id: 'redeemed', name: 'Cuento', emoji: '📖', cost: 5, date: '2026-10-21' }] };
async function enter(page: Page) {
  const email = `${uid}@example.invalid`, now = Math.floor(Date.now() / 1000);
  const token = `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({ sub: uid, user_id: uid, email, email_verified: true, auth_time: now, iat: now, exp: now + 3600, firebase: { sign_in_provider: 'google.com' } })).toString('base64url')}.simulated`;
  const user = { uid, email, emailVerified: true, isAnonymous: false, providerData: [{ providerId: 'google.com', uid, email }], stsTokenManager: { accessToken: token, refreshToken: 'fictional-only', expirationTime: Date.now() + 3600000 }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: 'neuroplaneta-adults' };
  await page.route('**/access-policy.json', route => route.fulfill({ json: { requireGoogle: true } }));
  await page.route('https://identitytoolkit.googleapis.com/**', route => route.fulfill({ json: { users: [{ localId: uid, email, emailVerified: true, providerUserInfo: [{ providerId: 'google.com', email, rawId: uid }] }] } }));
  await page.route('https://securetoken.googleapis.com/**', route => route.abort());
  await page.route('https://firestore.googleapis.com/**', route => route.fulfill({ status: 403, json: { error: { code: 403, status: 'PERMISSION_DENIED' } } }));
  await page.goto('./');
  await page.evaluate(({ key, user }) => { sessionStorage.setItem(key, JSON.stringify(user)); localStorage.setItem('np_sensory_audio_mode', 'silent'); }, { key: `firebase:authUser:${apiKey}:neuroplaneta-adults`, user });
}
async function unlock(page: Page, password: string) {
  const locked = page.getByRole('region', { name: 'Desbloquear perfiles protegidos', exact: true });
  await locked.getByLabel('Contraseña de protección', { exact: true }).fill(password);
  await locked.getByRole('button', { name: 'Desbloquear perfiles', exact: true }).click();
}
test('Google account encrypted backup transfers full content into a fresh protected browser after review', async ({ page, browser }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'Fictional sessions only in isolated candidate.');
  test.setTimeout(60000);
  const key = accountProfileKey(uid), sourceCipher = await encryptBackup([profile], localPassword);
  await enter(page);
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key, raw: sourceCipher });
  await page.reload(); await unlock(page, localPassword);
  await page.getByRole('button', { name: /Recuperación ficticia/ }).click();
  await page.getByRole('button', { name: 'Abrir espacio de adultos', exact: true }).click();
  const dialog = page.locator('#adult-panel-dialog');
  const match = (await dialog.innerText()).match(/¿Cuánto es (\d+) x (\d+)/);
  if (match) {
    await dialog.getByRole('spinbutton').fill(String(Number(match[1]) * Number(match[2])));
    await dialog.getByRole('button', { name: 'Abrir configuración', exact: true }).click();
  }
  await dialog.getByRole('button', { name: /Perfiles/ }).first().click();
  await expect(page.getByRole('status', { name: 'Guardado protegido', exact: true })).toHaveText('Guardado cifrado completo.');
  const committedSource = (await page.evaluate(key => localStorage.getItem(key), key))!;
  const [source] = await decryptBackup(committedSource, localPassword);
  expect(source).toEqual(expect.objectContaining(profile));
  const sourcePanel = page.getByRole('region', { name: 'Copias de seguridad', exact: true });
  await sourcePanel.getByLabel('Contraseña de la copia', { exact: true }).fill(copyPassword);
  await sourcePanel.getByLabel('Repetir contraseña para descargar').fill(copyPassword);
  const downloading = page.waitForEvent('download');
  await sourcePanel.getByRole('button', { name: 'Descargar copia cifrada', exact: true }).click();
  const text = await readFile((await (await downloading).path())!, 'utf8');
  expect(await decryptBackup(text, copyPassword)).toEqual([source]);
  expect(text).not.toMatch(/Recuperación ficticia|Nota ficticia|data:audio/);
  const context = await browser.newContext();
  try {
    const fresh = await context.newPage(); await enter(fresh); await fresh.reload();
    const setup = fresh.getByRole('region', { name: 'Crear espacio de perfiles', exact: true });
    await setup.getByLabel('Nueva contraseña de perfiles', { exact: true }).fill(destinationPassword);
    await setup.getByLabel('Repetir contraseña de perfiles', { exact: true }).fill(destinationPassword);
    await setup.getByRole('button', { name: 'Crear mi espacio protegido', exact: true }).click();
    await fresh.getByText('Adultos: recuperar una copia anterior', { exact: true }).click();
    const restore = fresh.getByRole('region', { name: 'Copias de seguridad', exact: true });
    const emptyCipher = await fresh.evaluate(key => localStorage.getItem(key), key);
    await restore.getByLabel('Archivo de copia cifrada').setInputFiles({ name: 'transfer.npbackup', mimeType: 'application/octet-stream', buffer: Buffer.from(text) });
    await restore.getByLabel('Contraseña de la copia', { exact: true }).fill(localPassword);
    await restore.getByRole('button', { name: 'Revisar copia antes de restaurar' }).click();
    await expect(restore.getByRole('status')).toContainText('Contraseña incorrecta');
    expect(await fresh.evaluate(key => localStorage.getItem(key), key)).toBe(emptyCipher);
    await restore.getByLabel('Contraseña de la copia', { exact: true }).fill(copyPassword);
    await restore.getByRole('button', { name: 'Revisar copia antes de restaurar' }).click();
    await expect(restore.getByText('1 perfil(es) en la copia', { exact: true })).toBeVisible();
    expect(await fresh.evaluate(key => localStorage.getItem(key), key)).toBe(emptyCipher);
    await restore.getByRole('button', { name: 'Agregar perfiles como copias', exact: true }).click();
    await expect(fresh.getByRole('button', { name: /Recuperación ficticia \(copia\)/ })).toBeVisible();
    const saved = (await fresh.evaluate(key => localStorage.getItem(key), key))!;
    const [restored] = await decryptBackup(saved, destinationPassword);
    expect(restored.id).not.toBe(profile.id);
    expect({ ...restored, id: source.id, name: source.name }).toEqual(source);
    await expect(decryptBackup(saved, localPassword)).rejects.toThrow();
    expect(await fresh.evaluate(() => localStorage.getItem('np_patients'))).toBeNull();
    await fresh.reload(); await unlock(fresh, destinationPassword);
    await expect(fresh.getByRole('button', { name: /Recuperación ficticia \(copia\)/ })).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(committedSource);
  } finally { await context.close(); }
});
