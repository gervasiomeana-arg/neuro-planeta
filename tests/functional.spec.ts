import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const profileName = 'Control ficticio';
const modules = [
  ['Emociones', 'Emociones y Regulación'], ['Atención', 'Atención Cósmica'],
  ['Zona Calma', 'Zona Calma'], ['Sensorial', 'Regulación Sensorial'],
  ['Comunicar', 'Tablero de Comunicación (SACS)'], ['Social', 'Historias Sociales y Situaciones'],
  ['Rutinas', 'Mis Rutinas y Estructura'],
] as const;

async function portal(page: Page, name = profileName) {
  await page.getByRole('button', { name: new RegExp(name) }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
}
async function enter(page: Page, name: string) {
  await page.getByRole('navigation').getByRole('button', { name: /Inicio/ }).click();
  await page.locator('main').getByRole('button', { name: new RegExp(name) }).first().click();
}
async function readProfile(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('np_patients') || '[]').find((p: any) => p.id === 'audit_a'));
}
async function adults(page: Page) {
  await page.getByRole('navigation').getByRole('button', { name: /Inicio/ }).click();
  const shortcut = page.getByRole('button', { name: 'Abrir espacio de adultos', exact: true });
  if (await shortcut.count()) await shortcut.click();
  else await page.getByRole('button', { name: /Modo Padres/ }).click();
  const dialog = page.locator('#adult-panel-dialog');
  const text = await dialog.innerText();
  const challenge = text.match(/¿Cuánto es (\d+) x (\d+)/);
  if (challenge) {
    await dialog.getByRole('spinbutton').fill(String(Number(challenge[1]) * Number(challenge[2])));
    await dialog.getByRole('button', { name: 'Abrir configuración' }).click();
  }
  return dialog;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('np_audit_seed')) return;
    const tasks = { Mañana: [], Tarde: [], Noche: [] } as Record<string, any[]>;
    for (const tab of Object.keys(tasks)) tasks[tab] = [{ id: `audit_${tab}`, name: 'Preparar mochila de prueba', emoji: '🎒', steps: ['Buscar mochila', 'Guardar cuaderno', 'Cerrar mochila'] }];
    const base = { avatar: '🦊', selectedAge: '6-8', stars: 12, unlockedAchievements: [], completedRoutineTasks: [],
      completedMicroSteps: {}, rewardedRoutineTasks: [], routineTasks: tasks, emotionJournal: [],
      customPictogramImages: {}, customPictogramVoices: {}, socialStories: [],
      rewardsStore: [{ id: 'audit_reward', name: 'Cuento de prueba', emoji: '📖', cost: 10, redeemedCount: 0 }], redeemedRewards: [] };
    localStorage.setItem('np_patients', JSON.stringify([{ ...base, id: 'audit_a', name: 'Control ficticio' }, { ...base, id: 'audit_b', name: 'Segundo ficticio' }]));
    localStorage.setItem('np_active_patient_id', 'audit_a');
    localStorage.setItem('np_sensory_audio_mode', 'silent');
    localStorage.setItem('np_audit_seed', '1');
  });
  await page.goto('./');
  await portal(page);
});

test('los siete módulos abren, vuelven al inicio y no arrojan errores de ejecución', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const [name, heading] of modules) await test.step(name, async () => {
    await enter(page, name);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  });
  expect(errors).toEqual([]);
});

test('números: error recuperable, cinco aciertos y reinicio', async ({ page }) => {
  await enter(page, 'Atención');
  await page.getByRole('button', { name: /Buscar números/ }).click();
  for (let round = 0; round < 5; round++) {
    const target = (await page.locator('main .text-4xl').first().innerText()).trim();
    if (round === 0) {
      const wrong = page.getByRole('button', { name: /^Número / }).filter({ hasNotText: new RegExp(`^${target}$`) });
      await wrong.first().click();
      await expect(page.getByRole('status')).toContainText('Probá');
    }
    await page.getByRole('button', { name: `Número ${target}`, exact: true }).click();
    await page.waitForTimeout(450);
  }
  await expect(page.getByRole('heading', { name: '¡Misión Completada!' })).toBeVisible();
  await page.getByRole('button', { name: 'Jugar de nuevo' }).click();
  await expect(page.getByRole('button', { name: /^Número / })).toHaveCount(16);
});

test('parejas: cuatro rondas, error recuperable y final', async ({ page }) => {
  await enter(page, 'Atención');
  await page.getByRole('button', { name: /Parejas de imágenes/ }).click();
  await page.getByRole('button', { name: 'Elegir gato', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Probá');
  for (const answer of ['perro', 'manzana', 'sol', 'auto']) {
    await page.getByRole('button', { name: `Elegir ${answer}`, exact: true }).click();
    await page.waitForTimeout(400);
  }
  await expect(page.getByText('Completaste las parejas de imágenes.', { exact: false })).toBeVisible();
});

test('semáforo: selección explícita, guardado, bonus diario y persistencia', async ({ page }) => {
  await enter(page, 'Emociones');
  await page.getByRole('button', { name: /Zona Roja/ }).click();
  await expect(page.getByRole('button', { name: 'Elegí una intensidad para guardar' })).toBeDisabled();
  await page.getByRole('button', { name: /Nvl 2 Bastante/ }).click();
  await page.getByRole('button', { name: /Registrar en mi Diario Emocional/ }).click();
  await expect.poll(async () => (await readProfile(page)).stars).toBe(15);
  await expect(page.getByRole('button', { name: 'Elegí una intensidad para guardar' })).toBeDisabled();
  await page.getByRole('button', { name: /Nvl 3 Mucho/ }).click();
  await page.getByRole('button', { name: /Cambio de planes/ }).click();
  await page.getByRole('button', { name: /Guardar nuevo registro/ }).click();
  await expect.poll(async () => (await readProfile(page)).emotionJournal.length).toBe(2);
  expect((await readProfile(page)).stars).toBe(15);
  await page.reload(); await portal(page);
  expect((await readProfile(page)).emotionJournal.map((e: any) => e.intensity)).toEqual([3, 2]);
});

test('respiración y SOS permiten avanzar, detener y salir', async ({ page }) => {
  await enter(page, 'Zona Calma');
  await page.getByRole('button', { name: 'Empezar la pausa' }).click();
  await expect(page.getByRole('button', { name: 'Detener la pausa' })).toBeVisible();
  await page.getByRole('button', { name: 'Detener la pausa' }).click();
  await expect(page.getByRole('button', { name: 'Empezar la pausa' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir ejercicio SOS Calma' }).click();
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Siguiente paso' }).click();
  await expect(page.getByText('Paso 3 de 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Empezar de nuevo' }).click();
  await expect(page.getByText('Paso 1 de 3', { exact: true })).toBeVisible();
});

test('sensorial responde a teclado y el sonido puede silenciarse', async ({ page }) => {
  await enter(page, 'Sensorial');
  const canvas = page.getByRole('button', { name: 'Crear un destello de color' });
  await canvas.focus(); await canvas.press('Enter');
  await expect(canvas.locator('.animate-ping')).toHaveCount(1);
  await page.getByRole('button', { name: 'Activar sonidos', exact: true }).click();
  await page.getByRole('button', { name: 'Silenciar sonidos', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Activar sonidos', exact: true })).toBeVisible();
});

test('comunicar: búsqueda, agregar palabras, quitar palabra y borrar frase', async ({ page }) => {
  await enter(page, 'Comunicar');
  const search = page.getByPlaceholder(/Buscar pictograma/);
  await search.fill('agua');
  const pic = page.locator('main button').filter({ hasText: /Tengo Sed/i }).last();
  await pic.click(); await search.fill('');
  await expect(page.getByRole('button', { name: 'Borrar', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Sonido desactivado/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Borrar', exact: true }).click();
  await expect(page.getByText('Tu frase aparecerá aquí...')).toBeVisible();
});

test('rutina: micro-pasos sobreviven recarga y están aislados por perfil', async ({ page }) => {
  await enter(page, 'Rutinas');
  await page.getByRole('button', { name: 'Ver micro-pasos de Preparar mochila de prueba' }).click();
  await page.getByRole('button', { name: /Buscar mochila/ }).click();
  await expect.poll(async () => Object.values((await readProfile(page)).completedMicroSteps).flat().length).toBe(1);
  await page.reload(); await portal(page); await enter(page, 'Rutinas');
  await expect(page.getByText('1 de 3 pasos', { exact: true })).toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: /Salir/ }).click();
  await portal(page, 'Segundo ficticio'); await enter(page, 'Rutinas');
  await expect(page.getByText('0 de 3 pasos', { exact: true })).toBeVisible();
});

test('temporizador permite pausar, reanudar y cancelar', async ({ page }) => {
  await enter(page, 'Rutinas');
  await page.getByRole('button', { name: 'Iniciar temporizador para Preparar mochila de prueba' }).click();
  await page.getByRole('button', { name: /Pausar/ }).click();
  await page.getByRole('button', { name: /Reanudar/ }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Iniciar temporizador para Preparar mochila de prueba' })).toBeVisible();
});

test('completar micro-pasos termina la tarea sin duplicar estrellas al volver a marcar', async ({ page }) => {
  await enter(page, 'Rutinas');
  await page.getByRole('button', { name: 'Ver micro-pasos de Preparar mochila de prueba' }).click();
  for (const step of ['Buscar mochila', 'Guardar cuaderno', 'Cerrar mochila']) {
    await page.getByRole('button', { name: new RegExp(step) }).click();
  }
  await expect.poll(async () => (await readProfile(page)).completedRoutineTasks.length).toBe(1);
  const stars = (await readProfile(page)).stars;
  expect(stars).toBe(27);
  const task = page.locator('main').getByRole('button', { name: /Preparar mochila de prueba/ }).first();
  await task.click(); await task.click();
  expect((await readProfile(page)).stars).toBe(stars);
});

test('tienda: cancelar no descuenta, confirmación descuenta exactamente y persiste', async ({ page }) => {
  await page.getByRole('navigation').getByRole('button', { name: /Logros/ }).click();
  await page.getByRole('button', { name: /Pedir canje/ }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect((await readProfile(page)).stars).toBe(12);
  await page.getByRole('button', { name: /Pedir canje/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('spinbutton').fill('0');
  await dialog.getByRole('button', { name: 'Confirmar canje' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  expect((await readProfile(page)).stars).toBe(12);
  const q = (await dialog.innerText()).match(/¿cuánto es (\d+) × (\d+)/)!;
  await dialog.getByRole('spinbutton').fill(String(Number(q[1]) * Number(q[2])));
  await dialog.getByRole('button', { name: 'Confirmar canje' }).click();
  await expect.poll(async () => (await readProfile(page)).stars).toBe(2);
  await page.reload(); await portal(page);
  const profile = await readProfile(page);
  expect(profile.stars).toBe(2); expect(profile.redeemedRewards).toHaveLength(1);
});

test('primero/después: reiniciar el tablero no permite repetir el bonus diario', async ({ page }) => {
  await enter(page, 'Rutinas');
  await page.getByRole('button', { name: /Tablero Primero/ }).click();
  await page.getByRole('button', { name: /Terminé el PRIMERO/ }).click();
  await expect.poll(async () => (await readProfile(page)).stars).toBe(17);
  await page.getByRole('button', { name: /Reiniciar Tablero/ }).click();
  await page.getByRole('button', { name: /Terminé el PRIMERO/ }).click();
  expect((await readProfile(page)).stars).toBe(17);
});

test('caritas y diario permiten guardar una nota ficticia', async ({ page }) => {
  await enter(page, 'Emociones');
  await page.getByRole('button', { name: /Caritas y Diario/ }).click();
  await page.getByRole('button', { name: /Feliz/ }).click();
  await page.getByPlaceholder('Ej: Hoy dormí genial...').fill('Nota de prueba sin datos personales');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(async () => (await readProfile(page)).emotionJournal.some((e: any) => e.note === 'Nota de prueba sin datos personales')).toBe(true);
});

test('panel adulto: siete secciones, historia revisada, guardado y cinco pasos para el niño', async ({ page }) => {
  const dialog = await adults(page);
  for (const name of ['Perfiles', 'Rutinas', 'Premios Reales', 'Pictogramas', 'Audio Sensorial', 'Resumen', 'Historias']) {
    await dialog.getByRole('button', { name: new RegExp(name) }).first().click();
    await expect(dialog).toBeVisible();
  }
  await dialog.getByLabel('Situación para la historia').fill('El lunes empezamos una escuela nueva');
  await dialog.getByRole('button', { name: 'Crear borrador sin IA' }).click();
  await expect(dialog.getByLabel('Texto del paso 1')).toBeVisible();
  await dialog.getByLabel('Texto del paso 1').fill('Iré a una escuela nueva con alguien de confianza.');
  await dialog.getByRole('button', { name: 'Guardar para el niño' }).click();
  await expect.poll(async () => (await readProfile(page)).socialStories.length).toBe(1);
  await dialog.getByRole('button', { name: 'Cerrar panel' }).click();
  await enter(page, 'Social');
  await page.getByRole('button', { name: /Mi nueva escuela/ }).click();
  await expect(page.getByText('Iré a una escuela nueva con alguien de confianza.', { exact: true })).toBeVisible();
  for (let step = 1; step < 5; step++) await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByRole('button', { name: 'Terminar', exact: true }).click();
  await expect(page.getByRole('button', { name: /Mi nueva escuela/ })).toBeVisible();
});

test('resumen registra intensidad sin atribuir una causa que no se eligió', async ({ page }) => {
  await enter(page, 'Emociones');
  await page.getByRole('button', { name: /Zona Roja/ }).click();
  await page.getByRole('button', { name: /Nvl 2 Bastante/ }).click();
  await page.getByRole('button', { name: /Registrar en mi Diario Emocional/ }).click();
  const dialog = await adults(page);
  await dialog.getByRole('button', { name: /Resumen/ }).click();
  await expect(dialog.getByText(/nadie señaló una situación previa/)).toBeVisible();
  await expect(dialog.getByText('Nivel 2 (Medio)', { exact: true })).toBeVisible();
});

test('diagnóstico de accesibilidad de los siete módulos (informe, sin certificar conformidad)', async ({ page }, info) => {
  const results: Record<string, unknown> = {};
  for (const [name] of modules) {
    await enter(page, name);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    results[name] = result.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
  }
  await info.attach('accesibilidad-modulos.json', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  console.log('ACCESIBILIDAD_MODULOS', JSON.stringify(results));
  for (const violations of Object.values(results)) expect(violations).toEqual([]);
});

for (const width of [360,1280]) {
  test(`actividades legibles y sin desbordes a ${width}px`, async ({page},info) => {
    await page.setViewportSize({width,height:900});
    const errors:string[]=[];
    page.on('pageerror',error=>errors.push(error.message));
    for(const [name,title] of modules) {
      await enter(page,name);
      const activity=page.locator('.np-module-view');
      await expect(activity.getByRole('heading',{name:title,exact:true})).toBeVisible();
      await expect(activity.getByRole('button',{name:'Volver al inicio',exact:true})).toBeEnabled();
      const bounds=await activity.evaluate(element=>{
        const r=element.getBoundingClientRect();
        return {left:r.left,right:r.right,scroll:element.scrollWidth,client:element.clientWidth};
      });
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(width);
      expect(bounds.scroll).toBeLessThanOrEqual(bounds.client+1);
      await page.screenshot({path:info.outputPath(`actividad-${modules.findIndex(m=>m[0]===name)}-${width}.png`),fullPage:true});
    }
    expect(errors).toEqual([]);
  });
}
