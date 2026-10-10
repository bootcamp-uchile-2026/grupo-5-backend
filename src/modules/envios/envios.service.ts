import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvioSinCoberturaException } from '../../common/exceptions/app.exceptions';
import {
  CotizacionEnvioDto,
  CotizarEnvioDto,
  MetodoEnvio,
  Region,
} from './dto/envio.dto';

const REGIONES_EXTREMAS = new Set<Region>([
  Region.XV,
  Region.I,
  Region.XI,
  Region.XII,
]);
const COMUNAS_SIN_COBERTURA = new Set([
  'isla de pascua',
  'rapa nui',
  'juan fernandez',
  'antartica',
]);

/** minúsculas y sin tildes, para comparar comunas sin depender de cómo se escriban. */
const normalizar = (texto: string) =>
  texto.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Cálculo DUMMY del costo de envío: no consulta a ningún courier. Las reglas
 * son fijas para que Web y Mobile puedan demostrar casos de éxito y de error:
 *
 *  1. RETIRO en tienda                         -> $0, 1 día.
 *  2. Comuna sin cobertura (Isla de Pascua,
 *     Juan Fernández, Antártica)               -> 422 ENVIO_SIN_COBERTURA.
 *  3. Subtotal >= ENVIO_GRATIS_DESDE ($40.000) -> $0 (se mantiene el plazo de la zona).
 *  4. Región Metropolitana                     -> $2.990, 2 días.
 *  5. Zonas extremas (XV, I, XI, XII)          -> $7.990, 7 días.
 *  6. Resto de las regiones                    -> $4.990, 4 días.
 */
@Injectable()
export class EnviosService {
  constructor(private readonly config: ConfigService) {}

  cotizar(dto: CotizarEnvioDto): CotizacionEnvioDto {
    if (dto.metodoEnvio === MetodoEnvio.RETIRO) {
      return {
        metodoEnvio: dto.metodoEnvio,
        costo: 0,
        diasEstimados: 1,
        gratis: false,
        regla: 'Retiro en tienda',
      };
    }

    const comuna = dto.comuna ?? '';
    if (COMUNAS_SIN_COBERTURA.has(normalizar(comuna)))
      throw new EnvioSinCoberturaException(comuna);

    const region = dto.region as Region;
    const zona =
      region === Region.RM
        ? {
            costo: 2990,
            diasEstimados: 2,
            regla: 'Despacho Región Metropolitana',
          }
        : REGIONES_EXTREMAS.has(region)
          ? { costo: 7990, diasEstimados: 7, regla: 'Despacho a zona extrema' }
          : { costo: 4990, diasEstimados: 4, regla: 'Despacho a regiones' };

    const gratisDesde = Number(this.config.get('ENVIO_GRATIS_DESDE', 40000));
    if (dto.subtotal >= gratisDesde) {
      return {
        metodoEnvio: dto.metodoEnvio,
        costo: 0,
        diasEstimados: zona.diasEstimados,
        gratis: true,
        regla: `Envío gratis por compras desde $${gratisDesde}`,
      };
    }
    return { metodoEnvio: dto.metodoEnvio, ...zona, gratis: false };
  }
}
