import { Routes } from '@angular/router';
import { authGuard, entitlementGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'login', loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'eventi' },
      // Il catalogo e' pubblico: si cerca e si legge senza accedere.
      { path: 'aiuto', loadComponent: () => import('./aiuto/aiuto.component').then((m) => m.AiutoComponent) },
      { path: 'info', loadComponent: () => import('./info/info.component').then((m) => m.InfoComponent) },
      { path: 'eventi', loadComponent: () => import('./eventi/eventi.component').then((m) => m.EventiComponent) },
      { path: 'eventi/:id', loadComponent: () => import('./evento-dettaglio/evento-dettaglio.component').then((m) => m.EventoDettaglioComponent) },
      {
        path: 'iscrizioni',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'iscrizione:self' },
        loadComponent: () => import('./iscrizioni/iscrizioni.component').then((m) => m.IscrizioniComponent),
      },
      {
        path: 'iscrizioni/:id/scheda',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'iscrizione:self' },
        loadComponent: () => import('./scheda/scheda.component').then((m) => m.SchedaComponent),
      },
      {
        path: 'segreteria/eventi',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'evento:gestione' },
        children: [
          { path: '', loadComponent: () => import('./segreteria-eventi/segreteria-eventi.component').then((m) => m.SegreteriaEventiComponent) },
          { path: 'nuovo', loadComponent: () => import('./evento-form/evento-form.component').then((m) => m.EventoFormComponent) },
          { path: ':id/modifica', loadComponent: () => import('./evento-form/evento-form.component').then((m) => m.EventoFormComponent) },
        ],
      },
      {
        path: 'segreteria/iscrizioni',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'iscrizione:gestione' },
        loadComponent: () => import('./segreteria-iscrizioni/segreteria-iscrizioni.component').then((m) => m.SegreteriaIscrizioniComponent),
      },
      {
        path: 'segreteria/documenti',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'iscrizione:gestione' },
        loadComponent: () => import('./segreteria-documenti/segreteria-documenti.component').then((m) => m.SegreteriaDocumentiComponent),
      },
      {
        path: 'segreteria/pagamenti',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'pagamento:registrazione' },
        loadComponent: () => import('./segreteria-pagamenti/segreteria-pagamenti.component').then((m) => m.SegreteriaPagamentiComponent),
      },
      {
        path: 'segreteria/rimborsi',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'pagamento:registrazione' },
        loadComponent: () => import('./segreteria-rimborsi/segreteria-rimborsi.component').then((m) => m.SegreteriaRimborsiComponent),
      },
      {
        path: 'amministrazione/tipi-evento',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'tipoevento:gestione' },
        children: [
          { path: '', loadComponent: () => import('./amministrazione-tipi-evento/amministrazione-tipi-evento.component').then((m) => m.AmministrazioneTipiEventoComponent) },
          { path: ':code/scheda', loadComponent: () => import('./amministrazione-scheda/amministrazione-scheda.component').then((m) => m.AmministrazioneSchedaComponent) },
        ],
      },
      {
        path: 'segreteria/coordinate',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'pagamento:registrazione' },
        loadComponent: () => import('./segreteria-coordinate/segreteria-coordinate.component').then((m) => m.SegreteriaCoordinateComponent),
      },
      {
        path: 'capi/autorizzazioni',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'iscrizione:self', mode: 'toAuthorize' },
        loadComponent: () => import('./capi-iscrizioni/capi-iscrizioni.component').then((m) => m.CapiIscrizioniComponent),
      },
      {
        path: 'capi/iscritti',
        canActivate: [authGuard, entitlementGuard],
        data: { entitlement: 'iscrizione:self', mode: 'presented' },
        loadComponent: () => import('./capi-iscrizioni/capi-iscrizioni.component').then((m) => m.CapiIscrizioniComponent),
      },
      // Il link dell'e-mail: il capo risponde senza accedere.
      { path: 'autorizza/:token', loadComponent: () => import('./autorizza/autorizza.component').then((m) => m.AutorizzaComponent) },
      { path: 'profilo', canActivate: [authGuard], loadComponent: () => import('./profilo/profilo.component').then((m) => m.ProfiloComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
