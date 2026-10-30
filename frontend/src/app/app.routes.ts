import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: 'inicio', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'portfolio', loadComponent: () => import('./pages/portfolio/portfolio').then(m => m.Portfolio) },
  { path: 'portfolio/:id', loadComponent: () => import('./pages/portfolio-item/portfolio-item').then(m => m.PortfolioItem) },
  { path: 'artistas', loadComponent: () => import('./pages/artistas/artistas').then(m => m.Artistas) },
  { path: 'artistas/:id', loadComponent: () => import('./pages/artista/artista').then(m => m.Artista) },
  { path: 'servicios', loadComponent: () => import('./pages/servicios/servicios').then(m => m.Servicios) },
  { path: 'blog', loadComponent: () => import('./pages/blog/blog').then(m => m.Blog) },
  { path: 'blog/:id', loadComponent: () => import('./pages/articulo/articulo').then(m => m.Articulo) },
  { path: 'contacto', loadComponent: () => import('./pages/contacto/contacto').then(m => m.Contacto) },
  { path: 'solicitar-cita', loadComponent: () => import('./pages/solicitar-cita/solicitar-cita').then(m => m.SolicitarCita) },
  { path: 'gracias', loadComponent: () => import('./pages/confirmacion/confirmacion').then(m => m.Confirmacion) },
  { path: 'aviso-legal', loadComponent: () => import('./pages/legal/legal').then(m => m.Legal), data: { page: 'aviso-legal', title: 'Aviso legal' } },
  { path: 'privacidad', loadComponent: () => import('./pages/legal/legal').then(m => m.Legal), data: { page: 'privacidad', title: 'Política de privacidad' } },
  { path: 'cookies', loadComponent: () => import('./pages/legal/legal').then(m => m.Legal), data: { page: 'cookies', title: 'Política de cookies' } },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  { path: '**', redirectTo: 'inicio' }
];
