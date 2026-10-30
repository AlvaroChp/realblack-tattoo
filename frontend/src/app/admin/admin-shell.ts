import { Component, computed, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-admin-shell',
  imports: [AsyncPipe, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <header>
        <a routerLink="/inicio"><h1>REALBLACK TATTOO</h1></a>
        <h2>Panel de administración · {{ auth.user()?.username }} ({{ auth.user()?.role }})</h2>

        <nav aria-label="Administración">
          <ul>
            <li><a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Panel</a></li>
            <li><a routerLink="/admin/solicitudes" routerLinkActive="active">Solicitudes</a></li>
            <li><a routerLink="/admin/citas" routerLinkActive="active">Citas</a></li>
            @if (auth.isAdmin()) {
              <li><a routerLink="/admin/artistas" routerLinkActive="active">Artistas</a></li>
              <li><a routerLink="/admin/portfolio" routerLinkActive="active">Portfolio</a></li>
              <li><a routerLink="/admin/videos" routerLinkActive="active">Vídeos</a></li>
              <li><a routerLink="/admin/blog" routerLinkActive="active">Blog</a></li>
              <li><a routerLink="/admin/usuarios" routerLinkActive="active">Usuarios</a></li>
            }
            <li><a href="#" (click)="logout($event)">Cerrar sesión</a></li>
          </ul>
        </nav>
      </header>

      <router-outlet />
    </div>
  `,
  styleUrl: './admin-shell.css',
})
export class AdminShell {
  auth = inject(AuthService);

  logout(event: Event) {
    event.preventDefault();
    this.auth.logout();
  }
}
