import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Appointment } from '../../core/models';

@Component({
  imports: [FormsModule],
  selector: 'app-admin-citas',
  templateUrl: './citas.html',
})
export class Citas {
  private api = inject(ApiService);
  auth = inject(AuthService);

  appointments = signal<Appointment[]>([]);
  editingId = signal<number | null>(null);
  error = signal('');
  textContent = '';
  textError = signal('');

  artists = signal<{ id: number; name: string }[]>([]);

  form = {
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    artistName: '',
    style: '',
    date: '',
    time: '',
    notes: '',
    status: 'confirmada'
  };

  constructor() {
    this.load();
    this.api.getEditableText('appointments').subscribe(data => this.textContent = data.content);
    this.api.getArtists().subscribe(a => this.artists.set(a));
  }

  load() {
    this.api.getAppointments().subscribe(a =>
      this.appointments.set([...a].sort((x, y) => (x.date + x.time < y.date + y.time ? 1 : -1)))
    );
  }

  saveText() {
    this.textError.set('');
    this.api.updateEditableText('appointments', this.textContent).subscribe({
      next: data => { this.textContent = data.content; this.load(); },
      error: error => this.textError.set(error.error?.error ?? 'No se pudo guardar appointments.txt.')
    });
  }

  reset() {
    this.editingId.set(null);
    this.error.set('');
    this.form = {
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      artistName: '',
      style: '',
      date: '',
      time: '',
      notes: '',
      status: 'confirmada'
    };
  }

  edit(appointment: Appointment) {
    this.editingId.set(appointment.id);
    this.error.set('');
    this.form = {
      clientName: appointment.clientName,
      clientEmail: appointment.clientEmail,
      clientPhone: appointment.clientPhone,
      artistName: appointment.artistName,
      style: appointment.style,
      date: appointment.date,
      time: appointment.time,
      notes: appointment.notes,
      status: appointment.status
    };
  }

  save() {
    this.error.set('');
    if (!this.form.clientName || !this.form.artistName || !this.form.date || !this.form.time) {
      this.error.set('Cliente, artista, fecha y hora son obligatorios.');
      return;
    }
    const id = this.editingId();
    const req = id ? this.api.updateAppointment(id, this.form) : this.api.createAppointment(this.form);
    req.subscribe(() => {
      this.reset();
      this.load();
    });
  }

  remove(appointment: Appointment) {
    if (confirm(`¿Eliminar la cita de ${appointment.clientName}?`)) {
      this.api.deleteAppointment(appointment.id).subscribe(() => this.load());
    }
  }
}
