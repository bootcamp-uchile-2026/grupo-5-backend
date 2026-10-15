import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Correo {
  para: string;
  asunto: string;
  texto: string;
  /** Enlace principal del correo (verificar, restablecer, ver pedido...). */
  enlace?: string;
}

/**
 * Envío de correos DUMMY: no se conecta a ningún proveedor. Cada correo queda
 * en el log en formato JSON con su enlace, para poder completar los flujos en
 * desarrollo y en la demo. Para producción basta con reemplazar `enviar` por
 * un proveedor real (SMTP, SES, Resend...) sin tocar a quienes lo usan.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger('Mail');

  constructor(private readonly config: ConfigService) {}

  /** URL del Front a la que apuntan los enlaces de los correos. */
  enlaceFront(ruta: string): string {
    const base = this.config
      .get<string>('FRONTEND_URL', 'http://localhost:5173')
      .replace(/\/+$/, '');
    return `${base}${ruta}`;
  }

  enviar(correo: Correo): Promise<void> {
    this.logger.log(JSON.stringify({ evento: 'correo_enviado', ...correo }));
    return Promise.resolve();
  }
}
