# Cobros y privacidad: implementación preparada

Responsable elegido por el titular: Gervasio Meana, Argentina. Proveedor elegido: PayPal. Plan: USD 20 mensuales.

## Entregado en código

- Alta recurrente mediante aprobación alojada en PayPal. El servidor valida el plan, moneda, importe, frecuencia, titular y consentimiento versionado; no acepta un precio del navegador.
- Renovación comprobada mediante pagos COMPLETED; aprobación o regreso del checkout no habilitan por sí solos. Tratamiento de meses cortos, rechazo, vencimiento, cancelación y devoluciones/reversiones que requieren revisión.
- Cancelación confirmada con PayPal que conserva el período pagado. Claves estables de idempotencia, notificaciones verificadas y referencias por cuenta y entorno. Un alta incierta no se recrea después del plazo de idempotencia.
- En modo de pago, el servidor entrega el módulo ImportedApp solo con un permiso firmado de hasta cinco minutos, en cookie Secure/HttpOnly/SameSite. No sustituye DRM ni revoca copias ya descargadas del código. Las API de cuenta verifican Firebase ID tokens y revocación; el navegador no escribe permisos de pago.
- Privacidad y condiciones visibles antes de ingresar y desde adultos. Aceptación expresa, revocación local que detiene las actividades, copia cifrada accesible aunque venza la suscripción y recuperación visible si falla el módulo.
- Borrado local de un perfil con selección, advertencia y confirmación escrita. Conserva los otros perfiles y cuentas. Exportación de datos de la cuenta, solicitudes autenticadas de acceso/rectificación/supresión/revocación/devolución y gestión por administrador en servidor.
- Supresión en servidores bajo solicitud confirmada; cierre de Auth de NeuroPlaneta solo después de cancelar las suscripciones. No elimina la cuenta Google general, descargas ni otros dispositivos. Comprobantes contables se conservan separadamente. Las devoluciones se tramitan en PayPal; cerrar una solicitud no reintegra dinero.
- Control manual de depuración de accesos de más de 90 días y registros operativos vencidos. No se programó una tarea automática ni se ejecutó una depuración sobre datos reales.

## Activación pendiente: no hay cobros operativos todavía

El valor predeterminado es PAYPAL_MODE=off y BILLING_ENFORCE=false. Los accesos y perfiles actuales se mantienen. No se ejecutó ninguna compra, cancelación, supresión de cuenta ni modificación de datos reales.

Para activar se necesita completar:

1. Domicilio comercial/legal que el titular quiera publicar y correo de soporte confirmado, en LEGAL_ADDRESS y SUPPORT_EMAIL. Los textos se muestran como incompletos y contratar permanece deshabilitado mientras falten.
2. Cuenta PayPal Business habilitada y credenciales sandbox en secretos del servidor: PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET. No poner claves en GitHub, navegador ni chat.
3. Identidad de servicio del servidor con acceso a Firestore y Firebase Authentication de neuroplaneta-bdaf9. Se usa Application Default Credentials; no se incorpora JSON privado al repositorio. Runtime Node >=22.12.
4. Ejecutar `node --import tsx scripts/setup-paypal.ts` en el entorno confiable del titular, con PAYPAL_MODE=sandbox, COMMERCIAL_APP_URL y PAYPAL_SETUP_REQUEST_ID (UUID estable por intento). Crea producto, plan mensual y webhook, sin cobrar. Guardar los IDs devueltos en PAYPAL_PRODUCT_ID, PAYPAL_PLAN_ID y PAYPAL_WEBHOOK_ID. Ver .env.example.
5. Prueba sandbox real con comprador ficticio: aprobación sin pago, pago, aviso firmado repetido, renovación, rechazo, cancelación y devolución. Las pruebas automatizadas actuales interceptan PayPal; no reemplazan esta aceptación externa ni verifican la habilitación comercial real de la cuenta.
6. Completar revisión comercial/legal y el procedimiento periódico de solicitudes y conservación. Crear recursos live con credenciales live y `--live`; generar BILLING_ASSET_SECRET privado aleatorio de al menos 32 caracteres. Solo entonces habilitar COMMERCIAL_LIVE_REVIEWED=true y BILLING_ENFORCE=true. El servidor rechaza una activación incompleta.

La factura fiscal y la revisión del alcance legal aplicable al titular no se sustituyen con un comprobante de PayPal. No se declara cerrada la preparación comercial hasta completar los puntos anteriores. No se cambian silenciosamente los precios de suscripciones existentes.

## Validación

TypeScript y compilación de producción. 65 comprobaciones de seguridad/datos aprobadas, incluyendo 14 comerciales y entrega del módulo por servidor. Pruebas de navegador con cuentas ficticias y cifrado real: contratación, aceptación, cancelación, borrado selectivo, revocación, solicitud pendiente, recuperación y exportación aun sin acceso de pago. La regresión de 25 juegos en tres tamaños y transferencia completa de respaldo cifrado también pasó. Las pruebas de navegador no equivalen a transacciones reales ni a dispositivos físicos.

El informe permanece descriptivo de actividades registradas, sin análisis clínicos, evaluaciones, diagnósticos ni tratamientos. Se conservaron los créditos de ilustraciones.

## Referencias consultadas

- https://developer.paypal.com/api/subscriptions/v1
- https://developer.paypal.com/api/webhooks/v1
- https://firebase.google.com/docs/auth/admin/verify-id-tokens
- https://www.argentina.gob.ar/normativa/nacional/norma-64790/actualizacion
- https://www.argentina.gob.ar/aaip/datospersonales/derechos
- https://www.rpba.gob.ar/files/Normas/Leyes/CCCN0320-0331.pdf
