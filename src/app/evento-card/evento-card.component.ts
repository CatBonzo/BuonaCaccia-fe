import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { EventDto } from '../api/models';
import { AVAILABILITY_LABELS, LEVEL_LABELS, REGION_NAMES, STATUS_LABELS, label } from '../core/labels';

/** Stato dei posti in tre toni: aperto, quasi pieno, chiuso. Serve a colorare il punto e il segno della carta. */
export function seatTone(availability: string | undefined): 'ok' | 'warn' | 'closed' {
  if (availability === 'OPEN') return 'ok';
  if (availability === 'LIMITED' || availability === 'HEAVY_OVERBOOKING') return 'warn';
  return 'closed';
}

/** La branca in minuscolo breve, per scegliere il colore del tipo nello stile. */
export function categoryKey(category: string | undefined): string {
  return { LC: 'lc', EG: 'eg', RS: 'rs', LEADER_TRAINING: 'leader', ASSOCIATION: 'assoc' }[category ?? ''] ?? 'assoc';
}

/**
 * Una carta evento ("wild card"): il tipo e lo stato in alto, titolo, luogo e date, quanti posti restano e la quota.
 * Tutta la carta e' cliccabile e porta al dettaglio, ma il collegamento vero resta uno solo: il titolo.
 */
@Component({
  selector: 'li[app-evento-card]',
  imports: [DatePipe, CurrencyPipe, RouterLink, MatProgressBarModule],
  templateUrl: './evento-card.component.html',
  styleUrl: './evento-card.component.scss',
  host: {
    class: 'event',
    '[attr.data-event]': 'event().code',
    '[attr.data-tone]': 'tone()',
    '[attr.data-cat]': 'cat()',
  },
})
export class EventoCardComponent {
  readonly event = input.required<EventDto>();

  protected readonly tone = computed(() => seatTone(this.event().availability));
  protected readonly cat = computed(() => categoryKey(this.event().category));

  /** Lo stato scritto in alto a destra: annullato prima di tutto, poi la disponibilita'. */
  protected readonly stateText = computed(() =>
    this.event().status === 'CANCELLED' ? label(STATUS_LABELS, 'CANCELLED') : label(AVAILABILITY_LABELS, this.event().availability),
  );

  /** "Nazionale" per gli eventi nazionali, altrimenti la regione per esteso. */
  protected readonly area = computed(() => {
    const { level, region } = this.event();
    return level === 'NATIONAL' ? label(LEVEL_LABELS, level) : (REGION_NAMES[region ?? ''] ?? region ?? '');
  });

  /** Quanta parte dei posti e' occupata, in percentuale; null se l'evento non ha un numero di posti. */
  protected readonly fill = computed(() => {
    const { seats, enrolledCount } = this.event();
    return seats ? Math.min(100, Math.round(((enrolledCount ?? 0) / seats) * 100)) : null;
  });

  /** "30 posti disponibili", "Ultimo posto" o "Posti esauriti". */
  protected readonly seatsText = computed(() => {
    const { seats = 0, enrolledCount = 0 } = this.event();
    const left = seats - enrolledCount;
    if (left <= 0) return 'Posti esauriti';
    return left === 1 ? '1 posto disponibile' : `${left} posti disponibili`;
  });
}
