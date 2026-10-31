import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [RouterLink],
  selector: 'app-artistas',
  templateUrl: './artistas.html',
})
export class Artistas {
  artists = toSignal(inject(ApiService).getArtists(), { initialValue: [] });
}
