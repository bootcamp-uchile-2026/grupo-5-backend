export class ResultadoRecomendacion {
  libroId: string;
  titulo: string;
  genero: string;
  score: number; // 0 a 1
  motivo: string; // explica por qué se recomienda (transparencia del motor)
}

/**
 * Registro simple del historial de compras, usado como señal
 * para el motor de recomendaciones. Se conectará al módulo de
 * pedidos/compras cuando exista en un hito posterior.
 */
export class CompraHistorial {
  usuarioId: string;
  libroId: string;
  genero: string;
  fecha: Date;
}
