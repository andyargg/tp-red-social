import { Transform } from 'class-transformer';

// quita los espacios de los extremos antes de validar: "   " cuenta como vacío
export const Recortar = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
