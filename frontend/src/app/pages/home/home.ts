import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  private api = inject(ApiService);

  featured = toSignal(this.api.getPortfolio(), { initialValue: [] });
  artists = toSignal(this.api.getArtists(), { initialValue: [] });
  posts = toSignal(this.api.getPosts(), { initialValue: [] });
}
