# NeuroPlaneta

Aplicación web de actividades de atención, comunicación, rutinas y calma para usar en celular o tableta.

## Desarrollo local

```bash
npm install
npm run dev
```

Verificaciones: `npm run lint`, `npm run build`, `npm run test:security` y `npx playwright test`. Los tests de seguridad del servidor requieren compilar primero. `npm start` ejecuta el servidor en producción desde `build/server.cjs`; `dist/` contiene solo recursos públicos.

## Estado de los datos

Los perfiles y avances se guardan en el almacenamiento local de este navegador. No se sincronizan entre dispositivos y pueden perderse si se borran los datos del navegador. Evitar ingresar información clínica o identificable de menores en una demostración pública. La pregunta matemática del panel adulto es una barrera de uso, no autenticación.

En «Modo Padres / Terapeutas» → «Historias», el adulto puede preparar, editar y guardar cinco pasos con «Crear borrador sin IA». La generación con Gemini queda **bloqueada en producción** hasta implementar autenticación y cuotas por cuenta. No se habilita con solo añadir la clave. Para pruebas de desarrollo local, se permite únicamente una conexión loopback con Host local y origen coincidente, usando `GEMINI_API_KEY` solo en el servidor. Hay una cuota global de diez solicitudes por hora y dos en curso por proceso. Estos límites no sustituyen un sistema distribuido de cuentas. El adulto siempre revisa el resultado; los dibujos son emojis seleccionables, no imágenes generadas.

El resumen imprimible muestra estrellas acumuladas, tareas marcadas y la mejor partida del juego de números por perfil. Son registros de uso de la aplicación, no resultados clínicos ni evidencia de mejora de la atención fuera del juego. Los pictogramas consultados en ARASAAC requieren conexión; revisar atribución y condiciones de uso antes de comercializar una integración.

Las rutas `/api/sync/*` y `/api/migrate/*` están desactivadas (HTTP 410). La implementación anterior permitía leer o sobrescribir perfiles sin autenticación y reemplazar código del servidor. Para habilitar sincronización se necesita autenticación real, control de acceso por perfil y almacenamiento seguro antes de aceptar datos de niños.

## Historias sociales personalizadas

En «Modo Padres / Terapeutas» → «Historias», el adulto describe una situación sin datos identificables. «Crear con IA» envía **solo ese texto** al servidor y requiere `GEMINI_API_KEY` como secreto de entorno. La clave nunca se incorpora al navegador. Hay un límite básico de solicitudes por IP; antes de abrir el servicio al público, configurar autenticación real y límites persistentes del proveedor. El adulto debe revisar y editar los cinco pasos antes de guardarlos. Puede volver a editar una historia guardada desde el mismo panel; los cambios permanecen en ese perfil. Los dibujos son emojis seleccionables, no imágenes generadas por IA.

«Crear borrador sin IA» funciona sin conexión con Gemini y prepara cinco pasos genéricos editables. En GitHub Pages, que aloja solo archivos estáticos, se puede usar esta opción. La generación remota con IA requiere una etapa posterior de autenticación, permisos y alojamiento del servidor. Las historias guardadas son locales a cada perfil y navegador y pueden perderse si se borran los datos locales. Las historias no sustituyen la valoración de un profesional.


Seguridad: ver [auditoría y pendientes](docs/seguridad-2026-10-21.md). Las imágenes personalizadas de tableros se limitan a formatos raster locales o URLs de pictogramas de ARASAAC. Las imágenes remotas antiguas no admitidas permanecen guardadas, pero se muestran con el pictograma predeterminado; no se solicitan a servidores externos. Las fotos nuevas se reducen y recodifican antes de guardarse, eliminando los metadatos originales.
