import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  imports: [RouterLink],
  selector: 'app-articulo',
  templateUrl: './articulo.html',
})
export class Articulo {
  id = input.required<number>();
  posts = inject(ApiService).getPosts();

  post = computed(() => this.posts().find(p => p.id === +this.id()));
}

