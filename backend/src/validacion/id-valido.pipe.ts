import { BadRequestException, PipeTransform } from '@nestjs/common';

const OBJECT_ID = /^[a-f\d]{24}$/i;

// exige un ObjectId de 24 caracteres hexadecimales; si no, 400 en vez de llegar a la base
export class IdValidoPipe implements PipeTransform<string, string> {
  transform(valor: string) {
    if (!OBJECT_ID.test(valor)) {
      throw new BadRequestException('El id no es válido');
    }
    return valor;
  }
}
