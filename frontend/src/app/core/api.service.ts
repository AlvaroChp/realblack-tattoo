import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './auth.service';
import { Artist, Appointment, BlogPost, CitationRequest, PortfolioWork, User, Video } from './models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // Artistas
  getArtists(): Observable<Artist[]> { return this.http.get<Artist[]>(`${API_URL}/artists`); }
  createArtist(data: Partial<Artist>): Observable<Artist> { return this.http.post<Artist>(`${API_URL}/artists`, data); }
  updateArtist(id: number, data: Partial<Artist>): Observable<Artist> { return this.http.put<Artist>(`${API_URL}/artists/${id}`, data); }
  deleteArtist(id: number): Observable<void> { return this.http.delete<void>(`${API_URL}/artists/${id}`); }

  // Portfolio
  getPortfolio(artistId?: number | null): Observable<PortfolioWork[]> {
    let params = new HttpParams();
    if (artistId) params = params.set('artistId', artistId);
    return this.http.get<PortfolioWork[]>(`${API_URL}/portfolio`, { params });
  }
  createWork(data: Partial<PortfolioWork>): Observable<PortfolioWork> { return this.http.post<PortfolioWork>(`${API_URL}/portfolio`, data); }
  updateWork(id: number, data: Partial<PortfolioWork>): Observable<PortfolioWork> { return this.http.put<PortfolioWork>(`${API_URL}/portfolio/${id}`, data); }
  deleteWork(id: number): Observable<void> { return this.http.delete<void>(`${API_URL}/portfolio/${id}`); }

  // Vídeos
  getVideos(): Observable<Video[]> { return this.http.get<Video[]>(`${API_URL}/videos`); }
  createVideo(data: Partial<Video>): Observable<Video> { return this.http.post<Video>(`${API_URL}/videos`, data); }
  updateVideo(id: number, data: Partial<Video>): Observable<Video> { return this.http.put<Video>(`${API_URL}/videos/${id}`, data); }
  deleteVideo(id: number): Observable<void> { return this.http.delete<void>(`${API_URL}/videos/${id}`); }

  // Blog
  getPosts(): Observable<BlogPost[]> { return this.http.get<BlogPost[]>(`${API_URL}/blog`); }
  getPost(id: number): Observable<BlogPost> { return this.http.get<BlogPost>(`${API_URL}/blog/${id}`); }
  createPost(data: Partial<BlogPost>): Observable<BlogPost> { return this.http.post<BlogPost>(`${API_URL}/blog`, data); }
  updatePost(id: number, data: Partial<BlogPost>): Observable<BlogPost> { return this.http.put<BlogPost>(`${API_URL}/blog/${id}`, data); }
  deletePost(id: number): Observable<void> { return this.http.delete<void>(`${API_URL}/blog/${id}`); }

  // Solicitudes
  createRequest(data: Partial<CitationRequest>): Observable<CitationRequest> { return this.http.post<CitationRequest>(`${API_URL}/requests`, data); }
  getRequests(): Observable<CitationRequest[]> { return this.http.get<CitationRequest[]>(`${API_URL}/requests`); }
  updateRequest(id: number, data: Partial<CitationRequest>): Observable<CitationRequest> { return this.http.put<CitationRequest>(`${API_URL}/requests/${id}`, data); }
  deleteRequest(id: number): Observable<void> { return this.http.delete<void>(`${API_URL}/requests/${id}`); }

  // Citas
  getAppointments(): Observable<Appointment[]> { return this.http.get<Appointment[]>(`${API_URL}/appointments`); }
  createAppointment(data: Partial<Appointment>): Observable<Appointment> { return this.http.post<Appointment>(`${API_URL}/appointments`, data); }
  updateAppointment(id: number, data: Partial<Appointment>): Observable<Appointment> { return this.http.put<Appointment>(`${API_URL}/appointments/${id}`, data); }
  deleteAppointment(id: number): Observable<void> { return this.http.delete<void>(`${API_URL}/appointments/${id}`); }

  // Usuarios
  getUsers(): Observable<User[]> { return this.http.get<User[]>(`${API_URL}/users`); }
  createUser(data: { username: string; password: string; role: string }): Observable<User> { return this.http.post<User>(`${API_URL}/users`, data); }
  updateUser(id: number, data: { username?: string; password?: string; role?: string }): Observable<User> { return this.http.put<User>(`${API_URL}/users/${id}`, data); }
  deleteUser(id: number): Observable<void> { return this.http.delete<void>(`${API_URL}/users/${id}`); }
}
