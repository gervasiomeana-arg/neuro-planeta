# Google e historial de accesos adultos

Continuar con Google usa Firebase Auth y selección explícita de cuenta, con la
misma persistencia de pestaña e inactividad que correo/contraseña. Requiere marcar
que se es adulto. No vincula automáticamente perfiles locales ni fusiona cuentas
existentes. Si ya existe una cuenta con otro proveedor, usar ese acceso.

Un inicio de sesión adulto exitoso y verificado intenta registrar correo adulto,
UID, proveedor y hora del servidor en accessEvents. El documento usa UID y el
instante auth_time firmado para no duplicar una sesión. No se registran visitas
anónimas, aperturas infantiles, IP, ubicación, contraseñas, tokens ni notas.
El registro depende de conectividad y reglas publicadas; un fallo no bloquea
el acceso y se informa. No es un registro forense completo de Firebase.

## Administración

Cuenta adulta contiene Administración · accesos. Antes de consultar, comprueba
admins/{UID}.active. Las reglas del servidor vuelven a comprobar ese permiso.
Ningún cliente puede crear, modificar, borrar ni enumerar administradores.
Una contraseña compartida incrustada en JavaScript no concede permisos.
No se agrega una clave administrativa al código.

La consulta es manual, de 50 en 50, ordenada por createdAt. La tabla muestra
correo, proveedor y fecha/hora de America/Argentina/Buenos_Aires. Cerrar la vista,
ocultar la pestaña, cerrar sesión o cambiar cuenta descarta los registros visibles.
No hay suscripciones en tiempo real ni carga completa automática del historial.

## Activación pendiente en Firebase

El código no habilita Google ni publica reglas por sí mismo. Antes de anunciarlo:

1. Confirmar el correo y UID exactos del propietario que será administrador.
2. Habilitar Google en Authentication → Sign-in method, indicar correo de soporte
   y comprobar dominios autorizados. Mantener Spark sin facturación.
3. Publicar firestore.rules solo tras aprobar las pruebas del emulador.
4. Desde consola de confianza crear admins/{UID propietario} con active: true.
   Nunca desde la app ni para un UID no confirmado.
5. Probar un acceso real controlado por el propietario y comprobar la tabla.
   Las pruebas automáticas no crean cuentas Google ni usuarios de producción.

Los registros empiezan a partir de la activación: no reconstruyen visitas
históricas. No se configuran TTL, Functions ni limpiezas pagas. Definir retención
antes de ampliar el uso comercial; el cliente no puede alterar o borrar registros.

Documentación oficial: https://firebase.google.com/docs/auth/web/google-signin
https://firebase.google.com/docs/rules/rules-and-auth
