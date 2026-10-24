import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { decryptBackup } from '../src/data/backups';

const password = 'Protección ficticia de prueba 2026';
const seed = { id: 'protected_test', name: 'Perfil protegido ficticio', avatar: '🦊', selectedAge: '6-8', stars: 19, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [{ date: '2026-10-22', emotion: 'Verde', note: 'Nota protegida ficticia' }], customPictogramImages: {}, customPictogramVoices: {}, attentionHighScore: 7 };

test('consented protection preserves backup, encrypts new profiles and locks across reload', async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(seed => {
    if (localStorage.getItem('np_patients') === null) {
      localStorage.setItem('np_patients', JSON.stringify([seed]));
      localStorage.setItem('np_active_patient_id', seed.id);
      localStorage.setItem('np_sensory_audio_mode', 'silent');
    }
  }, seed);
  await page.goto('./');
  await page.getByRole('button', { name: /Perfil protegido ficticio/ }).click();
  await page.getByRole('button', { name: 'Abrir espacio de adultos', exact: true }).click();
  const dialog = page.locator('#adult-panel-dialog');
  const match = (await dialog.innerText()).match(/¿Cuánto es (\d+) x (\d+)/);
  if (match) {
    await dialog.getByRole('spinbutton').fill(String(Number(match[1]) * Number(match[2])));
    await dialog.getByRole('button', { name: 'Abrir configuración' }).click();
  }
  await dialog.getByRole('button', { name: /Perfiles/ }).first().click();
  const controls = dialog.getByRole('region', { name: 'Protección principal de perfiles' });
  const original = await page.evaluate(() => localStorage.getItem('np_patients'));
  await controls.getByLabel('Nueva contraseña de protección', { exact: true }).fill(password);
  await controls.getByLabel('Repetir nueva contraseña de protección', { exact: true }).fill(password);
  const downloadPromise = page.waitForEvent('download');
  await controls.getByRole('button', { name: 'Preparar y descargar respaldo de protección' }).click();
  const download = await downloadPromise;
  const backup = await readFile((await download.path())!, 'utf8');
  expect(await decryptBackup(backup, password)).toEqual(JSON.parse(original!));
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(original);
  await expect(controls.getByRole('button', { name: 'Activar protección de perfiles', exact: true })).toBeDisabled();
  await controls.getByRole('checkbox').check();
  await controls.getByRole('button', { name: 'Activar protección de perfiles', exact: true }).click();
  const status = page.getByRole('status', { name: 'Guardado protegido' });
  await expect(status).toHaveText('Guardado cifrado completo.');
  const cipher = await page.evaluate(() => localStorage.getItem('np_patients'));
  expect(cipher).not.toMatch(/Perfil protegido ficticio|Nota protegida ficticia|emotionJournal/);
  expect(await decryptBackup(cipher!, password)).toEqual(JSON.parse(original!));
  await dialog.getByLabel('Nombre o apodo', { exact: true }).fill('Segundo protegido ficticio');
  await dialog.getByRole('button', { name: /Añadir perfil/ }).click();
  await expect(dialog.getByRole('button', { name: 'Activar perfil de Segundo protegido ficticio', exact: true })).toBeVisible();
  await expect.poll(async () => (await decryptBackup((await page.evaluate(() => localStorage.getItem('np_patients')))!, password)).length).toBe(2);
  await expect(status).toHaveText('Guardado cifrado completo.');
  const saved = await page.evaluate(() => localStorage.getItem('np_patients'));
  expect(saved).not.toMatch(/Perfil protegido ficticio|Segundo protegido ficticio|Nota protegida ficticia/);
  expect((await decryptBackup(saved!, password))[0].stars).toBe(19);
  await controls.getByRole('button', { name: 'Bloquear perfiles ahora' }).click();
  const locked = page.getByRole('region', { name: 'Desbloquear perfiles protegidos' });
  await expect(locked).toBeVisible();
  await expect(page.getByRole('button', { name: /Activar perfil de/ })).toHaveCount(0);
  await locked.getByLabel('Contraseña de protección', { exact: true }).fill('Contraseña equivocada de prueba');
  await locked.getByRole('button', { name: 'Desbloquear perfiles', exact: true }).click();
  await expect(locked.getByRole('status')).toContainText('Contraseña incorrecta');
  await expect(locked.getByLabel('Contraseña de protección', { exact: true })).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(saved);
  await locked.getByLabel('Contraseña de protección', { exact: true }).fill(password);
  await locked.getByRole('button', { name: 'Desbloquear perfiles', exact: true }).click();
  await expect(page.getByRole('button', { name: /Segundo protegido ficticio/ })).toBeVisible();
  await expect(status).toHaveText('Guardado cifrado completo.');
  await page.reload();
  await expect(locked).toBeVisible();
  expect((await decryptBackup((await page.evaluate(() => localStorage.getItem('np_patients')))!, password)).length).toBe(2);
});
