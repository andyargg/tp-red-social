import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ActualizacionesService } from './core/actualizaciones.service';
import { SesionService } from './core/sesion.service';
import { Modal } from './shared/modal/modal';

@Component({
  imports: [RouterOutlet, Modal],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  constructor() {
    inject(SesionService);
    inject(ActualizacionesService);
  }
}
