# NeuroPlaneta

Aplicación web de actividades de atención, comunicación, rutinas y calma para usar en celular o tableta.

## Desarrollo local

```bash
npm ci
npm run dev
```

Verificaciones: `npm run lint` y `npm run build`.

## Estado de los datos

Los perfiles y avances se guardan en el almacenamiento local de este navegador. No se sincronizan entre dispositivos y pueden perderse si se borran los datos del navegador. Evitar ingresar información clínica o identificable de menores en una demostración pública. La pregunta matemática del panel adulto es una barrera de uso, no autenticación.

En «Modo Padres / Terapeutas» → «Rutinas» se pueden agregar, renombrar, ordenar y quitar tareas de mañana, tarde y noche. Cada perfil conserva su propia lista en este navegador. Quitar una tarea también borra su marca de completada.

El resumen imprimible muestra estrellas acumuladas, tareas marcadas y la mejor partida del juego de números por perfil. Son registros de uso de la aplicación, no resultados clínicos ni evidencia de mejora de la atención fuera del juego. Los pictogramas consultados en ARASAAC requieren conexión; revisar atribución y condiciones de uso antes de comercializar una integración.

Las rutas `/api/sync/*` y `/api/migrate/*` están desactivadas (HTTP 410). La implementación anterior permitía leer o sobrescribir perfiles sin autenticación y reemplazar código del servidor. Para habilitar sincronización se necesita autenticación real, control de acceso por perfil y almacenamiento seguro antes de aceptar datos de niños.
