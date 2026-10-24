import { test, expect } from '@playwright/test';
import { encryptBackup } from '../src/data/backups';
import { accountProfileKey } from '../src/data/accountProfileStorage';
const published = Boolean(process.env.PLAYWRIGHT_BASE_URL);
test('mandatory Google entry hides local profiles until authentication', async ({ page }) => {
  if (!published) await page.route('**/access-policy.json', route => route.fulfill({ json: { requireGoogle: true } }));
  await page.addInitScript(() => {
    localStorage.setItem('np_patients', JSON.stringify([{ id: 'private_gate', name: 'Perfil reservado ficticio', avatar: '🦊', selectedAge: '6-8', stars: 8, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [], customPictogramImages: {}, customPictogramVoices: {} }]));
  });
  await page.goto('./');
  const before = await page.evaluate(() => localStorage.getItem('np_patients'));
  const entry = page.getByRole('region', { name: 'Ingreso con Google', exact: true });
  await expect(entry).toBeVisible();
  await expect(page.getByRole('button', { name: /Perfil reservado ficticio/ })).toHaveCount(0);
  await expect(entry.getByRole('button', { name: 'Continuar con Google', exact: true })).toBeDisabled();
  await entry.getByRole('checkbox').check();
  await expect(entry.getByRole('button', { name: 'Continuar con Google', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Administración', exact: true }).click();
  const admin = page.getByRole('dialog', { name: 'Administración', exact: true });
  await expect(admin.getByRole('region', { name: 'Ingreso con Google', exact: true })).toBeVisible();
  await expect(admin.getByLabel('Clave de administración', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(before);
});
test('missing access policy fails closed without changing stored profiles', async ({ page }) => {
  test.skip(published, 'Fault injection only in the isolated candidate.');
  await page.route('**/access-policy.json', route => route.abort());
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('No se pudo verificar la política');
  await expect(page.getByRole('button', { name: 'Continuar con Google', exact: true })).toBeDisabled();
  await expect(page.locator('#neuroplaneta-onboarding-wrapper')).toHaveCount(0);
});

test('simulated Google session still needs the device password and sign-out hides protected profiles', async ({ page }) => {
  test.skip(published, 'Only fictional accounts and mocked Auth in the isolated candidate.');
  test.setTimeout(45000);
  let required = false;
  await page.route('**/access-policy.json', route => route.fulfill({ json: { requireGoogle: required } }));
  const profile = { id: 'gate_cipher', name: 'Cifrado ficticio Google', avatar: '🦊', selectedAge: '6-8', stars: 8, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [], customPictogramImages: {}, customPictogramVoices: {} };
  const password = 'Protección de prueba Google 2026';
  const encrypted = await encryptBackup([profile], password);
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: 'google_mock', user_id: 'google_mock', auth_time: now, iat: now, exp: now + 3600, email: 'google@example.invalid', email_verified: true, firebase: { sign_in_provider: 'google.com' } };
  const token = `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.simulated`;
  // A mocked token response exercises the SDK/session gate without contacting Google.
  await page.route('https://identitytoolkit.googleapis.com/**', route => {
    if (route.request().url().includes('accounts:signInWithPassword')) return route.fulfill({ json: { localId: 'google_mock', email: 'google@example.invalid', idToken: token, refreshToken: 'mock-only', expiresIn: '3600' } });
    if (route.request().url().includes('accounts:lookup')) return route.fulfill({ json: { users: [{ localId: 'google_mock', email: 'google@example.invalid', emailVerified: true, providerUserInfo: [{ providerId: 'google.com', email: 'google@example.invalid', rawId: 'mock-only' }] }] } });
    return route.fulfill({ json: { recaptchaEnforcementState: [] } });
  });
  await page.route('https://securetoken.googleapis.com/**', route => route.abort());
  await page.route('https://firestore.googleapis.com/**', route => route.fulfill({ status: 403, json: { error: { code: 403, status: 'PERMISSION_DENIED', message: 'Fictional denied access history' } } }));
  await page.addInitScript(profile => {
    if (!localStorage.getItem('np_patients')) localStorage.setItem('np_patients', JSON.stringify([profile]));
    localStorage.setItem('np_sensory_audio_mode', 'silent');
  }, profile);
  await page.goto('./');
  await page.getByRole('button', { name: /Cifrado ficticio Google/ }).click();
  await page.getByRole('button', { name: 'Abrir espacio de adultos', exact: true }).click();
  const dialog = page.locator('#adult-panel-dialog');
  const match = (await dialog.innerText()).match(/¿Cuánto es (\d+) x (\d+)/)!;
  await dialog.getByRole('spinbutton').fill(String(Number(match[1]) * Number(match[2])));
  await dialog.getByRole('button', { name: 'Abrir configuración' }).click();
  await dialog.getByText('Cuenta adulta · correo y contraseña', { exact: true }).click();
  const account = dialog.getByRole('region', { name: 'Cuenta adulta', exact: true });
  await account.getByLabel('Correo del adulto', { exact: true }).fill('google@example.invalid');
  await account.getByLabel('Contraseña de la cuenta', { exact: true }).fill('Clave ficticia de simulación');
  await account.getByRole('button', { name: 'Ingresar a mi cuenta', exact: true }).click();
  await expect(account).toContainText('Sesión iniciada:');
  required = true;
  const source = await page.evaluate(() => localStorage.getItem('np_patients'));
  const scopedKey = accountProfileKey('google_mock');
  await page.evaluate(({ encrypted, scopedKey }) => localStorage.setItem(scopedKey, encrypted), { encrypted, scopedKey });
  await page.reload();
  const locked = page.getByRole('region', { name: 'Desbloquear perfiles protegidos', exact: true });
  await expect(locked).toBeVisible();
  await expect(page.getByRole('button', { name: /Cifrado ficticio Google/ })).toHaveCount(0);
  expect(await page.evaluate(scopedKey => localStorage.getItem(scopedKey), scopedKey)).toBe(encrypted);
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(source);
  await locked.getByLabel('Contraseña de protección', { exact: true }).fill(password);
  await locked.getByRole('button', { name: 'Desbloquear perfiles', exact: true }).click();
  await expect(page.getByRole('button', { name: /Cifrado ficticio Google/ })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Guardado protegido' })).toHaveText('Guardado cifrado completo.');
  await page.getByRole('button', { name: 'Cerrar sesión Google', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Ingreso con Google', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Cifrado ficticio Google/ })).toHaveCount(0);
  expect(await page.evaluate(scopedKey => localStorage.getItem(scopedKey), scopedKey)).not.toContain(profile.name);
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(source);
});
