import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Avatar } from '../../shared/avatar';
import { Icono } from '../../shared/icono';

@Component({
  selector: 'app-mi-perfil',
  imports: [RouterLink, DatePipe, Avatar, Icono],
  templateUrl: './mi-perfil.html',
  styleUrls: ['../vacio.scss', './mi-perfil.scss'],
})
export class MiPerfil {
  protected readonly auth = inject(AuthService);
}
