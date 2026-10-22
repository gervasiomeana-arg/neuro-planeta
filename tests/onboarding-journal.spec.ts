import { test, expect } from '@playwright/test';

test('a new profile starts with no invented emotional observations', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Configurar primer perfil' }).click();
  await page.locator('input[type="text"]').fill('Perfil ficticio nuevo');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: /Iniciar Aventura/ }).click();
  const profiles = () => page.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]'));
  await expect.poll(profiles).toHaveLength(1);
  expect((await profiles())[0].emotionJournal).toEqual([]);
  await page.getByRole('button', { name: /Emociones Contá/ }).click();
  await page.getByRole('button', { name: /Caritas y Diario/ }).click();
  await expect(page.getByRole('heading', { name: /Últimos registros/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Feliz/ }).click();
  await expect.poll(async () => (await profiles())[0].emotionJournal.length).toBe(1);
  await expect(page.getByRole('heading', { name: 'Últimos registros (1)' })).toBeVisible();
});

test('a fresh demo does not create a fictitious emotional observation', async ({ page }) => {
  await page.goto('./?demo=true&client=Prueba&age=6-8');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]').length)).toBe(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]')[0].emotionJournal)).toEqual([]);
});
