import { test, expect, type Page } from '@playwright/test';

async function enter(page: Page) {
  await page.getByRole('button', { name: 'Abrir espacio de adultos', exact: true }).click();
  const dialog = page.locator('#adult-panel-dialog');
  const answer = dialog.getByRole('spinbutton');
  await expect(answer).toHaveValue('');
  const question = (await dialog.innerText()).match(/¿Cuánto es (\d+) x (\d+)/)!;
  await answer.fill(String(Number(question[1]) * Number(question[2])));
  await dialog.getByRole('button', { name: 'Abrir configuración' }).click();
  return dialog;
}
for (const event of ['hidden', 'pagehide']) {
  test(`adult panel relocks on ${event} without changing stored profiles`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('np_patients', JSON.stringify([{ id: 'privacy_test', name: 'Privacidad ficticia', avatar: '🦊', selectedAge: '6-8', stars: 19, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [], customPictogramImages: {}, customPictogramVoices: {} }]));
      localStorage.setItem('np_sensory_audio_mode', 'silent');
    });
    await page.goto('./');
    await page.getByRole('button', { name: /Privacidad ficticia/ }).click();
    const dialog = await enter(page);
    await dialog.getByLabel('Contraseña de la copia', { exact: true }).fill('Clave ficticia de prueba 2026');
    const before = await page.evaluate(() => localStorage.getItem('np_patients'));
    await page.evaluate(event => {
      if (event === 'hidden') {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
        Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      } else window.dispatchEvent(new Event('pagehide'));
    }, event);
    await expect(dialog).toHaveCount(0);
    const reopened = await enter(page);
    await expect(reopened.getByLabel('Contraseña de la copia', { exact: true })).toHaveValue('');
    expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(before);
  });
}
