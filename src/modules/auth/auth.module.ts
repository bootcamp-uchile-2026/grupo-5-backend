import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthController, UsuariosAuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CuentaService } from './cuenta.service';
import { TokenUsuario } from './entities/token-usuario.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SocialAuthService } from './social-auth.service';

@Module({
  imports: [
    UsuariosModule,
    TypeOrmModule.forFeature([TokenUsuario]),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '2h') },
      }),
    }),
  ],
  controllers: [AuthController, UsuariosAuthController],
  providers: [
    AuthService,
    CuentaService,
    SocialAuthService,
    // El orden importa: primero se autentica, después se revisa el rol.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
