import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [RouterLink],
  selector: 'app-portfolio-item',
  templateUrl: './portfolio-item.html',
})
export class PortfolioItem {
  private api = inject(ApiService);
  id = input.required<number>();

  works = toSignal(this.api.getPortfolio(), { initialValue: [] });
  artists = toSignal(this.api.getArtists(), { initialValue: [] });

  work = computed(() => this.works().find(w => w.id === +this.id()));
  artist = computed(() =>
    this.artists().find(a => a.id === this.work()?.artistId)
  );
}
