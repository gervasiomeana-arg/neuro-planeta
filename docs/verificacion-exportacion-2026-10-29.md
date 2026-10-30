# Verificación de exportación de cuenta

Base comprobada en GitHub: `5becf830fe40fb1afc02c4ab541a03383f0ada47`.

## Evidencia disponible

El titular aportó capturas de la concesión de los dos roles previstos a la identidad del servidor en el proyecto Firebase de NeuroPlaneta y del diagnóstico publicado con sus siete comprobaciones de lectura correctas. También confirmó envío y recepción de mensajes entre el espacio adulto y Administración. Una captura posterior muestra una solicitud de acceso registrada y pendiente. Su cierre y la respuesta visible al solicitante todavía no están confirmados.

No se modificaron permisos, datos de producción, cobros ni configuración publicada durante esta revisión. No se publican capturas de consolas privadas ni datos de contacto personales.

## Exportación revisada con datos ficticios

Se agregaron dos pruebas de regresión. La primera ejecuta el repositorio de exportación con lecturas simuladas: comprueba el alcance por cuenta, incluso si quien exporta es administrador; la conservación de 55 solicitudes y sus respuestas; la inclusión de perfiles remotos y mensajes; y la exclusión de credenciales de aprobación del checkout. También comprueba que los registros de entrada no se modifican. No se conecta a Firebase real.

La segunda ejecuta el endpoint HTTP local: rechaza ausencia de sesión y tokens revocados; utiliza la identidad verificada aunque la URL incluya otro UID; diferencia dos cuentas; entrega un JSON como archivo adjunto y con `Cache-Control: no-store`; y devuelve un error seguro ante una falla del repositorio. Las operaciones de producción no se ejecutan y el limitador se simula.

Resultado: 74 pruebas de seguridad/datos aprobadas y TypeScript sin errores. Solo se agregan pruebas y esta constancia; no se modifica la aplicación ni se necesita republicarla por este cambio.

## Pendientes que esta revisión no cierra

- Descargar `neuroplaneta-datos-cuenta.json` desde la app publicada y comprobar que el archivo se abre correctamente. Todavía no hay confirmación del titular de esta descarga.
- Comprobar copia cifrada de perfiles locales y su restauración en un entorno aislado. La exportación JSON de cuenta no reemplaza esa copia.
- Confirmar el cierre de la solicitud de prueba y su respuesta en el espacio adulto.
- Verificar eliminaciones únicamente con una cuenta desechable y autorización específica; el rol Authentication Viewer no habilita eliminar usuarios de Firebase Auth.
- Completar las condiciones del lanzamiento comercial, los cobros y pruebas de proveedor, dispositivos físicos y piloto. Las pruebas aisladas no certifican esas condiciones.

Se conservan los datos existentes y los créditos del proyecto. Los informes siguen limitados a actividades registradas, sin análisis clínico, evaluaciones, diagnósticos ni tratamientos.
