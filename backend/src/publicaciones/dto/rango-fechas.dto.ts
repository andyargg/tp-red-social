import { IsDateString, IsOptional, Matches } from 'class-validator';

const FECHA_ISO =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2}))?$/;

export class RangoFechasDto {
  @IsOptional()
  @IsDateString({ strict: true }, { message: 'La fecha desde no es válida' })
  @Matches(FECHA_ISO, { message: 'La fecha desde no es válida' })
  desde?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'La fecha hasta no es válida' })
  @Matches(FECHA_ISO, { message: 'La fecha hasta no es válida' })
  hasta?: string;
}
