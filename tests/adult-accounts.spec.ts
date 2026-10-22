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
  await expect(account).toContainText('todavía no están vinculados');
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
  await page.clock.install();
  const payload = Buffer.from(JSON.stringify({ sub: 'idle_adult', user_id: 'idle_adult', auth_time: Math.floor(Date.now() / 1000), iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, email: 'adulto@example.invalid', email_verified: true })).toString('base64url');
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
