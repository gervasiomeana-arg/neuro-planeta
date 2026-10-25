// Export only the selected summary as a standalone document; never print the
// application shell, whose modal/print styles can hide or clip its contents.
export function downloadTextReport(title: string, text: string) {
  const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
  const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>${escape(title)}</title><style>body{font:15px/1.6 system-ui,sans-serif;color:#293b3a;padding:28px;max-width:950px;margin:auto}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}h1{font-size:23px}@media print{body{padding:0}}</style></head><body><h1>${escape(title)}</h1><pre>${escape(text)}</pre><p>Registro descriptivo, sin análisis, evaluaciones, diagnósticos ni tratamientos. Para generar un PDF, abrí este archivo y elegí Imprimir → Guardar como PDF.</p></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'neuroplaneta-resumen-familiar.html'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
