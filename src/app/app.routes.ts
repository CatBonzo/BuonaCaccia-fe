import { Routes } from '@angular/router';
import { authGuard, entitlementGuard } from './core/guards';

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
      {
        path: 'iscrizioni',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'iscrizione:self' },
        loadComponent: () => import('./pages/iscrizioni/enrollment-list').then((m) => m.EnrollmentList),
      },
      {
        path: 'iscrizioni/:id/scheda',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'iscrizione:self' },
        loadComponent: () => import('./pages/iscrizioni/form-page').then((m) => m.FormPage),
      },
      {
        path: 'segreteria/eventi',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'evento:gestione' },
        children: [
          { path: '', loadComponent: () => import('./pages/segreteria/event-manage-list').then((m) => m.EventManageList) },
          { path: 'nuovo', loadComponent: () => import('./pages/segreteria/event-form').then((m) => m.EventForm) },
          { path: ':id/modifica', loadComponent: () => import('./pages/segreteria/event-form').then((m) => m.EventForm) },
        ],
      },
      {
        path: 'segreteria/iscrizioni',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'iscrizione:gestione' },
        loadComponent: () => import('./pages/segreteria/enrollment-manage').then((m) => m.EnrollmentManage),
      },
      {
        path: 'segreteria/documenti',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'iscrizione:gestione' },
        loadComponent: () => import('./pages/segreteria/document-queue').then((m) => m.DocumentQueue),
      },
      {
        path: 'segreteria/pagamenti',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'pagamento:registrazione' },
        loadComponent: () => import('./pages/segreteria/payments').then((m) => m.Payments),
      },
      {
        path: 'segreteria/rimborsi',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'pagamento:registrazione' },
        loadComponent: () => import('./pages/segreteria/refund-queue').then((m) => m.RefundQueue),
      },
      {
        path: 'capi/autorizzazioni',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'iscrizione:self', mode: 'toAuthorize' },
        loadComponent: () => import('./pages/capi/leader-enrollments').then((m) => m.LeaderEnrollments),
      },
      {
        path: 'capi/iscritti',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'iscrizione:self', mode: 'presented' },
        loadComponent: () => import('./pages/capi/leader-enrollments').then((m) => m.LeaderEnrollments),
      },
      // Il link dell'e-mail: il capo risponde senza accedere.
      { path: 'autorizza/:token', loadComponent: () => import('./pages/capi/authorization-link').then((m) => m.AuthorizationLink) },
      { path: 'profilo', canActivate: [authGuard], loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
    ],
  },
  { path: '**', redirectTo: '' },
];
