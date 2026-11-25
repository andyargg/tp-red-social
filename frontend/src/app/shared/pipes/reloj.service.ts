import { DestroyRef, Injectable, inject, signal } from '@angular/core';

const UN_MINUTO = 60_000;

@Injectable({ providedIn: 'root' })
export class RelojService {
  private readonly actual = signal(new Date());
  readonly ahora = this.actual.asReadonly();

  constructor() {
    const intervalo = setInterval(() => this.actual.set(new Date()), UN_MINUTO);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalo));
  }
}
