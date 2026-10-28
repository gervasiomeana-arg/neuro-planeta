# Mensajes de adultos

Se agregó Mensajes inmediatamente después de Informe de uso en el menú de adultos (selector en celular). Administración incorpora Mensajes después de Suscripción mensual.

El formulario envía asunto y texto mediante la API autenticada. El cliente puede consultar sus propios mensajes; la administración puede ver la cuenta remitente, fecha, contenido y marcar como leído. Es mensajería interna, sin entrega a Gmail ni envío externo de email. Esta versión no incorpora respuestas de administración.

El domicilio y correo particulares del responsable no se publican. La configuración pública y los textos no exponen esos valores, incluso si existen variables de entorno del servidor. Las condiciones remiten al canal interno. La contratación sigue deshabilitada; este cambio no certifica el cumplimiento legal comercial.

## Persistencia y permisos

La colección nueva `supportMessages` se escribe exclusivamente desde Firebase Admin en el servidor. Las reglas actuales ya impiden acceso directo de clientes a colecciones no autorizadas: no requieren ampliación para mensajes. Se verifica Google con token no revocado y el rol administrador del servidor. La cuenta remitente se obtiene del token, nunca del cuerpo enviado. No se adjuntan perfiles, informes ni registros infantiles.

Se usa un identificador estable para reintentar un envío sin duplicarlo dentro del mismo formulario. El formulario conserva el texto ante errores y solo confirma recepción cuando responde el servidor. Paginación de 50 mensajes, por referencia de documento; el orden no es cronológico. Sin lectura automática en segundo plano. Los mensajes están incluidos en la exportación de cuenta y en una supresión expresamente solicitada; no se borran por cancelar la suscripción o revocar el registro de actividades del niño.

## Publicación

Guardar en GitHub no actualiza por sí solo AI Studio. Publicar la versión nueva y verificar el servidor con credenciales Application Default Credentials autorizadas en `neuroplaneta-bdaf9` (Firebase Auth y Firestore). No se necesitan credenciales PayPal para usar mensajes. `COMMERCIAL_APP_URL` debe coincidir con el origen HTTPS; para el dominio actual el canal admite por defecto `https://neuroplaneta.ai.studio` si esa variable no existe. Sin permisos de servidor no se confirma un envío: se muestra el error y se conserva el texto.

Las pruebas aisladas usan cuentas y contenido ficticios. La aceptación final requiere un envío desde la versión publicada y su lectura con la cuenta administradora. No se modificaron registros de familias ni se enviaron mensajes reales durante el desarrollo.
