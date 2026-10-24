# Protección local de perfiles

Esta etapa incorpora una base de almacenamiento cifrado por UID en `familyVault.ts`.
Se puede usar en Espacio de adultos → Perfiles → Cuenta adulta → Copia privada por cuenta, con correo verificado y confirmación explícita. Guarda o actualiza únicamente el perfil seleccionado; abrir y cerrar muestra u oculta el contenido de la copia. Las contraseñas se descartan del formulario al iniciar cada operación. Cambiar de cuenta, desmontar el panel, ocultar la pestaña o recibir cambios de almacenamiento descarta la vista descifrada y bloquea las respuestas tardías.

Sin activar la protección principal descrita abajo, los perfiles de `np_patients` siguen sin cifrar. La copia privada no los migra, borra ni oculta automáticamente. La copia privada no se actualiza al jugar: debe guardarse de nuevo explícitamente. No anunciar que el
dispositivo ya está protegido ni que existe aislamiento completo entre adultos.

Las copias privadas usan el cifrado existente AES-256-GCM, sal e IV aleatorios y
PBKDF2-SHA256 de 600.000 iteraciones. La ruta por UID se autentica como datos
adicionales: copiar el contenido cifrado de una familia a otra no permite abrirlo,
incluso usando la misma contraseña. Las copias exportables anteriores conservan
su formato y compatibilidad porque su contexto autenticado no cambia.

Cada lectura devuelve una revisión opaca. Antes de escribir se exige la revisión
actual, se comprueba la contraseña del contenido anterior y se vuelve a comprobar
la sesión y la revisión después de cifrar. Un fallo de cuota conserva la versión
anterior mediante setItem atómico. No hay escrituras de red ni claves persistidas.
El UID por sí solo no autoriza ni cifra: las funciones necesitan una contraseña
y una comprobación de sesión suministrada por el integrador.

Las pruebas usan únicamente perfiles ficticios: intercambio de UID, contraseña
incorrecta, conservación de originales, revisión obsoleta, cuota y cambio de sesión
durante cifrado/descifrado. No sustituyen una auditoría criptográfica independiente.

## Guardado principal cifrado del dispositivo

Espacio de adultos → Perfiles → Copias de seguridad → Proteger el guardado principal.
La persona adulta elige y repite una contraseña de 12 a 256 caracteres. La app cifra,
descifra y valida un respaldo compatible `.npbackup`, inicia su descarga y exige
confirmar que se descargó y que se conservó la contraseña. Esta confirmación es
humana: el navegador no certifica que la persona haya guardado el archivo.

La activación comprueba que los perfiles no cambiaron mientras se preparaba el
respaldo y reemplaza atómicamente `np_patients`. Un error de cuota o conflicto
conserva el contenido anterior. No se activa automáticamente ni exige Google.
La contraseña es única para todos los perfiles de ese navegador, no por adulto.

El guardado posterior cifra cada cambio en una cola ordenada con IV nuevo y una
clave AES no extraíble que solo vive en memoria; no persiste contraseña ni clave.
Antes y después del cifrado se compara la revisión para evitar sobrescribir otra
pestaña. Si falla un guardado, se conservan los cambios en memoria, se avisa y se
puede reintentar o exportar. El bloqueo manual espera la cola y se rechaza si quedan
cambios pendientes. Cerrar o recargar exige desbloquear de nuevo antes de montar
la app. El aviso al salir es de mejor esfuerzo, no una garantía ante fallos de energía.
No hay bloqueo automático por inactividad ni al cerrar la cuenta Firebase.

La pantalla bloqueada permite descargar el archivo cifrado sin borrar ni reiniciar
los perfiles. Puede recuperarse como copia en otro navegador con la contraseña.
No hay recuperación de una contraseña olvidada. Se deben conservar respaldos
actualizados; la copia inicial no incluye los avances posteriores.

Alcance: nombres, notas, imágenes, voces y avances dentro de `np_patients`.
Preferencias, ID opaco del perfil activo, archivos descargados y copias antiguas
quedan fuera. No garantiza borrado forense del almacenamiento anterior ni protege
frente a código malicioso ejecutándose en una sesión desbloqueada. No equivale
al aislamiento por cuenta ni a una auditoría de seguridad independiente.

Validación automatizada: datos ficticios, respaldo portátil, escritura ordenada,
bloqueo, contraseña incorrecta, fallo de cuota con reintento, conflicto entre
pestañas y conservación del original cuando falla la activación. La prueba de
navegador recorre activación, creación de otro perfil, bloqueo y recarga.

La rama pendiente de Google/Administración debe integrar ambos proveedores en
`App.tsx` al actualizarse; no debe reemplazar ni omitir `DeviceProtection`.
