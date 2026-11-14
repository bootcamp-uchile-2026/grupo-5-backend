import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoNoEncontradoException } from '../../common/exceptions/app.exceptions';
import { MailService } from '../mail/mail.service';
import { SuscripcionNewsletter } from './entities/suscripcion-newsletter.entity';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(SuscripcionNewsletter)
    private readonly repo: Repository<SuscripcionNewsletter>,
    private readonly mail: MailService,
  ) {}

  /** Idempotente: si el email ya estaba (activo o dado de baja) queda activo. */
  async suscribir(
    email: string,
    usuarioId: string | null = null,
  ): Promise<SuscripcionNewsletter> {
    const existente = await this.repo.findOneBy({ email });
    if (existente?.activa) {
      if (usuarioId && !existente.usuarioId) {
        await this.repo.update({ email }, { usuarioId });
        existente.usuarioId = usuarioId;
      }
      return existente;
    }
    if (existente) {
      await this.repo.update(
        { email },
        {
          activa: true,
          bajaEn: null,
          usuarioId: usuarioId ?? existente.usuarioId,
        },
      );
    } else {
      await this.repo.insert({ email, activa: true, usuarioId });
    }
    const suscripcion = await this.repo.findOneByOrFail({ email });
    await this.mail.enviar({
      para: email,
      asunto: 'Te suscribiste a las novedades de LeeConNos',
      texto:
        'Te contaremos los lanzamientos y las recomendaciones de nuestros libreros.',
      enlace: this.mail.enlaceFront(
        `/newsletter/baja?token=${suscripcion.tokenBaja}`,
      ),
    });
    return suscripcion;
  }

  async darDeBajaPorToken(token: string): Promise<SuscripcionNewsletter> {
    const suscripcion = await this.repo.findOneBy({ tokenBaja: token });
    if (!suscripcion)
      throw new RecursoNoEncontradoException('una suscripción', token);
    return this.desactivar(suscripcion);
  }

  async darDeBajaPorEmail(email: string): Promise<void> {
    const suscripcion = await this.repo.findOneBy({ email });
    if (suscripcion) await this.desactivar(suscripcion);
  }

  listar(): Promise<SuscripcionNewsletter[]> {
    return this.repo.find({
      where: { activa: true },
      order: { creadoEn: 'DESC' },
    });
  }

  private async desactivar(
    s: SuscripcionNewsletter,
  ): Promise<SuscripcionNewsletter> {
    if (s.activa) {
      s.activa = false;
      s.bajaEn = new Date();
      await this.repo.update(
        { email: s.email },
        { activa: false, bajaEn: s.bajaEn },
      );
    }
    return s;
  }
}
