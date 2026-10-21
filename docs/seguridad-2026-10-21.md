# NeuroPlaneta: primera etapa de seguridad, 21/10/2026

## Alcance

Revisión de código de servidor Express, compilación estática, entradas JSON/OBF, recursos externos e imágenes. Pruebas con perfiles ficticios y proveedor de IA simulado, sin enviar datos de niños ni consumir Gemini. No es una certificación, una auditoría de cumplimiento legal ni una prueba de penetración integral. No se migran, eliminan ni envían los perfiles locales.

## Hallazgos y cambios

| Hallazgo | Corrección |
| --- | --- |
| El endpoint de Gemini no autenticaba cuentas; podía consumir cuota si se configuraba una clave en un servidor público. | Producción responde 503 antes de leer el cuerpo o invocar el proveedor. El desarrollo permite únicamente loopback, Host local y origen coincidente. La pantalla comunica que falta acceso seguro. |
| La compilación Node compartía `dist` con recursos servidos por Express. | Bundle del servidor en `build/`, fuera de `dist`, sin sourcemap. Servidor rechaza rutas de bundles, mapas y archivos ocultos. GitHub Pages ya compilaba solo el cliente; este hallazgo afectaba al alojamiento con Node. |
| OBF aceptaba URLs arbitrarias y no limitaba tamaño, número de botones o IDs. | Máximo 2 MB y 100 botones, IDs conocidos y validación completa antes de modificar el estado. Solo imágenes raster base64 acotadas o URL HTTPS numérica de ARASAAC, sin credenciales, query o fragmentos. Lectura asíncrona vinculada al perfil original. |
| Imágenes externas guardadas podían solicitarse a terceros al abrir el tablero. | Se validan también al renderizar. Valores antiguos no admitidos se conservan en almacenamiento pero no se cargan; se muestra el pictograma predeterminado. |
| Fotos originales podían ocupar demasiado espacio y conservar EXIF. | Nuevas fotos raster hasta 8 MB se reducen a 512 px y recodifican JPEG antes del guardado. No modifica imágenes históricas. No se ha probado la cámara física. |
| Faltaba política de recursos y protección de respuestas API. | CSP de compilación estática, Referrer-Policy sin referencia, restricciones de recursos, object-src none. Express añade nosniff, Permissions-Policy, frame-ancestors compatible con dominios declarados de AI Studio y Cache-Control no-store para API. GitHub Pages no permite añadir desde el repositorio todos los encabezados HTTP; su CSP se entrega mediante meta. |
| Errores JSON o del proveedor podían devolver respuestas inadecuadas. | Límites, tipos y esquema cerrado de entrada, errores genéricos, salida validada de cinco pasos y campos extras descartados. Rutas API desconocidas devuelven JSON 404. Migración/sync siguen cerradas, también en la ruta exacta. |

La política mantiene estilos inline necesarios para React/Motion; no permite scripts inline ni eval. Esto reduce riesgos, pero no evita todo XSS. Se conservan Google Fonts y ARASAAC como dependencias externas explícitas; no se afirma funcionamiento completamente offline. La CSP del servidor debe revisarse si cambia el dominio que incrusta la app.

La cuota local tiene diez solicitudes por hora y dos en curso, sin confiar en X-Forwarded-For, y un plazo de espera de 20 segundos. El aborto local no garantiza cancelar una operación o un costo ya iniciado en el proveedor. Ninguna cuota en memoria se presenta como protección suficiente de un servicio comercial.

## Verificación

- `npm run lint`, `npm run build`.
- `npm run test:security`: pruebas HTTP reales del servidor de producción, cierre de IA, rutas, solicitudes malformadas/excesivas, origen y Host falsificados, cuotas y concurrencia; importación restrictiva y separación de archivos públicos.
- Playwright ahora usa el cliente compilado con CSP, no el servidor de desarrollo. Incluye regresión funcional y dos pruebas nuevas de scripts inline bloqueados, texto tratado como texto y no carga de imágenes remotas sin borrar sus valores guardados.
- Resultados y evidencia final se registran en el PR asociado. No se presenta un test pendiente como aprobado.

## Pendiente antes de suscripciones públicas

1. Cuenta de adulto con autenticación recuperable y sesión segura. La operación matemática actual es una barrera contra entradas accidentales, no autenticación.
2. Almacenamiento con autorización por cuenta/perfil y pruebas de acceso entre usuarios, más respaldo y restauración. Actualmente los perfiles siguen en localStorage sin cifrado propio; un usuario con acceso al dispositivo puede verlos y borrar datos del navegador puede perderlos.
3. Para reabrir Gemini: autenticación verificada por servidor, autorización por cuenta, cuotas persistentes, presupuesto del proveedor y revisión de privacidad/consentimiento. No colocar un secreto compartido en el cliente.
4. Revisión de privacidad para menores, minimización de información, conservación, exportación/borrado y consentimiento con asesoramiento adecuado para los países de venta. Esta etapa no certifica cumplimiento.
5. Auditoría independiente y pruebas en teléfonos de cámara, micrófono y voz. No se revisó exhaustivamente el historial Git, la configuración de cuentas cloud, permisos de colaboradores o secretos alojados fuera del código.
6. Revisar ciclo de vida de grabación de audio y advertencias ante fallo de guardado local. Las mejoras de tamaño de fotos reducen riesgo de cuota, pero no sustituyen esas protecciones ni un respaldo.

Referencia técnica: https://expressjs.com/en/advanced/best-practice-security/ y documentación instalada de `@google/genai` para abortSignal.
