import { Component, input, model, signal } from '@angular/core';

@Component({
  selector: 'app-image-input',
  imports: [],
  template: `
    <div class="image-input">
      <div>
        <label [for]="id() + '-url'">URL de imagen:</label>
        <input
          type="text"
          [id]="id() + '-url'"
          [value]="value() ?? ''"
          (input)="onChange($event.target)"
          placeholder="https://... o data:image/..."
        >
      </div>

      <div>
        <label [for]="id() + '-file'">O sube una imagen:</label>
        <input
          type="file"
          [id]="id() + '-file'"
          accept="image/*"
          (change)="onFile($event.target)"
        >
      </div>

      @if (error()) {
        <p class="error-text">{{ error() }}</p>
      }

      @if (value()) {
        <div>
          <p>Vista previa:</p>
          <img [src]="value()" [alt]="alt()" style="max-width: 240px; max-height: 180px;">
        </div>
      }
    </div>
  `,
})
export class ImageInput {
  value = model<string>('');
  id = input('img');
  alt = input('Imagen');

  error = signal('');

  onChange(target: EventTarget | null) {
    if (target instanceof HTMLInputElement) {
      this.error.set('');
      this.value.set(target.value.trim());
    }
  }

  onFile(target: EventTarget | null) {
    if (!(target instanceof HTMLInputElement)) return;
    const file = target.files?.[0];
    target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error.set('El archivo debe ser una imagen.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.error.set('La imagen debe pesar como máximo 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.error.set('');
      this.value.set(String(reader.result));
    };
    reader.onerror = () => this.error.set('No se pudo leer la imagen.');
    reader.readAsDataURL(file);
  }
}
