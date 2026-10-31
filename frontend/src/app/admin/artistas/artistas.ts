import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Artist } from '../../core/models';

@Component({
  imports: [FormsModule],
  selector: 'app-admin-artistas',
  templateUrl: './artistas.html',
})
export class AdminArtistas {
  private api = inject(ApiService);

  artists = signal<Artist[]>([]);
  editingId = signal<number | null>(null);

  form = { name: '', bio: '', specialty: '', image: '' };
  textContent = '';
  textError = signal('');

  constructor() {
    this.load();
    this.api.getEditableText('artists').subscribe(data => this.textContent = data.content);
  }

  load() {
    this.api.getArtists().subscribe(a => this.artists.set(a));
  }

  reset() {
    this.editingId.set(null);
    this.form = { name: '', bio: '', specialty: '', image: '' };
  }

  edit(artist: Artist) {
    this.editingId.set(artist.id);
    this.form = { name: artist.name, bio: artist.bio, specialty: artist.specialty, image: artist.image };
  }

  save() {
    if (!this.form.name) return;
    const id = this.editingId();
    const req = id ? this.api.updateArtist(id, this.form) : this.api.createArtist(this.form);
    req.subscribe(() => {
      this.reset();
      this.load();
    });
  }

  saveText() {
    this.textError.set('');
    this.api.updateEditableText('artists', this.textContent).subscribe({
      next: data => { this.textContent = data.content; this.load(); },
      error: error => this.textError.set(error.error?.error ?? 'No se pudo guardar artists.txt.')
    });
  }

  remove(artist: Artist) {
    if (confirm(`¿Eliminar el perfil de ${artist.name}?`)) {
      this.api.deleteArtist(artist.id).subscribe(() => this.load());
    }
  }
}
