import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('LeeConNos API')
    .setDescription(
      'API del e-commerce LeeConNos: librería independiente con recomendaciones ' +
        'personalizadas de libreros y club de lectura online.',
    )
    .setVersion('1.0')
    .addTag('Usuarios')
    .addTag('Libros')
    .addTag('Libreros')
    .addTag('Recomendaciones')
    .addTag('Club de Lectura')
    .addTag('Reseñas')
    .addTag('Listas de deseos')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 LeeConNos API corriendo en http://localhost:${port}`);
  console.log(`📚 Documentación Swagger en http://localhost:${port}/docs`);
}
bootstrap();
