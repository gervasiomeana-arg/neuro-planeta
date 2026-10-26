import { test, expect, type Page } from '@playwright/test';
import { encryptBackup, decryptBackup } from '../src/data/backups';
import { accountProfileKey } from '../src/data/accountProfileStorage';
import { DEFAULT_CONFIG, POLICY_VERSION } from '../commercial/policy';
const uid = 'billing-fictional', apiKey = 'AIzaSyAjnF0-SAQIpmPTgidYY11fjNHrOHkjdpk', password = 'Solo pruebas cifradas 2026';
const profile = (id: string, name: string) => ({ id, name, avatar: '🦊', selectedAge: '6-8', stars: 10, unlockedAchievements: [], completedRoutineTasks: [], emotionJournal: [{ date: '2026-10-25', emotion: 'Nota', note: `Conservar ${id}` }], customPictogramImages: {}, customPictogramVoices: {} });
const originals = [profile('first', 'Primer perfil ficticio'), profile('second', 'Segundo perfil ficticio')];
const key = accountProfileKey(uid);
async function seed(page: Page, enforce = false, activeSubscription = false) {
  const cfg = { ...DEFAULT_CONFIG, mode: enforce ? 'live' : 'sandbox', enforce, legalReady: true, checkoutReady: true, address: 'Domicilio ficticio de prueba', supportEmail: 'soporte@example.invalid' };
  const requests: Array<{ path: string; body: any }> = [];
  let status = { mode: cfg.mode, enforced: enforce, hasAccess: activeSubscription, paid: activeSubscription, status: activeSubscription ? 'ACTIVE' : 'NONE', paidThrough: activeSubscription ? Date.now() + 86400000 : 0, renewalCancelled: false, hasSubscription: activeSubscription, reviewRequired: false, checkedAt: Date.now() };
  await page.route('**/commercial-config.json', r => r.fulfill({ json: cfg }));
  await page.route('**/access-policy.json', r => r.fulfill({ json: { requireGoogle: true } }));
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  const email = `${uid}@example.invalid`, now = Math.floor(Date.now() / 1000);
  const token = `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({ sub: uid, user_id: uid, email, email_verified: true, auth_time: now, iat: now, exp: now + 3600, firebase: { sign_in_provider: 'google.com' } })).toString('base64url')}.simulated`;
  const user = { uid, email, emailVerified: true, isAnonymous: false, providerData: [{ providerId: 'google.com', uid, email }], stsTokenManager: { accessToken: token, refreshToken: 'fictional-only', expirationTime: Date.now() + 3600000 }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: 'neuroplaneta-adults' };
  await page.route('https://identitytoolkit.googleapis.com/**', r => r.fulfill({ json: { users: [{ localId: uid, email, emailVerified: true, providerUserInfo: [{ providerId: 'google.com', email, rawId: uid }] }] } }));
  await page.route('https://securetoken.googleapis.com/**', r => r.abort());
  await page.route('https://firestore.googleapis.com/**', r => r.fulfill({ status: 403, json: { error: { code: 403 } } }));
  await page.route('**/api/commercial/**', r => {
    const path = new URL(r.request().url()).pathname, body = r.request().postDataJSON(); requests.push({ path, body });
    if (path.endsWith('/checkout')) return r.fulfill({ json: { approvalUrl: 'https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=fictional' } });
    if (path.endsWith('/cancel')) status = { ...status, status: 'CANCELLED', renewalCancelled: true };
    return r.fulfill({ json: status });
  });
  await page.route('**/api/privacy/**', r => {
    const path = new URL(r.request().url()).pathname, body = r.request().postDataJSON(); requests.push({ path, body });
    return r.fulfill({ status: path.endsWith('/requests') ? 202 : 200, json: path.endsWith('/requests') ? { id: 'solicitud-ficticia', status: 'open' } : { uid, email } });
  });
  await page.goto('/');
  await page.evaluate(({ key, user, authKey, cipher, legacy }) => {
    sessionStorage.setItem(authKey, JSON.stringify(user)); localStorage.setItem(key, cipher);
    localStorage.setItem('np_account_profiles:v1:other-adult', 'otra-cuenta-no-modificar');
    localStorage.setItem('np_patients', legacy); localStorage.setItem('np_sensory_audio_mode', 'silent');
  }, { key, user, authKey: `firebase:authUser:${apiKey}:neuroplaneta-adults`, cipher: await encryptBackup(originals, password), legacy: JSON.stringify([profile('legacy', 'Histórico sin asignar')]) });
  await page.goto('/?subscription=return&subscription_id=no-es-prueba-de-pago');
  const locked = page.getByRole('region', { name: 'Desbloquear perfiles protegidos', exact: true });
  await locked.getByLabel('Contraseña de protección', { exact: true }).fill(password);
  await locked.getByRole('button', { name: 'Desbloquear perfiles', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Aceptar y continuar', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: /Soy adulto responsable o estoy autorizado/ }).check();
  await page.getByRole('button', { name: 'Aceptar y continuar', exact: true }).click();
  return { requests, cfg };
}
async function adults(page: Page) {
  await page.getByRole('button', { name: /Primer perfil ficticio/ }).click();
  await page.getByRole('button', { name: 'Abrir espacio de adultos', exact: true }).click();
  const dialog = page.locator('#adult-panel-dialog'), challenge = (await dialog.innerText()).match(/¿Cuánto es (\d+) x (\d+)/);
  if (challenge) { await dialog.getByRole('spinbutton').fill(String(Number(challenge[1]) * Number(challenge[2]))); await dialog.getByRole('button', { name: 'Abrir configuración', exact: true }).click(); }
  await expect(page.getByRole('status', { name: 'Guardado protegido', exact: true })).toHaveText('Guardado cifrado completo.');
  return dialog;
}
async function saved(page: Page) { return decryptBackup((await page.evaluate(k => localStorage.getItem(k), key))!, password); }

test.describe.configure({ mode: 'parallel' });
test.beforeEach(({ }, info) => { test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'Datos y cuentas ficticios solo en candidato aislado.'); });
for (const width of [390, 768]) test(`privacidad y condiciones públicas legibles, con teclado y sin activar Google: ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Privacidad y datos', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Privacidad y gestión de datos', exact: true });
  await expect(dialog).toContainText('Gervasio Meana'); await expect(dialog).toContainText('No realiza análisis clínicos');
  expect(await dialog.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Privacidad y datos', exact: true })).toBeFocused();
});
test('checkout exige tres aceptaciones, solo envía versiones y dirige a PayPal simulado', async ({ page }) => {
  const { requests } = await seed(page); await adults(page);
  const panel = page.getByRole('region', { name: 'Mi suscripción', exact: true }), button = panel.getByRole('button', { name: 'Continuar a PayPal · USD 20 mensuales', exact: true });
  await expect(button).toBeDisabled();
  for (const label of [/Soy adulto responsable,/, /Leí y acepto/, /Autorizo USD 20/]) await panel.getByRole('checkbox', { name: label }).check();
  await expect(button).toBeEnabled();
  await page.route('https://www.sandbox.paypal.com/**', r => r.fulfill({ contentType: 'text/html', body: '<h1>PayPal de prueba interceptado</h1>' }));
  await button.click(); await page.waitForURL('https://www.sandbox.paypal.com/**');
  const checkout = requests.find(r => r.path.endsWith('/checkout'))!;
  expect(checkout.body).toEqual({ privacyVersion: POLICY_VERSION, termsVersion: POLICY_VERSION, adultResponsible: true, recurringPayment: true });
  expect(JSON.stringify(checkout)).not.toMatch(/Primer perfil|Conservar|amount|currency|uid/);
});
test('cancelación confirmada conserva perfiles cifrados y período ya pagado', async ({ page }) => {
  await seed(page, false, true); await adults(page);
  const panel = page.getByRole('region', { name: 'Mi suscripción', exact: true });
  await panel.getByRole('button', { name: 'Consultar mi suscripción', exact: true }).click();
  const before = await page.evaluate(k => localStorage.getItem(k), key);
  await expect(panel.getByRole('button', { name: 'Cancelar renovación en PayPal', exact: true })).toBeDisabled();
  await panel.getByRole('checkbox', { name: /Quiero cancelar la renovación/ }).check();
  await panel.getByRole('button', { name: 'Cancelar renovación en PayPal', exact: true }).click();
  await expect(panel).toContainText('PayPal confirmó la cancelación');
  await expect(panel).toContainText('Período pagado hasta'); expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe(before);
});
test('eliminar un perfil requiere elección y confirmación; conserva el otro, la cuenta ajena y el histórico', async ({ page }) => {
  await seed(page); await adults(page);
  const panel = page.getByRole('region', { name: 'Privacidad y control de datos', exact: true });
  const before = await saved(page), raw = await page.evaluate(k => localStorage.getItem(k), key), legacy = await page.evaluate(() => localStorage.getItem('np_patients'));
  const button = panel.getByRole('button', { name: 'Eliminar solo el perfil elegido', exact: true });
  await expect(button).toBeDisabled(); await panel.getByRole('combobox', { name: 'Perfil que quiero eliminar', exact: true }).selectOption('first');
  await panel.getByRole('checkbox', { name: /Entiendo qué datos/ }).check();
  await panel.getByLabel('Escribí ELIMINAR PERFIL', { exact: true }).fill('ELIMINAR'); await expect(button).toBeDisabled();
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe(raw);
  await panel.getByLabel('Escribí ELIMINAR PERFIL', { exact: true }).fill('ELIMINAR PERFIL'); await button.click();
  await expect(page.getByRole('button', { name: /Segundo perfil ficticio/ })).toBeVisible();
  const after = await saved(page); expect(after).toHaveLength(1); expect(after[0]).toEqual(before[1]);
  expect(await page.evaluate(() => localStorage.getItem('np_account_profiles:v1:other-adult'))).toBe('otra-cuenta-no-modificar');
  expect(await page.evaluate(() => localStorage.getItem('np_patients'))).toBe(legacy);
});
test('solicitud de supresión queda pendiente sin borrar y revocación local detiene actividades sin perder la copia', async ({ page }) => {
  const { requests } = await seed(page); await adults(page);
  const panel = page.getByRole('region', { name: 'Privacidad y control de datos', exact: true });
  const raw = await page.evaluate(k => localStorage.getItem(k), key);
  await panel.getByRole('combobox', { name: 'Tipo de solicitud', exact: true }).selectOption('suppression');
  await expect(panel.getByRole('button', { name: 'Registrar solicitud', exact: true })).toBeDisabled();
  await panel.getByRole('checkbox', { name: /Comprendí el alcance/ }).check();
  await panel.getByRole('button', { name: 'Registrar solicitud', exact: true }).click();
  await expect(panel.getByRole('status')).toContainText('Está pendiente de gestión');
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe(raw);
  expect(requests.find(r => r.path.endsWith('/requests'))!.body).toEqual({ kind: 'suppression', version: POLICY_VERSION, understood: true });
  await panel.getByRole('button', { name: 'Revocar permiso de registro en este navegador', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Aceptar y continuar', exact: true })).toBeDisabled();
  await expect(page.getByRole('region', { name: 'Copias de seguridad', exact: true })).toBeVisible();
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe(raw);
});
test('volver de PayPal sin pago verificado no abre juegos y permite exportar los perfiles', async ({ page }) => {
  await seed(page, true);
  await expect(page.getByRole('button', { name: /Primer perfil ficticio/ })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Tu cuenta y tus datos', exact: true })).toBeVisible();
  const backup = page.getByRole('region', { name: 'Copias de seguridad', exact: true });
  await backup.getByLabel('Contraseña de la copia', { exact: true }).fill(password);
  await backup.getByLabel('Repetir contraseña para descargar', { exact: true }).fill(password);
  const downloading = page.waitForEvent('download'); await backup.getByRole('button', { name: 'Descargar copia cifrada', exact: true }).click();
  expect((await downloading).suggestedFilename()).toBe('neuroplaneta-copia.npbackup');
  expect(await saved(page)).toEqual(originals);
});

test('un fallo al entregar el módulo muestra recuperación y copia, sin pantalla vacía ni borrado', async ({ page }) => {
  await page.route('**/assets/ImportedApp-*.js', r => r.abort());
  await seed(page);
  await expect(page.getByRole('alert', { name: 'Recuperar acceso al espacio', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Copias de seguridad', exact: true })).toBeVisible();
  expect(await saved(page)).toEqual(originals);
});
