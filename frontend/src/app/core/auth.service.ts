import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { User } from './models';

export const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'rbt_token';
  private readonly userKey = 'rbt_user';

  readonly user = signal<User | null>(this.readUser());
  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  readonly isLoggedIn = computed(() => !!this.user());

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private readUser(): User | null {
    try {
      const raw = localStorage.getItem(this.userKey);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  login(username: string, password: string) {
    return this.http
      .post<{ token: string; user: User }>(`${API_URL}/auth/login`, { username, password })
      .pipe(
        tap(({ token, user }) => {
          localStorage.setItem(this.tokenKey, token);
          localStorage.setItem(this.userKey, JSON.stringify(user));
          this.user.set(user);
        })
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.user.set(null);
    this.router.navigate(['/admin/login']);
  }
}
