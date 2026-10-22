# Arquitectura y seguridad: segunda revisión

## Estado y límites

La publicación GitHub Pages ejecuta solo React y recursos estáticos. No ejecuta Express ni Gemini. El servidor Node es un destino distinto: su configuración y encabezados no protegen por sí mismos la versión Pages. El panel adulto utiliza una barrera aritmética local, sin cuenta, sesión remota ni autorización entre familias. Los perfiles, notas, fotos y voces permanecen en localStorage sin cifrado; las copias exportadas sí se cifran. No se presenta este estado como un servicio multiusuario listo para suscripciones.

## Separación actual

| Responsabilidad | Módulo / frontera |
| --- | --- |
| Persistencia local, conflictos y recuperación | `src/data/useProfileStore.ts` y `backups.ts` |
| Importación de imágenes y tableros | `src/security/imports.ts` |
| Navegación, diálogo adulto y foco | `src/AdultPanel.tsx` |
| Permiso, captura y liberación del micrófono | `src/audio/useVoiceRecording.ts` |
| API y límites de generación local | `server/app.ts` |
| Política de recursos del cliente y servidor | `security/policy.ts` |
| Coordinación de actividades y estados | `src/ImportedApp.tsx`, aún demasiado grande |

## Hallazgo corregido en esta etapa

La captura de voz vivía dentro de un manejador del componente principal. Faltaba liberar el micrófono al cerrar o cambiar de sección y al fallar el constructor. El permiso y FileReader podían finalizar después de cambiar el perfil/pictograma, permitiendo un guardado en un contexto diferente.

El hook nuevo identifica cada sesión con el perfil y pictograma. Cerrar panel, cambiar de sección/perfil/pictograma, ocultar la pestaña, salir de la página o desmontar cancela la sesión y libera pistas/timers. Los permisos tardíos se liberan al resolverse; los resultados tardíos se descartan. El navegador puede seguir mostrando su diálogo de permiso pendiente: la aplicación no puede cerrarlo, pero no usa un permiso concedido tras cancelar. Un token evita reutilizar una sesión anterior aun si vuelve el mismo perfil. La salida respeta el MIME del grabador; no fuerza WebM sobre audio de otro formato.

Cada grabación admite hasta 30 segundos y 2 MB. El límite de bytes se verifica al recibir cada fragmento; no garantiza un límite de memoria exacto del navegador. Grabar no sube datos a un servidor. Cambios de cuota siguen usando el aviso y recuperación local existentes. No se cambia el formato ni se migran grabaciones históricas.

## Verificación y alcance

Pruebas de navegador con un micrófono simulado: guardado normal/MIME, permiso tardío tras cerrar, salida de sección, cambio de pictograma, fallo de inicialización, exceso de tamaño y corte temporal. No prueban permisos ni hardware físico de Android/iOS. Se conserva la batería de seguridad y los recorridos funcionales existentes. Los resultados finales se registran en el PR; un test añadido no equivale a un test aprobado.

Tinyfish se intentó el 22/10/2026 para un recorrido de uso con datos ficticios. No inició: saldo insuficiente (-USD 0,07). No se atribuyen resultados de Playwright a Tinyfish ni se considera un recorrido de uso una prueba de penetración.

## Próximas fronteras, antes de venta multiusuario

1. Autenticación adulta real y recuperación de cuenta; autorización de cada perfil en el servidor. No reutilizar el candado como credencial.
2. Elegir y configurar infraestructura propia de NeuroPlaneta; no reutilizar bases de otros proyectos. Modelo cuenta → miembros/roles → perfiles → registros y archivos privados, con pruebas negativas entre dos familias.
3. Persistencia transaccional, cuotas por cuenta, respaldo verificado, restauración, retención y borrado. Mantener importación revisable de copias locales; no hacer una migración destructiva.
4. Reabrir IA solo tras autenticación verificada, autorización, consentimiento, minimización de texto, presupuestos y cuotas persistentes. Mientras tanto, conservar el cierre de producción.
5. Extraer gradualmente editores y registros de `ImportedApp.tsx`, con repositorios de datos y pruebas de contrato. No reescribir toda la aplicación de una vez.
6. Pruebas reales de micrófono/cámara/voz en teléfonos, revisión independiente de seguridad y revisión de privacidad/licencias antes de comercialización.
