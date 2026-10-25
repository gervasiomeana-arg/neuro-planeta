# Auditoría funcional de NeuroPlaneta — 25 de octubre de 2026

## Alcance y seguridad de la revisión

Base comprobada en GitHub: d893afe0f8d066eb016289784ffa6f0f838c6a25. Las pruebas usan perfiles ficticios y contextos de navegador aislados. Las pruebas de Firebase usan exclusivamente el proyecto demo-neuroplaneta-isolation en un emulador local. No se cambian datos de familias, perfiles reales, contraseñas, reglas de producción ni configuración de cobros.

## Correcciones

1. Al elegir un juego desde una tarjeta situada más abajo en la biblioteca se conservaba el desplazamiento anterior: el título y el botón de pausa podían quedar por encima del área visible. Ahora se vuelve al principio al entrar/salir del juego, cambiar de desafío y mostrar su cierre. Los juegos originales también recuperan el comienzo al iniciar o terminar.
2. Inicio y Logros en la navegación inferior usaban emojis que podían verse como cuadrados vacíos. Se sustituyeron por iconos vectoriales de la biblioteca Lucide ya integrada.
3. Las pruebas antiguas buscaban Atención/Atención Cósmica, Resumen y precios en ARS. Se actualizaron a Aprender y jugar, Informe de uso y USD 20. Una prueba de micrófono ahora identifica el pictograma seleccionado sin confundirlo con la opción de catálogo del mismo nombre.
4. Se actualizó únicamente body-parser de 1.20.8 a 1.20.9 para corregir el aviso alto GHSA-27r3-jxmh-p828 (denegación de servicio con cuerpos comprimidos malformados). El cambio de lock no altera Express ni sus interfaces. Se añadió una prueba que exige rechazar bytes inválidos tras gzip y seguir atendiendo solicitudes. `npm audit --omit=dev` no detecta vulnerabilidades después del cambio; no equivale a seguridad absoluta.
5. La recuperación entre navegadores incluye ahora registros de juegos y progreso educativo, además de imágenes, voces, notas, historias, rutinas y premios.

## Verificación técnica

| Comprobación | Resultado |
| --- | --- |
| TypeScript y compilación de cliente/servidor | Aprobados. |
| Escenarios distintos de navegador del candidato | 130 aprobados: 55 recorridos existentes + 75 de biblioteca, informe, imágenes, tiempos y tamaños. |
| Seguridad y conservación de datos | 51 aprobadas, incluida la regresión de gzip tras actualizar body-parser. |
| Reglas Firestore en emulador | 13 aprobadas, incluido USD 20 y rechazo de usuarios sin permiso. |
| Puerta Google en la web pública | 1 escenario aprobado, sin autenticar ni leer datos reales. |
| Vulnerabilidades conocidas de dependencias de producción | 0 detectadas por `npm audit --omit=dev` tras el parche. |

En la ejecución conjunta pasaron 129 escenarios y uno no llegó a abrir el perfil ficticio: la raíz del candidato respondió 404 durante una recompilación local concurrente. La traza confirma ese 404 antes de entrar al juego. Se repitió solo «instructions level 3» con el candidato estable: aprobado. No se oculta este incidente del entorno ni se presenta la ejecución conjunta como 130/130 en un único intento.

Las comprobaciones automatizadas de accesibilidad de los siete módulos y de las siete secciones del panel adulto no detectaron infracciones en las reglas WCAG ejecutadas. Esto no certifica accesibilidad total ni sustituye pruebas con lectores de pantalla y personas usuarias.

La prueba de los 23 juegos nuevos ejecuta cinco desafíos por nivel en los tres niveles: 345 desafíos completados en navegador. Comprueba imágenes locales, resultados guardados una sola vez, cantidad de primeras selecciones, progreso y persistencia tras recarga. Los dos juegos originales tienen sus recorridos de números y parejas probados aparte.

También se comprueba la descarga de un informe después de jugar, sus registros descriptivos, el perfil sin apodo por defecto, el respaldo textual ante una imagen que falla, la pausa, la exclusión del tiempo en pestaña oculta y el registro de ayuda de la app. No se infiere ayuda humana ni se emiten conclusiones clínicas.

Las pruebas de dimensiones recorren los 23 juegos nuevos a 360, 768 y 1280 px. Se revisan capturas representativas; no equivalen a teléfonos o tablets físicos. Los controles de voz y micrófono emplean dispositivos simulados para comprobar cancelación, tamaño máximo, errores, duración y liberación del recurso.

## Estado de producción observado

- https://neuroplaneta.ai.studio/ responde y la prueba pública de acceso obligatorio con Google pasó: un perfil ficticio local no se muestra antes de autenticar; el consentimiento habilita el botón y administración no revela el formulario protegido.
- En la primera revisión, el HTML público servía `/assets/index-Cql3IhsI.js` y faltaba el SVG de la toalla. Posteriormente el titular informó que actualizó AI Studio. Falta confirmar el recorrido final autenticado en esa versión; no se confunde la publicación de reglas con la publicación del frontend.
- No se probó autenticación real con una cuenta adulta en la web publicada. Los recorridos autenticados de integración usan respuestas ficticias de Auth y Firestore.
- Actualización posterior: el 25 de octubre se ingresó con autorización a la consola de NeuroPlaneta y se publicaron las reglas que admiten ARS y USD. Solo cambió `request.resource.data.currency == 'ARS'` por `request.resource.data.currency in ['ARS', 'USD']`. Se comparó el contenido completo antes de publicar y se confirmó la versión activa tras recargar (historial: Today, 5:02 PM). Los permisos, usuarios y documentos no se modificaron. Las 13 pruebas previas del emulador cubren este mismo cambio. La confirmación se registró como texto; no se adjunta una captura de la consola autenticada a GitHub.

## Lista de lanzamiento actualizada

| Área | Estado comprobado | Pendiente real |
| --- | --- | --- |
| Juegos, tiempos, guardado e informe | Recorridos automatizados y datos ficticios verificados; informe real del usuario revisado en el trabajo anterior. | Confirmar estas correcciones tras publicar la nueva versión. |
| Recuperación y aislamiento | Copia cifrada descargada desde UI, restauración en navegador nuevo y separación entre cuentas verificadas. | Prueba práctica en los dispositivos del titular; conservar copia descargada y contraseña. |
| Publicación | Código en GitHub, puerta pública y publicación de reglas Firebase USD comprobados. | Confirmar el recorrido final en la versión de AI Studio actualizada. |
| Cobros | USD 20 configurado como precio; formulario de administración y permisos probados. | No hay pasarela, suscripciones, renovación, cancelación ni habilitación por pago. No ofrecer como cobro automático operativo. |
| Privacidad y condiciones | Hay consentimientos puntuales y cifrado local. | Faltan textos comerciales completos, conservación/borrado, gestión de eliminación y contacto visible de soporte. No se da esta área por cerrada. |
| Dispositivos y accesibilidad | Geometría simulada, teclado, navegación, permisos y grabación simulados. | Android/iOS/tablets reales, calidad de voz, micrófono físico y lectores de pantalla. |
| Piloto | No se inventa evidencia de uso externo. | Familias/profesionales voluntarios, registro y corrección de dificultades reales. No es estudio clínico. |

## Reproducción

- `npm run lint`
- `npm run build`
- `npm run test:security`
- `npx playwright test` (el candidato aislado necesita `dist/access-policy.json` con `requireGoogle:false`, como prepara el workflow; nunca cambiar `public/access-policy.json` para esta prueba).
- Se admite `PLAYWRIGHT_EXECUTABLE_PATH` para usar un navegador ya instalado sin cambiar el proyecto.
- Reglas probadas con Firebase CLI 14.17.0 y emulador Firestore 1.19.8, Java 17, proyecto demo. Solo se usa el emulador; no se ejecuta deploy.

Se conserva [skip ci] al guardar esta revisión para evitar repetir automáticamente la batería y desplegar sin sincronización con AI Studio. El resultado técnico no sustituye una auditoría de seguridad independiente ni demuestra eficacia clínica.
