# Verificación de exportación de cuenta

Base comprobada en GitHub: `5becf830fe40fb1afc02c4ab541a03383f0ada47`.

## Evidencia disponible

El titular aportó capturas de la concesión de los dos roles previstos a la identidad del servidor en el proyecto Firebase de NeuroPlaneta y del diagnóstico publicado con sus siete comprobaciones de lectura correctas. También confirmó envío y recepción de mensajes entre el espacio adulto y Administración. Una captura posterior muestra una solicitud de acceso registrada y pendiente. Su cierre y la respuesta visible al solicitante todavía no están confirmados.

No se modificaron permisos, datos de producción, cobros ni configuración publicada durante esta revisión. No se publican capturas de consolas privadas ni datos de contacto personales.

## Exportación revisada con datos ficticios

Se agregaron dos pruebas de regresión. La primera ejecuta el repositorio de exportación con lecturas simuladas: comprueba el alcance por cuenta, incluso si quien exporta es administrador; la conservación de 55 solicitudes y sus respuestas; la inclusión de perfiles remotos y mensajes; y la exclusión de credenciales de aprobación del checkout. También comprueba que los registros de entrada no se modifican. No se conecta a Firebase real.

La segunda ejecuta el endpoint HTTP local: rechaza ausencia de sesión y tokens revocados; utiliza la identidad verificada aunque la URL incluya otro UID; diferencia dos cuentas; entrega un JSON como archivo adjunto y con `Cache-Control: no-store`; y devuelve un error seguro ante una falla del repositorio. Las operaciones de producción no se ejecutan y el limitador se simula.

Resultado: 74 pruebas de seguridad/datos aprobadas y TypeScript sin errores. Solo se agregan pruebas y esta constancia; no se modifica la aplicación ni se necesita republicarla por este cambio.

## Confirmación posterior y recuperación local

El titular confirmó que la descarga de datos de cuenta funciona en la app publicada. No se recibió ni inspeccionó el contenido de su archivo privado.

Se ejecutaron 22 pruebas de cifrado, conservación, almacenamiento protegido y separación por cuenta: todas aprobadas. Se compiló la versión de producción y se ejecutaron seis recorridos de navegador local: descarga/restauración de copia con cuenta Google; descarga/restauración de almacenamiento histórico; conservación de datos dañados; falta de espacio; conflicto entre pestañas; y contraseñas de descarga que no coinciden. Todos aprobaron, junto con TypeScript.

La prueba con cuenta Google conservó notas, imágenes, voces, historias, rutinas, premios, progreso y sesiones de juegos en un navegador nuevo con contraseña de protección distinta. Una contraseña de copia incorrecta no alteró el destino; revisar antes de restaurar tampoco escribió datos; la restauración agregó un perfil nuevo y permaneció tras recargar, conservando el origen.

Los cinco recorridos históricos inicialmente se detenían en la pantalla de Google porque sus fixtures no declaraban el acceso local de prueba. Se actualizó únicamente `tests/backups.spec.ts`: política de acceso simulada para el candidato local, bloqueo de servicios externos y exclusión de ejecución con `PLAYWRIGHT_BASE_URL`. El recorrido separado con cuenta Google conserva su sesión ficticia y almacenamiento cifrado. No se alteró la política publicada ni código de producto. Las pruebas usaron Chromium 153 local y datos ficticios; no sustituyen la comprobación en dispositivos físicos.

## Pendientes que esta revisión no cierra

- Comprobar que el archivo JSON real descargado se abre correctamente; su descarga ya fue confirmada por el titular.
- Descargar y revisar una copia cifrada propia desde los dispositivos del titular. La restauración aislada con datos ficticios está aprobada; la exportación JSON de cuenta no reemplaza la copia cifrada de perfiles.
- Confirmar el cierre de la solicitud de prueba y su respuesta en el espacio adulto.
- Verificar eliminaciones únicamente con una cuenta desechable y autorización específica; el rol Authentication Viewer no habilita eliminar usuarios de Firebase Auth.
- Completar las condiciones del lanzamiento comercial, los cobros y pruebas de proveedor, dispositivos físicos y piloto. Las pruebas aisladas no certifican esas condiciones.

Se conservan los datos existentes y los créditos del proyecto. Los informes siguen limitados a actividades registradas, sin análisis clínico, evaluaciones, diagnósticos ni tratamientos.
