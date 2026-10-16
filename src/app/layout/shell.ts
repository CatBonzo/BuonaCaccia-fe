import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SessionService } from '../core/session.service';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  /** Permesso richiesto, nella forma breve; senza, la voce e' per tutti. */
  entitlement?: string;
}

/** Tutte le voci del menu: compaiono solo se il token ha il permesso. Le pagine arrivano con le fasi F1-F5. */
const MENU: MenuItem[] = [
  { label: 'Eventi', path: '/eventi', icon: 'event' },
  { label: 'Le mie iscrizioni', path: '/iscrizioni', icon: 'how_to_reg', entitlement: 'iscrizione:self' },
  { label: 'Iscrizioni da gestire', path: '/segreteria/iscrizioni', icon: 'inbox', entitlement: 'iscrizione:gestione' },
  { label: 'Gestione eventi', path: '/segreteria/eventi', icon: 'edit_calendar', entitlement: 'evento:gestione' },
  { label: 'Pagamenti', path: '/segreteria/pagamenti', icon: 'payments', entitlement: 'pagamento:registrazione' },
  { label: 'Tipi di evento', path: '/amministrazione/tipi-evento', icon: 'category', entitlement: 'tipoevento:gestione' },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly menu = computed(() => MENU.filter((item) => !item.entitlement || this.session.can(item.entitlement)));

  protected logout(): void {
    this.session.logout();
    void this.router.navigate(['/login']);
  }
}
