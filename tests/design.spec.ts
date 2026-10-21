import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('np_patients', JSON.stringify([{
      id: 'design_test', name: 'Prueba de diseño', avatar: '🦊', selectedAge: '6-8',
      stars: 12, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [],
      customPictogramImages: {}, customPictogramVoices: {},
    }]));
    localStorage.setItem('np_active_patient_id', 'design_test');
    localStorage.setItem('np_sensory_audio_mode', 'silent');
  });
});

for (const width of [360, 768, 1280]) {
  test(`inicio legible y accesible a ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    if (width >= 768) await page.getByRole('button', { name: /Tablet Vista amplia/ }).click();
    await page.getByRole('button', { name: /Prueba de diseño/ }).click();
    await expect(page.locator('.np-activity-card')).toHaveCount(7);
    const bounds = await page.locator('.np-activity-card').evaluateAll(nodes => nodes.map(node => {
      const r = node.getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width, height: r.height };
    }));
    for (const rect of bounds) {
      expect(rect.left).toBeGreaterThanOrEqual(0);
      expect(rect.right).toBeLessThanOrEqual(width);
      expect(rect.width).toBeGreaterThanOrEqual(130);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    }
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    await page.screenshot({ path: testInfo.outputPath(`inicio-${width}.png`), fullPage: true });
    expect(audit.violations).toEqual([]);
  });
}

test('cada registro exige intensidad elegida y la situación es opcional', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Prueba de diseño/ }).click();
  await page.getByRole('button', { name: /Emociones Contá/ }).click();
  await page.getByRole('button', { name: /Zona Roja/ }).click();
  await expect(page.getByRole('button', { name: 'Elegí una intensidad para guardar' })).toBeDisabled();
  await page.getByRole('button', { name: /Nvl 2 Bastante/ }).click();
  await page.getByRole('button', { name: /Registrar en mi Diario Emocional/ }).click();
  await expect(page.getByText(/Registro guardado! Intensidad: Bastante/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Elegí una intensidad para guardar' })).toBeDisabled();
});
