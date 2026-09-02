export enum RolUsuario {
  CLIENTE = 'CLIENTE',
  LIBRERO = 'LIBRERO',
  ADMIN = 'ADMIN',
}

/**
 * Entidad Usuario.
 * Representa tanto a clientes como a libreros de LeeConNos.
 * En hitos siguientes se migrará a una entidad de persistencia real (TypeORM/Prisma).
 */
export class Usuario {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: RolUsuario;
  generosFavoritos?: string[]; // usado por el motor de recomendaciones (solo CLIENTE)
  fechaRegistro: Date;
}
