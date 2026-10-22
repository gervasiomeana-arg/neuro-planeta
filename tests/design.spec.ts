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

test('navegación de escritorio usa las actividades reales y conserva el perfil', async ({ page }, testInfo) => {
  await page.setViewportSize({width:1280,height:900});
  await page.goto('/');
  await page.getByRole('button', {name:/Tablet Vista amplia/}).click();
  await page.getByRole('button', {name:/Prueba de diseño/}).click();
  const sidebar=page.getByRole('complementary',{name:'Mi espacio'});
  await expect(sidebar).toBeVisible();
  await sidebar.getByRole('button',{name:'Mis rutinas',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Mis Rutinas y Estructura',exact:true})).toBeVisible();
  await sidebar.getByRole('button',{name:'Mis historias',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Historias Sociales y Situaciones',exact:true})).toBeVisible();
  await sidebar.getByRole('button',{name:'Mi planeta',exact:true}).click();
  await page.getByRole('button',{name:'Saludar a Cosmo',exact:true}).click();
  await expect(page.getByText('¡Hola, Prueba de diseño! Soy Cosmo. Te acompaño.',{exact:true})).toBeVisible();
  const profiles=await page.evaluate(()=>JSON.parse(localStorage.getItem('np_patients')||'[]'));
  expect(profiles).toHaveLength(1);
  expect(profiles[0]).toMatchObject({id:'design_test',name:'Prueba de diseño',stars:12});
  await page.screenshot({path:testInfo.outputPath('redisenio-escritorio.png'),fullPage:true});
});
