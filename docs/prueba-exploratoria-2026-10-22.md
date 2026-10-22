# Prueba exploratoria de usuario

Herramientas: navegador de prueba integrado, sesión nueva, interacción por la interfaz pública. Regresión reproducible mediante Playwright (código abierto, Apache-2.0), ya instalado en el repositorio. Tinyfish no se ejecutó por falta de saldo. No se instala otro servicio ni se inicia una suscripción.

## Hallazgo confirmado

Al completar el alta de un perfil ficticio y guardar una sola observación de regulación, «Caritas y Diario» mostraba dos registros. El segundo decía «Feliz» sin haber elegido esa emoción. El alta añadía el saludo como si fuera una observación emocional. La ruta de demostración también añadía una observación inventada.

Corrección: perfiles nuevos y demos nuevos empiezan con diario vacío. El saludo sigue en la bienvenida visual; no se transforma en una observación. No se eliminan ni migran registros guardados. «Registro de hoy» cambia a «Últimos registros» porque la lista no filtra por fecha y muestra un historial. Dos pruebas nuevas cubren el alta real y el enlace de demo; la regresión existente comprueba la conservación de registros introducidos por el usuario.

## Alcance

Solo datos ficticios. No se prueba hardware de teléfonos, no se realizan ataques y no se certifica seguridad clínica ni aislamiento multiusuario. Resultados finales y detalles de validación en el PR asociado.
