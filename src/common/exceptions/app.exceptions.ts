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

// ---------- Hito 3: catálogo enriquecido ----------
export class PrecioAnteriorInvalidoException extends AppException {
  constructor(precio: number, precioAnterior: number) {
    super(
      'PRECIO_ANTERIOR_INVALIDO',
      `El precio anterior (${precioAnterior}) debe ser mayor que el precio actual (${precio})`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

// ---------- Reseñas ----------
export class ResenaNoEncontradaException extends AppException {
  constructor(id: string) {
    super(
      'RESENA_NO_ENCONTRADA',
      `No existe una reseña con id "${id}"`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ResenaDuplicadaException extends AppException {
  constructor() {
    super(
      'RESENA_DUPLICADA',
      'Ya escribiste una reseña para este libro; puedes editarla',
      HttpStatus.CONFLICT,
    );
  }
}

// ---------- Libreros ----------
export class LibreroNoEncontradoException extends AppException {
  constructor(id: string) {
    super(
      'LIBRERO_NO_ENCONTRADO',
      `No existe un librero con id o slug "${id}"`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class LibreroYaTienePerfilException extends AppException {
  constructor() {
    super(
      'LIBRERO_YA_TIENE_PERFIL',
      'El usuario ya tiene un perfil de librero, o el slug ya está en uso',
      HttpStatus.CONFLICT,
    );
  }
}

// ---------- Listas de deseos / club de lectura ----------
export class ListaNoEncontradaException extends AppException {
  constructor(id: string) {
    super(
      'LISTA_NO_ENCONTRADA',
      `No existe una lista de deseos con id "${id}"`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ClubNoEncontradoException extends AppException {
  constructor(id: string) {
    super(
      'CLUB_NO_ENCONTRADO',
      `No existe un club de lectura con id "${id}"`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class HiloNoEncontradoException extends AppException {
  constructor(id: string) {
    super(
      'HILO_NO_ENCONTRADO',
      `No existe un hilo de discusión con id "${id}"`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class NoEsParticipanteException extends AppException {
  constructor() {
    super(
      'NO_ES_PARTICIPANTE',
      'Debes unirte al club de lectura antes de participar',
      HttpStatus.FORBIDDEN,
    );
  }
}

// ---------- Cupones ----------
/** Un cupón que no se puede aplicar; `codigo` dice por qué (CUPON_VENCIDO, ...). */
export class CuponInvalidoException extends AppException {
  constructor(
    codigo: string,
    detalle: string,
    status = HttpStatus.UNPROCESSABLE_ENTITY,
  ) {
    super(codigo, detalle, status);
  }
}

// ---------- Cuenta: verificación, recuperación y acceso social ----------
export class TokenCuentaInvalidoException extends AppException {
  constructor() {
    super(
      'TOKEN_CUENTA_INVALIDO',
      'El enlace es inválido, ya se usó o expiró. Solicita uno nuevo.',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class EmailYaVerificadoException extends AppException {
  constructor() {
    super(
      'EMAIL_YA_VERIFICADO',
      'El correo de esta cuenta ya está verificado',
      HttpStatus.CONFLICT,
    );
  }
}

export class ProveedorNoConfiguradoException extends AppException {
  constructor(proveedor: string) {
    super(
      'PROVEEDOR_NO_CONFIGURADO',
      `El acceso con ${proveedor} no está habilitado en este servidor`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class TokenProveedorInvalidoException extends AppException {
  constructor(proveedor: string) {
    super(
      'TOKEN_PROVEEDOR_INVALIDO',
      `${proveedor} no validó el token de acceso`,
      HttpStatus.UNAUTHORIZED,
    );
  }
}

// ---------- Compra como invitado ----------
export class TokenPedidoInvalidoException extends AppException {
  constructor() {
    super(
      'TOKEN_PEDIDO_INVALIDO',
      'Se requiere el header X-Pedido-Token válido entregado al crear el pedido',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
