import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PagamentoComponent } from './pagamento.component';

/** Le rotte della pagina, relative al percorso con cui il modulo viene caricato da `app-routing.module.ts`. */
const routes: Routes = [{ path: '', component: PagamentoComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagamentoRoutingModule {}
