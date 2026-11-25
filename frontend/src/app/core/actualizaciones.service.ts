import { Injectable, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { ModalService } from '../shared/modal/modal.service';

@Injectable({ providedIn: 'root' })
export class ActualizacionesService {
  private readonly sw = inject(SwUpdate);
  private readonly modal = inject(ModalService);
  private avisado = false;

  constructor() {
    if (!this.sw.isEnabled) return;
    this.sw.versionUpdates.subscribe((evento) => {
      if (evento.type === 'VERSION_READY') this.ofrecerRecarga();
    });
    this.sw.unrecoverable.subscribe(() => document.location.reload());
  }

  private async ofrecerRecarga() {
    if (this.avisado) return;
    this.avisado = true;
    const recargar = await this.modal.confirmar({
      tipo: 'info',
      titulo: 'Hay una versión nueva',
      mensaje: 'Se actualizó Socialito. Recargá para usar la última versión.',
      textoBoton: 'Recargar',
      textoCancelar: 'Más tarde',
    });
    if (recargar) document.location.reload();
  }
}
