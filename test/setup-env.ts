// Variables de entorno de las pruebas e2e. Se cargan antes de importar la
// aplicación, porque ConfigModule lee el entorno al cargar AppModule.

// Sin proveedor de correo real, los tokens de los correos se leen de la respuesta.
process.env.EXPONER_TOKENS_DEV = 'true';
// Origen de la Aplicación Web: con sesión por cookie, solo él puede modificar datos.
process.env.CORS_ORIGIN = 'http://localhost:5173';
// Acceso social sin configurar: se prueba el 503.
process.env.GOOGLE_CLIENT_ID = '';
process.env.FACEBOOK_APP_ID = '';
// Las imágenes de las pruebas no se mezclan con las de desarrollo.
process.env.UPLOADS_DIR = 'uploads-e2e';
