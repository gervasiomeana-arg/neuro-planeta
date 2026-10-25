# Plan de seguimiento para vender NeuroPlaneta

Fecha de corte: 25 de octubre de 2026. Estado: beta funcional. La aprobación de pruebas técnicas no demuestra eficacia terapéutica ni equivale a una auditoría de seguridad integral.

## Qué está hecho y qué falta

- Inicio rediseñado y publicado: crema/salvia, tarjetas pastel, actividades primero, textos y navegación simplificados. No se completó el rediseño de todas las pantallas. El archivo de Figma quedó vacío por el límite de llamadas comunicado en el intento anterior; no se presenta como entregado.
- Google obligatorio y administración con rol verificado en Firebase Spark. El historial registra accesos autenticados de adultos. Configurar el valor mensual no procesa pagos.
- Perfiles locales cifrados por cuenta Google, con contraseña propia, sin asignación automática del almacenamiento anterior. Cambio 69 publicado en GitHub Pages. El titular descargó su respaldo; falta su verificación del recorrido de recuperación en su dispositivo y de la actualización publicada en AI Studio.
- Cambio 70 publicado: al desmontar la sesión se destruye la referencia a la clave y se descartan las copias internas del almacén; los guardados tardíos no escriben. No equivale a borrado físico garantizado de memoria ni elimina archivos históricos.
- Evidencia del cambio 70: 54 pruebas de navegador y 47 de seguridad aprobadas, ejecución 40111047895. Despliegue de Pages aprobado, ejecución 40134318336. No es una auditoría independiente.
- Los perfiles completos siguen en el navegador. No hay sincronización automática ni respaldo automático en nube. Las fichas remotas mínimas requieren consentimiento; no equivalen al perfil completo ni a acceso multidispositivo.
- La IA remota sigue bloqueada en producción hasta tener permisos y cuotas por cuenta. El borrador guiado funciona sin esa IA.
- En curso: recuperación entre dos contextos de navegador con Google obligatorio, contraseñas de origen/copia/destino distintas y perfiles ficticios completos. El resultado se registrará en el PR asociado; no marcarlo aprobado antes de finalizar CI.

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

Bloque actual: demostrar recuperación cifrada con cuentas y confirmar el recorrido del titular. Después: privacidad/contenido/licencias y revisión en teléfonos; completar coherencia visual y accesibilidad; cobros con cancelación verificada; piloto acompañado. Firebase Spark ya es la infraestructura elegida para identidad y permisos mínimos. La duración depende del acceso a servicios, revisiones y problemas encontrados; estas son dependencias, no fechas garantizadas.

Antes de cada publicación: revisar cambios de AI Studio/GitHub, probar candidato con datos ficticios, verificar regresión, fusionar y comprobar la web publicada. Identificar explícitamente qué versión está publicada y no asumir que el editor de AI Studio se sincronizó por actualizar GitHub.

## Próximas entregas concretas

Informe incorporado en la rama: registro de uso para el profesional, sin análisis ni evaluación, con descarga revisada por el adulto. No se generan diagnósticos, tratamientos ni conclusiones sobre evolución. Ver `informe-registro-uso.md`. Sin pruebas ni publicación todavía.

Ampliación educativa en la rama: biblioteca de 25 juegos totales (2 originales + 23 nuevos), con niveles, apoyos, práctica cotidiana y progreso local cifrado. Ver `biblioteca-25-juegos.md`. Implementada sin pruebas por solicitud del titular; no se marca publicada ni validada.

Actualización de contenido: ver `contenido-uso-comercial.md`. La revisión encontró la restricción comercial de ARASAAC; la rama sustituye su buscador por OpenMoji local. Quedan pendientes pruebas, revisión de comprensión y revisión de imágenes históricas de origen desconocido. Ver `catalogo-openmoji.md` y `comparacion-otsimo-2026-10-25.md`. Las correcciones de texto, atribución e inventario se preparan en la rama `release/content-commercial-review`, sin pruebas ni publicación por instrucción del titular. No se considera cerrado P0-3 por añadir una advertencia.

| Prioridad | Trabajo y evidencia exigida | Estado al corte |
| --- | --- | --- |
| 1 | Exportar una copia real de la UI en un contexto aislado y restaurarla en otro, con revisión previa; comparar notas, imágenes, voces, rutinas, historias y premios; recargar y desbloquear de nuevo. | Prueba candidata preparada, pendiente de CI; recorrido real del titular pendiente. |
| 2 | Inventariar contenido e integraciones externas; decidir sustitución o autorización verificable de los recursos antes de vender. Revisar textos de privacidad y condiciones con el titular. | Pendiente. La advertencia de ARASAAC dentro de la app no cierra por sí sola el permiso comercial. |
| 3 | Revisar pantallas restantes, accesibilidad y permisos de audio/cámara en teléfonos objetivo. Registrar modelo, navegador y resultado. | Parcial; las pruebas automatizadas no reemplazan las físicas. |
| 4 | Elegir proveedor y precio final, implementar validación de pago/cancelación en servidor e idempotencia, sin desbloqueos basados en la pantalla de éxito. | Pendiente. El importe de administración es configuración, no pasarela de pago. |
| 5 | Publicar soporte y condiciones, ejecutar piloto consentido y resolver incidencias antes de ampliar ventas. | Pendiente. |

Las actualizaciones de GitHub Pages y AI Studio se verifican por separado. No prometer “funcionamiento total” por una batería de pruebas: hay servicios externos, permisos físicos y decisiones del titular que deben comprobarse.

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

Precio definido por el titular: Plan Familia, USD 20/mes. La rama de trabajo agrega la presentación del precio y el guardado administrador en USD; las reglas remotas y los cobros siguen pendientes de publicación/verificación. No convertir valores ARS previos automáticamente. Si se cobra en pesos, el importe y la política de conversión deben definirse y mostrarse antes de contratar; no se inventa aquí un tipo de cambio ni una tarifa del procesador. Confirmar costos antes de ofrecerlo. Posponer plan profesional y anual hasta contar con gestión de varias familias y retención observada.

Mercado Pago ofrece suscripciones recurrentes; integrarlas con estados de acceso en el servidor y validación de notificaciones según la documentación del producto. Un link o una pantalla de éxito no verifica una suscripción. Modelar prueba, activa, pago pendiente, período de gracia y cancelada; no retirar ejercicios de calma durante una sesión por un cambio de estado de cobro. Separar consulta/exportación de datos del acceso a funciones de pago.

Medir por cohorte: familias invitadas, adultas que completan el primer uso, cuentas activas a semana 1/4, conversiones a pago y cancelaciones con motivo opcional. Son indicadores de producto, no de eficacia clínica. Rentabilidad por cuenta = ingreso neto menos comisiones, impuestos aplicables, alojamiento, IA, soporte y devoluciones. No atribuir un margen sin conocer esos costos.

## Decisión de salida a venta

No hay lanzamiento general mientras falte cualquiera de estos controles: separación entre cuentas, recuperación demostrada, condiciones/privacidad y licencias, revisión de seguridad pendiente de alto impacto, cobro/cancelación verificados o soporte identificable. Se pueden preparar la presentación y reclutar voluntarios mientras se cierran esos puntos, informando que es una beta.

Fuentes oficiales consultadas: https://arasaac.org/terms-of-use ; https://aulaabierta.arasaac.org/en/terms-of-use ; https://www.mercadopago.com.ar/developers/es/docs/subscriptions/overview ; https://www.mercadopago.com.ar/developers/es/docs/subscriptions/additional-content/your-integrations/notifications/webhooks . Revisar licencias y condiciones concretas con asesoría antes de comercializar.
