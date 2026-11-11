import { ValidateBy, ValidationOptions } from 'class-validator';

// fecha "AAAA-MM-DD" que no sea posterior a hoy ni anterior a 1900
export function FechaPasada(opciones?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'fechaPasada',
      validator: {
        validate: (valor: unknown) => {
          if (typeof valor !== 'string') return false;
          const fecha = new Date(valor);
          if (Number.isNaN(fecha.getTime())) return false;
          // se compara contra mañana para no rechazar el día de hoy por diferencias de huso horario
          const manana = new Date();
          manana.setDate(manana.getDate() + 1);
          return fecha.getUTCFullYear() >= 1900 && fecha < manana;
        },
      },
    },
    opciones,
  );
}
