import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PermisoDenegadoException,
  PreguntaNoEncontradaException,
} from '../../common/exceptions/app.exceptions';
import { UsuarioAutenticado } from '../auth/decorators/current-user.decorator';
import { MailService } from '../mail/mail.service';
import { Rol } from '../usuarios/entities/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CrearPreguntaLibreroDto } from './dto/pregunta-librero.dto';
import { Librero } from './entities/perfil-librero.entity';
import { PreguntaLibrero } from './entities/pregunta-librero.entity';

/**
 * Formulario "¿No sabes qué leer?" del perfil del librero. La pregunta queda
 * guardada y se avisa por correo (dummy) al librero; al responder, se avisa a
 * quien preguntó.
 */
@Injectable()
export class PreguntasLibreroService {
  constructor(
    @InjectRepository(PreguntaLibrero)
    private readonly repo: Repository<PreguntaLibrero>,
    private readonly usuarios: UsuariosService,
    private readonly mail: MailService,
  ) {}

  async crear(
    librero: Librero,
    dto: CrearPreguntaLibreroDto,
    usuario?: UsuarioAutenticado,
  ): Promise<PreguntaLibrero> {
    const pregunta = await this.repo.save(
      this.repo.create({
        libreroId: librero.id,
        usuarioId: usuario?.id ?? null,
        nombre: dto.nombre.trim(),
        email: dto.email,
        pregunta: dto.pregunta.trim(),
      }),
    );
    const correoLibrero = await this.correoDe(librero);
    if (correoLibrero)
      await this.mail.enviar({
        para: correoLibrero,
        asunto: `${pregunta.nombre} te hizo una pregunta en LeeConNos`,
        texto: pregunta.pregunta,
        enlace: this.mail.enlaceFront(
          `/perfil-librero?librero=${encodeURIComponent(librero.slug)}`,
        ),
      });
    return pregunta;
  }

  async listar(
    librero: Librero,
    usuario: UsuarioAutenticado,
  ): Promise<PreguntaLibrero[]> {
    this.exigirDueno(librero, usuario);
    return this.repo.find({
      where: { libreroId: librero.id },
      order: { creadoEn: 'DESC' },
    });
  }

  async responder(
    librero: Librero,
    preguntaId: string,
    respuesta: string,
    usuario: UsuarioAutenticado,
  ): Promise<PreguntaLibrero> {
    this.exigirDueno(librero, usuario);
    const pregunta = await this.repo.findOneBy({
      id: preguntaId,
      libreroId: librero.id,
    });
    if (!pregunta) throw new PreguntaNoEncontradaException(preguntaId);
    pregunta.respuesta = respuesta.trim();
    pregunta.respondidaEn = new Date();
    await this.repo.save(pregunta);
    await this.mail.enviar({
      para: pregunta.email,
      asunto: `${librero.nombreCorto} respondió tu pregunta`,
      texto: pregunta.respuesta,
      enlace: this.mail.enlaceFront(
        `/perfil-librero?librero=${encodeURIComponent(librero.slug)}`,
      ),
    });
    return pregunta;
  }

  private exigirDueno(librero: Librero, usuario: UsuarioAutenticado): void {
    if (usuario.rol !== Rol.ADMIN && librero.usuarioId !== usuario.id)
      throw new PermisoDenegadoException(
        'Solo el librero dueño del perfil o un ADMIN pueden ver y responder sus preguntas',
      );
  }

  private async correoDe(librero: Librero): Promise<string | null> {
    if (!librero.usuarioId) return null;
    const usuario = await this.usuarios
      .obtener(librero.usuarioId)
      .catch(() => null);
    return usuario?.email ?? null;
  }
}
