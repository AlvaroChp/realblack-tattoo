import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-legal',
  templateUrl: './legal.html',
})
export class Legal {
  private route = inject(ActivatedRoute);

  page = this.route.snapshot.data['page'] as string;

  get title(): string {
    return this.page === 'aviso-legal'
      ? 'Aviso legal'
      : this.page === 'privacidad'
        ? 'Política de privacidad'
        : 'Política de cookies';
  }

  get text(): string {
    if (this.page === 'aviso-legal') {
      return 'Contenido pendiente de completar con los datos legales del estudio.';
    }
    if (this.page === 'privacidad') {
      return 'Contenido pendiente de completar con la información sobre el tratamiento de datos personales.';
    }
    return 'Contenido pendiente de completar cuando se definan las cookies utilizadas por la web.';
  }
}
