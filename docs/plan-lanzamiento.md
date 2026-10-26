# Plan de lanzamiento de NeuroPlaneta

Actualizado el 25 de octubre de 2026. Este estado sustituye las referencias anteriores a juegos e informe «sin pruebas». Evidencia detallada en [auditoria-funcional-2026-10-25.md](auditoria-funcional-2026-10-25.md).

## Situación actual

La app tiene 25 juegos, registro descriptivo de uso, descarga del informe, perfiles cifrados y copia/restauración. Los juegos nuevos, el informe y la recuperación cuentan ahora con pruebas de navegador. El informe no realiza análisis clínicos, evaluaciones, diagnósticos ni tratamientos. No presentar la app como servicio clínico ni como herramienta de diagnóstico.

Se corrigieron dibujos locales, la correspondencia toalla/canasta, el formato de 24 horas y el desplazamiento al entrar en juegos. El titular informó que actualizó AI Studio. Después se reprodujeron y corrigieron fallas adicionales de carga de Juegos, altura al girar el celular y salida de los juegos originales. Esta nueva corrección pasó 11 pruebas de navegador y requiere otra sincronización/publicación y confirmación en el equipo físico; ver la auditoría funcional.

El incidente móvil sigue abierto hasta confirmarlo en el teléfono: el titular indicó que falla después de elegir un juego en Chrome para Android y la publicación ya incluía la corrección anterior. El seguimiento agrega pruebas con cuenta ficticia y perfiles realmente cifrados, corrige un error del temporizador de sesión y refuerza el foco/desplazamiento al abrir cada juego. Requiere publicar esta nueva revisión y repetir la selección en el equipo; no borrar datos del navegador.

## Orden de cierre

| Orden | Trabajo | Condición verificable |
| --- | --- | --- |
| 1 | Publicar y verificar versión actualizada | AI Studio sirve el código actual y el SVG de la toalla; recorrido de acceso, juego, guardado e informe correcto en la publicación. |
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

El lanzamiento general sigue pendiente de publicación verificada, condiciones/privacidad, cobro/cancelación, equipos reales y piloto. Se puede demostrar la app y preparar interesados describiendo su estado actual de forma explícita.
