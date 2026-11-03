import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ImageInput } from '../../core/image-input.component';
import { Artist, PortfolioWork } from '../../core/models';

@Component({
  imports: [FormsModule, ImageInput],
  selector: 'app-admin-portfolio',
  templateUrl: './portfolio.html',
})
export class AdminPortfolio {
  private api = inject(ApiService);

  works = signal<PortfolioWork[]>([]);
  artists = signal<Artist[]>([]);
  editingId = signal<number | null>(null);

  form = { title: '', description: '', artistId: '' as string, image: '' };

  constructor() {
    this.load();
    this.api.getArtists().subscribe(a => this.artists.set(a));
  }

  load() {
    this.api.getPortfolio().subscribe(w => this.works.set(w));
  }

  reset() {
    this.editingId.set(null);
    this.form = { title: '', description: '', artistId: '', image: '' };
  }

  edit(work: PortfolioWork) {
    this.editingId.set(work.id);
    this.form = {
      title: work.title,
      description: work.description,
      artistId: work.artistId ? String(work.artistId) : '',
      image: work.image
    };
  }

  save() {
    if (!this.form.title) return;
    const data: Partial<PortfolioWork> = {
      title: this.form.title,
      description: this.form.description,
      artistId: this.form.artistId ? +this.form.artistId : null,
    };
    if (this.form.image) {
      data.image = this.form.image;
    }
    const id = this.editingId();
    const req = id ? this.api.updateWork(id, data) : this.api.createWork(data);
    req.subscribe(() => {
      this.reset();
      this.load();
    });
  }

  remove(work: PortfolioWork) {
    if (confirm(`¿Eliminar "${work.title}"?`)) {
      this.api.deleteWork(work.id).subscribe(() => this.load());
    }
  }

  artistName(id: number | null): string {
    return this.artists().find(a => a.id === id)?.name ?? 'Sin asignar';
  }
}
