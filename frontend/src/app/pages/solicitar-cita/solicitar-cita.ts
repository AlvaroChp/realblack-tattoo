import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  imports: [FormsModule],
  selector: 'app-solicitar-cita',
  templateUrl: './solicitar-cita.html',
})
export class SolicitarCita {
  private api = inject(ApiService);
  private router = inject(Router);

  artists = signal<{ id: number; name: string }[]>([]);

  model = {
    name: '',
    email: '',
    phone: '',
    artistId: '' as string,
    style: '',
    bodyPart: '',
    size: '',
    idea: '',
    observations: '',
    privacy: false
  };

  error = signal('');

  constructor() {
    this.api.getArtists().subscribe(a => this.artists.set(a));
  }

  send() {
    this.error.set('');
    const m = this.model;
    if (!m.name || !m.email || !m.phone || !m.style || !m.bodyPart || !m.size || !m.idea) {
      this.error.set('Completa todos los campos obligatorios.');
      return;
    }
    if (!m.privacy) {
      this.error.set('Debes aceptar la información de privacidad.');
      return;
    }
    const artistName = this.artists().find(a => a.id === +m.artistId)?.name ?? 'Sin preferencia';
    this.api
      .createRequest({
        name: m.name,
        email: m.email,
        phone: m.phone,
        artist: artistName,
        style: m.style,
        bodyPart: m.bodyPart,
        size: m.size,
        idea: m.idea,
        observations: m.observations
      })
      .subscribe({
        next: () => this.router.navigate(['/gracias']),
        error: () => this.error.set('No se pudo enviar la solicitud. Inténtalo de nuevo.')
      });
  }
}
