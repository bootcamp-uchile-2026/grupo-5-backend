import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Todas las excepciones de negocio extienden esta clase. `errorCode` es un
 * identificador estable (independiente del idioma del mensaje) que Web y
 * Mobile pueden usar para distinguir programáticamente cada tipo de error.
 * El filtro global las convierte en la respuesta HTTP correspondiente.
 */
export class AppException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    status: HttpStatus,
    public readonly detalles?: string[],
  ) {
    super(message, status);
  }
}

// ---------- Genéricas ----------
export class IdInvalidoException extends AppException {
  constructor(valor: string) {
    super(
      'ID_INVALIDO',
      `El identificador "${valor}" no es un UUID válido`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class RecursoNoEncontradoException extends AppException {
  constructor(recurso: string, id: string) {
    super(
      'RECURSO_NO_ENCONTRADO',
      `No existe ${recurso} con id "${id}"`,
      HttpStatus.NOT_FOUND,
    );
  }
}

// ---------- Auth / usuarios ----------
export class CredencialesInvalidasException extends AppException {
  constructor() {
    super(
      'CREDENCIALES_INVALIDAS',
      'Email o contraseña incorrectos',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class TokenRequeridoException extends AppException {
  constructor() {
    super(
      'TOKEN_REQUERIDO',
      'Se requiere el header Authorization: Bearer <token>',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class TokenInvalidoException extends AppException {
  constructor() {
    super(
      'TOKEN_INVALIDO',
      'El token es inválido o expiró',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class PermisoDenegadoException extends AppException {
  constructor(detalle = 'No tienes permisos para realizar esta operación') {
    super('PERMISO_DENEGADO', detalle, HttpStatus.FORBIDDEN);
  }
}

export class EmailYaRegistradoException extends AppException {
  constructor(email: string) {
    super(
      'EMAIL_YA_REGISTRADO',
      `Ya existe una cuenta con el email "${email}"`,
      HttpStatus.CONFLICT,
    );
  }
}

export class UsuarioNoEncontradoException extends AppException {
  constructor(id: string) {
    super(
      'USUARIO_NO_ENCONTRADO',
      `No existe un usuario con id "${id}"`,
      HttpStatus.NOT_FOUND,
    );
  }
}

// ---------- Catálogo ----------
export class LibroNoEncontradoException extends AppException {
  constructor(id: string) {
    super(
      'LIBRO_NO_ENCONTRADO',
      `No existe un libro con id "${id}"`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class IsbnDuplicadoException extends AppException {
  constructor(isbn: string) {
    super(
      'ISBN_DUPLICADO',
      `Ya existe un libro con el ISBN "${isbn}"`,
      HttpStatus.CONFLICT,
    );
  }
}

export class IsbnNoEncontradoException extends AppException {
  constructor(isbn: string) {
    super(
      'ISBN_NO_ENCONTRADO',
      `Open Library no tiene datos para el ISBN "${isbn}"`,
      HttpStatus.NOT_FOUND,
    );
  }
}

/** Fallas al invocar un servicio externo (Open Library, pasarela de pago). */
export class ServicioExternoException extends AppException {
  constructor(codigo: string, detalle: string) {
    super(codigo, detalle, HttpStatus.BAD_GATEWAY);
  }
}

// ---------- Carrito ----------
export class StockInsuficienteException extends AppException {
  constructor(detalles: string[]) {
    super(
      'STOCK_INSUFICIENTE',
      'No hay stock suficiente para uno o más libros',
      HttpStatus.CONFLICT,
      detalles,
    );
  }
}

export class ItemNoEstaEnCarritoException extends AppException {
  constructor(libroId: string) {
    super(
      'ITEM_NO_ESTA_EN_CARRITO',
      `El libro "${libroId}" no está en el carrito`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class CarritoVacioException extends AppException {
  constructor() {
    super(
      'CARRITO_VACIO',
      'No se puede crear un pedido con el carrito vacío',
      HttpStatus.CONFLICT,
    );
  }
}

// ---------- Envíos ----------
export class EnvioSinCoberturaException extends AppException {
  constructor(comuna: string) {
    super(
      'ENVIO_SIN_COBERTURA',
      `No hay cobertura de despacho para la comuna "${comuna}"`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

// ---------- Pedidos / pagos / seguimiento ----------
export class PedidoNoEncontradoException extends AppException {
  constructor(id: string) {
    super(
      'PEDIDO_NO_ENCONTRADO',
      `No existe un pedido con id "${id}"`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class EstadoPedidoInvalidoException extends AppException {
  constructor(operacion: string, estado: string) {
    super(
      'ESTADO_PEDIDO_INVALIDO',
      `No es posible ${operacion} un pedido en estado "${estado}"`,
      HttpStatus.CONFLICT,
    );
  }
}

export class PagoRechazadoException extends AppException {
  constructor(motivo: string, descripcion: string) {
    super('PAGO_RECHAZADO', descripcion, HttpStatus.PAYMENT_REQUIRED, [motivo]);
  }
}

export class SeguimientoNoDisponibleException extends AppException {
  constructor(estado: string) {
    super(
      'SEGUIMIENTO_NO_DISPONIBLE',
      `El pedido aún no tiene seguimiento porque su estado es "${estado}"`,
      HttpStatus.CONFLICT,
    );
  }
}
