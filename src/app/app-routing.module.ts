import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard, entitlementGuard } from './core/guards';

/** Tutte le rotte del sito: ogni pagina e' un modulo caricato solo quando serve. I permessi si controllano qui, sulla rotta. */
const routes: Routes = [
  { path: 'login', loadChildren: () => import('./login/login.module').then((m) => m.LoginModule) },
  { path: '', pathMatch: 'full', loadChildren: () => import('./home/home.module').then((m) => m.HomeModule) },
  { path: 'aiuto', loadChildren: () => import('./aiuto/aiuto.module').then((m) => m.AiutoModule) },
  { path: 'info', loadChildren: () => import('./info/info.module').then((m) => m.InfoModule) },
  // Il catalogo e' pubblico: si cerca e si legge senza accedere.
  { path: 'eventi', loadChildren: () => import('./eventi/eventi.module').then((m) => m.EventiModule) },
  { path: 'eventi/:id', loadChildren: () => import('./evento-dettaglio/evento-dettaglio.module').then((m) => m.EventoDettaglioModule) },
  {
    path: 'iscrizioni',
    canActivate: [authGuard, entitlementGuard],
    data: { entitlement: 'iscrizione:self' },
    loadChildren: () => import('./iscrizioni/iscrizioni.module').then((m) => m.IscrizioniModule),
  },
  {
    path: 'iscrizioni/:id/scheda',
    canActivate: [authGuard, entitlementGuard],
    data: { entitlement: 'iscrizione:self' },
    loadChildren: () => import('./scheda/scheda.module').then((m) => m.SchedaModule),
  },
  {
    path: 'segreteria/eventi',
    canActivate: [authGuard, entitlementGuard],
    data: { entitlement: 'evento:gestione' },
    loadChildren: () => import('./segreteria-eventi/segreteria-eventi.module').then((m) => m.SegreteriaEventiModule),
  },
  {
    path: 'segreteria/iscrizioni',
    canActivate: [authGuard, entitlementGuard],
    data: { entitlement: 'iscrizione:gestione' },
    loadChildren: () => import('./segreteria-iscrizioni/segreteria-iscrizioni.module').then((m) => m.SegreteriaIscrizioniModule),
  },
  {
    path: 'segreteria/documenti',
    canActivate: [authGuard, entitlementGuard],
    data: { entitlement: 'iscrizione:gestione' },
    loadChildren: () => import('./segreteria-documenti/segreteria-documenti.module').then((m) => m.SegreteriaDocumentiModule),
  },
  {
    path: 'segreteria/pagamenti',
    canActivate: [authGuard, entitlementGuard],
    data: { entitlement: 'pagamento:registrazione' },
    loadChildren: () => import('./segreteria-pagamenti/segreteria-pagamenti.module').then((m) => m.SegreteriaPagamentiModule),
  },
  {
    path: 'segreteria/rimborsi',
    canActivate: [authGuard, entitlementGuard],
    data: { entitlement: 'pagamento:registrazione' },
    loadChildren: () => import('./segreteria-rimborsi/segreteria-rimborsi.module').then((m) => m.SegreteriaRimborsiModule),
  },
  {
    path: 'segreteria/coordinate',
    canActivate: [authGuard, entitlementGuard],
    data: { entitlement: 'pagamento:registrazione' },
    loadChildren: () => import('./segreteria-coordinate/segreteria-coordinate.module').then((m) => m.SegreteriaCoordinateModule),
  },
  {
    path: 'amministrazione/tipi-evento',
    canActivate: [authGuard, entitlementGuard],
    data: { entitlement: 'tipoevento:gestione' },
    loadChildren: () => import('./amministrazione-tipi-evento/amministrazione-tipi-evento.module').then((m) => m.AmministrazioneTipiEventoModule),
  },
  {
    path: 'capi/autorizzazioni',
    canActivate: [authGuard, entitlementGuard],
    data: { entitlement: 'iscrizione:self', mode: 'toAuthorize' },
    loadChildren: () => import('./capi-iscrizioni/capi-iscrizioni.module').then((m) => m.CapiIscrizioniModule),
  },
  {
    path: 'capi/iscritti',
    canActivate: [authGuard, entitlementGuard],
    data: { entitlement: 'iscrizione:self', mode: 'presented' },
    loadChildren: () => import('./capi-iscrizioni/capi-iscrizioni.module').then((m) => m.CapiIscrizioniModule),
  },
  // Il link dell'e-mail: il capo risponde senza accedere.
  { path: 'autorizza/:token', loadChildren: () => import('./autorizza/autorizza.module').then((m) => m.AutorizzaModule) },
  { path: 'profilo', canActivate: [authGuard], loadChildren: () => import('./profilo/profilo.module').then((m) => m.ProfiloModule) },
  { path: '**', redirectTo: '' },
];

@NgModule({
  // `bindToComponentInputs`: i parametri del percorso (`:id`, `:token`) e i dati della rotta arrivano come input del componente.
  imports: [RouterModule.forRoot(routes, { bindToComponentInputs: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
