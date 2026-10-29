import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Modal } from './shared/modal/modal';

@Component({
  imports: [RouterOutlet, Modal],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
