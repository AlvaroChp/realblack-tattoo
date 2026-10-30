import { Component, computed, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  imports: [AsyncPipe, RouterLink],
  selector: 'app-portfolio-item',
  templateUrl: './portfolio-item.html',
})
export class PortfolioItem {
  private api = inject(ApiService);
  id = input.required<number>();

  works = this.api.getPortfolio();
  artists = this.api.getArtists();

  work = computed(() => this.works().find(w => w.id === +this.id()));
  artist = computed(() =>
    this.artists().find(a => a.id === this.work()?.artistId)
  );
}
