import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AiutoComponent } from './aiuto.component';

/** Le rotte della pagina, relative al percorso con cui il modulo viene caricato da `app-routing.module.ts`. */
const routes: Routes = [{ path: '', component: AiutoComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AiutoRoutingModule {}
