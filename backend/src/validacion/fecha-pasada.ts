import { ValidateBy, ValidationOptions } from 'class-validator';

export function FechaPasada(opciones?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'fechaPasada',
      validator: {
        validate: (valor: unknown) => {
          if (typeof valor !== 'string') return false;
          const fecha = new Date(valor);
          if (Number.isNaN(fecha.getTime())) return false;
          const manana = new Date();
          manana.setDate(manana.getDate() + 1);
          return fecha.getUTCFullYear() >= 1900 && fecha < manana;
        },
      },
    },
    opciones,
  );
}
