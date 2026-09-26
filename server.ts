import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2kb' }));

// Solo se envía la situación escrita por el adulto, nunca un perfil o un historial.
const storyRequests = new Map<string, { count: number; until: number }>();
app.post('/api/social-stories/draft', async (req, res) => {
  const situation = req.body?.situation;
  if (typeof situation !== 'string' || situation.trim().length < 12 || situation.trim().length > 200) {
    return res.status(400).json({ error: 'Describí una situación de 12 a 200 caracteres.' });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(503).json({ error: 'La IA no está configurada.' });
  }
  const client = req.ip || 'unknown';
  const now = Date.now();
  const usage = storyRequests.get(client);
  const next = !usage || now > usage.until ? { count: 1, until: now + 60 * 60 * 1000 } : { count: usage.count + 1, until: usage.until };
  if (next.count > 10) return res.status(429).json({ error: 'Probá de nuevo más tarde.' });
  storyRequests.set(client, next);
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: `Situación para anticipar: ${situation.trim()}`,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: `Redactá una historia social breve en español rioplatense para un niño de 3 a 10 años. Devolvé solo JSON con { "title": string, "pages": [{ "emoji": string, "text": string }] }. Exactamente cinco páginas, una oración simple por página y un emoji descriptivo en cada una. Primera página: qué pasará. Segunda: cómo prepararse. Tercera: qué puede observar o hacer. Cuarta: pedir ayuda o pausa si la necesita. Quinta: hablar después de cómo se sintió. Usá lenguaje respetuoso, opciones y autonomía, sin prometer resultados, imponer conductas, inventar detalles concretos, diagnosticar o dar consejos médicos. No repitas datos personales que aparezcan en la situación.`
      }
    });
    const parsed: unknown = JSON.parse(response.text || '{}');
    if (!parsed || typeof parsed !== 'object') throw new Error('Formato inválido');
    const story = parsed as { title?: unknown; pages?: unknown };
    if (typeof story.title !== 'string' || !Array.isArray(story.pages) || story.pages.length !== 5 ||
      story.pages.some((page: unknown) => !page || typeof page !== 'object' ||
        typeof (page as { text?: unknown }).text !== 'string' || typeof (page as { emoji?: unknown }).emoji !== 'string' ||
        !(page as { text: string }).text.trim() || (page as { text: string }).text.length > 180)) {
      throw new Error('La historia no tiene cinco pasos válidos');
    }
    return res.json({
      title: story.title.slice(0, 60),
      pages: story.pages.map((page: { text: string; emoji: string }) => ({
        text: page.text.slice(0, 180),
        emoji: page.emoji.slice(0, 8)
      }))
    });
  } catch (error) {
    // Evitar registrar la situación del niño o detalles sensibles del proveedor.
    return res.status(502).json({ error: 'No se pudo crear la historia en este momento.' });
  }
});

// Migration routes could overwrite source code, and sync routes exposed
// children's profiles without authentication. Keep them unavailable until
// authenticated, per-user storage is implemented.
app.all(['/api/migrate/*', '/api/sync/*'], (_req, res) => {
  res.status(410).json({ error: 'Esta función no está disponible.' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
