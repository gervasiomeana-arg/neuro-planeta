# Administración, Google y suscripción mensual

Google está habilitado en Firebase Spark. Los dos dominios de producción están autorizados; las reglas probadas están publicadas y el rol de la cuenta propietaria fue guardado desde consola privada. No se publican los identificadores personales del administrador en este documento.

La comprobación real del proveedor ingresó con Google y creó el registro de acceso con correo adulto, proveedor Google y fecha del servidor. El UID del acceso coincide con el permiso administrador active=true. La prueba utilizó un perfil ficticio local, sin vincularlo a una familia ni enviar datos infantiles.

Después de esa comprobación, access-policy.json exige requireGoogle=true. La puerta permanece cerrada si falta la política o la sesión Google verificada. DeviceProtection se conserva dentro de esa puerta: Google no sustituye la contraseña del cifrado local. Desde el cambio 69, el cifrado es obligatorio dentro de la puerta Google y los perfiles se separan por UID con contraseña propia. Los datos globales anteriores quedan preservados y sin asignar; ver aislamiento-perfiles-locales.md. Las fichas remotas mantienen aislamiento por UID.

Administración exige además la clave secundaria que el propietario debe ingresar en el formulario seguro; no es su contraseña Google. El cliente no puede asignarse roles. El intento automatizado inicial de esa clave no completó el ingreso. Posteriormente el titular mostró una captura con Administración desbloqueada en AI Studio; esa evidencia procede del titular, no de una repetición automatizada. El rol y el registro real de Google fueron comprobados en consola.

El historial muestra inicios autenticados de adultos, no visitas anónimas ni actividad infantil. La consulta es paginada. El valor mensual en ARS queda sin definir hasta que lo configure el propietario; guardarlo no ejecuta cobros ni débitos. No se habilitan facturación, Blaze, SMS ni servicios nuevos.

La integración precedente pasó 53 pruebas de navegador, 39 de seguridad y 13 de reglas. Los cambios de política y la aclaración de clave se verifican de nuevo antes de su despliegue. No publicar el dist modificado por las pruebas históricas de CI como producción.
