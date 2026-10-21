// React/Motion need inline styles, never inline scripts or eval.
export const browserPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://api.arasaac.org",
  "media-src 'self' data: blob:",
  "connect-src 'self' https://api.arasaac.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');
export const serverPolicy = `${browserPolicy}; frame-ancestors 'self' https://aistudio.google.com https://ai.studio https://*.ai.studio https://*.google.com`;
