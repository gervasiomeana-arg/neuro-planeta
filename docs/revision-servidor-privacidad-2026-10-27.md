# Servidor, Firebase, privacidad y condiciones

## Estado y límites

Revisión del código guardado en main, a partir de f0f675f0c11b759368887e161879d907e8de9d33. No se modificaron permisos de producción, cuentas, perfiles ni solicitudes reales. No se ejecutaron borrados, cobros ni depuraciones. La inspección inicial quedó bloqueada por el inicio de sesión Google. Tras autorización expresa del titular se accedió a Firebase en modo de lectura y se comprobaron las reglas publicadas, el proveedor Google, el dominio actual autorizado y la región de Firestore. **No se certifican aún los permisos IAM de la identidad del servidor, secretos ni región del despliegue**: el enlace oficial de Google Cloud mostró “Site Unavailable”, también después de una recarga. No se intentaron vías alternativas con credenciales.

El backend usa Firebase Admin con Application Default Credentials, que **no se somete a las reglas de clientes de Firestore**. La seguridad exige ambas capas: IAM de la identidad de servicio y autorización de cada API. Abrir reglas de clientes no arregla una falta de permisos IAM del servidor.

## Punto 3: autorización y diagnóstico

Las API verifican el token de Google, correo verificado, revocación y rol administrador real en `admins/{uid}`. El navegador no puede asignarse permisos. Las operaciones de cuenta que cambian datos exigen autenticación reciente, origen HTTPS permitido, límites de tamaño y frecuencia. Los mensajes mantienen la autorización de cuenta y los límites, sin exigir volver a ingresar cada diez minutos.

La sección Administración → Privacidad y devoluciones → Servidor y Firebase agrega una comprobación autenticada de **lectura** de Auth y de seis colecciones. Firestore proyecta solo referencias, con límite de un documento; la respuesta nunca contiene los documentos, correos, identidades de servicio ni errores del proveedor. No prueba escrituras, eliminación, PayPal ni despliegue de reglas. Su propia autenticación puede fallar si ADC/Auth/Firestore no están habilitados; en ese caso no informa éxito.

Se conserva la prohibición de acceso directo desde clientes a `supportMessages`, `dataRightsRequests`, `dataRightsRequestKeys`, `commercialAccounts`, `commercialBindings`, `commercialReceipts`, `commercialWebhookEvents` y `commercialLimits`, incluso para el cliente administrador. Esas operaciones pasan por la API.

`ops/server-runtime-role.json` es una **propuesta de rol personalizado**, no aplicada ni validada contra IAM real. Incluye lectura de Auth para comprobar revocación y supresión de usuarios para el cierre expresamente solicitado, además de las operaciones de documentos y transacciones Firestore. No concede administración de IAM, claves, proveedores de acceso ni lectura de hashes de contraseña. Confirmar los permisos efectivos requeridos en el entorno antes de asignarlo. IAM no aísla por familia: esa responsabilidad queda en la API. La identidad solo debe vincularse con `neuroplaneta-bdaf9` y con los recursos que efectivamente usa el servidor; no otorgar Owner/Editor global para resolver errores.

Pasos pendientes de producción:

1. Identificar la revisión publicada, proyecto Cloud Run y cuenta de servicio adjunta desde su configuración real. No deducirlos de la cuenta Google administradora.
2. Inspeccionar IAM de esa identidad en el proyecto Firebase y comprobar los permisos necesarios. Revisar la propuesta antes de concederlos; no ampliar permisos sin aprobación concreta.
3. Usar ADC del alojamiento, sin JSON privado en GitHub, frontend, mensajes ni capturas compartidas. Confirmar Node >=22.12 y el origen COMMERCIAL_APP_URL. El dominio actual es el origen predeterminado si esa variable no existe.
4. Ejecutar el diagnóstico privado después de publicar. Comprobar un mensaje ficticio desde la cuenta adulta y su lectura en administración, y una solicitud de privacidad. Esas pruebas crean solo los registros acordados; no borrar usuarios o datos existentes para probar permisos.
5. La eliminación de Auth y la depuración real requieren una prueba independiente en un proyecto de ensayo, no una cuenta familiar en producción. No se presentan como verificadas por el diagnóstico de lectura.

## Punto 4: controles corregidos

- El consentimiento de privacidad se exige en el espacio aislado de una cuenta aunque los cobros y la preparación comercial estén desactivados. La revocación detiene las actividades; permite volver a consentir, conservar copias y gestionar datos. No borra datos por sí sola.
- Mensajes también está disponible en la pantalla de cuenta cuando el acceso está detenido, sin exigir suscripción vigente.
- La rectificación requiere explicar qué dato de la cuenta corregir (hasta 500 caracteres). No solicita datos del niño. Si ya existe una solicitud pendiente con otro detalle, el texto no se reemplaza silenciosamente: se conserva en el formulario ante el error y se puede comunicar por Mensajes indicando la referencia.
- El adulto consulta hasta 50 solicitudes conservadas, estado y respuesta. La exportación autenticada de cuenta incluye el historial conservado completo. La administración registra una respuesta antes de cerrar una solicitud de acceso, rectificación o devolución. Una respuesta de devolución no ejecuta el reintegro: el responsable debe verificarlo y tramitarlo en PayPal.
- Una supresión o revocación no se puede cerrar solo con “gestión completada”: requiere completar el procedimiento de supresión del servidor. El control de suscripciones y la exclusión de cuentas administradoras se mantienen. Las copias locales y descargas siguen bajo control de sus titulares.
- Una solicitud nueva del mismo tipo conserva la respuesta de la anterior con una referencia nueva y un índice privado que evita duplicar solicitudes abiertas; la solicitud anterior y su referencia permanecen intactas, sujetas al mismo vencimiento. No se borra el historial al reabrir.
- Privacidad informa los plazos de la Ley 25.326: acceso, diez días corridos; rectificación/actualización/supresión, cinco días hábiles. Los feriados se revisan manualmente; no hay un contador que invente una fecha legal.
- Las condiciones explicitan la revocación de la compra a distancia en los casos de la Ley 24.240, sin limitar otros derechos. La versión de política cambió a 2026-10-27.2.
- El domicilio y correo particulares del responsable no se publican. Su sustitución por contacto interno es una decisión de producto, **no una conclusión de suficiencia legal para vender**. Antes de activar cobros se debe resolver la identificación e información del proveedor que corresponda y la revisión comercial aplicable, respetando la decisión de no publicar los datos particulares.

## Procedimiento operativo para el responsable

Cada día hábil: revisar Mensajes y solicitudes; comprobar fecha y alcance, responder con referencia y priorizar los plazos legales. No pedir contraseñas, fotos, voces o diagnósticos para resolver una consulta de cuenta. No marcar devolución completada sin verificar el pago y reintegro. Antes de cerrar una cuenta, coordinar cancelación y copia de respaldo y avisar que no podrá consultar el estado después del cierre.

La conservación de accesos/eventos/solicitudes cerradas se ejecuta desde el control manual existente. Su política habla de depuración mediante mantenimiento, no de una tarea ya programada. Revisar vencimientos periódicamente y conservar los comprobantes exigibles de forma restringida. No se programó ni ejecutó un borrado automático durante esta revisión. Un plazo de conservación no es motivo para borrar familias o perfiles al cancelar la suscripción.

Quedan por confirmar en el servicio real: región y proveedores efectivos, mecanismo de incidentes, revisión de transferencias y demás obligaciones aplicables a la actividad. No se ofrece un certificado de cumplimiento ni se habilita la venta por haber pasado pruebas de software.

## Fuentes primarias

- https://firebase.google.com/docs/admin/setup
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/firestore/security/iam
- https://docs.cloud.google.com/iam/docs/roles-permissions/firebaseauth
- https://www.argentina.gob.ar/aaip/datospersonales/derechos
- https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion
- https://www.argentina.gob.ar/normativa/nacional/638/actualizacion

## Validación del candidato

TypeScript y compilación de producción aprobados. 70 pruebas de seguridad/datos aprobadas. 22 escenarios de navegador aprobados: consentimiento/revocación, borrado selectivo, solicitudes, mensajes, respaldo cifrado transferible, aislamiento entre cuentas y entrada a los 25 juegos en tres tamaños. Tras ampliar la prueba administrativa se repitieron los tres escenarios afectados: diagnóstico de lectura y respuesta, privacidad con cobros apagados y rectificación con seguimiento; los tres pasaron. La preservación de referencias históricas y el bloqueo de cierre sin supresión se probaron con almacenamiento ficticio. No se ejecutaron estas pruebas contra datos reales ni se afirma haber validado IAM mediante mocks.


## Comprobación posterior en la consola real

- Reglas activas: publicación del 25 de octubre a las 17:02. Se revisaron todas sus secciones mediante navegación de lectura del editor. Se mantienen límites por familia, restricciones de administración, precio ARS/USD y denegación final de colecciones no autorizadas. No se publicó otra versión.
- Google está habilitado y el dominio actual de NeuroPlaneta está autorizado. Existe también el proveedor histórico de correo/contraseña; no se cambió.
- La base predeterminada de Firestore indica región `southamerica-east1`, edición Standard y modo nativo. La documentación oficial identifica esa región como São Paulo. Se añadió esta precisión a la política de privacidad sin atribuir esa ubicación al resto de servicios Google o PayPal.
- Firebase muestra las copias programadas de la base como desactivadas. Esto es distinto del respaldo cifrado que cada adulto descarga para sus perfiles locales. No se activaron servicios facturables ni se generó una copia de datos reales durante la revisión.
- La cuenta del titular tiene rol Owner en Firebase. Este rol no demuestra cuál es la identidad que usa el servidor publicado ni sus permisos efectivos. Hay cuentas de servicio registradas, pero Google Cloud no pudo cargar sus permisos avanzados en este navegador. No se generan claves privadas para suplir esa limitación.
- Se observó un correo de soporte ya configurado en los ajustes públicos del proyecto Firebase. Se informa al titular por el canal privado, sin copiar el valor en este informe ni cambiarlo durante la revisión. Ocultar el correo en la app no elimina la configuración de soporte del proveedor Google.

Pendiente para cerrar el punto 3: identificar la cuenta de servicio de la revisión publicada y contrastar sus permisos en Google Cloud con las operaciones requeridas; después comprobar el diagnóstico y la recepción de un mensaje/solicitud en la versión publicada. El acceso del titular a Firebase no reemplaza esa prueba de la identidad del servidor.

Fuente de ubicación: https://firebase.google.com/docs/firestore/locations?hl=en
