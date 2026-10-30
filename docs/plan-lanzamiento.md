# Plan de lanzamiento de NeuroPlaneta

Actualizado el 29 de octubre de 2026. Este estado sustituye las referencias anteriores a juegos e informe «sin pruebas». Evidencia inicial en [auditoria-funcional-2026-10-25.md](auditoria-funcional-2026-10-25.md), con actualizaciones posteriores indicadas abajo.

## Situación actual

Actualización de seguimiento, 29 de octubre: el código de aplicación se sincronizó y publicó en AI Studio; el titular confirmó que los juegos vuelven a abrir en celular. También confirmó envío y recepción de mensajes, descarga JSON de cuenta y descarga de copia cifrada. El diagnóstico publicado mostró siete lecturas correctas de Firebase. La restauración aislada pasó seis recorridos de navegador y 22 pruebas de conservación/cifrado. Ver [constancia y límites](verificacion-exportacion-2026-10-29.md). Esto no cierra cobros, eliminaciones reales, recuperación del servidor, dispositivos físicos restantes ni piloto.

La app tiene 25 juegos, registro descriptivo de uso, descarga del informe, perfiles cifrados y copia/restauración. Los juegos nuevos, el informe y la recuperación cuentan ahora con pruebas de navegador. El informe no realiza análisis clínicos, evaluaciones, diagnósticos ni tratamientos. No presentar la app como servicio clínico ni como herramienta de diagnóstico.

La revisión acumulada del 29 de octubre aprobó 83 escenarios distintos de juegos, guardado, imágenes, informe, tiempos y navegación táctil simulada; incluye los tres niveles de los 23 juegos nuevos y la finalización de los dos originales. Ver [resultados y límites](verificacion-juegos-informe-2026-10-29.md). No equivale a certificar equipos físicos ni cobros.

Se corrigieron dibujos locales, la correspondencia toalla/canasta, el formato de 24 horas y el desplazamiento al entrar en juegos. Después se reprodujeron y corrigieron fallas adicionales de carga de Juegos, altura al girar el celular y salida de los juegos originales; ver la auditoría funcional para la secuencia histórica. Las correcciones se incorporaron a la publicación posterior y el titular confirmó el funcionamiento de juegos en celular.

El titular confirmó posteriormente que los juegos abren en celular. El seguimiento con cuenta ficticia y perfiles realmente cifrados cubre el error corregido del temporizador, foco y desplazamiento al abrir cada juego. La confirmación de un celular no sustituye probar los demás dispositivos objetivo; no borrar datos del navegador para verificarlo.

## Orden de cierre

| Orden | Trabajo | Condición verificable |
| --- | --- | --- |
| 1 | Publicación comprobada, aceptación final pendiente | Código de aplicación sincronizado y republicado en AI Studio; backend actualizado y diagnóstico privado comprobados. El titular confirmó juegos en celular. Falta completar la aceptación de los recorridos restantes en la publicación. |
| 2 | Reglas Firebase de USD: completado | Publicadas en NeuroPlaneta el 25 de octubre y verificadas tras recarga. Cambio limitado a admitir USD junto con ARS; permisos y datos conservados. Ver constancia en la auditoría. |
| 3 | Privacidad, condiciones y soporte | Textos visibles, conservación y eliminación resueltas, alcance del servicio y contacto identificable. Los consentimientos puntuales actuales no cierran este punto. |
| 4 | Cobro y acceso | Elegir/configurar proveedor; probar pago verificado en servidor, renovación aprobada/rechazada, notificaciones repetidas, cancelación y estado de acceso. Mostrar USD 20 no cobra. |
| 5 | Equipos reales | Probar Android/iOS/tablet objetivo, voz, grabación, permisos, recuperación, teclado y lector de pantalla. No confundir viewport simulado con equipo físico. |
| 6 | Piloto acompañado | Familias y profesionales voluntarios prueban el uso; registrar incidencias sin datos infantiles innecesarios y corregirlas antes de ampliar ventas. |

## Datos y funciones disponibles

Los perfiles completos permanecen cifrados en el navegador y separados por cuenta adulta. No hay sincronización automática del perfil completo ni respaldo automático en nube. La copia descargada y su contraseña son esenciales; conservarlas de forma segura. Las fichas mínimas remotas requieren consentimiento y no sustituyen al perfil completo.

La recuperación aislada entre navegadores conserva notas, imágenes, voces, historias, rutinas, premios, sesiones y progreso. Falta confirmar el recorrido práctico del titular en sus dispositivos. La IA remota continúa bloqueada en producción; el borrador guiado sin IA funciona. No prometer IA remota o sincronización mientras no estén disponibles.

Plan Familia: USD 20/mes, precio elegido por el titular. La app guarda la configuración pero todavía no procesa pagos ni débitos. No se considera una suscripción operativa. La gestión comercial debe preservar consulta y exportación de datos y no borrar perfiles automáticamente al cancelar.

OpenMoji local conserva atribución, licencia y origen. Revisar por separado cualquier material histórico de origen desconocido. La comprensión de las imágenes también requiere prueba humana: un archivo disponible puede representar el objeto equivocado.

## Mantenimiento

Antes de publicar: compilar, ejecutar pruebas pertinentes con datos ficticios, comprobar acceso/aislamiento, recuperación, informe y la versión pública exacta. Registrar incidencias, soporte y cambios sin guardar datos infantiles en logs. Revisar periódicamente dependencias, permisos, restauración y costos. Esto es un plan, no una automatización ya creada.

El lanzamiento general sigue pendiente de la aceptación final de la versión publicada, condiciones/privacidad, cobro/cancelación, equipos reales y piloto. Se puede demostrar la app y preparar interesados describiendo su estado actual de forma explícita.

## Cobros y privacidad preparados en código

PayPal, verificación del servidor, cancelación, control de acceso, consentimiento y controles de datos implementados. La activación comercial sigue pendiente: configuración comercial formal, credenciales del proveedor, aceptación sandbox real y configuración live. Los permisos actuales permiten verificar usuarios y manejar documentos; no incluyen eliminar usuarios de Firebase Auth. No publicar domicilio ni correo personales del titular: el soporte funciona por Mensajes dentro de la app. Ver [detalle y activación](cobros-y-privacidad.md). El modo predeterminado conserva el acceso actual sin cobrar.


Actualización PayPal, 30 de octubre: el titular confirmó credenciales y API Sandbox correctas desde Cloud Shell, creación/validación del plan USD 20 mensual con cero cobros y acceso a la cuenta compradora Personal Sandbox. Se preparó un laboratorio privado que reutiliza el motor de cobros sin Firebase y sin cambiar producción. El alta/aprobación/pago/cancelación real con ese comprador, webhooks firmados, renovación y habilitación dentro de la aplicación siguen pendientes. [Procedimiento y límites](paypal-sandbox-cloud-shell.md).

Seguimiento del mismo 30 de octubre: el laboratorio privado completó alta, aprobación y pago Sandbox (ACTIVE y acceso técnico habilitado), seguido por cancelación confirmada (CANCELLED, misma fecha de fin de período). El titular mostró la aplicación NeuroPlaneta Live creada, Subscriptions marcada y los dos secretos Live creados junto a los dos Sandbox. Se preparó una comprobación Live solo de autenticación/lectura; todavía no se ejecutó. No hay plan/webhook Live ni cobros reales habilitados. La aceptación del laboratorio no cierra el recorrido de pago del producto con Google/Firebase ni las notificaciones automáticas.
