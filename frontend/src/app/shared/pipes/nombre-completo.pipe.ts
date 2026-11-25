import { Pipe, PipeTransform } from '@angular/core';

export interface ConNombre {
  nombre: string;
  apellido: string;
}

@Pipe({ name: 'nombreCompleto' })
export class NombreCompletoPipe implements PipeTransform {
  transform(persona: ConNombre | null | undefined): string {
    if (!persona) return '';
    return [persona.nombre, persona.apellido]
      .map((parte) => parte?.trim())
      .filter(Boolean)
      .join(' ');
  }
}
