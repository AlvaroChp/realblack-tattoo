import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [RouterLink],
  selector: 'app-blog',
  templateUrl: './blog.html',
})
export class Blog {
  posts = toSignal(inject(ApiService).getPosts(), { initialValue: [] });
}
