# Juegos, guardado e informe: verificación del candidato

Base de aplicación verificada en GitHub: `ee5d9a8606e0c7aed50a06bfb4ce647406eba904`. La revisión solo modifica pruebas y documentación. No cambia la app publicada, permisos, cobros, datos ni créditos.

## Resultados

Se ejecutaron 83 escenarios distintos de navegador local, todos aprobados. La prueba del informe se repitió tras reforzar sus comprobaciones: 84 ejecuciones en total. También aprobaron 74 pruebas de seguridad/datos y TypeScript.

| Cobertura | Escenarios | Evidencia comprobada |
| --- | ---: | --- |
| 23 juegos nuevos, tres niveles por juego | 69 | Cinco rondas, carga de imágenes, sesión guardada una sola vez y persistencia al recargar. |
| Dos juegos originales | 2 | Error recuperable, finalización y reinicio de números; cuatro rondas y finalización de parejas. |
| Informe descargado | 1 | Juego, estado, tiempo activo, tiempos de primera selección, desafíos, intentos y respuestas coinciden con la sesión guardada. Descargar no modifica el perfil y el apodo queda excluido por defecto. |
| Imagen no disponible | 1 | Respaldo textual legible y pausa registrada una sola vez, sin pantalla vacía. |
| Ancho de biblioteca y juegos | 3 | Ajuste a 360, 768 y 1280 píxeles; imágenes cargadas y controles accesibles dentro del área prevista. |
| Tiempo y pista | 1 | La pestaña oculta no suma tiempo activo; usar pista no se interpreta como ayuda humana ni acierto independiente. |
| Cuenta simulada con cifrado real y controles táctiles | 6 | Apertura de los 25 juegos a 360, 412 y 768 píxeles, con y sin scrollTo; finalización de Contar objetos, foco visible, salida, 25 sesiones conservadas, nota original intacta y ausencia de errores de ejecución. |

Las pruebas utilizan Chromium 153 local, sesiones ficticias y datos de prueba. Los seis recorridos táctiles simulan tamaños y eventos móviles; no son pruebas físicas de Android, iOS o tablet. El titular ya confirmó anteriormente el arreglo de apertura de juegos en su celular.

## Mejoras en las pruebas

Se reforzó la descarga del informe para comparar cada medición con los valores guardados y comprobar que no cambia el perfil. El documento mantiene su alcance descriptivo: actividades registradas y notas voluntarias, sin análisis clínico, evaluaciones, diagnósticos ni tratamientos.

Los fixtures históricos de `functional.spec.ts` ahora declaran explícitamente su acceso local simulado y bloquean servicios externos. Se excluyen de destinos publicados mediante `PLAYWRIGHT_BASE_URL`. Esto permite comprobar los dos juegos originales sin alterar el ingreso Google ni las políticas de producción. El flujo con cuenta y perfiles cifrados se comprueba por separado.

Las ilustraciones y los archivos de atribución/licencia de OpenMoji no se modificaron.

## Límites y siguiente cierre

Esta revisión cierra las comprobaciones aisladas enumeradas, no certifica el lanzamiento comercial. Permanecen pendientes: confirmar cierre y respuesta de la solicitud real de prueba; verificación de eliminaciones con cuenta desechable y permiso específico; configuración y prueba real de PayPal sandbox antes de live; recuperación del servidor; dispositivos físicos restantes, voz/micrófono/accesibilidad y piloto acompañado. Los cobros siguen desactivados. Se conserva la prohibición de publicar domicilio o correo personales del titular.
