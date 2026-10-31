import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [RouterLink],
  selector: 'app-articulo',
  templateUrl: './articulo.html',
})
export class Articulo {
  id = input.required<number>();
  posts = toSignal(inject(ApiService).getPosts(), { initialValue: [] });

  post = computed(() => this.posts().find(p => p.id === +this.id()));
}
