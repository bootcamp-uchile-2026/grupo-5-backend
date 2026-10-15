import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';

/** Marca un endpoint (o un controller completo) como accesible sin token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Endpoint accesible sin token que, si recibe uno válido, deja al usuario en
 * req.user (por ejemplo, para validar un cupón de un solo uso por cliente).
 * Un token inválido se rechaza igual que en una ruta privada.
 */
export const AuthOpcional = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
