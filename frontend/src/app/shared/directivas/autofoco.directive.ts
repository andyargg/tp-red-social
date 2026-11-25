import {
  AfterViewInit,
  Directive,
  ElementRef,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';

@Directive({ selector: '[appAutofoco]' })
export class AutofocoDirective implements AfterViewInit {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly appAutofoco = input(true, { transform: booleanAttribute });

  ngAfterViewInit() {
    const tactil =
      typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
    if (!this.appAutofoco() || tactil) return;
    const elemento = this.elemento.nativeElement;
    queueMicrotask(() => {
      elemento.focus();
      if (elemento instanceof HTMLTextAreaElement || elemento instanceof HTMLInputElement) {
        const fin = elemento.value.length;
        try {
          elemento.setSelectionRange(fin, fin);
        } catch {
          return;
        }
      }
    });
  }
}
