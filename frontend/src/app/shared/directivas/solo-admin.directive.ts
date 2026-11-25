import { Directive, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthService } from '../../core/auth.service';

@Directive({ selector: '[appSoloAdmin]' })
export class SoloAdminDirective {
  private readonly auth = inject(AuthService);
  private readonly plantilla = inject(TemplateRef<unknown>);
  private readonly contenedor = inject(ViewContainerRef);
  private visible = false;

  constructor() {
    effect(() => {
      const esAdmin = this.auth.usuario()?.perfil === 'administrador';
      if (esAdmin && !this.visible) this.contenedor.createEmbeddedView(this.plantilla);
      if (!esAdmin && this.visible) this.contenedor.clear();
      this.visible = esAdmin;
    });
  }
}
