# PayPal sandbox desde Cloud Shell

El titular creó la aplicación `NeuroPlaneta Sandbox` en PayPal y aportó capturas de los dos recursos en Secret Manager del proyecto donde está alojado el servidor. Todavía no se verificaron los valores ni se ejecutó una operación real contra la API sandbox desde esta herramienta.

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
