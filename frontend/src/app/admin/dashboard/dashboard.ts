import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { CitationRequest } from '../../core/models';

@Component({
  imports: [RouterLink],
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  auth = inject(AuthService);
  private api = inject(ApiService);

  requests = signal<CitationRequest[]>([]);
  appointments = toSignal(this.api.getAppointments(), { initialValue: [] });

  constructor() {
    this.api.getRequests().subscribe(requests => this.requests.set(requests));
  }
}
