import { Injectable, signal } from '@angular/core';

export type TipoModal = 'exito' | 'error' | 'info';

export interface DatosModal {
  titulo: string;
  mensaje: string;
  tipo?: TipoModal;
  textoBoton?: string;
  // con textoCancelar el modal pide confirmación y muestra dos botones
  textoCancelar?: string;
  peligroso?: boolean;
}

// reemplaza a alert() y confirm(): un único modal para toda la app, montado en App
@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly actual = signal<DatosModal | null>(null);
  private alCerrar?: (aceptado: boolean) => void;

  // se resuelve en true si se tocó el botón principal
  abrir(datos: DatosModal): Promise<boolean> {
    this.alCerrar?.(false);
    this.actual.set({ tipo: 'info', textoBoton: 'Aceptar', ...datos });
    return new Promise((resolve) => (this.alCerrar = resolve));
  }

  confirmar(datos: DatosModal): Promise<boolean> {
    return this.abrir({ textoBoton: 'Confirmar', textoCancelar: 'Cancelar', ...datos });
  }

  cerrar(aceptado = false) {
    const alCerrar = this.alCerrar;
    this.alCerrar = undefined;
    this.actual.set(null);
    alCerrar?.(aceptado);
  }
}
