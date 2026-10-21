# Plan de seguimiento para vender NeuroPlaneta

Fecha de corte: 21 de octubre de 2026. Estado: beta funcional. La aprobación de pruebas técnicas no demuestra eficacia terapéutica ni equivale a una auditoría de seguridad integral.

## Qué está hecho y qué falta

- Inicio rediseñado y publicado: crema/salvia, tarjetas pastel, actividades primero, textos y navegación simplificados. No se completó el rediseño de todas las pantallas. El archivo de Figma quedó vacío por el límite de llamadas comunicado en el intento anterior; no se presenta como entregado.
- Siete módulos y principales recorridos revisados. La etapa anterior aprobó 11 pruebas de seguridad, 22 de navegador y 16 recorridos de la web publicada.
- Esta entrega agrega protección de lectura/guardado local, avisos, copias cifradas y restauración como perfiles nuevos con revisión previa. Sus resultados se registran en el PR asociado.
- Los perfiles siguen en el navegador. No hay cuentas comerciales, sincronización ni respaldo automático en nube. No se promete acceso desde varios dispositivos.
- Entre los proyectos Supabase disponibles no aparece NeuroPlaneta. La infraestructura propia debe definirse antes de implementar cuentas; no se selecciona otro proyecto existente como destino.
- La IA remota sigue bloqueada en producción hasta tener autenticación, permisos y cuotas por cuenta. El borrador guiado funciona sin esa IA.

## Secuencia y condiciones de salida

| Orden | Entrega | Responsable principal | Se cierra cuando... |
| --- | --- | --- | --- |
| P0-1 | Cuentas adultas y datos protegidos | Desarrollo + titular para destino cloud | Registro, verificación, ingreso, recuperación y cierre de sesión probados; cuenta A no puede leer ni modificar datos de B; sesiones vencidas dejan de operar. |
| P0-2 | Respaldo y migración voluntaria | Desarrollo + titular | Se restaura una copia en otro dispositivo y se demuestra preservación de notas, rutinas, premios, imágenes e historias. Ningún dato infantil se sube por defecto; destino y consentimiento son explícitos. |
| P0-3 | Privacidad, contenido y licencias | Titular + asesoría y profesionales | Textos, consentimiento, retención, exportación y borrado revisados; inventario de assets con permiso comercial verificable. Decisión específica sobre ARASAAC, que declara BY-NC-SA: no asumir que su integración permite cobrar. |
| P0-4 | Seguridad restante y teléfonos | Desarrollo + revisor independiente | Sin hallazgos críticos/altos abiertos; permisos de cámara/micrófono pedidos por acción; grabación termina al cerrar/cambiar perfil; voz, teclado y guardado probados en Android y en los dispositivos objetivo. |
| P1-1 | Rediseño integral | Diseño + desarrollo | Portal, siete módulos, logros, adultos y errores usan la misma tipografía, espaciado, colores, foco y controles; prueba de 360/768/1280 px sin solapamientos. Evidencia por pantalla. |
| P1-2 | Cobro y acceso | Desarrollo + titular | Pago inicial, renovación aprobada/rechazada, cancelación, reembolso y notificación repetida probados; activación solo tras verificación del servidor; cuenta puede cancelar renovación sin borrar datos automáticamente. |
| P1-3 | Prueba acompañada | Titular + familias/profesionales | Piloto voluntario de 10-20 familias y 2 profesionales durante dos semanas; sin pérdida de datos ni incidentes críticos, problemas de uso registrados y corregidos. No se interpreta como estudio clínico. |
| P2 | Venta inicial controlada | Titular | P0 y P1 cerrados, soporte y condiciones de oferta publicados, costos y política de cancelación definidos. Ampliar ventas después de revisar los primeros resultados. |

No vender como tratamiento, diagnóstico, atención de emergencias ni servicio clínico validado. La propuesta comercial inicial es apoyo visual, actividades, rutinas y acompañamiento familiar. No prometer la IA o la sincronización mientras no estén disponibles.

## Organización del trabajo

Trabajar por bloques, con máximo tres tareas activas y un responsable por tarea. Una tarea pasa por Pendiente → En curso → En prueba → Publicada y verificada. Registrar objetivo, evidencia, fecha de verificación, dependencia y siguiente acción. No usar un porcentaje global de avance sin un alcance estable y ponderado.

Bloque 1: cerrar protección/recuperación local y elegir infraestructura de cuentas. Bloque 2: cuentas, autorización, respaldos y privacidad. Bloque 3: rediseño completo, permisos físicos y revisión profesional. Bloque 4: cobros y piloto. La duración depende del acceso a servicios, revisiones y problemas encontrados; estas son dependencias, no fechas garantizadas.

Antes de cada publicación: revisar cambios de AI Studio/GitHub, probar candidato con datos ficticios, verificar regresión, fusionar y comprobar la web publicada. Identificar explícitamente qué versión está publicada y no asumir que el editor de AI Studio se sincronizó por actualizar GitHub.

## Seguimiento después del piloto

| Frecuencia propuesta | Qué revisar | Acción |
| --- | --- | --- |
| Cada publicación | Login, autorización, guardado/restauración, pago/cancelación y pantallas clave | No publicar con fallas que afecten datos o acceso. Conservar versión anterior recuperable. |
| Diaria durante la primera semana de venta | Incidentes, disponibilidad, pagos fallidos y contactos de soporte | Atender primero pérdida/exposición de datos y cobros incorrectos. Registrar solo información técnica mínima, sin notas infantiles en logs. |
| Semanal | Bugs abiertos, uso agregado con consentimiento, consultas, cancelaciones y costo por cuenta | Elegir tres mejoras con mayor impacto y revisar problemas repetidos. |
| Mensual | Dependencias, permisos, restauración de prueba y márgenes | Repetir recuperación con datos ficticios; ajustar presupuesto y precio si hace falta. |
| Trimestral o tras cambios de autenticación/pagos | Revisión de seguridad y acceso entre cuentas | Revisar permisos, sesiones, secretos y plan de incidentes. |

Esto es un plan de trabajo, no una automatización ya programada. Registrar incidentes sin nombres, diagnósticos, notas o grabaciones de niños. No sumar seguimiento publicitario al espacio infantil.

## Oferta y medición comercial

Propuesta a validar: piloto gratuito, luego un único Plan Familia de lanzamiento con referencia de US$5,99/mes. Para Argentina definir un importe fijo en pesos visible antes de contratar; no se fija aquí una conversión cambiaria ni una tarifa del procesador. Precio y costos deben confirmarse antes de ofrecerlo. Posponer plan profesional y anual hasta contar con gestión de varias familias y retención observada.

Mercado Pago ofrece suscripciones recurrentes; integrarlas con estados de acceso en el servidor y validación de notificaciones según la documentación del producto. Un link o una pantalla de éxito no verifica una suscripción. Modelar prueba, activa, pago pendiente, período de gracia y cancelada; no retirar ejercicios de calma durante una sesión por un cambio de estado de cobro. Separar consulta/exportación de datos del acceso a funciones de pago.

Medir por cohorte: familias invitadas, adultas que completan el primer uso, cuentas activas a semana 1/4, conversiones a pago y cancelaciones con motivo opcional. Son indicadores de producto, no de eficacia clínica. Rentabilidad por cuenta = ingreso neto menos comisiones, impuestos aplicables, alojamiento, IA, soporte y devoluciones. No atribuir un margen sin conocer esos costos.

## Decisión de salida a venta

No hay lanzamiento general mientras falte cualquiera de estos controles: separación entre cuentas, recuperación demostrada, condiciones/privacidad y licencias, revisión de seguridad pendiente de alto impacto, cobro/cancelación verificados o soporte identificable. Se pueden preparar la presentación y reclutar voluntarios mientras se cierran esos puntos, informando que es una beta.

Fuentes oficiales consultadas: https://arasaac.org/terms-of-use ; https://aulaabierta.arasaac.org/en/terms-of-use ; https://www.mercadopago.com.ar/developers/es/docs/subscriptions/overview ; https://www.mercadopago.com.ar/developers/es/docs/subscriptions/additional-content/your-integrations/notifications/webhooks . Revisar licencias y condiciones concretas con asesoría antes de comercializar.
