import { IsDateString, IsOptional } from 'class-validator';

export class RangoFechasDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha desde no es válida' })
  desde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha hasta no es válida' })
  hasta?: string;
}
