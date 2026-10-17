import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AmministrazioneSchedaComponent } from './amministrazione-scheda.component';

/** Le rotte della pagina, relative al percorso con cui il modulo viene caricato da `app-routing.module.ts`. */
const routes: Routes = [{ path: '', component: AmministrazioneSchedaComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AmministrazioneSchedaRoutingModule {}
