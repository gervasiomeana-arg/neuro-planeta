# Administración, Google y suscripción mensual

Google está habilitado en Firebase Spark. Se publicaron las reglas probadas de familias, accesos y suscripción; el permiso de la cuenta propietaria fue guardado desde consola privada. Los dominios de GitHub Pages y neuroplaneta.ai.studio están autorizados. Los identificadores personales de administración no se incluyen en este documento.

Administración aparece a la izquierda y exige el rol admins/{UID}.active=true además del control secundario de interfaz. El cliente no puede crearse permisos. El historial muestra correo adulto, proveedor y hora del servidor; no actividad infantil ni visitas anónimas. El importe mensual en ARS es una configuración: no ejecuta cobros.

La puerta Google conserva DeviceProtection por dentro. Si el cifrado está activo, autenticar con Google no sustituye la contraseña local. La protección es de todo el navegador; no separa perfiles locales por cuenta. Las fichas remotas conservan aislamiento por UID.

Despliegue gradual: access-policy.json mantiene requireGoogle=false durante la comprobación real del proveedor desde Cuenta adulta. Se habilitará requireGoogle=true únicamente después de comprobar ese ingreso. Mientras esté en false no se anuncia acceso obligatorio. Las pruebas de puerta fuerzan true en el candidato, independientemente de la política de despliegue; las demás pruebas mantienen su entorno aislado. No publicar el directorio dist modificado por CI.

Conservar Spark sin facturación. No se crean cuentas de prueba ni se suben perfiles infantiles reales. Las reglas y el código fueron probados con 53 recorridos de navegador, 39 pruebas de seguridad y 13 de reglas. Estas pruebas no sustituyen una auditoría externa ni la comprobación real de Google.
