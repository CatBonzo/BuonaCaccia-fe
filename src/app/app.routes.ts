import { Routes } from '@angular/router';
import { authGuard } from './core/guards';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [{ path: '', pathMatch: 'full', loadComponent: () => import('./pages/home/home').then((m) => m.Home) }],
  },
  { path: '**', redirectTo: '' },
];
