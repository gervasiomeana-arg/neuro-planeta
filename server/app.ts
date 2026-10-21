import express, { type Request, type ErrorRequestHandler } from 'express';
import { serverPolicy } from '../security/policy';

export type StoryGenerator = (situation: string, signal: AbortSignal) => Promise<unknown>;
type Options = { production: boolean; generate?: StoryGenerator; now?: () => number };

function localRequest(req: Request) {
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress || '')) return false;
  // Reject DNS rebinding, cross-origin browser requests and forged proxy headers.
  if (!['localhost', '127.0.0.1', '[::1]'].includes(req.hostname)) return false;
  if (req.get('sec-fetch-site') === 'cross-site') return false;
  const origin = req.get('origin');
  return !origin || origin === `${req.protocol}://${req.get('host')}`;
}

function safeStory(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Invalid story');
  const story = value as { title?: unknown; pages?: unknown };
  if (typeof story.title !== 'string' || !story.title.trim() || story.title.length > 60 ||
    !Array.isArray(story.pages) || story.pages.length !== 5 ||
    story.pages.some((page: unknown) => {
      if (!page || typeof page !== 'object') return true;
      const p = page as { text?: unknown; emoji?: unknown };
      return typeof p.text !== 'string' || !p.text.trim() || p.text.length > 180 ||
        typeof p.emoji !== 'string' || !p.emoji.trim() || p.emoji.length > 8;
    })) throw new Error('Invalid story');
  return { title: story.title.trim(), pages: story.pages.map(p => ({ text: p.text.trim(), emoji: p.emoji })) };
}

export function createApiApp({ production, generate, now = Date.now }: Options) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'geolocation=(), payment=(), usb=(), camera=(self), microphone=(self)',
      'X-Permitted-Cross-Domain-Policies': 'none',
    });
    if (production) res.set('Content-Security-Policy', serverPolicy);
    next();
  });
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.all(['/api/migrate', '/api/migrate/*', '/api/sync', '/api/sync/*'], (_req, res) => {
    res.status(410).json({ error: 'Esta función no está disponible.' });
  });

  let windowStart = now();
  let requests = 0;
  let active = 0;
  app.post('/api/social-stories/draft', (req, res, next) => {
    // No production access until per-account authentication is implemented.
    if (production) return res.status(503).json({ error: 'IA pendiente de autenticación segura. Usá el borrador guiado.' });
    if (!localRequest(req)) return res.status(403).json({ error: 'La prueba de IA solo está disponible en desarrollo local.' });
    if (!generate) return res.status(503).json({ error: 'La IA no está configurada.' });
    if (!req.is('application/json')) return res.status(415).json({ error: 'Enviá un objeto JSON.' });
    const time = now();
    if (time - windowStart >= 3_600_000) { windowStart = time; requests = 0; }
    if (requests >= 10 || active >= 2) {
      res.set('Retry-After', '3600');
      return res.status(429).json({ error: 'Probá de nuevo más tarde.' });
    }
    requests++;
    next();
  }, express.json({ limit: '2kb', strict: true }), async (req, res) => {
    const situation = req.body?.situation;
    if (!req.body || Object.keys(req.body).length !== 1 || typeof situation !== 'string' ||
      situation.trim().length < 12 || situation.trim().length > 200) {
      return res.status(400).json({ error: 'Enviá solo una situación de 12 a 200 caracteres.' });
    }
    active++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    const disconnected = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', disconnected);
    try {
      const story = safeStory(await generate!(situation.trim(), controller.signal));
      if (!controller.signal.aborted) return res.json(story);
      if (!res.destroyed) return res.status(504).json({ error: 'La generación tardó demasiado.' });
    } catch {
      // Never echo provider errors, submitted text, stack traces or credentials.
      if (!res.destroyed) return res.status(controller.signal.aborted ? 504 : 502)
        .json({ error: 'No se pudo crear la historia en este momento.' });
    } finally {
      clearTimeout(timer);
      res.off('close', disconnected);
      active--;
    }
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no disponible.' }));
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    res.status(error?.type === 'entity.too.large' ? 413 : 400).json({ error: 'Solicitud no válida.' });
  };
  app.use('/api', errors);
  return app;
}
