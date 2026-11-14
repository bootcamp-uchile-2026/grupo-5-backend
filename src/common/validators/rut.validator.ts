import { ValidationOptions, registerDecorator } from 'class-validator';

/** Deja el RUT como 12345678-5: sin puntos ni espacios y con el dígito verificador en mayúscula. */
export function normalizarRut({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  const limpio = value.replace(/[.\s-]/g, '').toUpperCase();
  return limpio.length > 1
    ? `${limpio.slice(0, -1)}-${limpio.slice(-1)}`
    : limpio;
}

/** Valida el dígito verificador de un RUT chileno (módulo 11). */
export function rutValido(rut: string): boolean {
  const m = /^(\d{7,8})-([\dK])$/.exec(rut);
  if (!m) return false;
  let suma = 0;
  let factor = 2;
  for (const digito of m[1].split('').reverse()) {
    suma += Number(digito) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return esperado === m[2];
}

export function IsRut(opciones?: ValidationOptions) {
  return (objeto: object, propiedad: string) =>
    registerDecorator({
      name: 'isRut',
      target: objeto.constructor,
      propertyName: propiedad,
      options: {
        message: `${propiedad} debe ser un RUT válido, por ejemplo 12.345.678-5`,
        ...opciones,
      },
      validator: {
        validate: (valor: unknown) =>
          typeof valor === 'string' && rutValido(valor),
      },
    });
}
