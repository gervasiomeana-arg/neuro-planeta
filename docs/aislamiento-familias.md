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
