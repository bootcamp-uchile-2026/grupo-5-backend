import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Validación de entrada: rechaza campos no declarados en el DTO y aplica
  // las conversiones de tipo declaradas (@Type) en query params y body.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const origenes = config.get<string>('CORS_ORIGIN', '*');
  app.enableCors({
    origin: origenes === '*' ? true : origenes.split(',').map((o) => o.trim()),
    exposedHeaders: ['x-request-id'],
  });
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('LeeConNos API')
    .setDescription(
      'API del e-commerce de libros LeeConNos — Hito 2.\n\n' +
        '**Funcional sobre PostgreSQL:** auth (JWT), usuarios, catálogo, carrito y pedidos.\n\n' +
        '**Dummy con reglas predecibles:** costo de envío, pago y seguimiento.\n\n' +
        '**En memoria (contrato congelado del Hito 1):** reseñas, listas de deseos, libreros y club de lectura.\n\n' +
        'Todos los errores usan la estructura `ErrorResponseDto` y toda respuesta incluye el header `x-request-id`.',
    )
    .setVersion('0.2.0')
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
