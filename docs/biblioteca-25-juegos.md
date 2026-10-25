# Biblioteca de 25 juegos y precio mensual

Fecha: 25 de octubre de 2026. Rama `release/content-commercial-review`. Implementación pendiente de pruebas, revisión con usuarios y publicación. No se ejecutaron tests, lint, build ni pruebas de navegador por instrucción del titular; tampoco se abre PR para no disparar CI.

## Alcance implementado

El catálogo total contiene 25 juegos: los dos originales y 23 nuevos. Acceso desde la sección de atención, ahora titulada «Aprender y jugar». No se cuentan como juegos extra los niveles ni los módulos de calma, social, rutinas u otros.

| Área | Juegos |
| --- | --- |
| Números | Buscar números (original), Contar objetos, ¿Dónde hay más?, Sumar juntando, Quitar y contar, El número siguiente, El número escondido. |
| Atención | Parejas de imágenes (original), Trenes de patrones, Grande y pequeño, Detectives de formas, Taller de colores, Cada cosa en su grupo, El intruso, Arriba, abajo y al lado. |
| Memoria | Memoria de parejas, Recuerdo el camino, Escucho y hago. |
| Lenguaje | Encuentro la letra, ¿Con qué letra empieza?, Palabras en palmas, Palabras que riman. |
| Vida diaria | Primero, después; Caras y expresiones; Me cuido cada día. |

Los 23 nuevos tienen tres niveles seleccionables y cinco desafíos por sesión. No equivalen a 69 juegos. La dificultad aumenta mediante cantidades, alternativas, pares de memoria, extensión de secuencias o pasos. Varias actividades comparten el motor de opciones; memoria, repetición de secuencias y ordenación agregan interacciones diferentes.

Cada juego declara objetivo, apoyo, explicación posterior y una propuesta de práctica cotidiana. No hay reloj, pérdida de vidas ni bloqueo de niveles. Las respuestas incorrectas permiten reintentar. La memoria usa ocultación manual, sin exigir rapidez; las consignas tienen lectura de voz a pedido si el sonido está habilitado y el navegador la ofrece. Las letras y rimas necesitan acompañamiento según el nivel de lectura. Los colores muestran nombres como apoyo; no se presenta como prueba de visión cromática.

Las expresiones son dibujos convencionales, no un método para deducir emociones de una persona real. No se añaden reconocimiento facial, inferencias clínicas ni recomendaciones de tratamiento. OpenMoji pertenece al catálogo de comunicación; los ejercicios nuevos también utilizan texto, figuras CSS y emojis del sistema.

## Registro y protección

`learningProgress` es un campo opcional del perfil. Guarda por juego nuevo: sesiones terminadas, nivel máximo practicado, última fecha, respuestas sin ayuda e intentos acumulados. Se actualiza solo al terminar los cinco desafíos. Actualización: los 25 juegos agregan un registro descriptivo de sesiones completas o pausadas por controles instrumentados, con máximo 200 por perfil; los avances de nivel se agregan solo al completar. Ver informe-registro-uso.md. Se registran tiempos a la primera selección por desafío, no el contenido de cada respuesta. No se envía progreso infantil a servidores ni se usa un almacenamiento compartido adicional.

El registro sigue el guardado cifrado por cuenta y se incluye en respaldos. La validación del respaldo admite y controla el nuevo campo. «Sin ayuda» significa primer intento sin abrir pistas ni revisar la secuencia; en memoria, sin pares fallidos ni mostrar todas. Es un indicador de interacción con la app, no de dominio de una habilidad ni de evolución clínica. No se agregan estrellas para evitar cambiar sin revisión la economía de recompensas existente.

## USD 20 mensuales

Precio elegido por el titular: **Plan Familia, USD 20 por mes**. Fuente única del precio público en `src/auth/commercial.ts`; se presenta en el ingreso adulto y administración. El panel permite guardar exactamente USD 20 luego de consultar el registro anterior. Los valores previos en ARS no se convierten ni se sobrescriben por cargar la pantalla.

La modificación de `firestore.rules` permite USD además de ARS, exclusivamente al rol administrador ya existente. **Estas reglas todavía no se publicaron en Firebase**; el guardado remoto en USD puede ser rechazado hasta hacerlo. No se modificaron documentos remotos ni se ejecutaron cobros. La suscripción, renovaciones, cancelación y validación del servidor siguen pendientes. No hay conversión a pesos ni tipo de cambio inventado. Cambiar el precio futuro requiere actualizar esta configuración/versionado.

## Verificación diferida

Al retomar controles: revisar compilación; probar cada uno de los 25 juegos, los tres niveles de los nuevos, teclado/voz/silencio, secuencias y memoria; evitar dobles cierres; cambiar de perfil durante una actividad; cuota/errores de guardado; exportar y restaurar progresos; revisar lectura y pertinencia de consignas con familias/profesionales; comprobar reglas USD y coherencia de precios. Adaptar las pruebas históricas que buscan los botones antiguos y los textos ARS. No informar estos controles como realizados.
