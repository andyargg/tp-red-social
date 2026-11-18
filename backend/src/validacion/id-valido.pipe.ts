import { BadRequestException, PipeTransform } from '@nestjs/common';

const OBJECT_ID = /^[a-f\d]{24}$/i;

export class IdValidoPipe implements PipeTransform<string, string> {
  transform(valor: string) {
    if (!OBJECT_ID.test(valor)) {
      throw new BadRequestException('El id no es válido');
    }
    return valor;
  }
}
