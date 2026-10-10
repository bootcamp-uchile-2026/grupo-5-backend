import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { RequestContext } from '../context/request-context';
import { AppException } from '../exceptions/app.exceptions';

interface ErrorResuelto {
  statusCode: number;
  errorCode: string;
  message: string;
  detalles?: string[];
}

const CODIGO_POR_ESTADO: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'NO_AUTORIZADO',
  403: 'PERMISO_DENEGADO',
  404: 'RUTA_NO_ENCONTRADA',
  409: 'CONFLICTO',
};

/**
 * Captura cualquier excepción (de negocio, de validación o inesperada) y la
 * transforma en una respuesta HTTP con una única estructura (ErrorResponseDto).
 * El stack trace nunca se expone al cliente: solo queda en los logs.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsHandler');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId =
      RequestContext.requestId ??
      String(response.getHeader('x-request-id') ?? 'unknown');

    const { statusCode, errorCode, message, detalles } =
      this.resolve(exception);
    const linea = `[${requestId}] ${request.method} ${request.originalUrl} -> ${statusCode} ${errorCode}: ${message}`;

    if (statusCode >= 500) {
      // El stack solo interesa en errores inesperados, no en los de negocio (p. ej. pasarela caída).
      const stack =
        exception instanceof AppException
          ? undefined
          : ((exception as Error)?.stack ?? String(exception));
      this.logger.error(linea, stack);
    } else {
      this.logger.warn(linea);
    }

    response.status(statusCode).json({
      statusCode,
      error: errorCode,
      message,
      ...(detalles?.length ? { detalles } : {}),
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      requestId,
    });
  }

  private resolve(exception: unknown): ErrorResuelto {
    if (exception instanceof AppException) {
      return {
        statusCode: exception.getStatus(),
        errorCode: exception.errorCode,
        message: exception.message,
        detalles: exception.detalles,
      };
    }

    // Errores del ValidationPipe u otras HttpException estándar de Nest.
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();
      const original =
        typeof body === 'object' && body !== null
          ? (body as { message?: unknown }).message
          : body;
      if (Array.isArray(original)) {
        return {
          statusCode,
          errorCode: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son válidos',
          detalles: original.map(String),
        };
      }
      return {
        statusCode,
        errorCode: CODIGO_POR_ESTADO[statusCode] ?? 'ERROR_HTTP',
        message: typeof original === 'string' ? original : exception.message,
      };
    }

    // Restricciones que detecta PostgreSQL: unicidad (carrera entre dos
    // peticiones) y llaves foráneas (borrar algo que todavía tiene datos asociados).
    if (exception instanceof QueryFailedError) {
      const codigo = (exception.driverError as { code?: string })?.code;
      if (codigo === '23505') {
        return {
          statusCode: HttpStatus.CONFLICT,
          errorCode: 'CONFLICTO',
          message: 'El recurso ya existe',
        };
      }
      if (codigo === '23503') {
        return {
          statusCode: HttpStatus.CONFLICT,
          errorCode: 'RECURSO_EN_USO',
          message: 'No se puede eliminar porque tiene datos asociados',
        };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: 'ERROR_INTERNO',
      message: 'Ocurrió un error interno inesperado',
    };
  }
}
