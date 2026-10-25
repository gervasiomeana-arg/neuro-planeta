import { test, expect, type Page } from '@playwright/test';
import { LEARNING_GAMES, createLearningQuestion } from '../src/learning/curriculum';

const modules = [
  ['Emociones', 'Emociones y Regulación'], ['Aprender y jugar', 'Aprender y jugar'],
  ['Zona Calma', 'Zona Calma'], ['Sensorial', 'Regulación Sensorial'],
  ['Comunicar', 'Tablero de Comunicación (SACS)'], ['Social', 'Historias Sociales y Situaciones'],
  ['Rutinas', 'Mis Rutinas y Estructura'],
];
async function prepare(page: Page) {
  await page.route('**/access-policy.json', route => route.fulfill({ json: { requireGoogle: false } }));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(() => {
    if (!localStorage.getItem('np_patients')) localStorage.setItem('np_patients', JSON.stringify([{
      id: 'touch-test', name: 'Prueba táctil', avatar: '🦊', selectedAge: '6-8', stars: 12,
      unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [{ date: '12:00', emotion: 'nota', note: 'Conservar este registro' }],
      customPictogramImages: {}, customPictogramVoices: {},
    }]));
    localStorage.setItem('np_sensory_audio_mode', 'silent');
    localStorage.setItem('np_app_device_mode', innerWidth >= 600 ? 'tablet' : 'movil');
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Prueba táctil/ }).tap();
}
async function openGames(page: Page) {
  await page.locator('main').getByRole('button', { name: /Aprender y jugar/ }).tap();
}
async function assertPreserved(page: Page) {
  const profiles = await page.evaluate(() => JSON.parse(localStorage.getItem('np_patients')!));
  expect(profiles).toHaveLength(1);
  expect(profiles[0]).toMatchObject({ id: 'touch-test', name: 'Prueba táctil', emotionJournal: [{ note: 'Conservar este registro' }] });
}
for (const device of [
  { name: 'celular pequeño', width: 320, height: 568 },
  { name: 'celular', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'tablet horizontal', width: 1024, height: 600 },
]) test.describe(device.name, () => {
  test.use({ viewport: { width: device.width, height: device.height }, isMobile: true, hasTouch: true });
  test('recorrido táctil, 25 juegos, rotación, pausa y registros conservados', async ({ page }) => {
    test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'Solo datos ficticios en candidato aislado.');
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await prepare(page);
    for (const [label, heading] of modules) {
      await page.locator('main').getByRole('button', { name: new RegExp(label) }).first().tap();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeInViewport();
      await page.getByRole('button', { name: 'Volver al inicio', exact: true }).tap();
    }
    await openGames(page);
    await expect(page.getByRole('button', { name: /^Jugar:/ })).toHaveCount(25);
    for (const title of ['Buscar números', 'Parejas de imágenes']) {
      await page.getByRole('button', { name: `Jugar: ${title}`, exact: true }).tap();
      await expect(page.locator('.np-module-atencion')).toContainText(title === 'Buscar números' ? 'Buscá este número' : 'Buscá el dibujo igual');
      await expect(page.locator('.np-module-atencion button').last()).toBeEnabled();
      await page.getByRole('button', { name: 'Volver al inicio', exact: true }).tap();
      await openGames(page);
    }
    for (const game of LEARNING_GAMES.filter(g => !['numbers', 'matching'].includes(g.id))) {
      await page.getByRole('button', { name: `Jugar: ${game.title}`, exact: true }).tap();
      await expect(page.getByRole('button', { name: 'Pausar y volver', exact: true })).toBeInViewport();
      const question = page.locator('.np-learning-question');
      await expect(question).toBeVisible();
      const overflowing = await question.evaluate(el => el.scrollWidth > el.clientWidth + 1);
      expect(overflowing, game.title).toBe(false);
      await page.getByRole('button', { name: 'Pausar y volver', exact: true }).tap();
    }
    await page.getByRole('button', { name: 'Jugar: Contar objetos', exact: true }).tap();
    const q = createLearningQuestion('count', 1, 0);
    await page.locator('.np-learning-choices > button').nth(q.options.findIndex(o => o.id === q.answer)).tap();
    await page.setViewportSize({ width: device.height, height: device.width });
    await expect(page.locator('#neuroplaneta-workspace > nav')).toBeInViewport({ ratio: 1 });
    await page.getByRole('button', { name: 'Siguiente desafío', exact: true }).tap();
    await expect(page.locator('.np-learning-session-head')).toContainText('Desafío 2 de 5');
    await page.getByRole('button', { name: 'Pausar y volver', exact: true }).tap();
    await page.getByRole('button', { name: 'Jugar: Contar objetos', exact: true }).tap();
    await page.locator('#neuroplaneta-workspace > nav').getByRole('button', { name: 'Inicio', exact: true }).tap();
    await openGames(page);
    await expect(page.getByRole('button', { name: /^Jugar:/ })).toHaveCount(25);
    await assertPreserved(page);
    const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem('np_patients')!)[0].activitySessions);
    expect(sessions.at(-2)).toMatchObject({ gameId: 'count', roundsCompleted: 1, status: 'paused' });
    expect(sessions.at(-1)).toMatchObject({ gameId: 'count', roundsCompleted: 0, status: 'paused' });
    expect(sessions).toHaveLength(27);
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.getByRole('button', { name: 'Abrir espacio de adultos', exact: true }).tap();
    const dialog = page.locator('#adult-panel-dialog');
    const challenge = (await dialog.innerText()).match(/¿Cuánto es (\d+) x (\d+)/);
    if (challenge) {
      await dialog.getByRole('spinbutton').fill(String(Number(challenge[1]) * Number(challenge[2])));
      await dialog.getByRole('button', { name: 'Abrir configuración', exact: true }).tap();
    }
    for (const [id, label] of [['pacientes', 'Perfiles'], ['rutinas', 'Rutinas'], ['recompensas', 'Premios Reales'], ['historias', 'Historias'], ['pictogramas', 'Pictogramas'], ['sonido', 'Audio Sensorial'], ['reportes', 'Informe de uso']]) {
      if (device.width < 900) await dialog.getByLabel('Sección del panel', { exact: true }).selectOption(id);
      else await dialog.getByRole('navigation', { name: 'Secciones del panel de adultos' }).getByRole('button', { name: new RegExp(label) }).tap();
      const content = dialog.locator('#adult-panel-scroll');
      await expect(content).toHaveAttribute('data-section', id);
      expect(await content.evaluate(el => el.scrollWidth <= el.clientWidth + 1), label).toBe(true);
    }
    await dialog.getByRole('button', { name: 'Cerrar panel de adultos', exact: true }).tap();
    await assertPreserved(page);
    expect(errors).toEqual([]);
  });
});

test.describe('fallo de carga en celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('los juegos abren aun bloqueando la descarga separada que antes vaciaba la pantalla', async ({ page }) => {
    test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'Inyección de fallos solo local.');
    const gameRequests: string[] = [];
    await page.route('**/assets/LearningHub-*.js', route => { gameRequests.push(route.request().url()); return route.abort(); });
    await prepare(page); await openGames(page);
    await expect(page.getByRole('button', { name: /^Jugar:/ })).toHaveCount(25);
    expect(gameRequests).toEqual([]);
    await assertPreserved(page);
  });
  test('un error de dibujo permite reintentar o volver sin borrar perfiles', async ({ page }) => {
    test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'Inyección de fallos solo local.');
    await prepare(page);
    await page.evaluate(() => {
      const original = String.prototype.split;
      document.documentElement.dataset.gameFault = 'yes';
      String.prototype.split = function (this: string, ...args: Parameters<typeof original>) {
        if (String(this) === '🌱' && document.documentElement.dataset.gameFault === 'yes') throw new Error('Fallo ficticio de dibujo');
        return original.apply(this, args);
      } as typeof original;
    });
    await openGames(page);
    await expect(page.getByRole('alert', { name: 'Actividad no disponible' })).toBeVisible();
    await expect(page.locator('#neuroplaneta-workspace > nav')).toBeInViewport();
    await assertPreserved(page);
    await page.evaluate(() => { delete document.documentElement.dataset.gameFault; });
    await page.getByRole('button', { name: 'Volver a intentar', exact: true }).tap();
    await expect(page.getByRole('button', { name: /^Jugar:/ })).toHaveCount(25);
    await assertPreserved(page);
  });
});
