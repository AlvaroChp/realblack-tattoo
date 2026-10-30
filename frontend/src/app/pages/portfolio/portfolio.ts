import { Component, computed, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  imports: [AsyncPipe, FormsModule, RouterLink],
  selector: 'app-portfolio',
  templateUrl: './portfolio.html',
})
export class Portfolio {
  private api = inject(ApiService);

  readonly artists = this.api.getArtists();
  readonly selectedArtist = signal<number | null>(null);
  readonly works = computed(() => this.api.getPortfolio(this.selectedArtist()));

  filter(id: number | null) {
    this.selectedArtist.set(id);
  }

  artistName(id: number | null, artists: { id: number; name: string }[] | null): string {
    return artists?.find(a => a.id === id)?.name ?? 'Sin asignar';
  }
}
