import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import {
  EmailYaVerificadoException,
  TokenCuentaInvalidoException,
} from '../../common/exceptions/app.exceptions';
import { MailService } from '../mail/mail.service';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { MensajeCuentaDto } from './dto/cuenta.dto';
import {
  TipoTokenUsuario,
  TokenUsuario,
} from './entities/token-usuario.entity';

const VIGENCIA_MS: Record<TipoTokenUsuario, number> = {
  [TipoTokenUsuario.VERIFICACION_EMAIL]: 24 * 60 * 60 * 1000,
  [TipoTokenUsuario.RECUPERACION_PASSWORD]: 60 * 60 * 1000,
};

const sha256 = (texto: string) =>
  createHash('sha256').update(texto).digest('hex');

/**
 * Verificación de correo y recuperación de contraseña con tokens de un solo
 * uso enviados por correo (MailService, dummy). En la base solo queda el
 * SHA-256 del token, así que una filtración de la base no permite usarlos.
 */
@Injectable()
export class CuentaService {
  constructor(
    @InjectRepository(TokenUsuario)
    private readonly tokens: Repository<TokenUsuario>,
    private readonly usuarios: UsuariosService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  /** Envía el enlace de verificación. Devuelve el token si se permite exponerlo. */
  async enviarVerificacion(usuario: Usuario): Promise<string | undefined> {
    if (usuario.emailVerificado) throw new EmailYaVerificadoException();
    const token = await this.emitir(
      usuario.id,
      TipoTokenUsuario.VERIFICACION_EMAIL,
    );
    await this.mail.enviar({
      para: usuario.email,
      asunto: 'Confirma tu correo en LeeConNos',
      texto: `Hola ${usuario.nombre}, confirma tu correo para activar tu cuenta.`,
      enlace: this.mail.enlaceFront(`/verificar-correo?token=${token}`),
    });
    return this.exponer(token);
  }

  async verificarEmail(token: string): Promise<Usuario> {
    const registro = await this.consumir(
      token,
      TipoTokenUsuario.VERIFICACION_EMAIL,
    );
    const usuario = await this.usuarios.obtener(registro.usuarioId);
    await this.usuarios.marcarEmailVerificado(usuario.id);
    // Las compras hechas como invitado con este email pasan a su historial.
    await this.dataSource.query(
      `UPDATE pedidos SET usuario_id = $1
        WHERE usuario_id IS NULL AND LOWER(invitado_email) = LOWER($2)`,
      [usuario.id, usuario.email],
    );
    return this.usuarios.obtener(usuario.id);
  }

  /**
   * Siempre responde lo mismo, exista o no la cuenta, para no revelar qué
   * emails están registrados.
   */
  async olvidePassword(email: string): Promise<MensajeCuentaDto> {
    const respuesta: MensajeCuentaDto = {
      mensaje:
        'Si el email está registrado, te enviamos un enlace para restablecer tu contraseña.',
    };
    const usuario = await this.usuarios.buscarPorEmail(email);
    if (!usuario) return respuesta;

    const token = await this.emitir(
      usuario.id,
      TipoTokenUsuario.RECUPERACION_PASSWORD,
    );
    await this.mail.enviar({
      para: usuario.email,
      asunto: 'Restablece tu contraseña de LeeConNos',
      texto:
        'Recibimos una solicitud para restablecer tu contraseña. El enlace vence en 1 hora. ' +
        'Si no fuiste tú, ignora este correo.',
      enlace: this.mail.enlaceFront(`/restablecer-password?token=${token}`),
    });
    return { ...respuesta, tokenDesarrollo: this.exponer(token) };
  }

  async restablecerPassword(token: string, password: string): Promise<void> {
    const registro = await this.consumir(
      token,
      TipoTokenUsuario.RECUPERACION_PASSWORD,
    );
    await this.usuarios.cambiarPassword(registro.usuarioId, password);
    // Quien recibe el correo demuestra ser dueño del email.
    await this.usuarios.marcarEmailVerificado(registro.usuarioId);
  }

  private async emitir(
    usuarioId: string,
    tipo: TipoTokenUsuario,
  ): Promise<string> {
    // Solo vale el último enlace enviado de cada tipo.
    await this.tokens.update(
      { usuarioId, tipo, usadoEn: IsNull() },
      { usadoEn: new Date() },
    );
    const token = randomBytes(32).toString('hex');
    await this.tokens.insert({
      usuarioId,
      tipo,
      tokenHash: sha256(token),
      expiraEn: new Date(Date.now() + VIGENCIA_MS[tipo]),
    });
    return token;
  }

  private async consumir(
    token: string,
    tipo: TipoTokenUsuario,
  ): Promise<TokenUsuario> {
    const registro = await this.tokens.findOneBy({
      tokenHash: sha256(token),
      tipo,
      usadoEn: IsNull(),
      expiraEn: MoreThan(new Date()),
    });
    if (!registro) throw new TokenCuentaInvalidoException();
    // El WHERE por usado_en evita usar dos veces el mismo token en paralelo.
    const { affected } = await this.tokens.update(
      { id: registro.id, usadoEn: IsNull() },
      { usadoEn: new Date() },
    );
    if (!affected) throw new TokenCuentaInvalidoException();
    return registro;
  }

  /** Sin proveedor de correo real, en desarrollo se puede devolver el token. */
  private exponer(token: string): string | undefined {
    const permitido =
      this.config.get<string>('EXPONER_TOKENS_DEV') === 'true' &&
      this.config.get<string>('NODE_ENV', 'development') !== 'production';
    return permitido ? token : undefined;
  }
}
