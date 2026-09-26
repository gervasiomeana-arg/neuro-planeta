# NeuroPlaneta

Aplicación web de actividades de atención, comunicación, rutinas y calma para usar en celular o tableta.

## Desarrollo local

```bash
npm install
npm run dev
```

Verificaciones: `npm run lint` y `npm run build`.

## Estado de los datos

Los perfiles y avances se guardan en el almacenamiento local de este navegador. No se sincronizan entre dispositivos y pueden perderse si se borran los datos del navegador. Evitar ingresar información clínica o identificable de menores en una demostración pública. La pregunta matemática del panel adulto es una barrera de uso, no autenticación.

En «Modo Padres / Terapeutas» → «Rutinas» se pueden agregar, renombrar, ordenar y quitar tareas de mañana, tarde y noche. Cada perfil conserva su propia lista en este navegador. Quitar una tarea también borra su marca de completada.

El resumen imprimible muestra estrellas acumuladas, tareas marcadas y la mejor partida del juego de números por perfil. Son registros de uso de la aplicación, no resultados clínicos ni evidencia de mejora de la atención fuera del juego. Los pictogramas consultados en ARASAAC requieren conexión; revisar atribución y condiciones de uso antes de comercializar una integración.

Las rutas `/api/sync/*` y `/api/migrate/*` están desactivadas (HTTP 410). La implementación anterior permitía leer o sobrescribir perfiles sin autenticación y reemplazar código del servidor. Para habilitar sincronización se necesita autenticación real, control de acceso por perfil y almacenamiento seguro antes de aceptar datos de niños.

## Historias sociales personalizadas

En «Modo Padres / Terapeutas» → «Historias», el adulto describe una situación sin datos identificables. «Crear con IA» envía **solo ese texto** al servidor y requiere `GEMINI_API_KEY` como secreto de entorno. La clave nunca se incorpora al navegador. Hay un límite básico de solicitudes por IP; antes de abrir el servicio al público, configurar autenticación real y límites persistentes del proveedor. El adulto debe revisar y editar los cinco pasos antes de guardarlos. Puede volver a editar una historia guardada desde el mismo panel; los cambios permanecen en ese perfil. Los dibujos son emojis seleccionables, no imágenes generadas por IA.

«Crear borrador sin IA» funciona sin conexión con Gemini y prepara cinco pasos genéricos editables. En GitHub Pages, que aloja solo archivos estáticos, se puede usar esta opción; para usar la generación con IA se debe ejecutar el servidor Node en un alojamiento compatible, como la vista de ejecución de AI Studio con el secreto configurado. Las historias guardadas son locales a cada perfil y navegador y pueden perderse si se borran los datos locales. Las historias no sustituyen la valoración de un profesional.
