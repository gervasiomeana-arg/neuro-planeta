# Contenido y permisos antes de comercializar NeuroPlaneta

Revisión de código y fuentes primarias: 25 de octubre de 2026. Rama sin pruebas ni publicación, por instrucción del titular. No equivale a una autorización jurídica global ni a revisión de todos los datos privados de los usuarios.

## Hallazgos y decisiones

| Recurso | Evidencia en el proyecto | Estado y acción para la venta |
| --- | --- | --- |
| Pictogramas ARASAAC | Buscador remoto, asignación de URL y tableros importados en `src/ImportedApp.tsx` y `src/security/imports.ts`. | **Bloqueo comercial abierto.** Las condiciones oficiales excluyen uso comercial bajo CC BY-NC-SA. La atribución sola no lo resuelve. Conseguir autorización escrita aplicable al modelo propuesto o sustituir esta integración y los recursos distribuidos por un catálogo apto. No asumir que cobrar solo por otras funciones salva la restricción. |
| Iconos Lucide/Feather | `lucide-react`, versión exacta en el inventario adjunto. | El paquete incluye ISC y avisos de Feather/MIT. Se conserva su LICENSE completo en `public/third-party-notices.txt`. Revisar los avisos del resto del bundle; este archivo es parcial. |
| Tipografías Inter y JetBrains Mono | Importación CSS desde Google Fonts. | Sus proyectos publican SIL OFL 1.1. Permiten incorporarlas en software sujeto a sus condiciones; no vender las fuentes por separado. Conservar licencia/autoría si se distribuyen archivos locales. La carga remota también requiere revisión de privacidad/disponibilidad, independiente del permiso comercial. |
| Bibliotecas JavaScript | `package.json` / `package-lock.json`. | Inventario de licencias declaradas de dependencias directas en `inventario-licencias-directas.json`. No demuestra por sí solo cumplimiento de dependencias transitivas o archivos realmente distribuidos. Hay paquetes de herramientas con MPL-2.0 en el lockfile: revisar su alcance según distribución; no calificarlos automáticamente como incompatibles con venta. |
| AsTeRICS Grid / OBF | Lectura/escritura de archivos OBF. | Se corrige el texto: es intercambio manual de archivos, no sincronización ni integración oficial. No se afirma compatibilidad completa. Si se incorpora código externo posteriormente, revisar la licencia de esa versión antes de copiarlo. |
| Imágenes y voces subidas por adultos | Archivos locales, cámara/micrófono y respaldo. | La app no obtiene derechos comerciales por aceptar un archivo. Se incorpora recordatorio para usar contenido propio o autorizado. No revisar ni subir perfiles reales para este inventario. No redistribuir contenido de familias como material promocional sin autorización específica. |
| Emojis y gráficos del proyecto | Emojis del sistema e ilustraciones SVG en componentes; diseño previo/remix. | No se encontró en la búsqueda enfocada un catálogo raster incluido en `public/`. Esto no acredita titularidad de cada diseño, texto o archivo histórico. Confirmar procedencia del código/diseño importado y términos aplicables a sus herramientas. Los emojis del sistema no implican que se puedan extraer y redistribuir como un paquete gráfico. |
| Textos de actividades e historias | Contenido incluido y editor de historias. | Retirada la descripción general «terapéutica» de metadata. Mantener presentación como apoyo visual/actividades; no prometer tratamiento, diagnóstico ni eficacia clínica. La revisión profesional de adecuación y la procedencia de cada contenido siguen abiertas. La generación remota de IA permanece bloqueada en producción. |

## Cambios de esta rama

- Metadata alineada con actividades y acompañamiento, sin presentar eficacia terapéutica.
- Quitados «Buscador Oficial» y la falsa expectativa de sincronización de OBF.
- Atribución de ARASAAC completada y restricción comercial expresada claramente.
- Recordatorio sobre permiso para imágenes y voces de terceros.
- Aviso Lucide/Feather e inventario de licencias directas registrados.

**Actualización posterior:** la integración de búsqueda ARASAAC se sustituye por 24 símbolos locales OpenMoji; ver `catalogo-openmoji.md`. No se borró contenido existente ni se autoriza el uso comercial de imágenes ARASAAC conservadas en respaldos antiguos. La decisión de sustitución/autorización debe resolverse antes de vender o redistribuir la versión que lo incluya. Una imagen incorporada en base64 puede perder su procedencia: no puede declararse libre por su formato ni borrarse automáticamente sin revisión del titular.

## Siguiente modificación propuesta

El catálogo local de OpenMoji y la sustitución de la búsqueda ya están implementados en esta rama, pendientes de pruebas. Revisar la comprensión de las imágenes y cualquier contenido histórico antes de distribuirlo. Conservar originales y acceso a recuperación. No presentar un icono de interfaz como equivalente validado a un sistema de comunicación aumentativa.

No se ejecutaron tests, compilación, lint ni comprobaciones de navegador en esta entrega. No se abre PR ni se fusiona a main para evitar CI y despliegues automáticos hasta el bloque de pruebas diferido. El plan de venta sigue abierto.

## Fuentes primarias

- ARASAAC: https://arasaac.org/terms-of-use
- Aula Abierta ARASAAC (condiciones de sus materiales): https://aulaabierta.arasaac.org/en/terms-of-use
- Lucide: https://lucide.dev/license y el LICENSE de la versión instalada.
- Inter: https://github.com/rsms/inter/blob/master/LICENSE.txt
- JetBrains Mono: https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt

Antes de distribuir una versión concreta, conservar las licencias/avisos de esa versión y las autorizaciones particulares obtenidas. No se ha contactado a titulares ni solicitado permisos en nombre del propietario.
