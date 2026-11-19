import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

export interface Correo {
  para: string;
  asunto: string;
  texto: string;
  /** Enlace principal del correo (verificar, restablecer, ver pedido...). */
  enlace?: string;
}

/** Escapa el texto para insertarlo en el HTML del correo. */
const html = (texto: string) =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Envío de correos.
 *
 *  - Con SMTP_HOST configurado, se envían de verdad por SMTP (Gmail con
 *    contraseña de aplicación, Resend, SendGrid, Mailtrap...).
 *  - Sin SMTP_HOST (desarrollo, pruebas), quedan en el log en formato JSON con
 *    su enlace, para poder completar los flujos sin bandeja real.
 *
 * Si el proveedor falla, el error queda en el log y la operación que originó
 * el correo (registro, pedido...) no se interrumpe: el usuario puede pedir que
 * se reenvíe (por ejemplo POST /auth/reenviar-verificacion).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger('Mail');
  private readonly transporte: Transporter | null;
  private readonly remitente: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const puerto = Number(this.config.get('SMTP_PORT', 587));
    this.remitente = this.config.get<string>(
      'MAIL_FROM',
      'LeeConNos <no-responder@leeconnos.cl>',
    );
    this.transporte = host
      ? createTransport({
          host,
          port: puerto,
          // 465 usa TLS desde el inicio; 587 negocia STARTTLS.
          secure:
            this.config.get('SMTP_SECURE', String(puerto === 465)) === 'true',
          auth: this.config.get<string>('SMTP_USER')
            ? {
                user: this.config.get<string>('SMTP_USER'),
                pass: this.config.get<string>('SMTP_PASS'),
              }
            : undefined,
        })
      : null;
  }

  /** true si los correos se envían de verdad (hay SMTP configurado). */
  get envioReal(): boolean {
    return this.transporte !== null;
  }

  /** URL del Front a la que apuntan los enlaces de los correos. */
  enlaceFront(ruta: string): string {
    const base = this.config
      .get<string>('FRONTEND_URL', 'http://localhost:5173')
      .replace(/\/+$/, '');
    return `${base}${ruta}`;
  }

  async enviar(correo: Correo): Promise<void> {
    if (!this.transporte) {
      this.logger.log(JSON.stringify({ evento: 'correo_enviado', ...correo }));
      return;
    }
    try {
      await this.transporte.sendMail(this.armar(correo));
      // El enlace no se escribe en el log: con envío real contiene un token válido.
      this.logger.log(
        JSON.stringify({
          evento: 'correo_enviado',
          para: correo.para,
          asunto: correo.asunto,
        }),
      );
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo "${correo.asunto}" a ${correo.para}: ${(error as Error).message}`,
      );
    }
  }

  /** Mensaje en texto plano y HTML, con el enlace como botón. */
  armar(correo: Correo) {
    const texto = correo.enlace
      ? `${correo.texto}\n\n${correo.enlace}`
      : correo.texto;
    const boton = correo.enlace
      ? `<p style="margin:24px 0"><a href="${html(correo.enlace)}" style="background:#2f5d50;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Continuar</a></p>
         <p style="font-size:12px;color:#666">Si el botón no funciona, copia este enlace en tu navegador:<br>${html(correo.enlace)}</p>`
      : '';
    return {
      from: this.remitente,
      to: correo.para,
      subject: correo.asunto,
      text: texto,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222;max-width:520px">
        <h2 style="color:#2f5d50">LeeConNos</h2>
        <p>${html(correo.texto).replace(/\n/g, '<br>')}</p>${boton}
      </div>`,
    };
  }
}
