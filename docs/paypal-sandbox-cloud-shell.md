# PayPal sandbox desde Cloud Shell

El titular creó la aplicación `NeuroPlaneta Sandbox` en PayPal y aportó capturas de los dos recursos en Secret Manager del proyecto donde está alojado el servidor. El 30 de octubre el titular ejecutó la herramienta en Cloud Shell y aportó las salidas: credenciales y API de suscripciones verificadas, producto y plan sandbox creados y validados, cero cobros creados. También confirmó que pudo ingresar con la cuenta Personal Sandbox. No se copiaron valores de credenciales al repositorio.

La app pública conserva sus cobros desactivados. No se modifican Cloud Run, Firebase, permisos ni perfiles al ejecutar este procedimiento. La pantalla de Source de Cloud Run confirmó que el despliegue actual viene de AI Studio; el código fuente ya está guardado en GitHub.

## Comprobación inicial

Usar `scripts/paypal_sandbox.py` en Cloud Shell, con la cuenta del titular que ya puede leer los dos secretos. Requiere Python 3 y `gcloud`, sin instalar paquetes. Se puede subir ese archivo individual a Cloud Shell desde el repositorio. No copiar las claves a la terminal, al chat, al repositorio o a archivos locales.

```sh
python3 paypal_sandbox.py
```

El programa lee exclusivamente las versiones `latest` de:

- `neuroplaneta-paypal-sandbox-client-id`
- `neuroplaneta-paypal-sandbox-client-secret`

El proyecto está fijado en el script. El intercambio OAuth usa únicamente `https://api-m.sandbox.paypal.com`; la comprobación de suscripciones hace una lectura de planes. Por defecto no crea productos, planes, suscripciones, notificaciones ni pagos y no modifica archivos. La salida pública confirma `credentialsVerified`, `subscriptionsApiVerified` y `chargesCreated: 0`. No imprime claves, tokens, respuestas privadas del proveedor ni cuentas compradoras. Los errores usan mensajes fijos. No se aceptan redirecciones.

Si Google pide autorizar Cloud Shell, el titular completa esa autorización directamente en Google. Si falla la lectura de Secret Manager, revisar cuenta y permisos antes de cambiarlos; no otorgar roles amplios por defecto.

## Crear el plan de prueba, después de confirmar las claves

```sh
python3 paypal_sandbox.py --create-plan
```

Esta opción crea únicamente un producto de servicio y un plan activo sandbox de USD 20 por mes, sin alta inicial, impuestos, cantidades variables ni cobro automático de saldos vencidos. No crea una suscripción, no registra compradores ni ejecuta débitos. Vuelve a leer el plan y valida importe, moneda, ciclo y preferencias antes de informar sus IDs.

Conserva identificadores e idempotencia en `~/.local/state/neuroplaneta-paypal-sandbox/plan.json`, con permisos 0600 y bloqueo para evitar dos creaciones simultáneas. El archivo no contiene claves ni tokens. Reutiliza los recursos al reintentar; si un intento incompleto supera 72 horas o las credenciales corresponden a otra aplicación, se detiene para revisión. No borrar el archivo para forzar otro intento sin revisar PayPal primero.

No se configura un webhook hacia la app pública: su modo de cobro sigue apagado. Tras esta comprobación faltará preparar la URL y el servidor de pruebas, notificaciones firmadas y el recorrido con comprador ficticio antes de considerar live. La cuenta actual muestra que requiere Business para credenciales live; no se cambió su tipo.

## Validación local

Ocho pruebas aisladas aprobadas: lectura de secretos concretos y salida sin claves, errores privados redactados, bloqueo en entorno live, rutas/redirecciones limitadas, reutilización del plan, recuperación de intento interrumpido con el mismo ID, detención ante estado vencido/otra aplicación y rechazo de planes con importe/ciclos/cargos distintos. Las pruebas interceptan Google y PayPal; no certifican las credenciales guardadas.

```sh
python3 -m unittest discover -s scripts -p test_paypal_sandbox.py -v
```

Referencias oficiales: [Secret Manager: acceso a una versión](https://docs.cloud.google.com/secret-manager/docs/access-secret-version), [PayPal: producto](https://developer.paypal.com/api/catalog-products/v1/products-create/), [PayPal: suscripciones](https://developer.paypal.com/api/subscriptions/v1/).

## Laboratorio privado para el recorrido de suscripción (30 de octubre)

Se agregó `scripts/paypal-lab.ts`, ejecutable separado que reutiliza **BillingService y PayPalClient reales**. No cambia la aplicación publicada ni su configuración. No importa Firebase, no autentica familias ni expone rutas de perfiles, soporte o administración. La decisión de acceso se prueba sobre una única cuenta técnica ficticia y no habilita cuentas reales de NeuroPlaneta.

Compilar con `npm run build:paypal-lab`. El archivo resultante `build/paypal-lab.mjs` usa solamente módulos nativos de Node y puede subirse solo a Cloud Shell, junto al estado `plan.json` que creó la herramienta Python. Requiere Node 22.12 o posterior, `gcloud` autorizado y `WEB_HOST` de Cloud Shell. No subir credenciales en archivos ni pegarlas en la terminal.

```sh
node ~/paypal-lab.mjs
```

Abrir Vista previa web, puerto 8080, en la sesión Google del titular. Cloud Shell limita esa vista previa a su usuario. El laboratorio escucha en loopback, toma su origen del `WEB_HOST` validado y exige origen exacto, token CSRF aleatorio y JSON para mutaciones; no permite peticiones de otros sitios. Al iniciar no crea ninguna suscripción. La casilla y el botón de alta autorizan expresamente una **suscripción mensual Sandbox**. Aprobarla requiere las credenciales Personal Sandbox, nunca la cuenta real.

El laboratorio lee exclusivamente los dos secretos Sandbox ya creados y comprueba que su huella corresponda al plan conservado. No permite modo live. Usa un punto de inyección de pruebas explícito para activar checkout y la decisión de acceso dentro de este ejecutable, sin falsear preparación legal ni modificar las restricciones live de `commercialConfig`. Las políticas de producción no se alteran ni se publican datos personales de contacto.

Conserva solo el registro técnico necesario (identificadores, consentimiento de prueba, enlace pendiente y fechas de pago) en `~/.local/state/neuroplaneta-paypal-sandbox/lab-account.json`, modo 0600, escritura atómica con fsync y bloqueo exclusivo de proceso. No conserva claves, tokens OAuth, nombre ni correo del comprador. Al reiniciar reutiliza el registro y la idempotencia del motor real. No hay botón de borrado o reinicio y no permite otra alta tras una cancelación. Si un cierre abrupto deja `lab.lock` o `lab-account.tmp`, detenerse y revisar el proceso y PayPal antes de retirar el bloqueo; no borrar el estado para iniciar otra suscripción.

Secuencia pendiente de aceptación real:

1. Abrir la pantalla, consultar estado y confirmar que no hay acceso pagado.
2. Aceptar la casilla y crear una sola suscripción de prueba.
3. Autorizarla en PayPal con Personal Sandbox. Si esa pestaña no puede volver a la vista privada de Google, regresar a la pestaña original.
4. Consultar estado. Exigir pago COMPLETED de USD 20 confirmado por API antes de observar acceso habilitado; volver desde PayPal no lo acredita.
5. Escribir `CANCELAR PRUEBA`, cancelar renovación y volver a consultar hasta ver CANCELLED. Conservar el período pagado, sin generar otra alta.

**Límites:** no recibe webhooks (rutas inexistentes), no verifica firmas/eventos reales, renovación mensual, recuperación de servidor/Firebase, inicio Google dentro del producto ni enforcement en la app pública. Esos pasos siguen pendientes antes de live. Las notificaciones de PayPal no pueden dirigirse a una vista privada de Cloud Shell. No presentar este laboratorio como aceptación completa del producto.

Validación local: 77 pruebas de seguridad/datos aprobadas en total, incluidas tres nuevas pruebas de laboratorio con controles de origen/CSRF/consentimiento, estado privado/reinicio y recorrido por el motor real (aprobación sin pago no habilita; pago confirmado habilita; cancelación conserva período). TypeScript y compilación independiente aprobados. Vista a 390 y 768 píxeles sin desborde ni errores de navegador, con datos simulados. El recorrido real con comprador sigue pendiente.

Referencia: [Vista previa privada de Cloud Shell](https://docs.cloud.google.com/shell/docs/using-web-preview).

## Aceptación observada y preparación Live

El 30 de octubre el titular aportó capturas del laboratorio contra PayPal Sandbox: alta aprobada con USD 20, estado ACTIVE, pago confirmado y acceso técnico habilitado; luego CANCELLED, renovación cancelada y conservación del mismo período hasta el 30/11/2026. Esto confirma el recorrido API manual del laboratorio, no webhooks ni acceso de familias en el producto. Las capturas no se agregan al repositorio porque contienen identificadores/tokens de aprobación.

Después, el titular completó el cambio a cuenta Empresas y mostró acceso a Apps & Credentials Live, creación de `NeuroPlaneta Live`, casilla Subscriptions marcada y listado de Live Webhooks vacío. Secret Manager mostró creados `neuroplaneta-paypal-live-client-id` y `neuroplaneta-paypal-live-client-secret`, además de los dos recursos Sandbox. No se verificaron aún sus valores ni la elegibilidad completa de la cuenta.

Se agregó la herramienta independiente `scripts/paypal_live_check.py`. Subir ese único archivo a Cloud Shell y ejecutar:

```sh
python3 ~/paypal_live_check.py
```

Lee exclusivamente los dos secretos Live nombrados del mismo proyecto fijado, obtiene un token OAuth en `https://api-m.paypal.com` y hace GET de una página de planes. Son las únicas dos rutas permitidas; no acepta opciones, cuerpos comerciales, redirecciones ni rutas de suscripción, productos, planes nuevos o webhooks. No modifica archivos, Firebase, IAM, Cloud Run ni la configuración pública. No imprime credenciales, tokens ni planes recibidos; los errores son fijos. El resultado correcto indica `credentialsVerified: true`, `subscriptionsApiReadVerified: true`, `billingActivated: false`, `subscriptionsCreated: 0`, `chargesCreated: 0`. No equivale a verificar facultades de cobro, identidad/compliance de la cuenta o recepción de pagos.

Tres pruebas nuevas aisladas verifican secretos/host/rutas/métodos exactos y salida privada, bloqueo de escrituras/opciones/redirecciones y redacción de errores de Google/PayPal. Pasaron las once pruebas Python de ambas herramientas. La ejecución Live real continúa pendiente. Antes de activar cobros faltan plan/webhook Live, verificación de eventos firmados, prueba de Google/Firebase y acceso en el producto, requisitos comerciales y aceptación real controlada autorizada. No ejecutar la herramienta Sandbox con credenciales Live ni reemplazar su estado para hacer pruebas reales.
