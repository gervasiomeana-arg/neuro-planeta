import { POLICY_VERSION } from '../commercial/policy';
import { test, expect, type Page } from '@playwright/test';
import { accountProfileKey } from '../src/data/accountProfileStorage';
import { decryptBackup } from '../src/data/backups';

const apiKey = 'AIzaSyAjnF0-SAQIpmPTgidYY11fjNHrOHkjdpk';
const authKey = `firebase:authUser:${apiKey}:neuroplaneta-adults`;
function fictionalUser(uid: string) {
  const now = Math.floor(Date.now() / 1000), email = `${uid}@example.invalid`;
  const token = `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({ sub: uid, user_id: uid, email, email_verified: true, auth_time: now, iat: now, exp: now + 3600, firebase: { sign_in_provider: 'google.com' } })).toString('base64url')}.simulated`;
  return { uid, email, emailVerified: true, isAnonymous: false, providerData: [{ providerId: 'google.com', uid, email }], stsTokenManager: { accessToken: token, refreshToken: 'fictional-only', expirationTime: Date.now() + 3600000 }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: 'neuroplaneta-adults' };
}
async function account(page: Page, uid: string) {
  await page.evaluate(({ authKey, user, version }) => { sessionStorage.setItem(authKey, JSON.stringify(user)); localStorage.setItem(`np_privacy_consent:${user.uid}:${version}`, JSON.stringify({ version, acceptedAt: new Date().toISOString() })); }, { authKey, user: fictionalUser(uid), version: POLICY_VERSION });
  await page.reload();
}
async function createSpace(page: Page, password: string) {
  const setup = page.getByRole('region', { name: 'Crear espacio de perfiles', exact: true });
  await expect(setup).toBeVisible();
  await setup.getByLabel('Nueva contraseña de perfiles', { exact: true }).fill(password);
  await setup.getByLabel('Repetir contraseña de perfiles', { exact: true }).fill(password);
  await setup.getByRole('button', { name: 'Crear mi espacio protegido', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Configurar primer perfil', exact: true })).toBeVisible();
}
async function addProfile(page: Page, name: string) {
  await page.getByRole('button', { name: 'Configurar primer perfil', exact: true }).click();
  await page.getByRole('textbox', { name: 'Escribe el nombre aquí...', exact: true }).fill(name);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: '¡Iniciar Aventura Estelar! 🚀', exact: true }).click();
  await expect(page.getByRole('heading', { name: `Hola, ${name}!`, exact: true })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Guardado protegido', exact: true })).toHaveText('Guardado cifrado completo.');
}
test('two fictional Google accounts keep encrypted profiles separate and never claim legacy data', async ({ page }) => {
  test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'Fictional identities only in the isolated candidate.');
  test.setTimeout(60000);
  let uid = 'account-a';
  await page.route('**/access-policy.json', route => route.fulfill({ json: { requireGoogle: true } }));
  await page.route('https://identitytoolkit.googleapis.com/**', route => route.fulfill({ json: { users: [{ localId: uid, email: `${uid}@example.invalid`, emailVerified: true, providerUserInfo: [{ providerId: 'google.com', email: `${uid}@example.invalid`, rawId: uid }] }] } }));
  await page.route('https://securetoken.googleapis.com/**', route => route.abort());
  await page.route('https://firestore.googleapis.com/**', route => route.fulfill({ status: 403, json: { error: { code: 403, status: 'PERMISSION_DENIED', message: 'Fictional network only' } } }));
  await page.goto('./');
  const legacy = JSON.stringify([{ id: 'legacy', name: 'Anterior sin asignar', avatar: '🦊', selectedAge: '6-8', stars: 17, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [], customPictogramImages: {}, customPictogramVoices: {} }]);
  await page.evaluate(legacy => { localStorage.setItem('np_patients', legacy); localStorage.setItem('np_sensory_audio_mode', 'silent'); }, legacy);
  await account(page, uid);
  await expect(page.getByRole('button', { name: /Anterior sin asignar/ })).toHaveCount(0);
  const passA = 'Contraseña ficticia cuenta A 2026', passB = 'Contraseña ficticia cuenta B 2026';
  await createSpace(page, passA); await addProfile(page, 'Familia A ficticia');
  const keyA = accountProfileKey(uid);
  const savedA = (await page.evaluate(key => localStorage.getItem(key), keyA))!;
  expect(savedA).not.toContain('Familia A ficticia');
  expect((await decryptBackup(savedA, passA))[0].name).toBe('Familia A ficticia');
  uid = 'account-b'; await account(page, uid);
  await expect(page.getByRole('heading', { name: /Familia A ficticia/ })).toHaveCount(0);
  await createSpace(page, passB); await addProfile(page, 'Familia B ficticia');
  const keyB = accountProfileKey(uid), savedB = (await page.evaluate(key => localStorage.getItem(key), keyB))!;
  expect(await page.evaluate(key => localStorage.getItem(key), keyA)).toBe(savedA);
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(legacy);
  uid = 'account-a'; await account(page, uid);
  const locked = page.getByRole('region', { name: 'Desbloquear perfiles protegidos', exact: true });
  await locked.getByLabel('Contraseña de protección', { exact: true }).fill(passB);
  await locked.getByRole('button', { name: 'Desbloquear perfiles', exact: true }).click();
  await expect(locked.getByRole('status')).toContainText('Contraseña incorrecta');
  await locked.getByLabel('Contraseña de protección', { exact: true }).fill(passA);
  await locked.getByRole('button', { name: 'Desbloquear perfiles', exact: true }).click();
  await expect(page.getByRole('button', { name: /Familia A ficticia/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Familia B ficticia/ })).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), keyB)).toBe(savedB);
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(legacy);
});
