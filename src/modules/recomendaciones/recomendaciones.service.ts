import { Injectable } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LibrosService } from '../libros/libros.service';
import { ResultadoRecomendacion, CompraHistorial } from './entities/recomendacion.entity';

/**
 * Motor de Recomendaciones (esfuerzo diferencial del proyecto).
 *
 * Hito 1: versión básica basada en reglas, combinando:
 *  1) Géneros favoritos declarados por el usuario.
 *  2) Historial de compras (simulado en memoria por ahora).
 *
 * Score = 0.6 * coincidenciaGeneroFavorito + 0.4 * coincidenciaHistorialCompras
 * En hitos siguientes este cálculo podrá evolucionar a un modelo colaborativo
 * (usuarios similares) o basado en contenido (similaridad entre libros).
 */
@Injectable()
export class RecomendacionesService {
  // Historial simulado; en el hito de integración se reemplaza por datos reales de compras.
  private readonly historialCompras: CompraHistorial[] = [];

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly librosService: LibrosService,
  ) {}

  registrarCompra(usuarioId: string, libroId: string, genero: string): void {
    this.historialCompras.push({ usuarioId, libroId, genero, fecha: new Date() });
  }

  generarParaUsuario(usuarioId: string, limite = 5): ResultadoRecomendacion[] {
    const usuario = this.usuariosService.findOne(usuarioId);
    const generosFavoritos = new Set((usuario.generosFavoritos ?? []).map((g) => g.toLowerCase()));

    const comprasUsuario = this.historialCompras.filter((c) => c.usuarioId === usuarioId);
    const generosComprados = new Set(comprasUsuario.map((c) => c.genero.toLowerCase()));
    const librosYaComprados = new Set(comprasUsuario.map((c) => c.libroId));

    const catalogo = this.librosService.findAll();

    const resultados: ResultadoRecomendacion[] = catalogo
      .filter((libro) => !librosYaComprados.has(libro.id))
      .map((libro) => {
        const generoLower = libro.genero.toLowerCase();
        const coincideFavorito = generosFavoritos.has(generoLower) ? 1 : 0;
        const coincideHistorial = generosComprados.has(generoLower) ? 1 : 0;
        const score = 0.6 * coincideFavorito + 0.4 * coincideHistorial;

        let motivo = 'Seleccionado del catálogo general';
        if (coincideFavorito && coincideHistorial) {
          motivo = `Coincide con tu género favorito "${libro.genero}" y tu historial de compras`;
        } else if (coincideFavorito) {
          motivo = `Coincide con tu género favorito "${libro.genero}"`;
        } else if (coincideHistorial) {
          motivo = `Similar a compras anteriores en "${libro.genero}"`;
        }

        return {
          libroId: libro.id,
          titulo: libro.titulo,
          genero: libro.genero,
          score,
          motivo,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limite);

    return resultados;
  }
}
