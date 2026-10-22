# Cuentas adultas: primera etapa, Firebase Spark

Proyecto independiente creado desde la consola: `neuroplaneta-bdaf9`. La consola confirmó Spark, sin costo mensual. Se desactivaron Gemini y Analytics durante el alta. Email/Password es el único proveedor habilitado; política de contraseña en modo obligatorio con mínimo 12 caracteres. Sin Cloud Storage, SMS, Functions, cuenta de facturación ni actualización a Blaze.

En Espacio de adultos → Perfiles → Cuenta adulta se pueden crear cuentas, ingresar, solicitar verificación de correo, recuperar contraseña y cerrar sesión mediante Firebase Auth. La recuperación usa el manejador de acciones de Firebase, sin una pantalla propia que recopile códigos. El SDK está fijado a una versión exacta. La configuración web pública no contiene claves administrativas ni credenciales de servicio. La contraseña no se incorpora a perfiles y se descarta al completar cada operación o desmontar el panel. Los errores de acceso son genéricos. El registro requiere confirmar que se es adulto y que se autoriza el uso de ese correo.

La persistencia de Auth se limita a la sesión de la pestaña. Cerrar el panel no cierra la sesión de Firebase; para cerrar una sesión se usa «Cerrar sesión adulta». El cierre por visibilidad sigue siendo una precaución local, no revocación de tokens. Una sesión en el navegador no evita acceso a localStorage mediante herramientas del dispositivo.

## Límite de esta etapa

Las cuentas adultas son identidades independientes de los perfiles locales. No se asocia, sube, mezcla ni migra un perfil al ingresar. No hay sincronización de datos infantiles ni base Firestore abierta. El candado aritmético sigue siendo una barrera local y la cuenta aún no reemplaza esa barrera. Tener una cuenta no cifra ni protege los perfiles existentes del dispositivo. La IA pública continúa bloqueada.

Antes de conectar datos: reglas de Firestore que exijan usuario autenticado y correo verificado, colección por UID, validación de campos y tamaños, prohibición de acceso entre dos adultos, rechazo anónimo y pruebas con emulador. La importación de perfiles locales debe ser explícita y revisable, manteniendo los originales. Fotos y voces familiares quedan locales para evitar Cloud Storage/Blaze. Separar también cachés de cada cuenta y descartar datos en memoria al cambiarla; no usar el UID informado por el cliente como autorización suficiente.

## Verificación

TypeScript, compilación y batería de seguridad existentes; dos pruebas nuevas de navegador con solicitudes de Auth simuladas: consentimiento/longitud y acceso fallido con contraseña descartada, sin cambiar ni enviar datos del perfil. No se envían correos reales durante esas pruebas. Estas pruebas no sustituyen una prueba completa de registro/verificación/recuperación con una casilla controlada por el propietario. No se crean usuarios con contraseñas elegidas por el agente.

Referencias oficiales: https://firebase.google.com/docs/auth/web/password-auth y https://firebase.google.com/docs/projects/billing/firebase-pricing-plans .
