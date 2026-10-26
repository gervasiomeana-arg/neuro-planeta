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

## Revisión adicional de celular y tablet

El titular informó que Juegos quedaba en blanco en un celular. Se verificó primero que `main` de GitHub seguía en `3bb46207b8a6e74f5021cafc59a4394b663a1647`, con las correcciones previas guardadas. La web pública sirve `index-D2heCtX4.js`, `ImportedApp-BaCBbqSF.js` y `LearningHub-CtFZ8Ef3.js`; el módulo de juegos responde JavaScript en esta consulta. No se dispone del error ni de una inspección del teléfono del titular, por lo que no se afirma una causa exacta en ese equipo.

Se reprodujeron y corrigieron tres fallas en el candidato aislado:

- Al abortar la descarga diferida de `LearningHub`, React dejaba `#root` vacío. Los juegos ahora se incluyen en el módulo principal de la app; abrir la biblioteca no depende de otra descarga de JavaScript. Un límite de errores permite reintentar o volver al inicio ante una falla de renderizado, conservando la navegación. No borra almacenamiento ni recarga automáticamente.
- Al girar un celular de 390 × 844 a 844 × 390, la altura mínima de 600 px dejaba la navegación totalmente fuera de pantalla (intersección con el viewport: cero). En pantallas bajas se usa la altura disponible, y la barra lateral de tablets permite desplazarse.
- Al salir de un juego original se conservaba su estado de juego, impidiendo volver a elegir desde la biblioteca. Las salidas por cabecera, Inicio, Logros, SOS, barra lateral y acceso ahora cierran la sesión como pausa y restablecen la selección. La comprobación de navegador cubre la cabecera y la salida por Inicio, sin duplicar registros.

Resultado final: **11 pruebas de navegador aprobadas**, más TypeScript, compilación de producción y revisión de espacios del diff. La batería incluye:

- Interacción táctil simulada con `isMobile` y `hasTouch`: 320 × 568, 390 × 844, 768 × 1024 y 1024 × 600. En los tamaños de tablet también se activa el modo Tablet de la app.
- Apertura y salida de los 25 juegos en cada tamaño; una respuesta de Contar objetos, giro, siguiente desafío, pausa y conservación de 27 registros de prueba por recorrido. No se confunde este recorrido con repetir las cinco rondas de todos los juegos, ya verificadas en la batería anterior.
- Las siete actividades y las siete secciones del panel adulto, sin desborde horizontal; navegación visible después del giro; perfiles y notas ficticias conservados.
- Descarga del informe descriptivo después de completar un juego, respaldo textual ante una imagen ausente y dimensiones de los 23 juegos nuevos a 360, 768 y 1280 px.
- Bloqueo de la antigua descarga separada sin impedir abrir Juegos e inyección de un error de dibujo con recuperación mediante Reintentar.

Todas las pruebas usan perfiles ficticios locales. No se modificaron datos reales, Firebase, permisos, precios, créditos de ilustraciones ni el contenido del informe. El informe sigue describiendo actividades registradas, sin análisis clínicos, evaluaciones, diagnósticos ni tratamientos. Las correcciones requieren sincronizar/publicar AI Studio; esta batería no sustituye la confirmación en el celular/tablet físico ni prueba Safari/iOS real.

## Seguimiento: seleccionar un juego en Chrome para Android

El titular aclaró que la biblioteca aparece y la pantalla queda en blanco después de elegir un juego, únicamente en Juegos, usando Chrome en Android. Antes de editar se confirmó que GitHub `main` estaba en `02439bf316e62b39b2e82be54bd4228146e40ffe` y que la publicación ya servía `index-Cupq0L20.js`, el resultado de esa corrección. No se atribuyó el incidente a una actualización pendiente.

Las pruebas anteriores de juegos deshabilitaban la puerta de Google y usaban perfiles locales sin cifrar. Se agregó una batería separada con sesión Google ficticia, respuestas de red interceptadas y cifrado real de perfiles ficticios. No inicia sesión ni escribe en cuentas reales.

Hallazgos y cambios:

- En el recorrido autenticado se detectaron excepciones `TypeError: Illegal invocation` al tocar controles. La cancelación del temporizador de inactividad estaba asignada como `cancel: clearTimeout` y se invocaba con el objeto de entorno como receptor. Se reemplazó por `cancel: timer => clearTimeout(timer)`. Este error ocurrió aun cuando los juegos eran visibles en el navegador de prueba: es una falla real corregida, pero no demuestra por sí solo la causa de la pantalla blanca del teléfono.
- El paso de una tarjeta al juego ahora enfoca el título de la nueva pantalla, restablece directamente `scrollTop` y `scrollLeft` y repite el ajuste en el siguiente cuadro de dibujo, cancelándolo al salir. No depende del desplazamiento animado ni conserva el foco en una tarjeta que desaparece. El mismo restablecimiento directo se usa antes de pintar los juegos originales.
- Se comprobó mediante inyección local que, si `Element.scrollTo` no efectúa el desplazamiento, la versión anterior deja el botón de pausa fuera del viewport. La nueva transición mantiene título, pausa y consigna visibles aun con ese método desactivado. Esta inyección es una prueba de resistencia; no confirma que ese método falle en el teléfono real.

Validación final: ocho pruebas de navegador aprobadas y siete pruebas de inactividad, además de TypeScript, compilación y revisión del diff. Se recorren los 25 juegos con perfil cifrado en 360 × 640, 412 × 915 y 768 × 1024, con interacción táctil y agente de usuario de Android; cada tamaño se repite con y sin `scrollTo`. Se completa Contar objetos, se pausa el resto, se descifra el resultado y se comprueba la conservación del perfil y su nota, 25 sesiones y el avance completado. No quedan errores de JavaScript en esos recorridos. También se vuelven a verificar el informe descriptivo descargado y el texto de respaldo de una imagen ausente.

Límite explícito: no se reprodujo una pantalla totalmente blanca en el equipo físico del titular ni se inspeccionó su Chrome remoto. Los resultados son del Chromium de prueba con emulación, no de un Android físico. No se declara cerrado el incidente hasta publicar esta corrección y repetir la selección en el celular. Si persiste, hace falta el nombre del juego y una captura de la pantalla para identificar el estado exacto. No se borra ni reinicia el almacenamiento como solución.

No se cambiaron datos reales, reglas Firebase, formato del cifrado, permisos, cobros ni créditos de ilustraciones. El informe continúa describiendo actividades registradas, sin análisis clínicos, evaluaciones, diagnósticos ni tratamientos.

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
