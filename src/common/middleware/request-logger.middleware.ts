import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { RequestContext } from '../context/request-context';

/** Campos que nunca deben quedar escritos en los logs. */
const CAMPOS_SENSIBLES = new Set([
  'password',
  'numeroTarjeta',
  'cvv',
  'accessToken',
]);

export function ocultarSensibles(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ocultarSensibles);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>).map(([clave, v]) => [
        clave,
        CAMPOS_SENSIBLES.has(clave) ? '***' : ocultarSensibles(v),
      ]),
    );
  }
  return valor;
}

/**
 * Trazabilidad transversal de las peticiones (bases del Hito 2):
 *  - Genera el id del request (o reutiliza el x-request-id que envía el
 *    cliente) y lo devuelve en el header x-request-id de la respuesta.
 *  - Log de entrada: id, fecha y hora, method, path y body (si aplica).
 *  - Log de salida: id, código de respuesta y tiempo de ejecución, tanto en
 *    el flujo ok como en el de error (se mide al terminar de enviar la
 *    respuesta, por lo que también cubre lo que resuelve el filtro de errores).
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const entrante = req.headers['x-request-id'];
    const requestId =
      (Array.isArray(entrante) ? entrante[0] : entrante) || randomUUID();
    res.setHeader('x-request-id', requestId);

    const inicio = process.hrtime.bigint();
    const cuerpo: unknown = req.body;
    const tieneBody =
      !!cuerpo && typeof cuerpo === 'object' && Object.keys(cuerpo).length > 0;
    const body = tieneBody
      ? ` body=${JSON.stringify(ocultarSensibles(cuerpo))}`
      : '';
    this.logger.log(
      `[${requestId}] --> ${new Date().toISOString()} ${req.method} ${req.originalUrl}${body}`,
    );

    RequestContext.run({ requestId }, () => {
      res.on('finish', () => {
        const duracionMs = Number(process.hrtime.bigint() - inicio) / 1_000_000;
        this.logger.log(
          `[${requestId}] <-- ${req.method} ${req.originalUrl} ${res.statusCode} ${duracionMs.toFixed(1)}ms`,
        );
      });
      next();
    });
  }
}
