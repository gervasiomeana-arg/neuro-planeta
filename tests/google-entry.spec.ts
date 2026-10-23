import { test, expect } from '@playwright/test';
const published = Boolean(process.env.PLAYWRIGHT_BASE_URL);
test('mandatory Google entry hides local profiles until authentication', async ({ page }) => {
  if (!published) await page.route('**/access-policy.json', route => route.fulfill({ json: { requireGoogle: true } }));
  await page.addInitScript(() => {
    localStorage.setItem('np_patients', JSON.stringify([{ id: 'private_gate', name: 'Perfil reservado ficticio', avatar: '🦊', selectedAge: '6-8', stars: 8, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [], customPictogramImages: {}, customPictogramVoices: {} }]));
  });
  await page.goto('./');
  const before = await page.evaluate(() => localStorage.getItem('np_patients'));
  const entry = page.getByRole('region', { name: 'Ingreso con Google', exact: true });
  await expect(entry).toBeVisible();
  await expect(page.getByRole('button', { name: /Perfil reservado ficticio/ })).toHaveCount(0);
  await expect(entry.getByRole('button', { name: 'Continuar con Google', exact: true })).toBeDisabled();
  await entry.getByRole('checkbox').check();
  await expect(entry.getByRole('button', { name: 'Continuar con Google', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Administración', exact: true }).click();
  const admin = page.getByRole('dialog', { name: 'Administración', exact: true });
  await expect(admin.getByRole('region', { name: 'Ingreso con Google', exact: true })).toBeVisible();
  await expect(admin.getByLabel('Clave de administración', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(before);
});
test('missing access policy fails closed without changing stored profiles', async ({ page }) => {
  test.skip(published, 'Fault injection only in the isolated candidate.');
  await page.route('**/access-policy.json', route => route.abort());
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('No se pudo verificar la política');
  await expect(page.getByRole('button', { name: 'Continuar con Google', exact: true })).toBeDisabled();
  await expect(page.locator('#neuroplaneta-onboarding-wrapper')).toHaveCount(0);
});
