import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, inject, input, signal, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MessageModule } from '@openng/optimus-ui/message';
import { PanelModule } from '@openng/optimus-ui/panel';
import { ProgressBarModule } from '@openng/optimus-ui/progressbar';
import { TagModule } from '@openng/optimus-ui/tag';
import { Api } from '../api/api';
import { eventEnrollmentEnroll } from '../api/fn/enrollments/event-enrollment-enroll';
import { eventGet } from '../api/fn/events/event-get';
import { EventDto, ObligationDto } from '../api/models';
import { CATEGORY_ICONS, categoryKey } from '../evento-card/evento-card.component';
import { ApiError, ApiErrorDetail } from '../core/api-error';
import { SessionService } from '../core/session.service';
import { AVAILABILITY_LABELS, BRANCH_LABELS, CATEGORY_LABELS, LEVEL_LABELS, MEMBER_TYPE_LABELS, OBLIGATION_LABELS, REGION_NAMES, STATUS_LABELS, label } from '../core/labels';

/** Dettaglio di un evento a sezioni: logistica, iscrizione, scheda e documenti, referenti, e a lato posti e iscrizione. */
@Component({
  selector: 'app-evento-dettaglio',
  imports: [FormsModule, NgClass, MatFormFieldModule, MatInputModule, CurrencyPipe, DatePipe, RouterLink, MatButtonModule, MatProgressBarModule, MessageModule, PanelModule, ProgressBarModule, TagModule],
  templateUrl: './evento-dettaglio.component.html',
  styleUrl: './evento-dettaglio.component.scss',
})
export class EventoDettaglioComponent {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly session = inject(SessionService);

  /** Arriva dal percorso `/eventi/:id`. */
  readonly id = input.required<string>();

  protected readonly event = signal<EventDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notFound = signal(false);
  protected readonly enrolling = signal(false);
  /** Perche' l'iscrizione e' stata rifiutata: messaggio e, se ci sono, i motivi uno per uno. */
  protected readonly enrollError = signal<{ message: string; details: ApiErrorDetail[] } | null>(null);

  protected readonly labelOf = label;
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly availabilityLabels = AVAILABILITY_LABELS;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly levelLabels = LEVEL_LABELS;
  protected readonly obligationLabels = OBLIGATION_LABELS;

  constructor() {
    effect(() => this.load(this.id()));
  }

  protected cat(): string {
    return categoryKey(this.event()?.category);
  }

  protected icon(): string {
    return CATEGORY_ICONS[this.cat()];
  }

  protected regionName(event: EventDto): string {
    return event.level === 'NATIONAL' ? 'Nazionale' : label(REGION_NAMES, event.region);
  }

  protected availabilitySeverity(event: EventDto): 'success' | 'warn' | 'secondary' | 'danger' {
    switch (event.availability) {
      case 'OPEN': return 'success';
      case 'LIMITED': return 'warn';
      case 'HEAVY_OVERBOOKING': return 'danger';
      default: return 'secondary';
    }
  }

  protected seatsTakenPercent(event: EventDto): number {
    const seats = event.seats ?? 0;
    return seats ? Math.min(Math.round(((event.enrolledCount ?? 0) / seats) * 100), 100) : 0;
  }

  protected enrollmentText(event: EventDto): string {
    switch (event.enrollmentMode) {
      case 'BY_LEADER': return 'Questo evento prevede l\u2019iscrizione tramite un presentatore (il capo unità).';
      case 'BOTH': return 'Questo evento prevede l\u2019iscrizione autonoma o tramite un presentatore.';
      default: return 'Questo evento prevede l\u2019iscrizione autonoma (non è necessario un presentatore).';
    }
  }

  /** Le autorizzazioni dei capi richieste per completare l'iscrizione. */
  protected approvals(event: EventDto): string[] {
    const types = new Set((event.obligations ?? []).map((o) => o.type));
    const out: string[] = [];
    if (types.has('UNIT_LEADER_AUTHORIZATION')) out.push('l\u2019autorizzazione di un capo unità');
    if (types.has('GROUP_LEADER_AUTHORIZATION')) out.push('l\u2019autorizzazione di un capo gruppo');
    if (types.has('LEADER_VALIDATION')) out.push('la validazione di un capo');
    return out;
  }

  protected payments(event: EventDto): ObligationDto[] {
    return (event.obligations ?? []).filter((o) => o.type === 'PAYMENT');
  }

  protected hasForm(event: EventDto): boolean {
    return (event.obligations ?? []).some((o) => o.type === 'ELECTRONIC_FORM');
  }

  protected documents(event: EventDto): ObligationDto[] {
    return (event.obligations ?? []).filter((o) => o.type === 'DOCUMENT');
  }

  protected documentText(d: ObligationDto): string {
    const name = d.description || 'Documento da caricare';
    if (d.delivery === 'PAPER') return `${name} (da consegnare in cartaceo).`;
    const formats = (d.allowedMimeTypes ?? []).map((m) => m.split('/')[1]?.toUpperCase().replace('JPEG', 'JPG')).filter(Boolean);
    const size = d.maxSizeBytes ? ` - max ${Math.round(d.maxSizeBytes / 1_000_000)} MB` : '';
    return `${name}${formats.length ? ` (formato ${formats.join('/')}${size})` : ''}.`;
  }

  /** Le regole di partecipazione dai requisiti, una per riga. */
  protected rules(event: EventDto): string[] {
    const r = event.requirements;
    if (!r) return [];
    const out: string[] = [];
    if (r.minAge) out.push(`Minimo ${r.minAge} anni compiuti alla partenza dell'evento`);
    if (r.maxAge) out.push(`Massimo ${r.maxAge} anni compiuti alla partenza dell'evento`);
    if (r.branches?.length) out.push(`Branca: ${r.branches.map((b) => label(BRANCH_LABELS, b)).join(', ')}`);
    if (r.memberTypes?.length) out.push(`Tipo di socio: ${r.memberTypes.map((m) => label(MEMBER_TYPE_LABELS, m)).join(', ')}`);
    if (r.maxPerGroup) out.push(`Non più di ${r.maxPerGroup} iscritti dallo stesso gruppo`);
    if (r.oneActivePerType) out.push('Una sola iscrizione contemporanea a questo tipo di eventi');
    return out;
  }

  protected seatsLeft(event: EventDto): number {
    return Math.max((event.seats ?? 0) - (event.enrolledCount ?? 0), 0);
  }

  /** Le iscrizioni si possono tentare solo a eventi aperti; il backend decide comunque l'ultima parola. */
  protected canEnroll(event: EventDto): boolean {
    return event.availability === 'OPEN' || event.availability === 'LIMITED' || event.availability === 'HEAVY_OVERBOOKING';
  }

  /** Codice socio del ragazzo che un capo iscrive come presentatore. */
  protected memberCode = '';

  protected enroll(event: EventDto, memberCode?: string): void {
    this.enrolling.set(true);
    this.enrollError.set(null);
    this.api.invoke(eventEnrollmentEnroll, { eventId: event.id!, body: memberCode ? { memberCode } : {} }).then(
      (response) => {
        const waiting = response.payload?.position === 'WAITING';
        this.snackBar.open(waiting ? 'Sei in lista d\u2019attesa.' : 'Iscrizione registrata: completa gli adempimenti.', 'Chiudi', { duration: 6000 });
        void this.router.navigate([memberCode ? '/capi/iscritti' : '/iscrizioni']);
      },
      (e: ApiError) => {
        this.enrolling.set(false);
        this.enrollError.set({ message: e.message, details: e.details });
      },
    );
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.api.invoke(eventGet, { id }).then(
      (response) => {
        this.event.set(response.payload ?? null);
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.event.set(null);
        if (e.status === 404) this.notFound.set(true);
        else this.error.set(e.message);
        this.loading.set(false);
      },
    );
  }
}
