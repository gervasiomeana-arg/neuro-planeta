import { test, expect, type Page } from '@playwright/test';
async function open(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('np_patients', JSON.stringify([{ id: 'account_test', name: 'Cuenta ficticia', avatar: '🦊', selectedAge: '6-8', stars: 8, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [], customPictogramImages: {}, customPictogramVoices: {} }]));
    localStorage.setItem('np_sensory_audio_mode', 'silent');
  });
  await page.goto('./');
  await page.getByRole('button', { name: /Cuenta ficticia/ }).click();
  await page.getByRole('button', { name: 'Abrir espacio de adultos', exact: true }).click();
  const dialog = page.locator('#adult-panel-dialog');
  const match = (await dialog.innerText()).match(/¿Cuánto es (\d+) x (\d+)/)!;
  await dialog.getByRole('spinbutton').fill(String(Number(match[1]) * Number(match[2])));
  await dialog.getByRole('button', { name: 'Abrir configuración' }).click();
  await dialog.getByText('Cuenta adulta · correo y contraseña', { exact: true }).click();
  const account = dialog.getByRole('region', { name: 'Cuenta adulta', exact: true });
  await expect(account.getByLabel('Correo del adulto', { exact: true })).toBeEnabled();
  return account;
}

test('account registration requires adult consent and a long password', async ({ page }) => {
  const account = await open(page);
  await account.getByLabel('Correo del adulto', { exact: true }).fill('adulto@example.invalid');
  await account.getByLabel('Contraseña de la cuenta', { exact: true }).fill('short');
  await expect(account.getByRole('button', { name: 'Crear cuenta adulta', exact: true })).toBeDisabled();
  await account.getByLabel('Contraseña de la cuenta', { exact: true }).fill('Clave ficticia larga 2026');
  await expect(account.getByRole('button', { name: 'Crear cuenta adulta', exact: true })).toBeDisabled();
  await account.getByRole('checkbox').check();
  await expect(account.getByRole('button', { name: 'Crear cuenta adulta', exact: true })).toBeEnabled();
  await expect(account).toContainText('no se vinculan automáticamente');
});

test('failed login clears password, preserves child data, and sends only account fields', async ({ page }) => {
  let submitted: any;
  let release!: () => void;
  const responseGate = new Promise<void>(resolve => { release = resolve; });
  await page.route('https://identitytoolkit.googleapis.com/**', async route => {
    if (route.request().url().includes('accounts:signInWithPassword')) {
      submitted = route.request().postDataJSON();
      await responseGate;
      return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { code: 400, message: 'INVALID_LOGIN_CREDENTIALS' } }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ recaptchaEnforcementState: [] }) });
  });
  const account = await open(page);
  const before = await page.evaluate(() => localStorage.getItem('np_patients'));
  await account.getByLabel('Correo del adulto', { exact: true }).fill('adulto@example.invalid');
  await account.getByLabel('Contraseña de la cuenta', { exact: true }).fill('Clave ficticia larga 2026');
  await account.getByRole('button', { name: 'Ingresar a mi cuenta', exact: true }).click();
  await expect.poll(() => Boolean(submitted)).toBe(true);
  await expect(account.getByLabel('Contraseña de la cuenta', { exact: true })).toHaveValue('');
  release();
  await expect(account.getByRole('status')).toContainText('No se pudo completar la solicitud');
  await expect(account.getByLabel('Contraseña de la cuenta', { exact: true })).toHaveValue('');
  expect(submitted.email).toBe('adulto@example.invalid');
  expect(JSON.stringify(submitted)).not.toMatch(/Cuenta ficticia|account_test|stars|emotionJournal/);
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(before);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('Clave ficticia larga 2026');
});


test('unknown and existing recovery emails receive the same message without sending child data', async ({ page }) => {
  const requests: any[] = [];
  let missing = true;
  await page.route('https://identitytoolkit.googleapis.com/**', async route => {
    if (route.request().url().includes('accounts:sendOobCode')) {
      requests.push(route.request().postDataJSON());
      return route.fulfill({ status: missing ? 400 : 200, contentType: 'application/json', body: JSON.stringify(missing ? { error: { code: 400, message: 'EMAIL_NOT_FOUND' } } : { email: 'adulto@example.invalid' }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ recaptchaEnforcementState: [] }) });
  });
  const account = await open(page);
  await account.getByLabel('Correo del adulto', { exact: true }).fill('adulto@example.invalid');
  await account.getByRole('button', { name: 'Olvidé mi contraseña', exact: true }).click();
  const neutral = 'Si el correo corresponde a una cuenta, recibirás las instrucciones para recuperar el acceso.';
  await expect(account.getByRole('status')).toHaveText(neutral);
  missing = false;
  await account.getByRole('button', { name: 'Olvidé mi contraseña', exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  await expect(account.getByRole('status')).toHaveText(neutral);
  expect(JSON.stringify(requests)).not.toMatch(/Cuenta ficticia|account_test|stars|emotionJournal/);
});

test('adult session signs out after inactivity while preserving local child profiles', async ({ page }) => {
  const clockStart = new Date(new Date().setUTCHours(12, 0, 0, 0));
  await page.clock.install({ time: clockStart });
  const payload = Buffer.from(JSON.stringify({ sub: 'idle_adult', user_id: 'idle_adult', auth_time: Math.floor(clockStart.getTime() / 1000), iat: Math.floor(clockStart.getTime() / 1000), exp: Math.floor(clockStart.getTime() / 1000) + 3600, email: 'adulto@example.invalid', email_verified: true })).toString('base64url');
  const token = `eyJhbGciOiJub25lIn0.${payload}.simulated`;
  await page.route('https://identitytoolkit.googleapis.com/**', async route => {
    const url = route.request().url();
    if (url.includes('accounts:signInWithPassword')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ localId: 'idle_adult', email: 'adulto@example.invalid', idToken: token, refreshToken: 'simulated-only', expiresIn: '3600' }) });
    if (url.includes('accounts:lookup')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ users: [{ localId: 'idle_adult', email: 'adulto@example.invalid', emailVerified: true, providerUserInfo: [{ providerId: 'password', email: 'adulto@example.invalid', rawId: 'adulto@example.invalid' }] }] }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ recaptchaEnforcementState: [] }) });
  });
  await page.route('https://securetoken.googleapis.com/**', route => route.abort());
  const account = await open(page);
  const before = await page.evaluate(() => localStorage.getItem('np_patients'));
  await account.getByLabel('Correo del adulto', { exact: true }).fill('adulto@example.invalid');
  await account.getByLabel('Contraseña de la cuenta', { exact: true }).fill('Clave ficticia larga 2026');
  await account.getByRole('button', { name: 'Ingresar a mi cuenta', exact: true }).click();
  await expect(account).toContainText('Sesión iniciada:');
  await expect(account).toContainText('Correo verificado.');
  await page.clock.fastForward(15 * 60 * 1000 + 1000);
  await expect(account.getByLabel('Correo del adulto', { exact: true })).toBeVisible();
  await expect(account.getByLabel('Correo del adulto', { exact: true })).toHaveValue('');
  await expect(account.getByRole('checkbox')).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(before);
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter(key => key.startsWith('np_adult_last_activity:')))).toEqual([]);
});

test('verified adult explicitly links only a minimal profile and retries without duplicates', async ({ page }) => {
  const payload = Buffer.from(JSON.stringify({ sub: 'link_adult', user_id: 'link_adult', auth_time: Math.floor(Date.now() / 1000), iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, email: 'adulto@example.invalid', email_verified: true })).toString('base64url');
  const token = `eyJhbGciOiJub25lIn0.${payload}.simulated`;
  await page.route('https://identitytoolkit.googleapis.com/**', async route => {
    if (route.request().url().includes('accounts:signInWithPassword')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ localId: 'link_adult', email: 'adulto@example.invalid', idToken: token, refreshToken: 'simulated-only', expiresIn: '3600' }) });
    if (route.request().url().includes('accounts:lookup')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ users: [{ localId: 'link_adult', email: 'adulto@example.invalid', emailVerified: true }] }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ recaptchaEnforcementState: [] }) });
  });
  await page.route('https://securetoken.googleapis.com/**', route => route.abort());
  const writes: any[] = [], cloud = new Map<string, any>();
  let reads = 0, commits = 0, pauseReads = false;
  let resumeRead!: () => void;
  const pendingRead = new Promise<void>(resolve => { resumeRead = resolve; });
  await page.route('https://firestore.googleapis.com/**', async route => {
    const url = route.request().url(), body = route.request().postDataJSON();
    const now = '2026-10-22T12:00:00.000000Z';
    if (url.includes(':batchGet')) {
      reads++;
      if (pauseReads) await pendingRead;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body.documents.map((name: string) => cloud.has(name) ? { found: cloud.get(name), readTime: now } : { missing: name, readTime: now })) });
    }
    if (url.includes(':commit')) {
      commits++;
      for (const write of body.writes || []) if (write.update) {
        writes.push(write.update);
        cloud.set(write.update.name, { ...write.update, createTime: now, updateTime: now });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ commitTime: now, writeResults: (body.writes || []).map(() => ({ updateTime: now })) }) });
    }
    return route.abort();
  });
  const account = await open(page);
  const before = await page.evaluate(() => localStorage.getItem('np_patients'));
  await account.getByLabel('Correo del adulto', { exact: true }).fill('adulto@example.invalid');
  await account.getByLabel('Contraseña de la cuenta', { exact: true }).fill('Clave ficticia larga 2026');
  await account.getByRole('button', { name: 'Ingresar a mi cuenta', exact: true }).click();
  const link = account.getByRole('region', { name: 'Vincular perfil a mi familia', exact: true });
  await expect(link).toBeVisible();
  expect(reads).toBe(0); expect(writes).toHaveLength(0);
  await link.getByRole('textbox').fill('Astro');
  await expect(link.getByRole('button')).toBeDisabled();
  await link.getByRole('checkbox').check();
  await link.getByRole('button').click();
  await expect(link.getByRole('status')).toContainText('Ficha mínima vinculada');
  expect(writes.filter(write => write.name.includes('/families/'))).toHaveLength(2);
  const child = writes.find(write => write.name.includes('/profiles/'));
  expect(child.name).toMatch(/\/families\/link_adult\/profiles\/[a-f0-9]{64}$/);
  expect(Object.keys(child.fields).sort()).toEqual(['ageRange', 'nickname', 'ownerUid', 'schemaVersion']);
  expect(JSON.stringify(writes)).not.toMatch(/Cuenta ficticia|account_test|stars|emotionJournal/);
  await link.getByRole('checkbox').check(); await link.getByRole('button').click();
  await expect(link.getByRole('status')).toContainText('ya estaba vinculada');
  expect(writes.filter(write => write.name.includes('/families/'))).toHaveLength(2);
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(before);
  const vault = account.getByRole('region', { name: 'Copia privada por cuenta', exact: true });
  await expect(vault).toBeVisible();
  const privatePassword = 'Contraseña privada ficticia 2026';
  await vault.getByLabel('Contraseña de la copia privada', { exact: true }).fill(privatePassword);
  await vault.getByLabel('Repetir contraseña de la copia privada', { exact: true }).fill(privatePassword);
  await vault.getByRole('checkbox').check();
  await vault.getByRole('button', { name: 'Guardar perfil en copia privada', exact: true }).click();
  await expect(vault.getByRole('status')).toContainText('guardada y comprobada');
  const encrypted = await page.evaluate(() => localStorage.getItem('np_family_vault:v1:link_adult'));
  expect(encrypted).toBeTruthy();
  expect(encrypted).not.toMatch(/Cuenta ficticia|account_test|emotionJournal/);
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(before);
  await expect(vault.getByLabel('Contraseña de la copia privada', { exact: true })).toHaveValue('');
  await vault.getByRole('button', { name: 'Cerrar copia privada', exact: true }).click();
  await expect(vault.getByLabel('Contenido de copia privada', { exact: true })).toHaveCount(0);
  await vault.getByLabel('Contraseña de la copia privada', { exact: true }).fill('Contraseña incorrecta ficticia');
  await vault.getByRole('button', { name: 'Abrir copia privada', exact: true }).click();
  await expect(vault.getByRole('status')).toContainText('No se pudo confirmar');
  await expect(vault.getByLabel('Contenido de copia privada', { exact: true })).toHaveCount(0);
  await vault.getByLabel('Contraseña de la copia privada', { exact: true }).fill(privatePassword);
  await vault.getByRole('button', { name: 'Abrir copia privada', exact: true }).click();
  await expect(vault.getByLabel('Contenido de copia privada', { exact: true })).toContainText('Cuenta ficticia');

  await account.getByRole('button', { name: 'Administración', exact: true }).click();
  const admin = page.getByRole('dialog', { name: 'Administración', exact: true });
  await admin.getByLabel('Clave de administración', { exact: true }).fill('CAR123');
  await admin.getByRole('button', { name: 'Ingresar a administración', exact: true }).click();
  await expect(admin.getByRole('status')).toContainText('Clave o permisos');
  await expect(admin.getByRole('tabpanel')).toHaveCount(0);
  const roleName = 'projects/neuroplaneta-bdaf9/databases/(default)/documents/admins/link_adult';
  cloud.set(roleName, { name: roleName, fields: { active: { booleanValue: true } }, createTime: '2026-10-22T12:00:00Z', updateTime: '2026-10-22T12:00:00Z' });
  await admin.getByLabel('Clave de administración', { exact: true }).fill('CAR123');
  await admin.getByRole('button', { name: 'Ingresar a administración', exact: true }).click();
  await admin.getByRole('tab', { name: 'Suscripción mensual', exact: true }).click();
  const pricing = admin.getByRole('region', { name: 'Suscripción mensual', exact: true });
  await pricing.getByRole('button', { name: 'Consultar valor vigente', exact: true }).click();
  await expect(pricing.getByLabel('Importe mensual en pesos', { exact: true })).toBeEnabled();
  await pricing.getByLabel('Importe mensual en pesos', { exact: true }).fill('15000,50');
  await pricing.getByRole('button', { name: 'Guardar valor mensual', exact: true }).click();
  await expect(pricing.getByRole('status')).toContainText('Valor mensual guardado');
  const monthly = writes.find(write => write.name.endsWith('/billingConfig/monthly'));
  expect(Number(monthly.fields.amountCents.integerValue)).toBe(1500050);
  expect(monthly.fields.currency.stringValue).toBe('ARS');
  await admin.getByRole('button', { name: 'Volver a la app', exact: true }).click();

  // Delay a new transaction response until after logout: it must not commit,
  // even a verification-only commit, or revive the old account's UI.
  pauseReads = true;
  const readsBeforeLogout = reads, commitsBeforeLogout = commits;
  await link.getByRole('checkbox').check();
  await link.getByRole('button').click();
  await expect.poll(() => reads).toBeGreaterThan(readsBeforeLogout);
  await account.getByRole('button', { name: 'Cerrar sesión adulta', exact: true }).click();
  await expect(account.getByRole('region', { name: 'Vincular perfil a mi familia', exact: true })).toHaveCount(0);
  const lateResponse = page.waitForResponse(response => response.url().includes('firestore.googleapis.com') && response.url().includes(':batchGet'));
  resumeRead();
  await lateResponse;
  await page.waitForLoadState('networkidle');
  expect(commits).toBe(commitsBeforeLogout);
  expect(writes.filter(write => write.name.includes('/families/'))).toHaveLength(2);
  await expect(account.getByLabel('Correo del adulto', { exact: true })).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(before);
});


test('Google sign-in requires adult consent without sending child data', async ({ page }) => {
  const account = await open(page);
  const google = account.getByRole('button', { name: 'Continuar con Google', exact: true });
  await expect(google).toBeDisabled();
  await account.getByRole('checkbox').check();
  await expect(google).toBeEnabled();
  await account.getByRole('checkbox').uncheck();
  await expect(google).toBeDisabled();
});
