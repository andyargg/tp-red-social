import { Injectable, signal } from '@angular/core';

export type TipoModal = 'exito' | 'error' | 'info';

export interface DatosModal {
  titulo: string;
  mensaje: string;
  tipo?: TipoModal;
  textoBoton?: string;
  textoCancelar?: string;
  peligroso?: boolean;
}

interface Pendiente {
  datos: DatosModal;
  responder: (aceptado: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly actual = signal<DatosModal | null>(null);
  private abierto?: Pendiente;
  private readonly cola: Pendiente[] = [];

  abrir(datos: DatosModal): Promise<boolean> {
    return new Promise((responder) => {
      this.cola.push({ datos: { tipo: 'info', textoBoton: 'Aceptar', ...datos }, responder });
      if (!this.abierto) this.mostrarSiguiente();
    });
  }

  confirmar(datos: DatosModal): Promise<boolean> {
    return this.abrir({ textoBoton: 'Confirmar', textoCancelar: 'Cancelar', ...datos });
  }

  cerrar(aceptado = false) {
    const abierto = this.abierto;
    this.abierto = undefined;
    abierto?.responder(aceptado);
    this.mostrarSiguiente();
  }

  descartar(titulo: string) {
    for (let i = this.cola.length - 1; i >= 0; i--) {
      if (this.cola[i].datos.titulo === titulo) this.cola.splice(i, 1)[0].responder(false);
    }
    if (this.abierto?.datos.titulo === titulo) this.cerrar(false);
  }

  private mostrarSiguiente() {
    this.abierto = this.cola.shift();
    this.actual.set(this.abierto?.datos ?? null);
  }
}
