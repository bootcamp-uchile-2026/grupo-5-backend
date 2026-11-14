import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { opcionesBaseDatos } from './database/opciones';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health.controller';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CarritoModule } from './modules/carrito/carrito.module';
import { ClubLecturaModule } from './modules/club-lectura/club-lectura.module';
import { CuponesModule } from './modules/cupones/cupones.module';
import { DireccionesModule } from './modules/direcciones/direcciones.module';
import { EnviosModule } from './modules/envios/envios.module';
import { ImagenesModule } from './modules/imagenes/imagenes.module';
import { LibrerosModule } from './modules/libreros/libreros.module';
import { LibrosModule } from './modules/libros/libros.module';
import { ListasDeseosModule } from './modules/listas-deseos/listas-deseos.module';
import { MailModule } from './modules/mail/mail.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { RecomendacionesModule } from './modules/recomendaciones/recomendaciones.module';
import { ResenasModule } from './modules/resenas/resenas.module';
import { SeguimientoModule } from './modules/seguimiento/seguimiento.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...opcionesBaseDatos(
          config.get<string>('DATABASE_URL'),
          config.get('DB_SSL') === 'true',
        ),
        autoLoadEntities: true,
        // Al arrancar se aplican las migraciones pendientes: la base queda lista
        // (estructura y datos de prueba) sin ejecutar scripts a mano.
        migrationsRun: config.get('DB_MIGRAR_AL_INICIAR', 'true') === 'true',
      }),
    }),
    // Funcionales sobre PostgreSQL
    MailModule,
    AuthModule,
    UsuariosModule,
    LibrosModule,
    ImagenesModule,
    CarritoModule,
    DireccionesModule,
    CuponesModule,
    PedidosModule,
    ResenasModule,
    ListasDeseosModule,
    LibrerosModule,
    ClubLecturaModule,
    RecomendacionesModule,
    NewsletterModule,
    AdminModule,
    // Dummy con reglas predecibles
    EnviosModule,
    PagosModule,
    SeguimientoModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
