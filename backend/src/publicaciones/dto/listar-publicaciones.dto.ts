import { IsIn, IsMongoId, IsOptional } from 'class-validator';
import { PaginacionDto } from './paginacion.dto.js';

export const ORDENES = ['fecha', 'meGusta'] as const;
export type Orden = (typeof ORDENES)[number];

export class ListarPublicacionesDto extends PaginacionDto {
  @IsOptional()
  @IsIn(ORDENES, { message: 'orden debe ser "fecha" o "meGusta"' })
  orden: Orden = 'fecha';

  // id del autor, para ver solo sus publicaciones
  @IsOptional()
  @IsMongoId({ message: 'usuario debe ser un id válido' })
  usuario?: string;
}
