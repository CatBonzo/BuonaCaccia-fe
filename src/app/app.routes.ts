import { Routes } from '@angular/router';
import { authGuard } from './core/guards';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
  {
    path: '',
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'eventi' },
      // Il catalogo e' pubblico: si cerca e si legge senza accedere.
      { path: 'eventi', loadComponent: () => import('./pages/eventi/event-list').then((m) => m.EventList) },
      { path: 'eventi/:id', loadComponent: () => import('./pages/eventi/event-detail').then((m) => m.EventDetail) },
      { path: 'profilo', canActivate: [authGuard], loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
    ],
  },
  { path: '**', redirectTo: '' },
];
