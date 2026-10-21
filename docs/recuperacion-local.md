# Recuperación local y copias cifradas

En Espacio de adultos → Perfiles → Copias de seguridad se puede descargar una copia de todos los perfiles del navegador. Se cifra en el dispositivo con AES-256-GCM y una clave derivada de una contraseña mediante PBKDF2-SHA256 (600.000 iteraciones, sal aleatoria de 16 bytes e IV aleatorio de 12 bytes). La contraseña no se guarda ni se envía. No se puede recuperar una contraseña olvidada. El cifrado protege el archivo exportado; los perfiles que usa la app siguen en localStorage sin ese cifrado.

Para restaurar se selecciona el archivo .npbackup, se ingresa la contraseña y se revisan los nombres. Solo «Agregar perfiles como copias» realiza el guardado. Crea IDs nuevos y conserva perfiles existentes; cancelar o fallar no modifica el almacenamiento. No es una sincronización ni deduplica restauraciones repetidas. Una copia restaurada puede reiniciar avances diarios de fechas anteriores al abrir el perfil, según la lógica diaria existente. El archivo incluye notas, imágenes y voces: guardarlo y compartirlo solo con personas autorizadas.

Si el navegador está vacío, el acceso inicial ofrece «Adultos: recuperar una copia anterior». La copia descargada es manual; el mensaje de descarga no garantiza que el usuario haya conservado el archivo. No se ofrece respaldo automático o en nube.

Si el JSON o su estructura no se pueden leer, la app detiene escrituras y conserva la cadena original. Ofrece un rescate cifrado para revisión técnica; no intenta reparar ni restaurar automáticamente datos dañados. No borrar datos del navegador antes de obtener ayuda. Errores de cuota muestran aviso y permiten descargar el estado en memoria antes de cerrar. Cambios detectados en otra pestaña detienen escrituras de la sesión antigua. La comprobación de versión y el evento storage reducen sobrescrituras; no sustituyen transacciones de una base de datos ni prometen resolver escrituras exactamente simultáneas.

Pruebas: cifrado/descifrado, contraseña incorrecta, archivo alterado, costo KDF manipulado, esquema inválido, datos dañados, cuota y conflictos. Pruebas en navegador verifican la descarga y restauración en un contexto nuevo con revisión/cancelación, y la preservación de datos originales. Solo se usan perfiles ficticios. Evidencia final en el PR de esta etapa.

Referencias: Web Crypto deriveKey/encrypt de MDN y guías OWASP de almacenamiento criptográfico/contraseñas, consultadas el 21/10/2026. No se afirma certificación criptográfica o auditoría independiente.
