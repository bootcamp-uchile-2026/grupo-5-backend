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

/** Código y mensaje del ejemplo cuando la descripción no nombra un código. */
const POR_DEFECTO: Record<number, [string, string]> = {
  400: ['VALIDATION_ERROR', 'Los datos enviados no son válidos'],
  401: [
    'TOKEN_REQUERIDO',
    'Se requiere el header Authorization: Bearer <token>',
  ],
  402: [
    'PAGO_RECHAZADO',
    'Pago rechazado: la tarjeta no tiene fondos suficientes',
  ],
  403: ['PERMISO_DENEGADO', 'No tienes permisos para realizar esta operación'],
  404: ['RECURSO_NO_ENCONTRADO', 'El recurso solicitado no existe'],
  409: ['CONFLICTO', 'Conflicto con el estado actual del recurso'],
  413: [
    'ARCHIVO_DEMASIADO_GRANDE',
    'El archivo supera el tamaño máximo permitido',
  ],
  415: [
    'TIPO_ARCHIVO_NO_PERMITIDO',
    'El archivo debe ser una imagen JPG, PNG o WEBP',
  ],
  422: [
    'OPERACION_NO_PROCESABLE',
    'La operación no se puede procesar con esos datos',
  ],
  502: ['SERVICIO_EXTERNO_NO_DISPONIBLE', 'Un servicio externo no respondió'],
  503: [
    'PROVEEDOR_NO_CONFIGURADO',
    'El servicio no está configurado en el servidor',
  ],
};

/** Primer código de error (MAYUSCULAS_CON_GUION_BAJO) que aparece en la descripción. */
const CODIGO = /\b[A-Z][A-Z0-9]*_[A-Z0-9_]*[A-Z0-9]\b/;

/**
 * Ejemplo de ErrorResponseDto propio de cada respuesta, para que Swagger no
 * muestre el mismo error de ejemplo en todos los códigos HTTP.
 */
export function ejemploError(
  status: number,
  descripcion: string | undefined,
): ErrorResponseDto {
  const [codigoDefecto, mensajeDefecto] = POR_DEFECTO[status] ?? [
    'ERROR_HTTP',
    'Ocurrió un error',
  ];
  const codigo = descripcion?.match(CODIGO)?.[0] ?? codigoDefecto;
  // El texto de la descripción sin el código entre paréntesis, si queda algo legible.
  const texto = descripcion
    ?.replace(CODIGO, '')
    .replace(/\(\s*[,\s]*\)|^[\s:,.-]+|[\s:,.(-]+$/g, '')
    .trim();
  // LIBRO_NO_ENCONTRADO -> "Libro no encontrado"
  const delCodigo =
    codigo.charAt(0) + codigo.slice(1).toLowerCase().replace(/_/g, ' ');
  const mensaje =
    codigo === codigoDefecto
      ? mensajeDefecto
      : texto && texto.length > 3
        ? texto.charAt(0).toUpperCase() + texto.slice(1)
        : delCodigo;
  return {
    statusCode: status,
    error: codigo,
    message: mensaje,
    ...(status === 400 && codigo === 'VALIDATION_ERROR'
      ? {
          detalles: [
            'email must be an email',
            'password must be longer than or equal to 8 characters',
          ],
        }
      : {}),
    timestamp: '2026-11-19T14:21:09.120Z',
    path: '/ruta/del/endpoint',
    requestId: 'b0f6f0a2-5f0e-4a36-9d0c-3f7c2b5a8f11',
  };
}

/** Documenta en Swagger las respuestas de error de un endpoint. */
export function ApiErrores(...estados: Array<number | [number, string]>) {
  return applyDecorators(
    ...estados.map((e) => {
      const [status, description] = Array.isArray(e)
        ? e
        : [e, DESCRIPCIONES[e]];
      return ApiResponse({
        status,
        description,
        type: ErrorResponseDto,
        example: ejemploError(status, description),
      });
    }),
  );
}
