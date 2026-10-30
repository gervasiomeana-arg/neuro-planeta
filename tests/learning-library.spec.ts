import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { LEARNING_GAMES, createLearningQuestion, type Game, type LearningLevel } from '../src/learning/curriculum';
const published = Boolean(process.env.PLAYWRIGHT_BASE_URL);
test.describe.configure({ mode: 'parallel' });
async function start(page: Page) {
  await page.route('**/access-policy.json', route => route.fulfill({ json: { requireGoogle: false } }));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.addInitScript(() => {
    if (localStorage.getItem('np_library_fixture')) return;
    localStorage.setItem('np_patients', JSON.stringify([{ id: 'library-fictional', name: 'Biblioteca ficticia', avatar: '🦊', selectedAge: '6-8', stars: 12, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [], customPictogramImages: {}, customPictogramVoices: {} }]));
    localStorage.setItem('np_sensory_audio_mode', 'silent'); localStorage.setItem('np_library_fixture', '1');
  });
  await page.goto('./');
  await page.getByRole('button', { name: /Biblioteca ficticia/ }).click();
  await page.locator('main').getByRole('button', { name: /Aprender y jugar/ }).click();
}
async function profile(page: Page) { return page.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]')[0]); }
async function images(page: Page) {
  await expect.poll(() => page.locator('.np-learning img').evaluateAll(imgs => imgs.every(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator('.np-learning [data-failed]')).toHaveCount(0);
}
async function solve(page: Page, game: Game, level: LearningLevel) {
  await page.getByRole('button', { name: `${level}. ${['Explorar', 'Practicar', 'Desafío'][level - 1]}`, exact: true }).click();
  await page.getByRole('button', { name: `Jugar: ${game.title}`, exact: true }).click();
  for (let round = 0; round < 5; round++) {
    const q = createLearningQuestion(game.id, level, round);
    await expect(page.locator('.np-learning-session-head')).toContainText(`Desafío ${round + 1} de 5`);
    await expect(page.getByRole('button', { name: 'Pausar y volver', exact: true })).toBeInViewport();
    await images(page);
    if (q.memory) {
      await page.getByRole('button', { name: 'Mirar todas con ayuda', exact: true }).click();
      const labels = await page.locator('.np-learning-memory>button').evaluateAll(btns => btns.map(b => b.getAttribute('aria-label')!.replace(/^Tarjeta \d+: /, '')));
      await images(page);
      await page.getByRole('button', { name: 'Ocultar para seguir', exact: true }).click();
      for (const symbol of q.memory) {
        const indices = labels.flatMap((value, i) => value === symbol ? [i] : []);
        for (const index of indices) await page.locator('.np-learning-memory>button').nth(index).click();
      }
    } else {
      if (game.id === 'sequence') await page.getByRole('button', { name: 'Estoy listo: ocultar y empezar', exact: true }).click();
      for (const answer of q.sequence || [q.answer]) await page.locator('.np-learning-choices>button').nth(q.options.findIndex(o => o.id === answer)).click();
    }
    await expect(page.getByRole('button', { name: round === 4 ? 'Ver cierre de la sesión' : 'Siguiente desafío', exact: true })).toBeVisible();
    if (round < 4) await page.getByRole('button', { name: 'Siguiente desafío', exact: true }).click();
  }
  await expect.poll(async () => (await profile(page)).activitySessions?.length).toBe(1);
  const saved = await profile(page), session = saved.activitySessions[0];
  expect(session).toMatchObject({ gameId: game.id, level, status: 'completed', roundsCompleted: 5, independentCorrect: game.id === 'memory' ? 0 : 5 });
  expect(session.firstResponseSeconds).toHaveLength(5);
  expect(session.activeSeconds).toBeGreaterThanOrEqual(0);
  expect(session.attempts).toBeGreaterThanOrEqual(5);
  expect(saved.learningProgress[game.id]).toMatchObject({ sessions: 1, highestLevel: level });
  await page.getByRole('button', { name: 'Ver cierre de la sesión', exact: true }).click();
  expect((await profile(page)).activitySessions).toHaveLength(1);
}
for (const game of LEARNING_GAMES.filter(g => !['numbers', 'matching'].includes(g.id))) for (const level of [1, 2, 3] as LearningLevel[]) {
  test(`${game.id} level ${level}: five rounds, local pictures and one saved session`, async ({ page }) => {
    test.skip(published, 'Fictional fixtures only in isolated candidate.');
    await start(page); await solve(page, game, level);
    const saved = await profile(page); await page.reload();
    expect((await profile(page)).activitySessions).toEqual(saved.activitySessions);
  });
}
test('completed game downloads a factual report with the saved measurements', async ({ page }) => {
  test.skip(published, 'Fictional fixtures only.');
  await start(page); await solve(page, LEARNING_GAMES.find(g => g.id === 'count')!, 1);
  const savedBeforeReport = await profile(page), session = savedBeforeReport.activitySessions[0];
  await page.getByRole('button', { name: 'Abrir espacio de adultos', exact: true }).click();
  const dialog = page.locator('#adult-panel-dialog');
  const challenge = (await dialog.innerText()).match(/¿Cuánto es (\d+) x (\d+)/);
  if (challenge) { await dialog.getByRole('spinbutton').fill(String(Number(challenge[1]) * Number(challenge[2]))); await dialog.getByRole('button', { name: 'Abrir configuración', exact: true }).click(); }
  await dialog.getByRole('navigation').getByRole('button', { name: /Informe de uso/ }).click();
  const report = page.getByRole('region', { name: 'Informe descriptivo para compartir', exact: true });
  await expect(report).toContainText('1 sesiones registradas');
  await report.getByRole('checkbox', { name: /Revisé los datos/ }).check();
  const downloading = page.waitForEvent('download');
  await report.getByRole('button', { name: 'Descargar informe para revisar (.html)', exact: true }).click();
  const html = await readFile((await (await downloading).path())!, 'utf8');
  expect(html).toContain('Contar objetos'); expect(html).toContain('1 sesiones registradas: 1 completas');
  expect(html).toContain('No realiza análisis, evaluaciones, diagnósticos ni recomendaciones de tratamiento');
  expect(html).toContain(`<td>${session.activeSeconds.toFixed(1)} s</td>`);
  expect(html).toContain(`<td>${session.firstResponseSeconds.map((n: number) => n.toFixed(1)).join(' / ')}</td>`);
  expect(html).toContain(`<td>${session.roundsCompleted}</td><td>${session.attempts}</td><td>${session.independentCorrect}</td>`);
  expect(html).not.toContain('Biblioteca ficticia');
  expect(await profile(page)).toEqual(savedBeforeReport);
});
test('a missing image shows a readable label and pausing saves once', async ({ page }) => {
  test.skip(published, 'Fault injection only in isolated candidate.');
  await start(page);
  await page.route('**/pictograms/neuroplaneta/towel.svg', route => route.abort());
  await page.getByRole('button', { name: 'Jugar: Me cuido cada día', exact: true }).click();
  for (let round = 0; round < 2; round++) {
    const q = createLearningQuestion('hygiene', 1, round);
    await page.locator('.np-learning-choices>button').nth(q.options.findIndex(o => o.id === q.answer)).click();
    await page.getByRole('button', { name: 'Siguiente desafío', exact: true }).click();
  }
  await expect(page.locator('.np-learning-stimulus [data-failed]')).toHaveText('toalla');
  await page.getByRole('button', { name: 'Pausar y volver', exact: true }).click();
  await expect.poll(async () => (await profile(page)).activitySessions?.length).toBe(1);
  expect((await profile(page)).activitySessions[0]).toMatchObject({ status: 'paused', roundsCompleted: 2 });
});
for (const width of [360, 768, 1280]) {
  test(`all new games fit screen widths: ${width}px`, async ({ page }, info) => {
    test.skip(published, 'Fictional fixtures only.');
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 900 }); await start(page);
    await page.getByRole('button', { name: '3. Desafío', exact: true }).click();
    for (const game of LEARNING_GAMES.filter(g => !['numbers', 'matching'].includes(g.id))) {
      await page.getByRole('button', { name: `Jugar: ${game.title}`, exact: true }).click();
      await expect(page.getByRole('button', { name: 'Pausar y volver', exact: true })).toBeInViewport();
      await images(page);
      const bounds = await page.locator('.np-learning').evaluate(el => ({ left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right, scroll: el.scrollWidth, client: el.clientWidth }));
      expect(bounds.left, game.id).toBeGreaterThanOrEqual(0); expect(bounds.right, game.id).toBeLessThanOrEqual(width);
      expect(bounds.scroll, game.id).toBeLessThanOrEqual(bounds.client + 1);
      if (['count', 'memory', 'positions', 'hygiene'].includes(game.id)) await page.screenshot({ path: info.outputPath(`${game.id}-${width}.png`), fullPage: true });
      await page.getByRole('button', { name: 'Pausar y volver', exact: true }).click();
    }
  });
}
test('background timing is excluded and help is recorded without inferring human assistance', async ({ page }) => {
  test.skip(published, 'Visibility fault injection only in isolated candidate.');
  await start(page);
  await page.getByRole('button', { name: 'Jugar: Contar objetos', exact: true }).click();
  const begin = await page.evaluate(() => performance.now());
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  const q = createLearningQuestion('count', 1, 0);
  await page.getByRole('button', { name: 'Necesito una pista', exact: true }).click();
  await page.locator('.np-learning-choices>button').nth(q.options.findIndex(o => o.id === q.answer)).click();
  await page.getByRole('button', { name: 'Pausar y volver', exact: true }).click();
  const wall = (await page.evaluate(() => performance.now()) - begin) / 1000;
  await expect.poll(async () => (await profile(page)).activitySessions?.length).toBe(1);
  const session = (await profile(page)).activitySessions[0];
  expect(session).toMatchObject({ status: 'paused', independentCorrect: 0, roundsCompleted: 1, attempts: 1 });
  expect(session.activeSeconds).toBeLessThan(wall - 1.2);
  expect(session.firstResponseSeconds).toHaveLength(1);
});
