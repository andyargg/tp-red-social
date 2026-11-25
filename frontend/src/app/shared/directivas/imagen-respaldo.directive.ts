import { Directive, input, output, signal } from '@angular/core';

@Directive({
  selector: 'img[appImagenRespaldo]',
  host: {
    '(error)': 'alFallar($event)',
    '(load)': 'alCargar()',
    '[style.display]': "oculta() ? 'none' : null",
  },
})
export class ImagenRespaldoDirective {
  readonly appImagenRespaldo = input<string>('');
  readonly imagenRota = output<void>();
  protected readonly oculta = signal(false);
  private usoRespaldo = false;

  protected alCargar() {
    this.oculta.set(false);
    this.usoRespaldo = false;
  }

  protected alFallar(evento: Event) {
    const img = evento.target as HTMLImageElement;
    const respaldo = this.appImagenRespaldo();
    if (respaldo && !this.usoRespaldo) {
      this.usoRespaldo = true;
      img.src = respaldo;
      return;
    }
    this.oculta.set(true);
    this.imagenRota.emit();
  }
}
