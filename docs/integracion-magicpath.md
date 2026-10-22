# Integración del diseño de MagicPath

Primera integración en la aplicación real: navegación lateral en escritorio, bienvenida ilustrada con Cosmo, tarjetas de actividades, paleta y jerarquía común de encabezados, formularios y panel de adultos. En celular se mantiene la navegación inferior, con el ejercicio SOS siempre disponible.

La barra lateral llama a las mismas actividades y al mismo control de acceso de adultos que la navegación existente. El saludo utiliza el perfil activo; no hay nombres ni registros de demostración en producción. Los datos de rutinas, emociones, historias, estrellas y copias cifradas conservan sus manejadores actuales.

El prototipo completo sigue en https://designs.magicpath.ai/v1/luckily-cave-3485 y en la propuesta #46. La migración visual de los interiores de cada módulo continúa pendiente; esta integración no reemplaza esos módulos por sus ejemplos de MagicPath.

Las ilustraciones vectoriales de Cosmo son propias y no requieren llamadas a servicios externos. No se añade generación de IA ni se modifica el almacenamiento.

## Interiores de actividades

Los siete módulos infantiles comparten ahora un encabezado con acción de volver, etiqueta y título. El progreso de Atención conserva su contador real. Emociones mantiene los cuatro colores visibles y expone la selección a tecnologías de asistencia; no cambia las reglas de intensidad ni el registro. Se ampliaron las tarjetas de números, pictogramas e historias, el espacio de respiración y el lienzo sensorial. La búsqueda y su acción de limpiar tienen nombres accesibles.

Se conservan los manejadores de cada actividad, las historias creadas por la familia y las preferencias de sonido. El diagnóstico de accesibilidad de las pantallas iniciales de los módulos pasa a exigir cero infracciones detectadas; esto no certifica todas las situaciones ni reemplaza pruebas con personas. Las pruebas de 360 y 1280 px generan capturas de cada módulo y comprueban límites y navegación.

## Panel de adultos

Navegación lateral en escritorio y selector de sección en celular para las siete secciones existentes. La identidad del perfil y el aviso de almacenamiento permanecen disponibles; los formularios y las copias cifradas conservan sus funciones. La gestión de perfiles se presenta antes del bloque de respaldo. El panel vuelve al principio al cambiar de sección.

El diálogo incorpora nombre accesible, cierre con Escape, recorrido de teclado dentro del panel y retorno al control que lo abrió. El control aritmético existente sigue siendo una barrera infantil local, no una autenticación de cuenta. El resumen impreso mantiene sus estilos de impresión.
