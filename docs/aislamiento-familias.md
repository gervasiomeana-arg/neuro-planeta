# Aislamiento por familia: reglas y pruebas

## Modelo

Una cuenta adulta equivale inicialmente a una familia. La familia se identifica por el UID de Firebase Auth, no por un correo ni por un identificador que el cliente pueda elegir. No hay invitaciones, cuentas de terapeutas compartidas ni roles de administrador desde la app en esta etapa.

`families/{uid}` contiene solo ownerUid, schemaVersion=1, createdAt y updatedAt. `families/{uid}/profiles/{id}` admite además nickname (1–60 caracteres) y ageRange (3-5, 6-8, 9-10). Las marcas temporales se escriben con serverTimestamp. El propietario no puede cambiar createdAt. Fotos, voces, notas, premios, avances y otros campos quedan expresamente fuera del esquema habilitado. Cualquier colección no prevista se rechaza.

## Permisos

- Usuario anónimo o correo sin verificar: ningún acceso.
- Propietario con correo verificado: acceso solo a su UID, aunque conozca la ruta de otra familia.
- Lectura de perfiles en listas: límite explícito de hasta 20 documentos por consulta.
- Enumeración de familias, consultas globales de perfiles y subcolecciones arbitrarias: rechazadas.
- Cambiar ownerUid, introducir miembros/roles o campos no previstos: rechazado.
- Borrar el documento raíz de familia: rechazado para no dejar perfiles huérfanos; la eliminación completa requiere un flujo específico futuro.

Estas reglas son controles del servidor de Firestore. Los SDK administrativos las omiten: no se incluyen ni se entregan credenciales administrativas al navegador. La política del cliente no sustituye estas reglas.

## Pruebas reproducibles sin datos reales

`npm run test:families` descarga la CLI oficial fijada a 15.34.1 y ejecuta el emulador oficial de Firestore con Node 24 y Java 21. El ID demo-neuroplaneta-isolation no es el proyecto real. Las pruebas exigen FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 y no crean usuarios ni envían correos. Usan @firebase/rules-unit-testing 6.0.0 para simular identidades. El workflow Aislamiento de familias ejecuta los casos automáticamente al cambiar reglas, configuración o dependencias.

Se prueban accesos permitidos del propietario y rechazos para otra familia, anónimos, correo sin verificar, propietario falsificado, rol admin reclamado, campos/tipos/fechas inválidos, consultas globales y rutas no previstas. No se necesita facturación, API privada ni secretos de producción.

## Activación y límites

Las reglas deben publicarse en el proyecto correcto neuroplaneta-bdaf9, sobre Firestore Standard en modo de producción y manteniendo el plan Spark. No usar modo de prueba, no abrir permisos temporales y no activar Storage/Blaze. El despliegue de reglas requiere una sesión del propietario en Firebase; las pruebas del emulador no despliegan reglas.

La app sigue sin inicializar Firestore y la CSP no habilita ese endpoint. No se sube ni se migra ningún perfil al iniciar sesión. Estas reglas no aíslan, cifran ni protegen el localStorage ya existente: los perfiles del dispositivo siguen accesibles a quien use ese navegador. Una integración futura requiere confirmación explícita de qué perfil se vincula, copias conservadas, cachés separadas por UID y descarte de estado al cambiar de cuenta. No activar escrituras infantiles hasta verificar reglas publicadas e integración de extremo a extremo. La primera etapa solo habilita un esquema mínimo de apodo y edad, no sincronización completa.

Fuentes oficiales: https://firebase.google.com/docs/firestore/security/rules-conditions, https://firebase.google.com/docs/firestore/security/rules-fields y https://firebase.google.com/docs/rules/unit-tests.

## Vinculación explícita de ficha mínima

En Cuenta adulta, solo con correo verificado, el adulto puede escribir un apodo y confirmar el envío del apodo y rango de edad del perfil seleccionado. No se envía el nombre local ni el ID local, fotos, voces, notas, historias o avances. El perfil local original no se modifica ni se asigna silenciosamente a una familia. La ficha mínima no sincroniza el perfil completo ni protege localStorage.

El repositorio deriva la ruta de la identidad autenticada, comprueba la verificación del token y usa un identificador SHA-256 estable por UID e ID local. Una transacción crea los metadatos de familia y la ficha solo si faltan. Reintentar con el mismo apodo y edad es idempotente; una ficha existente distinta produce conflicto y no se sobrescribe. Firestore Lite usa REST sin caché persistente ni cola de escrituras offline. La CSP añade únicamente firestore.googleapis.com.

Se invalida la sesión cliente mediante una versión al cambiar/cerrar cuenta o vencer el tiempo de inactividad. Las comprobaciones antes/después de operaciones asíncronas descartan respuestas de una sesión anterior. El formulario se desmonta y descarta el borrador al cambiar cuenta, perfil o edad. Esto no revoca peticiones que ya hayan llegado al servidor: si se interrumpe una solicitud, reintentar permite confirmar el mismo vínculo sin duplicar datos. Las reglas del servidor siguen siendo la autorización efectiva.

La opción Ya verifiqué mi correo recarga el usuario y renueva su token. Las pruebas de navegador interceptan tanto Auth como Firestore: no crean cuentas ni documentos reales. La prueba de integración verifica consentimiento, lista cerrada de campos, idempotencia, conservación del perfil y limpieza al cerrar sesión.
