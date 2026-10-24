# Perfiles locales separados por cuenta adulta

La puerta Google verificada monta un almacenamiento exclusivo por UID. No hay
fallback al antiguo `np_patients` ni a otro adulto. Cada cuenta nueva crea un
espacio vacío cifrado con una contraseña elegida por la persona adulta, distinta
de Google. La contraseña y la clave criptográfica no se persisten. Google por sí
solo no descifra los perfiles. Cambiar de cuenta desmonta el espacio anterior.

Las lecturas y escrituras comprueban la sesión vigente, incluso después de tareas
criptográficas pendientes. Los cambios de otras cuentas en el almacenamiento no
se interpretan como cambios propios. Los perfiles, notas, voces, imágenes y
avances permanecen dentro del contenedor cifrado de su cuenta. Las preferencias
de dispositivo/audio y el ID opaco del perfil activo continúan siendo locales y
compartidos; no contienen el listado de perfiles ni permiten abrir otro espacio.

## Publicación y datos anteriores

Antes de publicar, el propietario debe descargar y comprobar una copia cifrada
de los perfiles existentes desde Adultos → Perfiles → Copias de seguridad.
Después de la actualización, debe crear su espacio con la cuenta Google correcta
e importar esa copia desde la misma sección, revisando antes de confirmar.
Las copias se agregan como perfiles nuevos; el origen no se borra ni se reasigna.

El almacenamiento global anterior queda intacto, sin dueño inferido y sin ser
montado en la app. No se asigna a la primera cuenta que ingresa, ni siquiera al
administrador. Si ya era una copia cifrada, se puede descargar desde la pantalla
de creación de espacio; sigue haciendo falta su contraseña anterior para abrirla.
Si era texto claro y no existe respaldo, hay que preparar su recuperación antes
de desplegar, en el dispositivo original. No anunciar migración automática.

La separación nueva no borra forensemente restos, capturas o descargas anteriores.
Los datos anteriores sin cifrar siguen necesitando recuperación y tratamiento
explícito. No protege contra código malicioso en una sesión ya desbloqueada ni
contra quien conoce la contraseña y dispone de la copia cifrada. Conservar
respaldos actualizados y esperar Guardado cifrado completo antes de cerrar sesión.

## Comprobaciones

Pruebas con cuentas y perfiles ficticios: A y B usan claves físicas diferentes;
B no hereda A ni los datos globales; las contraseñas son independientes; cambiar
la sesión bloquea operaciones tardías; cuota y creación concurrente conservan la
versión anterior. Un recorrido de navegador crea perfiles A/B, vuelve a A y
rechaza la contraseña B. No crea usuarios reales ni sube datos infantiles.

La política Google deshabilitada conserva el modo antiguo exclusivamente para
las pruebas históricas aisladas. La política de producción debe seguir en true.
Las reglas remotas de Firestore y los permisos de Administración no cambian.
