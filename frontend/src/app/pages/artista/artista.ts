import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [RouterLink],
  selector: 'app-artista',
  templateUrl: './artista.html',
})
export class Artista {
  private api = inject(ApiService);
  id = input.required<number>();

  artists = toSignal(this.api.getArtists(), { initialValue: [] });
  works = toSignal(this.api.getPortfolio(), { initialValue: [] });
  artist = computed(() => this.artists().find(a => a.id === this.id()));
  artistWorks = computed(() => {
    const artistId = this.artist()?.id;
    return artistId === undefined ? [] : this.works().filter(work => work.artistId === artistId);
  });
}
