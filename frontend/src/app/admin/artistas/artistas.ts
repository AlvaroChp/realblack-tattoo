import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ImageInput } from '../../core/image-input.component';
import { Artist } from '../../core/models';

@Component({
  imports: [FormsModule, ImageInput],
  selector: 'app-admin-artistas',
  templateUrl: './artistas.html',
})
export class AdminArtistas {
  private api = inject(ApiService);

  artists = signal<Artist[]>([]);
  editingId = signal<number | null>(null);

  form = { name: '', bio: '', specialty: '', image: '' };

  constructor() {
    this.load();
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
    const data: Partial<Artist> = { name: this.form.name, bio: this.form.bio, specialty: this.form.specialty };
    if (this.form.image) {
      data.image = this.form.image;
    }
    const id = this.editingId();
    const req = id ? this.api.updateArtist(id, data) : this.api.createArtist(data);
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
