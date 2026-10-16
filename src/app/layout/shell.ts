import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SessionService } from '../core/session.service';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  /** Permesso richiesto, nella forma breve; senza, la voce e' per tutti. */
  entitlement?: string;
  /** Solo per chi e' capo nel censimento. */
  leader?: boolean;
  /** Gruppo del menu: la prima voce di ogni gruppo mostra il titolo. Senza, la voce e' tra le prime. */
  group?: string;
}

type Theme = 'light' | 'dark' | null;

/** Tutte le voci del menu: compaiono solo se il token ha il permesso. Le pagine arrivano con le fasi F1-F5. */
const MENU: MenuItem[] = [
  { label: 'Eventi', path: '/eventi', icon: 'event' },
  { label: 'Le mie iscrizioni', path: '/iscrizioni', icon: 'how_to_reg', entitlement: 'iscrizione:self' },
  { label: 'Autorizzazioni da dare', path: '/capi/autorizzazioni', icon: 'verified_user', entitlement: 'iscrizione:self', leader: true, group: 'Capi' },
  { label: 'Ragazzi che ho iscritto', path: '/capi/iscritti', icon: 'groups', entitlement: 'iscrizione:self', leader: true, group: 'Capi' },
  { label: 'Iscrizioni da gestire', path: '/segreteria/iscrizioni', icon: 'inbox', entitlement: 'iscrizione:gestione', group: 'Segreteria' },
  { label: 'Documenti da validare', path: '/segreteria/documenti', icon: 'fact_check', entitlement: 'iscrizione:gestione', group: 'Segreteria' },
  { label: 'Gestione eventi', path: '/segreteria/eventi', icon: 'edit_calendar', entitlement: 'evento:gestione', group: 'Segreteria' },
  { label: 'Pagamenti', path: '/segreteria/pagamenti', icon: 'payments', entitlement: 'pagamento:registrazione', group: 'Segreteria' },
  { label: 'Rimborsi', path: '/segreteria/rimborsi', icon: 'currency_exchange', entitlement: 'pagamento:registrazione', group: 'Segreteria' },
  { label: 'Coordinate di pagamento', path: '/segreteria/coordinate', icon: 'account_balance', entitlement: 'pagamento:registrazione', group: 'Segreteria' },
  { label: 'Tipi di evento', path: '/amministrazione/tipi-evento', icon: 'category', entitlement: 'tipoevento:gestione', group: 'Amministrazione' },
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

  private readonly visible = computed(() => MENU.filter((item) => (!item.entitlement || this.session.can(item.entitlement)) && (!item.leader || this.session.isLeader())));

  /** Il menu a gruppi: ogni voce sa se apre un gruppo nuovo, per scrivere il titolo una volta sola. */
  protected readonly menu = computed(() =>
    this.visible().map((item, i, all) => ({ ...item, groupStart: !!item.group && item.group !== all[i - 1]?.group })),
  );

  /** Con una sola voce (chi non ha fatto l'accesso) il menu non serve: lo spazio resta ai contenuti. */
  protected readonly hasMenu = computed(() => this.visible().length > 1);

  protected readonly narrow = toSignal(inject(BreakpointObserver).observe('(max-width: 900px)').pipe(map((s) => s.matches)), {
    initialValue: false,
  });
  protected readonly theme = signal<Theme>(readTheme());
  private readonly sidenav = viewChild(MatSidenav);

  constructor() {
    // Sul telefono il menu si chiude da solo dopo aver scelto una pagina.
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd && this.narrow()) void this.sidenav()?.close();
    });
  }

  /** Chiaro, scuro, oppure quello del sistema: tre passi in giro, la scelta resta nel browser. */
  protected cycleTheme(): void {
    const next: Theme = this.theme() === null ? 'light' : this.theme() === 'light' ? 'dark' : null;
    this.theme.set(next);
    const root = document.documentElement;
    if (next) root.dataset['theme'] = next;
    else delete root.dataset['theme'];
    try {
      if (next) localStorage.setItem('bc-theme', next);
      else localStorage.removeItem('bc-theme');
    } catch {
      // Senza memoria del browser la scelta vale solo per questa visita.
    }
  }

  protected logout(): void {
    this.session.logout();
    void this.router.navigate(['/eventi']);
  }
}

function readTheme(): Theme {
  try {
    const t = localStorage.getItem('bc-theme');
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}
