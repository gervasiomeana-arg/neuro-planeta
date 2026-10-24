# Cuentas adultas: primera etapa, Firebase Spark

Proyecto independiente creado desde la consola: `neuroplaneta-bdaf9`. La consola confirmó Spark, sin costo mensual. Se desactivaron Gemini y Analytics durante el alta. Email/Password y Google están habilitados; política de contraseña en modo obligatorio con mínimo 12 caracteres. Sin Cloud Storage, SMS, Functions, cuenta de facturación ni actualización a Blaze.

En Espacio de adultos → Perfiles → Cuenta adulta se pueden crear cuentas, ingresar, solicitar verificación de correo, recuperar contraseña y cerrar sesión mediante Firebase Auth. La recuperación usa el manejador de acciones de Firebase, sin una pantalla propia que recopile códigos. El SDK está fijado a una versión exacta. La configuración web pública no contiene claves administrativas ni credenciales de servicio. La contraseña no se incorpora a perfiles y se descarta al completar cada operación o desmontar el panel. Los errores de acceso son genéricos. El registro requiere confirmar que se es adulto y que se autoriza el uso de ese correo.

La persistencia de Auth se limita a la sesión de la pestaña. Cerrar el panel no cierra la sesión de Firebase; para cerrar una sesión se usa «Cerrar sesión adulta». El cierre por inactividad sigue siendo una precaución local, no revocación de tokens. Una sesión en el navegador no evita acceso a localStorage mediante herramientas del dispositivo.

## Límite de esta etapa

Las cuentas adultas son identidades independientes de los perfiles locales. No se asocia, sube, mezcla ni migra un perfil al ingresar. Solo el adulto con correo verificado puede confirmar el envío de una ficha mínima de apodo y rango de edad a su familia en Firestore. No hay sincronización del perfil completo. El candado aritmético sigue siendo una barrera local y la cuenta aún no reemplaza esa barrera. Tener una cuenta no activa el cifrado: el guardado principal tiene una protección opcional independiente, descrita en proteccion-local.md. La IA pública continúa bloqueada.

Las reglas publicadas de Firestore exigen autenticación y correo verificado, aíslan por UID y validan campos y tamaños. Se probaron en el emulador y se comprobaron rechazos en producción sin subir perfiles reales. Fotos y voces familiares quedan locales para evitar Cloud Storage/Blaze. La vinculación conserva los originales y descarta el borrador al cambiar de cuenta o perfil. Ver [aislamiento-familias.md](aislamiento-familias.md) para el alcance y las pruebas.

## Verificación

TypeScript, compilación y batería de seguridad existentes; dos pruebas nuevas de navegador con solicitudes de Auth simuladas: consentimiento/longitud y acceso fallido con contraseña descartada, sin cambiar ni enviar datos del perfil. No se envían correos reales durante esas pruebas. Estas pruebas no sustituyen una prueba completa de registro/verificación/recuperación con una casilla controlada por el propietario. No se crean usuarios con contraseñas elegidas por el agente.

Referencias oficiales: https://firebase.google.com/docs/auth/web/password-auth y https://firebase.google.com/docs/projects/billing/firebase-pricing-plans .

## Refuerzo de recuperación y privacidad del formulario

La recuperación muestra la misma respuesta neutral para correos existentes, inexistentes y otros errores del proveedor. Solo distingue fallos de red y exceso de intentos, sin exponer códigos internos. La contraseña se retira del formulario antes de esperar la respuesta, además de limpiarse al finalizar. Cerrar sesión también limpia el correo y la casilla de consentimiento. Esto no reemplaza la protección contra enumeración y las cuotas del proveedor, ni oculta tiempos de respuesta o llamadas inspeccionadas desde herramientas del navegador.

Una prueba de navegador intercepta todas las llamadas a Auth y compara recuperación exitosa e EMAIL_NOT_FOUND, verificando que no se envíen datos infantiles. No envía correos reales.

## Sesión adulta por inactividad

Auth instala un único guardián independiente del montaje del formulario. Tras 15 minutos sin interacción dentro del panel adulto abierto, solicita signOut de Firebase. Las acciones del espacio infantil, el foco y volver de una pestaña oculta no renuevan el plazo. Antes de aceptar una nueva interacción comprueba que el plazo no haya vencido; volver de suspensión fuerza esa comprobación aunque los temporizadores del navegador hayan estado pausados.

Se conserva únicamente la última actividad por UID en sessionStorage para que recargar la página no reinicie el plazo. Una fecha inválida, futura o un fallo de almacenamiento solicita cierre de sesión. Al cerrar o cambiar de adulto se limpia el marcador anterior; no se borran perfiles, fotos o avances. Si el SDK informa que no pudo completar signOut y el formulario está montado, se muestra una indicación para cerrar la pestaña antes de compartir el dispositivo.

Este cierre es una precaución del navegador: no revoca tokens en otros dispositivos, no cifra localStorage y no sustituye las reglas de Firestore. La vinculación explícita solo guarda la ficha mínima; no sube el perfil completo. Pruebas unitarias cubren interacción infantil/adulta, suspensión, recarga, manipulación del reloj/metadatos y preservación de datos; una prueba de navegador utiliza Auth completamente simulado para comprobar el cierre real del SDK sin crear cuentas ni contactar al proveedor.
