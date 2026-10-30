# Prueba gratuita de NeuroPlaneta: 48 horas

Implementación del 30 de octubre de 2026, solicitada por el titular antes de enviar invitaciones comerciales.

- Una prueba de 48 horas por cuenta adulta Google verificada y por entorno comercial. Inicia únicamente por POST autenticado, con origen permitido, sesión reciente y consentimiento versionado. Consultar el estado no la inicia.
- Inicio y fin se guardan en el documento comercial mediante transacción de Firestore. Recargar, cambiar de equipo, cerrar sesión o borrar almacenamiento del navegador no extiende la prueba. Las altas y reemplazos de suscripción conservan su historial.
- No requiere tarjeta, autorización en PayPal ni creación de suscripción. El vencimiento no genera cobros automáticos. El Plan Familia continúa en USD 20 mensuales si el adulto lo contrata expresamente.
- Estado de prueba separado del pago confirmado. La autorización de los archivos del módulo usa la fecha real de vencimiento del acceso, incluida la prueba. Una revisión por reembolso o reversión no queda anulada por una prueba.
- Se muestra el inicio de prueba, fecha y hora de vencimiento y aviso al finalizar. Los perfiles, copias, mensajes y controles de privacidad siguen disponibles cuando vence el acceso a las actividades.
- La supresión de una cuenta que solo tiene prueba no requiere cancelar una suscripción inexistente. No se ejecutaron supresiones de usuarios reales.
- Condiciones y privacidad actualizadas a 2026-10-30.1. El plan de PayPal no se modifica: esta prueba es de la aplicación.

## Validación

80 pruebas de seguridad/datos aprobadas, incluidas pruebas de inicio explícito, concurrencia, límite exacto de 48 horas, no reinicio tras vencimiento, cuentas separadas, conservación al contratar, rechazo de fechas falsas, entorno equivocado y reembolsos. Ruta HTTP comprobada con sesión antigua, origen incorrecto y parámetros adicionales.

TypeScript y compilación de producción aprobados. Tres pruebas de navegador aprobadas: contratación con consentimiento explícito, prueba gratuita y vencimiento a 390 y 768 píxeles, sin autorizar pagos, sin desborde y sin alterar los perfiles cifrados.

## Publicación

La activación Live previa fue confirmada por el titular en la revisión remix-neuroplaneta-00046-bm7, con 100 % del tráfico, mode=live, enforce=true, checkoutReady=true y legalReady=true. Este cambio requiere sincronizar el código nuevo de GitHub y volver a publicar en AI Studio. Conservar las variables y referencias a secretos de Cloud Run existentes. No es necesario cambiar el producto, precio, plan ni webhook de PayPal.

Antes de enviar una invitación que prometa la prueba, la versión pública debe mostrar el botón «Iniciar prueba gratuita · 2 días» en una cuenta adulta nueva, y condiciones versión 2026-10-30.1. No se ha confirmado aún esa publicación.
