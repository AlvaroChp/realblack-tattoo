import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  imports: [AsyncPipe, RouterLink],
  selector: 'app-blog',
  templateUrl: './blog.html',
})
export class Blog {
  posts = inject(ApiService).getPosts();
}
