import { POLICY_VERSION } from '../commercial/policy';
import { test, expect, type Page } from '@playwright/test';
import { encryptBackup, decryptBackup } from '../src/data/backups';
import { accountProfileKey } from '../src/data/accountProfileStorage';
import { LEARNING_GAMES, createLearningQuestion } from '../src/learning/curriculum';
test.describe.configure({ mode: 'parallel' });
const uid = 'mobile-protected-fictional', apiKey = 'AIzaSyAjnF0-SAQIpmPTgidYY11fjNHrOHkjdpk';
const password = 'Solo datos ficticios prueba 2026';
const profile = { id: 'mobile-protected', name: 'Celular ficticio', avatar: '🦊', selectedAge: '6-8', stars: 10, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [{ date: '2026-10-25', emotion: 'Nota', note: 'Conservar esta nota ficticia' }], customPictogramImages: {}, customPictogramVoices: {} };
async function openProtected(page: Page) {
  // Consent is covered separately; this fixture exercises encryption/game recovery.
  await page.addInitScript(({ uid, version }) => localStorage.setItem(`np_privacy_consent:${uid}:${version}`, JSON.stringify({ version, acceptedAt: new Date().toISOString() })), { uid, version: POLICY_VERSION });
  const email = `${uid}@example.invalid`, now = Math.floor(Date.now() / 1000);
  const token = `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({ sub: uid, user_id: uid, email, email_verified: true, auth_time: now, iat: now, exp: now + 3600, firebase: { sign_in_provider: 'google.com' } })).toString('base64url')}.simulated`;
  const user = { uid, email, emailVerified: true, isAnonymous: false, providerData: [{ providerId: 'google.com', uid, email }], stsTokenManager: { accessToken: token, refreshToken: 'fictional-only', expirationTime: Date.now() + 3600000 }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: 'neuroplaneta-adults' };
  await page.route('**/access-policy.json', r => r.fulfill({ json: { requireGoogle: true } }));
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.route('https://identitytoolkit.googleapis.com/**', r => r.fulfill({ json: { users: [{ localId: uid, email, emailVerified: true, providerUserInfo: [{ providerId: 'google.com', email, rawId: uid }] }] } }));
  await page.route('https://securetoken.googleapis.com/**', r => r.abort());
  await page.route('https://firestore.googleapis.com/**', r => r.fulfill({ status: 403, json: { error: { code: 403, status: 'PERMISSION_DENIED' } } }));
  await page.goto('/');
  await page.evaluate(({ authKey, user, dataKey, cipher }) => {
    sessionStorage.setItem(authKey, JSON.stringify(user)); localStorage.setItem(dataKey, cipher);
    localStorage.setItem('np_sensory_audio_mode', 'silent');
    localStorage.setItem('np_app_device_mode', innerWidth >= 600 ? 'tablet' : 'movil');
  }, { authKey: `firebase:authUser:${apiKey}:neuroplaneta-adults`, user, dataKey: accountProfileKey(uid), cipher: await encryptBackup([profile], password) });
  await page.reload();
  const locked = page.getByRole('region', { name: 'Desbloquear perfiles protegidos', exact: true });
  await locked.getByLabel('Contraseña de protección', { exact: true }).fill(password);
  await locked.getByRole('button', { name: 'Desbloquear perfiles', exact: true }).tap();
  await page.getByRole('button', { name: /Celular ficticio/ }).tap();
  await page.locator('main').getByRole('button', { name: /Aprender y jugar/ }).tap();
}
for (const device of [{ width: 360, height: 640 }, { width: 412, height: 915 }, { width: 768, height: 1024 }]) test.describe(`perfil cifrado ${device.width}`, () => {
  test.use({ viewport: device, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36' });
  for (const interrupted of [false, true]) test(`seleccionar juegos con cuenta simulada y cifrado real${interrupted ? ' sin scrollTo' : ''}`, async ({ page }, info) => {
    test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'Nunca inyectar cuentas ficticias en producción.');
    test.setTimeout(120000);
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await openProtected(page);
    if (interrupted) await page.evaluate(() => { Element.prototype.scrollTo = () => {}; });
    for (const game of LEARNING_GAMES) {
      const button = page.getByRole('button', { name: `Jugar: ${game.title}`, exact: true });
      await button.scrollIntoViewIfNeeded();
      const box = await button.boundingBox(); expect(box).not.toBeNull();
      await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
      if (game.id === 'numbers' || game.id === 'matching') {
        const choice = game.id === 'numbers' ? page.locator('.np-number-grid button').first() : page.getByRole('button', { name: /^Elegir / }).first();
        await expect(choice).toBeInViewport();
        await page.getByRole('button', { name: 'Volver al inicio', exact: true }).tap();
        await page.locator('main').getByRole('button', { name: /Aprender y jugar/ }).tap();
        await expect(page.getByRole('status', { name: 'Guardado protegido', exact: true })).toHaveText('Guardado cifrado completo.');
        continue;
      }
      await expect(page.getByRole('region', { name: `Juego: ${game.title}`, exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Pausar y volver', exact: true })).toBeInViewport();
      await expect(page.locator('.np-learning-question h4')).toBeInViewport();
      await expect(page.locator('.np-learning > h3')).toBeFocused();
      if (game.id === 'count') {
        for (let round = 0; round < 5; round++) {
          const q = createLearningQuestion('count', 1, round);
          await page.locator('.np-learning-choices > button').nth(q.options.findIndex(o => o.id === q.answer)).tap();
          await page.getByRole('button', { name: round === 4 ? 'Ver cierre de la sesión' : 'Siguiente desafío', exact: true }).tap();
        }
        await expect(page.getByRole('heading', { name: '¡Completaste cinco desafíos!' })).toBeFocused();
        await page.getByRole('button', { name: 'Elegir otro juego', exact: true }).tap();
      }
      if (game.id === 'hygiene') await page.screenshot({ path: info.outputPath(`protected-${device.width}.png`) });
      if (game.id !== 'count') await page.getByRole('button', { name: 'Pausar y volver', exact: true }).tap();
      await expect(page.getByRole('status', { name: 'Guardado protegido', exact: true })).toHaveText('Guardado cifrado completo.');
    }
    expect(errors).toEqual([]);
    const raw = (await page.evaluate(key => localStorage.getItem(key), accountProfileKey(uid)))!;
    const [saved] = await decryptBackup(raw, password);
    expect(saved).toMatchObject(profile);
    expect(saved.activitySessions).toHaveLength(25);
    expect(saved.activitySessions).toEqual(expect.arrayContaining([expect.objectContaining({ gameId: 'count', status: 'completed', roundsCompleted: 5 })]));
    expect(saved.learningProgress).toMatchObject({ count: { sessions: 1 } });
    expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBeNull();
  });
});
