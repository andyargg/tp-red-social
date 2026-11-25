import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'plural' })
export class PluralPipe implements PipeTransform {
  transform(
    cantidad: number | null | undefined,
    singular: string,
    plural = `${singular}s`,
  ): string {
    return (cantidad ?? 0) === 1 ? singular : plural;
  }
}
