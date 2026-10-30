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

  form = { name: '', bio: '', image: '' };

  constructor() {
    this.load();
  }

  load() {
    this.api.getArtists().subscribe(a => this.artists.set(a));
  }

  reset() {
    this.editingId.set(null);
    this.form = { name: '', bio: '', image: '' };
  }

  edit(artist: Artist) {
    this.editingId.set(artist.id);
    this.form = { name: artist.name, bio: artist.bio, image: artist.image };
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

  remove(artist: Artist) {
    if (confirm(`¿Eliminar el perfil de ${artist.name}?`)) {
      this.api.deleteArtist(artist.id).subscribe(() => this.load());
    }
  }
}
