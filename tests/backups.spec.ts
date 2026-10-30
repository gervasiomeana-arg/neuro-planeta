import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { decryptBackup } from '../src/data/backups';
import { DEFAULT_CONFIG } from '../commercial/policy';
// Legacy storage remains covered separately from the authenticated encrypted flow.
// Override access only in this local fixture, never in the published application.
async function isolated(page: Page) {
  await page.route('**/access-policy.json', route => route.fulfill({ json: { requireGoogle: false } }));
  await page.route('**/commercial-config.json', route => route.fulfill({ json: DEFAULT_CONFIG }));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://identitytoolkit.googleapis.com/**', route => route.abort());
  await page.route('https://firestore.googleapis.com/**', route => route.abort());
}
test.beforeEach(async ({ page }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'Legacy fixtures only in an isolated local candidate.');
  await isolated(page);
});
const password = 'Varias palabras de prueba 2026';
const seed = { id: 'backup_test', name: 'Respaldo ficticio', avatar: '🦊', selectedAge: '6-8', stars: 19, unlockedAchievements: ['Prueba'], completedRoutineTasks: [], emotionJournal: [{ date: '2026-10-21', emotion: 'Verde', note: 'Nota ficticia' }], customPictogramImages: {}, customPictogramVoices: {}, attentionHighScore: 7 };
async function start(page: Page) {
  await page.addInitScript(seed => {
    localStorage.setItem('np_patients', JSON.stringify([seed]));
    localStorage.setItem('np_active_patient_id', seed.id);
    localStorage.setItem('np_sensory_audio_mode', 'silent');
  }, seed);
  await page.goto('./');
  await page.getByRole('button', { name: /Respaldo ficticio/ }).click();
}
async function panel(page: Page) {
  await page.getByRole('button', { name: 'Abrir espacio de adultos', exact: true }).click();
  const dialog = page.locator('#adult-panel-dialog');
  const match = (await dialog.innerText()).match(/¿Cuánto es (\d+) x (\d+)/);
  if (match) {
    await dialog.getByRole('spinbutton').fill(String(Number(match[1]) * Number(match[2])));
    await dialog.getByRole('button', { name: 'Abrir configuración' }).click();
  }
  await dialog.getByRole('button', { name: /Perfiles/ }).first().click();
  return dialog.getByRole('region', { name: 'Copias de seguridad' });
}

test('downloaded encrypted backup restores in a fresh browser after review and preserves the source', async ({ page, browser }) => {
  await start(page);
  const backup = await panel(page);
  const source = await page.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]'));
  await backup.getByLabel('Contraseña de la copia', { exact: true }).fill(password);
  await backup.getByLabel('Repetir contraseña para descargar').fill(password);
  const downloaded = page.waitForEvent('download');
  await backup.getByRole('button', { name: 'Descargar copia cifrada' }).click();
  const download = await downloaded;
  const text = await readFile((await download.path())!, 'utf8');
  expect(text).not.toContain(seed.name);
  expect(await decryptBackup(text, password)).toEqual(source);
  const context = await browser.newContext();
  try {
    const fresh = await context.newPage(); await isolated(fresh); await fresh.goto(page.url());
    await fresh.getByText('Adultos: recuperar una copia anterior', { exact: true }).click();
    const restore = fresh.getByRole('region', { name: 'Copias de seguridad' });
    await restore.getByLabel('Archivo de copia cifrada').setInputFiles({ name: 'copia.npbackup', mimeType: 'application/octet-stream', buffer: Buffer.from(text) });
    await restore.getByLabel('Contraseña de la copia', { exact: true }).fill('Contraseña equivocada de prueba');
    await restore.getByRole('button', { name: 'Revisar copia antes de restaurar' }).click();
    await expect(restore.getByRole('status')).toContainText('Contraseña incorrecta');
    await expect(restore.getByLabel('Contraseña de la copia', { exact: true })).toHaveValue('');
    expect(await fresh.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]'))).toEqual([]);
    await restore.getByLabel('Contraseña de la copia', { exact: true }).fill(password);
    await restore.getByRole('button', { name: 'Revisar copia antes de restaurar' }).click();
    await expect(restore.getByText('1 perfil(es) en la copia', { exact: true })).toBeVisible();
    expect(await fresh.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]'))).toEqual([]);
    await restore.getByRole('button', { name: 'Cancelar restauración' }).click();
    expect(await fresh.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]'))).toEqual([]);
    await restore.getByLabel('Archivo de copia cifrada').setInputFiles({ name: 'copia.npbackup', mimeType: 'application/octet-stream', buffer: Buffer.from(text) });
    await restore.getByLabel('Contraseña de la copia', { exact: true }).fill(password);
    await restore.getByRole('button', { name: 'Revisar copia antes de restaurar' }).click();
    await restore.getByRole('button', { name: 'Agregar perfiles como copias' }).click();
    await expect(fresh.getByRole('button', { name: /Respaldo ficticio \(copia\)/ })).toBeVisible();
    const restored = await fresh.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]')[0]);
    expect(restored.id).not.toBe(seed.id);
    expect({ ...restored, id: source[0].id, name: source[0].name }).toEqual(source[0]);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]'))).toEqual(source);
  } finally { await context.close(); }
});

test('malformed saved data is retained instead of being overwritten by an empty array', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('np_patients', '{DATOS_FICTICIOS_DANADOS'));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Conservamos tus datos para recuperarlos' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe('{DATOS_FICTICIOS_DANADOS');
  await expect(page.getByRole('button', { name: 'Descargar rescate cifrado' })).toBeVisible();
});

test('storage quota failure is visible and does not replace the saved profile', async ({ page }) => {
  await page.addInitScript(seed => {
    localStorage.setItem('np_patients', JSON.stringify([seed]));
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'np_patients') throw new DOMException('Test quota', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  }, seed);
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('No se pudieron guardar');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]')[0])).toEqual(seed);
});

test('changes in another tab stop writes from the old session', async ({ page, context }) => {
  await start(page);
  const other = await context.newPage();
  // A same-origin empty document avoids a second running application writing state.
  const helperUrl = new URL('__storage-test__', page.url()).href;
  await other.route(helperUrl, route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Storage test helper</title>' }));
  await other.goto(helperUrl);
  await other.evaluate(() => {
    const profiles = JSON.parse(localStorage.getItem('np_patients') || '[]');
    profiles[0].stars = 7; localStorage.setItem('np_patients', JSON.stringify(profiles));
  });
  await expect(page.getByRole('alert')).toContainText('Otra pestaña');
  await page.getByRole('button', { name: /Emociones Contá/ }).click();
  await page.getByRole('button', { name: /Zona Roja/ }).click();
  await page.getByRole('button', { name: /Nvl 2 Bastante/ }).click();
  await page.getByRole('button', { name: /Registrar en mi Diario Emocional/ }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]')[0].stars)).toBe(7);
  await other.close();
});


test('backup password mismatch clears both fields and preserves local profiles', async ({ page }) => {
  await start(page);
  const backup = await panel(page);
  const before = await page.evaluate(() => localStorage.getItem('np_patients'));
  await backup.getByLabel('Contraseña de la copia', { exact: true }).fill(password);
  await backup.getByLabel('Repetir contraseña para descargar').fill('Otra clave ficticia distinta');
  await backup.getByRole('button', { name: 'Descargar copia cifrada', exact: true }).click();
  await expect(backup.getByRole('status')).toContainText('Las contraseñas no coinciden');
  await expect(backup.getByLabel('Contraseña de la copia', { exact: true })).toHaveValue('');
  await expect(backup.getByLabel('Repetir contraseña para descargar')).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(before);
});
