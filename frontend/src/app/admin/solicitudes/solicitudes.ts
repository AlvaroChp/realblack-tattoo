import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CitationRequest } from '../../core/models';

@Component({
  imports: [FormsModule],
  selector: 'app-admin-solicitudes',
  templateUrl: './solicitudes.html',
})
export class Solicitudes {
  private api = inject(ApiService);
  auth = inject(AuthService);

  requests = signal<CitationRequest[]>([]);
  selected = signal<CitationRequest | null>(null);
  fullImage = signal<CitationRequest | null>(null);

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
    this.fullImage.set(null);
    this.message.set('');
    this.appointmentForm = { date: '', time: '', notes: '' };
    setTimeout(() => document.getElementById('convertir-cita')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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
    this.api.getAppointments().subscribe(appointments => {
      const linked = appointments.find(a => a.requestId === request.id);
      const req = linked
        ? this.api.updateAppointment(linked.id, {
            date: this.appointmentForm.date,
            time: this.appointmentForm.time,
            notes: this.appointmentForm.notes || linked.notes,
            status: 'confirmada'
          })
        : this.api.createAppointment({
            clientName: request.name,
            clientEmail: request.email,
            clientPhone: request.phone,
            artistName: request.artist || 'Sin asignar',
            style: request.style,
            date: this.appointmentForm.date,
            time: this.appointmentForm.time,
            notes: this.appointmentForm.notes,
            requestId: request.id,
            status: 'confirmada'
          });
      req.subscribe(() => {
        this.selected.set(null);
        this.message.set('');
        this.load();
      });
    });
  }

  cancel() {
    this.selected.set(null);
  }

  showImage(request: CitationRequest) {
    this.fullImage.set(request);
  }

  closeImage() {
    this.fullImage.set(null);
  }
}
