import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from './error-response.dto';

const DESCRIPCIONES: Record<number, string> = {
  400: 'Datos de entrada inválidos (VALIDATION_ERROR, ID_INVALIDO)',
  401: 'Falta el token o es inválido (TOKEN_REQUERIDO, TOKEN_INVALIDO)',
  402: 'Pago rechazado por la pasarela (PAGO_RECHAZADO)',
  403: 'El usuario no tiene permisos (PERMISO_DENEGADO)',
  404: 'El recurso no existe',
  409: 'Conflicto con el estado actual del recurso',
  422: 'La operación no se puede procesar con esos datos',
  502: 'Falla de un servicio externo',
};

/** Documenta en Swagger las respuestas de error de un endpoint. */
export function ApiErrores(...estados: Array<number | [number, string]>) {
  return applyDecorators(
    ...estados.map((e) => {
      const [status, description] = Array.isArray(e)
        ? e
        : [e, DESCRIPCIONES[e]];
      return ApiResponse({ status, description, type: ErrorResponseDto });
    }),
  );
}
