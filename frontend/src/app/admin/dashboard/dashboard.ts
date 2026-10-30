import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

@Component({
  imports: [AsyncPipe, RouterLink],
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  auth = inject(AuthService);
  private api = inject(ApiService);

  requests = this.api.getRequests();
  appointments = this.api.getAppointments();
}
