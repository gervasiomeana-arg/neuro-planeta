export const MAX_BOARD_BYTES = 2_000_000;
const MAX_IMAGE_CHARS = 350_000;

// Never request arbitrary remote URLs supplied by a board file or old storage.
export function safeImageSource(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > MAX_IMAGE_CHARS) return undefined;
  if (/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.origin === 'https://api.arasaac.org' && !url.username && !url.password &&
      /^\/api\/pictograms\/\d+$/.test(url.pathname) && !url.search && !url.hash) return url.href;
  } catch { /* Invalid and relative URLs are not imported. */ }
  return undefined;
}

export function parseBoardImages(text: string, knownIds: readonly string[]): Record<string, string> {
  if (new TextEncoder().encode(text).length > MAX_BOARD_BYTES) throw new Error('El tablero supera el límite de 2 MB.');
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || !('format' in parsed) || parsed.format !== 'open-board-v1' ||
    !('buttons' in parsed) || !Array.isArray(parsed.buttons) || parsed.buttons.length > 100) {
    throw new Error('El archivo no es un tablero OBF válido (hasta 100 botones).');
  }
  const allowed = new Set(knownIds);
  const images: Record<string, string> = Object.create(null);
  for (const button of parsed.buttons) {
    if (!button || typeof button !== 'object' || typeof button.id !== 'string' || !allowed.has(button.id)) continue;
    if (button.image_url == null || button.image_url === '') continue;
    const image = safeImageSource(button.image_url);
    if (!image) throw new Error('El tablero contiene imágenes no admitidas. Usá PNG, JPEG, WEBP, GIF locales o pictogramas de ARASAAC.');
    images[button.id] = image;
  }
  return images;
}

export async function prepareLocalImage(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 8_000_000) {
    throw new Error('Elegí una imagen PNG, JPEG, WEBP o GIF de hasta 8 MB.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo preparar la imagen.');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    // Re-encoding reduces storage use and drops original EXIF/location metadata.
    const image = canvas.toDataURL('image/jpeg', 0.75);
    if (!safeImageSource(image)) throw new Error('La imagen preparada supera el tamaño admitido.');
    return image;
  } finally { bitmap.close(); }
}
