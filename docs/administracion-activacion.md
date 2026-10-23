# Administración, entrada Google y valor mensual

Interfaz preparada en PR64, pendiente de activación del proveedor y reglas en Firebase. No publicar la entrada obligatoria antes de completar esa configuración.

- Administración aparece a la izquierda en la navegación de escritorio y en la entrada con Google. Usa una comprobación adicional de la clave indicada por el propietario, sin persistir lo escrito. Esa comprobación no autoriza: Firebase exige la cuenta verificada cuyo UID tenga admins/{UID}.active=true. Nadie puede concederse el rol desde el cliente.
- La cuenta administradora solicitada es gervasiomeana@gmail.com. Verificar su UID en Authentication antes de aprovisionar el permiso desde consola de confianza.
- Historial: correo adulto, proveedor y timestamp del servidor por sesión autenticada; horario argentino, consulta paginada. No muestra visitantes que no se autentiquen ni actividad infantil.
- Suscripción mensual: importe en ARS y centavos enteros. Consultar y guardar solo con rol administrador. No activa pagos, débitos ni servicios facturados.
- La entrada exige una sesión Firebase con email verificado y proveedor Google. La política publicada exige Google; si no se puede leer, no carga los perfiles. Es una barrera del cliente: los datos remotos siguen protegidos por reglas. No cifra ni separa los perfiles locales originales.
- CI usa una política explícita de prueba en dist para los controles funcionales históricos; las pruebas de entrada interceptan esa política con requireGoogle=true y comprueban el bloqueo. El archivo fuente y la compilación de producción conservan true. Nunca subir dist de pruebas como producción.

Activación: habilitar proveedor Google y dominios autorizados en neuroplaneta-bdaf9 manteniendo Spark; publicar reglas probadas; verificar el UID propietario y crear su rol; completar un ingreso Google controlado por el propietario; recién entonces integrar/publicar PR64. No se crearon cuentas ni permisos reales durante las pruebas automáticas.
