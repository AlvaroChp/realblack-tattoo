import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';

@Component({
  imports: [FormsModule],
  selector: 'app-contacto',
  templateUrl: './contacto.html',
})
export class Contacto {
  private api = inject(ApiService);

  model = { name: '', email: '', subject: '', message: '' };
  sent = signal(false);
  error = signal('');

  send() {
    const { name, email, subject, message } = this.model;
    if (!name || !email || !subject || !message) {
      this.error.set('Todos los campos son obligatorios.');
      return;
    }
    this.error.set('');
    this.api
      .createRequest({
        name,
        email,
        phone: '',
        style: subject,
        bodyPart: 'Consulta',
        size: '-',
        idea: message,
        observations: 'Enviado desde el formulario de contacto.'
      })
      .subscribe({
        next: () => this.sent.set(true),
        error: () => this.error.set('No se pudo enviar la consulta. Inténtalo de nuevo.')
      });
  }
}
