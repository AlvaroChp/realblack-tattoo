import { Component, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CitationRequest } from '../../core/models';

@Component({
  imports: [AsyncPipe, FormsModule],
  selector: 'app-admin-solicitudes',
  templateUrl: './solicitudes.html',
})
export class Solicitudes {
  private api = inject(ApiService);
  auth = inject(AuthService);

  requests = signal<CitationRequest[]>([]);
  selected = signal<CitationRequest | null>(null);

  appointmentForm = { date: '', time: '', notes: '' };
  message = signal('');

  constructor() {
    this.load();
  }

  load() {
    this.api.getRequests().subscribe(r => this.requests.set(r));
  }

  review(request: CitationRequest) {
    this.selected.set(request);
    this.message.set('');
    this.appointmentForm = { date: '', time: '', notes: '' };
  }

  setStatus(request: CitationRequest, status: string) {
    this.api.updateRequest(request.id, { status }).subscribe(() => this.load());
  }

  remove(request: CitationRequest) {
    if (confirm(`¿Eliminar la solicitud de ${request.name}?`)) {
      this.api.deleteRequest(request.id).subscribe(() => this.load());
    }
  }

  accept() {
    const request = this.selected();
    if (!request) return;
    if (!this.appointmentForm.date || !this.appointmentForm.time) {
      this.message.set('Indica fecha y hora para la cita.');
      return;
    }
    this.api
      .createAppointment({
        clientName: request.name,
        clientEmail: request.email,
        clientPhone: request.phone,
        artistName: request.artist || 'Sin asignar',
        style: request.style,
        date: this.appointmentForm.date,
        time: this.appointmentForm.time,
        notes: this.appointmentForm.notes,
        requestId: request.id
      })
      .subscribe(() => {
        this.selected.set(null);
        this.message.set('');
        this.load();
      });
  }

  cancel() {
    this.selected.set(null);
  }
}
