import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SessionService } from './session.service';

export interface MenuItem {
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

/** Tutte le voci del menu: compaiono solo se il token ha il permesso. */
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

/** Il menu della persona e lo stato dello schermo: la barra in alto e il menu laterale leggono la stessa fonte. */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly session = inject(SessionService);

  private readonly visible = computed(() =>
    MENU.filter((item) => (!item.entitlement || this.session.can(item.entitlement)) && (!item.leader || this.session.isLeader())),
  );

  /** Ogni voce sa se apre un gruppo nuovo, per scrivere il titolo una volta sola. */
  readonly items = computed(() =>
    this.visible().map((item, i, all) => ({ ...item, groupStart: !!item.group && item.group !== all[i - 1]?.group })),
  );

  /** Con una sola voce (chi non ha fatto l'accesso) il menu non serve: lo spazio resta ai contenuti. */
  readonly hasMenu = computed(() => this.visible().length > 1);

  /** Schermo stretto (telefono): il menu diventa un cassetto. */
  readonly narrow = toSignal(inject(BreakpointObserver).observe('(max-width: 900px)').pipe(map((s) => s.matches)), {
    initialValue: false,
  });
}
