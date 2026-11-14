import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { origenesPermitidos } from './config/origenes';
import {
  RUTA_PUBLICA_IMAGENES,
  directorioImagenes,
} from './modules/imagenes/almacenamiento';

/**
 * Configuración común de la aplicación HTTP. La usan main.ts y las pruebas
 * e2e, para que ambas ejerciten exactamente la misma API.
 */
export function configurarApp(app: NestExpressApplication): void {
  const config = app.get(ConfigService);

  // Detrás de un proxy (Caddy) req.protocol y req.secure reflejan el HTTPS real.
  app.set('trust proxy', 1);
  app.use(cookieParser());

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

  // credentials: true permite que el navegador envíe y reciba las cookies de
  // sesión. Con CORS_ORIGIN=* se refleja el origen que llega (solo desarrollo).
  const origenes = origenesPermitidos(config.get<string>('CORS_ORIGIN', '*'));
  app.enableCors({
    origin: origenes ?? true,
    credentials: true,
    exposedHeaders: ['x-request-id'],
  });

  // Servidor de archivos estáticos para las imágenes subidas.
  app.useStaticAssets(directorioImagenes(config), {
    prefix: `${RUTA_PUBLICA_IMAGENES}/`,
    maxAge: '7d',
    index: false,
    dotfiles: 'deny',
  });

  app.enableShutdownHooks();
}
