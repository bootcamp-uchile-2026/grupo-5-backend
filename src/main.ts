import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { configurarApp } from './app.setup';
import { VERSION_APP } from './config/version';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  configurarApp(app);

  const swagger = new DocumentBuilder()
    .setTitle('LeeConNos API')
    .setDescription(
      'API del e-commerce de libros LeeConNos — Hito 3.\n\n' +
        '**Funcional sobre PostgreSQL:** auth (JWT con refresh, verificación de correo, recuperación de contraseña, ' +
        'Google y Facebook), usuarios, catálogo con filtros y categorías del menú, carrito, cupones, pedidos ' +
        '(también como invitado), reseñas, libreros, recomendaciones, listas de deseos, club de lectura y newsletter.\n\n' +
        '**Dummy con reglas predecibles:** costo de envío, pago, seguimiento y envío de correos (quedan en el log).\n\n' +
        'Todos los errores usan la estructura `ErrorResponseDto` y toda respuesta incluye el header `x-request-id`.',
    )
    .setVersion(VERSION_APP)
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger), {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(config.get('PORT', 3000));
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `LeeConNos API escuchando en el puerto ${port} — Swagger en /docs`,
    'Bootstrap',
  );
}

void bootstrap();
