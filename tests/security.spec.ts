import { test, expect } from '@playwright/test';

test('production CSP blocks injected inline scripts while React renders names as text', async ({ page }) => {
  const name = '<img src=x onerror=alert(1)>';
  await page.addInitScript(name => {
    localStorage.setItem('np_patients', JSON.stringify([{ id: 'security_test', name, avatar: '🦊', selectedAge: '6-8', stars: 0, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [], customPictogramImages: {}, customPictogramVoices: {} }]));
    localStorage.setItem('np_active_patient_id', 'security_test');
  }, name);
  await page.goto('./');
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
  await page.getByRole('button', { name: /onerror=alert/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
  await expect(page.locator('h1 img')).toHaveCount(0);
  const violation = await page.evaluate(() => new Promise<string>(resolve => {
    document.addEventListener('securitypolicyviolation', event => resolve(event.violatedDirective), { once: true });
    const script = document.createElement('script');
    script.text = 'document.documentElement.dataset.injected = "yes"';
    document.head.append(script);
  }));
  expect(violation).toMatch(/script-src/);
  expect(await page.locator('html').getAttribute('data-injected')).toBeNull();
});

test('previously stored remote images are not loaded and their saved data is preserved', async ({ page }) => {
  const remoteRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('tracker.invalid')) remoteRequests.push(request.url()); });
  await page.addInitScript(() => {
    localStorage.setItem('np_patients', JSON.stringify([{ id: 'security_test', name: 'Seguridad ficticia', avatar: '🦊', selectedAge: '6-8', stars: 0, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [],
      customPictogramImages: { tengo_sed: 'https://tracker.invalid/private.png' }, customPictogramVoices: {} }]));
    localStorage.setItem('np_active_patient_id', 'security_test');
  });
  await page.goto('./');
  await page.getByRole('button', { name: /Seguridad ficticia/ }).click();
  await page.getByRole('button', { name: /Comunicar Decilo/ }).click();
  await expect(page.getByRole('button', { name: /Tengo Sed/ })).toBeVisible();
  expect(remoteRequests).toEqual([]);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]')[0].customPictogramImages.tengo_sed);
  expect(saved).toBe('https://tracker.invalid/private.png');
});
