import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-portfolio',
  templateUrl: './portfolio.html',
})
export class Portfolio {
  private api = inject(ApiService);

  readonly artists = toSignal(this.api.getArtists(), { initialValue: [] });
  readonly selectedArtist = signal<number | null>(null);
  readonly works = toSignal(this.api.getPortfolio(), { initialValue: [] });

  filter(id: number | null) {
    this.selectedArtist.set(id);
  }

  artistName(id: number | null): string {
    return this.artists().find(a => a.id === id)?.name ?? 'Sin asignar';
  }
}
