# Protección local: primera etapa de almacenamiento

Esta etapa incorpora una base de almacenamiento cifrado por UID en `familyVault.ts`.
Se puede usar en Espacio de adultos → Perfiles → Cuenta adulta → Copia privada por cuenta, con correo verificado y confirmación explícita. Guarda o actualiza únicamente el perfil seleccionado; abrir y cerrar muestra u oculta el contenido de la copia. Las contraseñas se descartan del formulario al iniciar cada operación. Cambiar de cuenta, desmontar el panel, ocultar la pestaña o recibir cambios de almacenamiento descarta la vista descifrada y bloquea las respuestas tardías.

Los perfiles actuales de `np_patients` siguen sin cifrar y no se migran, borran ni ocultan automáticamente. La copia privada no se actualiza al jugar: debe guardarse de nuevo explícitamente. No anunciar que el
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

Siguiente etapa: interfaz de activación con cuenta verificada y consentimiento,
respaldo descargado y comprobado, desbloqueo, bloqueo y recuperación de errores;
integración de guardado cifrado antes de retirar cualquier original en texto claro.
No ofrecer recuperación de contraseña sin diseñar una recuperación de claves.
