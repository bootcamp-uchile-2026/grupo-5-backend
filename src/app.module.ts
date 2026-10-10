import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CarritoModule } from './modules/carrito/carrito.module';
import { ClubLecturaModule } from './modules/club-lectura/club-lectura.module';
import { EnviosModule } from './modules/envios/envios.module';
import { LibrerosModule } from './modules/libreros/libreros.module';
import { LibrosModule } from './modules/libros/libros.module';
import { ListasDeseosModule } from './modules/listas-deseos/listas-deseos.module';
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
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        ssl:
          config.get('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        autoLoadEntities: true,
        // La estructura la crean los scripts de db/, nunca el ORM.
        synchronize: false,
      }),
    }),
    // Funcionales sobre PostgreSQL
    AuthModule,
    UsuariosModule,
    LibrosModule,
    CarritoModule,
    PedidosModule,
    // Dummy con reglas predecibles
    EnviosModule,
    PagosModule,
    SeguimientoModule,
    // En memoria, contrato congelado del Hito 1
    ResenasModule,
    ListasDeseosModule,
    LibrerosModule,
    ClubLecturaModule,
    RecomendacionesModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
