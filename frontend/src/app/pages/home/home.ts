import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  imports: [RouterLink, AsyncPipe],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  private api = inject(ApiService);

  featured = this.api.getPortfolio();
  artists = this.api.getArtists();
  posts = this.api.getPosts();
}
