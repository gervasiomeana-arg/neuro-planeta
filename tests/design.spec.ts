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

const modules = [['Emociones','Emociones y Regulación'],['Atención','Atención Cósmica'],['Zona Calma','Zona Calma'],['Sensorial','Regulación Sensorial'],['Comunicar','Tablero de Comunicación (SACS)'],['Social','Historias Sociales y Situaciones'],['Rutinas','Mis Rutinas y Estructura']] as const;

for (const width of [360,1280]) {
  test(`actividades legibles y sin desbordes a ${width}px`, async ({page},info) => {
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    await page.getByRole('button',{name:/Prueba de diseño/}).click();
    const errors:string[]=[];
    page.on('pageerror',error=>errors.push(error.message));
    for(const [name,title] of modules) {
      await page.getByRole('navigation').getByRole('button',{name:/Inicio/}).click();
      await page.locator('main').getByRole('button',{name:new RegExp(name)}).first().click();
      const activity=page.locator('.np-module-view');
      await expect(activity.getByRole('heading',{name:title,exact:true})).toBeVisible();
      await expect(activity.getByRole('button',{name:'Volver al inicio',exact:true})).toBeEnabled();
      await expect(activity.locator('.np-activity-header')).toBeInViewport();
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

for(const width of [360,1280]) {
  test(`panel adulto navegable y sin desbordes a ${width}px`,async({page},info)=>{
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    await page.getByRole('button',{name:/Prueba de diseño/}).click();
    const opener=page.getByRole('button',{name:'Abrir espacio de adultos',exact:true});
    await opener.click();
    const dialog=page.getByRole('dialog',{name:'Panel de adultos',exact:true});
    await expect(dialog).toBeVisible();
    const challenge=(await dialog.innerText()).match(/¿Cuánto es (\d+) x (\d+)/);
    expect(challenge).not.toBeNull();
    await dialog.getByRole('spinbutton').fill(String(Number(challenge![1])*Number(challenge![2])));
    await dialog.getByRole('button',{name:'Abrir configuración',exact:true}).click();
    const sections=[['pacientes','Perfiles'],['rutinas','Rutinas'],['recompensas','Premios Reales'],['historias','Historias'],['pictogramas','Pictogramas'],['sonido','Audio Sensorial'],['reportes','Resumen']];
    const accessibility:Record<string,unknown>={};
    for(const [id,label] of sections){
      if(width<900)await dialog.getByLabel('Sección del panel',{exact:true}).selectOption(id);
      else await dialog.getByRole('navigation',{name:'Secciones del panel de adultos'}).getByRole('button',{name:new RegExp(label)}).click();
      const viewport=dialog.locator('#adult-panel-scroll');
      await expect(viewport).toHaveAttribute('data-section',id);
      const geometry=await viewport.evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth,top:el.scrollTop}));
      expect(geometry.scroll).toBeLessThanOrEqual(geometry.client+1);
      expect(geometry.top).toBe(0);
      await page.screenshot({path:info.outputPath(`adultos-${id}-${width}.png`),fullPage:true});
      const audit=await new AxeBuilder({page}).include('#adult-panel-dialog').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      accessibility[id]=audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
    }
    await info.attach('accesibilidad-adultos.json',{body:JSON.stringify(accessibility,null,2),contentType:'application/json'});
    console.log(`ACCESIBILIDAD_ADULTOS_${width}`,JSON.stringify(accessibility));
    await dialog.getByRole('button',{name:'Cerrar panel de adultos',exact:true}).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('button',{name:'Cerrar panel',exact:true})).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button',{name:'Cerrar panel de adultos',exact:true})).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    const profiles=await page.evaluate(()=>JSON.parse(localStorage.getItem('np_patients')||'[]'));
    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toMatchObject({id:'design_test',name:'Prueba de diseño',stars:12});
  });
}
