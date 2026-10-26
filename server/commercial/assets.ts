import { createHmac, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import type { RequestHandler, Response } from 'express';
import type { CommercialConfig } from './config';
const COOKIE = 'np_paid_assets', OPTIONS = { httpOnly: true, secure: true, sameSite: 'strict' as const, path: '/assets' };
export function assetToken(uid: string, expires: number, key: string) {
  const payload = Buffer.from(JSON.stringify({ uid, expires, scope: 'neuroplaneta-assets-live' })).toString('base64url');
  return `${payload}.${createHmac('sha256', key).update(payload).digest('base64url')}`;
}
export function assetTokenValid(value: string, key: string, now = Date.now()) {
  try {
    if (!key || value.length > 1024) return false;
    const [payload, signature, extra] = value.split('.'); if (extra || !payload || !signature) return false;
    const actual = Buffer.from(signature, 'base64url'), expected = createHmac('sha256', key).update(payload).digest();
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return /^[A-Za-z0-9_-]{1,128}$/.test(data.uid) && data.scope === 'neuroplaneta-assets-live' && Number.isSafeInteger(data.expires) && data.expires > now && data.expires <= now + 301000;
  } catch { return false; }
}
export function setAssetAccess(res: Response, config: CommercialConfig, uid: string, allowed: boolean, paidThrough: number) {
  if (!config.enforce) return;
  if (!allowed) { res.clearCookie(COOKIE, OPTIONS); return; }
  const expires = Math.min(Date.now() + 300000, paidThrough > 0 ? paidThrough : Number.MAX_SAFE_INTEGER);
  res.cookie(COOKIE, assetToken(uid, expires, config.assetSecret), { ...OPTIONS, maxAge: Math.max(0, expires - Date.now()) });
}
export function protectedAssets(config: CommercialConfig): RequestHandler {
  return (req, res, next) => {
    if (!config.enforce) return next();
    let name: string;
    try { name = path.posix.basename(path.posix.normalize(decodeURIComponent(req.path))); } catch { return void res.sendStatus(400); }
    if (!/^ImportedApp-[A-Za-z0-9_-]+\.js$/i.test(name)) return next();
    const cookie = (req.get('cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || '';
    if (!assetTokenValid(cookie, config.assetSecret)) return void res.status(401).set('Cache-Control', 'no-store').json({ error: 'El módulo requiere acceso verificado.' });
    res.set('Cache-Control', 'private, no-store'); next();
  };
}
