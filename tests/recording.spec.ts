import { test, expect, type Page } from '@playwright/test';

async function open(page: Page, deferred = false, constructorError = false) {
  await page.addInitScript(({ deferred, constructorError }) => {
    localStorage.setItem('np_patients', JSON.stringify([{ id: 'voice_test', name: 'Voz ficticia', avatar: '🦊', selectedAge: '6-8', stars: 0, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [], customPictogramImages: {}, customPictogramVoices: {} }]));
    localStorage.setItem('np_sensory_audio_mode', 'silent');
    const qa: any = (window as any).voiceQA = { stops: 0, bytes: 16, recorder: null, grant: null };
    const stream = { getTracks: () => [{ stop: () => qa.stops++ }] };
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: () => deferred ? new Promise(resolve => { qa.grant = () => resolve(stream); }) : Promise.resolve(stream) } });
    (window as any).MediaRecorder = class {
      state = 'inactive'; mimeType = 'audio/ogg'; ondataavailable: any; onstop: any; onerror: any;
      constructor() { if (constructorError) throw new Error('Unsupported'); qa.recorder = this; }
      start() { this.state = 'recording'; }
      stop() {
        this.state = 'inactive';
        setTimeout(() => { this.ondataavailable?.({ data: new Blob(['x'.repeat(qa.bytes)], { type: 'audio/ogg' }) }); this.onstop?.(); }, 0);
      }
    };
  }, { deferred, constructorError });
  await page.goto('./');
  await page.getByRole('button', { name: /Voz ficticia/ }).click();
  await page.getByRole('button', { name: 'Abrir espacio de adultos', exact: true }).click();
  const dialog = page.locator('#adult-panel-dialog');
  const match = (await dialog.innerText()).match(/¿Cuánto es (\d+) x (\d+)/)!;
  await dialog.getByRole('spinbutton').fill(String(Number(match[1]) * Number(match[2])));
  await dialog.getByRole('button', { name: 'Abrir configuración' }).click();
  await dialog.getByRole('button', { name: /Pictogramas/ }).first().click();
}
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]')[0].customPictogramVoices);

test('voice saves to the original pictogram with the recorder MIME and releases microphone', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Grabar Voz Familiar/ }).click();
  await page.getByRole('button', { name: /Detener Grabación/ }).click();
  await expect.poll(() => saved(page)).toHaveProperty('tengo_hambre');
  expect((await saved(page)).tengo_hambre).toMatch(/^data:audio\/ogg;base64,/);
  expect(await page.evaluate(() => (window as any).voiceQA.stops)).toBeGreaterThan(0);
});

test('closing panel while microphone permission is pending discards late stream without saving', async ({ page }) => {
  await open(page, true);
  await page.getByRole('button', { name: /Grabar Voz Familiar/ }).click();
  await page.getByRole('button', { name: 'Cerrar panel de adultos', exact: true }).click();
  await page.evaluate(() => (window as any).voiceQA.grant());
  await expect.poll(() => page.evaluate(() => (window as any).voiceQA.stops)).toBeGreaterThan(0);
  expect(await saved(page)).toEqual({});
  expect(await page.evaluate(() => (window as any).voiceQA.recorder)).toBeNull();
});

test('leaving pictograms stops recording and discards delayed events', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Grabar Voz Familiar/ }).click();
  await page.locator('#adult-panel-dialog').getByRole('button', { name: /Rutinas/ }).first().click();
  await expect.poll(() => page.evaluate(() => (window as any).voiceQA.stops)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => (window as any).voiceQA.recorder.state)).toBe('inactive');
  expect(await saved(page)).toEqual({});
});

test('constructor failure releases microphone and reports error without changing saved voices', async ({ page }) => {
  await open(page, false, true);
  await page.getByRole('button', { name: /Grabar Voz Familiar/ }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudo acceder al micrófono');
  expect(await page.evaluate(() => (window as any).voiceQA.stops)).toBeGreaterThan(0);
  expect(await saved(page)).toEqual({});
});

test('oversized audio is refused and previous data is preserved', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { (window as any).voiceQA.bytes = 2_000_001; });
  await page.getByRole('button', { name: /Grabar Voz Familiar/ }).click();
  await page.getByRole('button', { name: /Detener Grabación/ }).click();
  await expect(page.getByRole('alert')).toContainText('límite de tamaño');
  expect(await saved(page)).toEqual({});
});

test('recording stops automatically at thirty seconds', async ({ page }) => {
  await open(page);
  await page.clock.install();
  await page.getByRole('button', { name: /Grabar Voz Familiar/ }).click();
  await page.clock.fastForward(30_100);
  await expect.poll(() => page.evaluate(() => (window as any).voiceQA.recorder.state)).toBe('inactive');
  expect(await page.evaluate(() => (window as any).voiceQA.stops)).toBeGreaterThan(0);
});

test('changing pictogram cancels the recording rather than attaching it to another choice', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Grabar Voz Familiar/ }).click();
  await page.locator('#adult-panel-dialog').getByRole('button', { name: /Tengo Sed/ }).click();
  await expect.poll(() => page.evaluate(() => (window as any).voiceQA.stops)).toBeGreaterThan(0);
  expect(await saved(page)).toEqual({});
});
