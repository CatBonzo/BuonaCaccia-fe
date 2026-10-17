import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SegreteriaEventiComponent } from './segreteria-eventi.component';

/** Le rotte della pagina, relative al percorso con cui il modulo viene caricato da `app-routing.module.ts`. */
const routes: Routes = [
  { path: '', component: SegreteriaEventiComponent },
  { path: 'nuovo', loadChildren: () => import('../evento-form/evento-form.module').then((m) => m.EventoFormModule) },
  { path: ':id/modifica', loadChildren: () => import('../evento-form/evento-form.module').then((m) => m.EventoFormModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SegreteriaEventiRoutingModule {}
