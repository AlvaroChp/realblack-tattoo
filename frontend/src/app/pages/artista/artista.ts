import { Component, inject, input } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  imports: [AsyncPipe, RouterLink],
  selector: 'app-artista',
  templateUrl: './artista.html',
})
export class Artista {
  private api = inject(ApiService);
  id = input.required<number>();

  artists = this.api.getArtists();
  works = this.api.getPortfolio();
}
