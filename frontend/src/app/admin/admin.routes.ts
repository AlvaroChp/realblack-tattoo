import { Routes } from '@angular/router';
import { authGuard, adminGuard } from '../core/auth.guard';
import { AdminShell } from './admin-shell';

export const ADMIN_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./login/login').then(m => m.Login) },
  {
    path: '',
    component: AdminShell,
    children: [
      { path: '', canActivate: [authGuard], loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'solicitudes', canActivate: [authGuard], loadComponent: () => import('./solicitudes/solicitudes').then(m => m.Solicitudes) },
      { path: 'citas', canActivate: [authGuard], loadComponent: () => import('./citas/citas').then(m => m.Citas) },
      { path: 'artistas', canActivate: [adminGuard], loadComponent: () => import('./artistas/artistas').then(m => m.AdminArtistas) },
      { path: 'portfolio', canActivate: [adminGuard], loadComponent: () => import('./portfolio/portfolio').then(m => m.AdminPortfolio) },
      { path: 'blog', canActivate: [adminGuard], loadComponent: () => import('./blog/blog').then(m => m.AdminBlog) },
      { path: 'usuarios', canActivate: [adminGuard], loadComponent: () => import('./usuarios/usuarios').then(m => m.AdminUsuarios) },
      { path: 'videos', canActivate: [adminGuard], loadComponent: () => import('./videos/videos').then(m => m.AdminVideos) }
    ]
  }
];
