# Administración, entrada Google y valor mensual

Interfaz preparada en PR64 e integrada con el cifrado principal. Google está habilitado en Firebase; faltan dominios, reglas y rol administrador. No publicar la entrada obligatoria antes de completar esa configuración.

- Administración aparece a la izquierda en la navegación de escritorio y en la entrada con Google. Usa una comprobación adicional de la clave indicada por el propietario, sin persistir lo escrito. Esa comprobación no autoriza: Firebase exige la cuenta verificada cuyo UID tenga admins/{UID}.active=true. Nadie puede concederse el rol desde el cliente.
- La cuenta administradora solicitada es la cuenta propietaria confirmada. Verificar su UID en Authentication antes de aprovisionar el permiso desde consola de confianza.
- Historial: correo adulto, proveedor y timestamp del servidor por sesión autenticada; horario argentino, consulta paginada. No muestra visitantes que no se autentiquen ni actividad infantil.
- Suscripción mensual: importe en ARS y centavos enteros. Consultar y guardar solo con rol administrador. No activa pagos, débitos ni servicios facturados.
- La entrada exige una sesión Firebase con email verificado y proveedor Google. La política publicada exige Google; si no se puede leer, no carga los perfiles. Es una barrera del cliente: los datos remotos siguen protegidos por reglas. El cifrado local opcional se conserva dentro de la puerta Google: exige además la contraseña del dispositivo y vuelve a montarse tras cerrar la sesión. No separa los perfiles locales por cuenta; una contraseña local abre todos los perfiles de ese navegador.
- CI usa una política explícita de prueba en dist para los controles funcionales históricos; las pruebas de entrada interceptan esa política con requireGoogle=true y comprueban el bloqueo. El archivo fuente y la compilación de producción conservan true. Nunca subir dist de pruebas como producción.

Activación: habilitar proveedor Google y dominios autorizados en neuroplaneta-bdaf9 manteniendo Spark; publicar reglas probadas; verificar el UID propietario y crear su rol; completar un ingreso Google controlado por el propietario; recién entonces integrar/publicar PR64. No se crearon cuentas ni permisos reales durante las pruebas automáticas.

## Preparación verificada en consola

Authentication identifica al propietario la cuenta propietaria confirmada con UID
el UID verificado en la consola privada. Este UID es identificador, no una credencial.
El documento previsto es `admins/{UID propietario}` con `active: true`
(booleano). El permiso permite consultar accesos y configurar el precio, sin
conceder acceso a perfiles de otras familias. No crear roles por coincidencia
de correo ni permitir al cliente escribir la colección admins.

Los dominios de producción previstos son `gervasiomeana-arg.github.io` y
`neuroplaneta.ai.studio`. No autorizar dominios generales de AI Studio ni comodines.
El editor/preview de AI Studio puede requerir un origen adicional específico;
no debe adivinarse ni habilitarse ampliamente.

Las reglas conservan intacto el aislamiento remoto por UID y los límites de
campos de familia. Registrar accesos informa al adulto antes de autenticar y no
recopila actividad infantil. La consola mantiene Spark y no se habilitan cobros.
Estos cambios de permisos deben confirmarse antes de guardarse en Firebase.
