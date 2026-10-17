import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AmministrazioneTipiEventoComponent } from './amministrazione-tipi-evento.component';

/** Le rotte della pagina, relative al percorso con cui il modulo viene caricato da `app-routing.module.ts`. */
const routes: Routes = [
  { path: '', component: AmministrazioneTipiEventoComponent },
  { path: ':code/scheda', loadChildren: () => import('../amministrazione-scheda/amministrazione-scheda.module').then((m) => m.AmministrazioneSchedaModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AmministrazioneTipiEventoRoutingModule {}
