import { Component, inject } from '@angular/core';
import { SessionService } from '../core/session.service';

/** Pagina /profilo: chi sei e che permessi ha il tuo accesso. */
@Component({
  selector: 'app-profilo',
  templateUrl: './profilo.component.html',
  styleUrl: './profilo.component.scss',
})
export class ProfiloComponent {
  protected readonly session = inject(SessionService);
}
