# Sustitución de la integración ARASAAC

Rama de trabajo `release/content-commercial-review`, sin tests, build, lint ni despliegue por instrucción del titular. Las pruebas existentes que exigían aceptar URLs de ARASAAC deberán actualizarse en el bloque de verificación diferido. No se afirma que esta rama haya aprobado pruebas.

## Implementado

- Retirados el buscador remoto, sus estados, la consulta a ARASAAC y sus resultados. El catálogo integrado contiene 24 gráficos OpenMoji SVG, copiados sin modificar del commit fijado en sus créditos.
- Símbolos usados por defecto en el tablero, la frase, la selección adulta y la vista previa. Los archivos se sirven desde el mismo sitio; no se descargan de GitHub en cada uso. No se promete modo offline: requiere haber cargado la app y tener sus archivos disponibles.
- Diseño del selector: crema y verde suave, tarjetas, búsqueda sin acentos, marca de selección, foco visible y selección por teclado mediante botones nativos. La imagen y la etiqueta se muestran juntas; la voz sigue usando la frase de la tarjeta.
- Fotos raster locales conservadas. Las imágenes remotas antiguas no se solicitan: se muestra el símbolo local equivalente. Sus valores originales permanecen en el almacenamiento y los respaldos, sin migración destructiva.
- Solo se aceptan identificadores del catálogo conocido o imágenes raster locales; no SVG arbitrarios subidos por usuarios ni URLs remotas. Los SVG del catálogo se incorporan como archivos revisados, no mediante HTML dinámico.
- La exportación OBF conserva las imágenes raster propias y agrega una referencia de catálogo como extensión de NeuroPlaneta con atribución. Otras apps pueden ignorar esa extensión; no se presenta como portabilidad visual completa. Las notas/licencias del catálogo están accesibles desde adultos y dentro del repositorio.

## Licencia y límites

OpenMoji publica sus gráficos bajo CC BY-SA 4.0, que permite uso comercial con atribución y condiciones de compartir igual para adaptaciones. Los dibujos incluidos no se modificaron; su licencia está en `public/pictograms/openmoji/LICENSE.txt`, su origen y commit en el README de ese directorio. No se cambia la licencia de esos gráficos por vender acceso a la app ni se sugiere aval del proyecto OpenMoji.

La sustitución de la integración no sanea automáticamente fotos o imágenes importadas en base64 cuyo origen se desconoce. No se borran datos familiares para resolver derechos de autor. Revisar por separado cualquier contenido promocional o precargado que se vaya a distribuir.

El cambio mejora coherencia de estilo y elimina la dependencia de búsqueda de ARASAAC; no demuestra que los nuevos símbolos sean mejores para cada niño o clínicamente equivalentes. Los emojis no son una biblioteca especializada de comunicación aumentativa validada. La revisión de comprensión con usuarios queda pendiente junto con las pruebas funcionales.
