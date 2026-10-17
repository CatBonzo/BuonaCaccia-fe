import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { EventDto } from '../api/models';
import { AVAILABILITY_LABELS, CATEGORY_LABELS, LEVEL_LABELS, REGION_NAMES, STATUS_LABELS, label } from '../core/labels';

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

/** Icona Font Awesome della testata, una per tipologia. */
export const CATEGORY_ICONS: Record<string, string> = {
  lc: 'fa-paw',
  eg: 'fa-campground',
  rs: 'fa-mountain-sun',
  leader: 'fa-user-graduate',
  assoc: 'fa-flag',
};

/**
 * Una carta evento ("wild card"): in alto una testata colorata con lo stato, poi i tag (tipo di evento, tipologia, livello),
 * titolo, descrizione, luogo e date, quanti posti restano e la quota. Se le iscrizioni sono chiuse o l'evento e' annullato la carta si attenua.
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
    '[class.off]': 'off()',
  },
})
export class EventoCardComponent {
  readonly event = input.required<EventDto>();

  protected readonly tone = computed(() => seatTone(this.event().availability));
  protected readonly cat = computed(() => categoryKey(this.event().category));

  protected readonly icon = computed(() => CATEGORY_ICONS[this.cat()]);

  /** La tipologia (branca o formazione) per esteso, per il tag. */
  protected readonly categoryText = computed(() => label(CATEGORY_LABELS, this.event().category));

  /** Il livello per il tag: "Nazionale", oppure "Regionale · Piemonte" e "Di zona · Piemonte". */
  protected readonly levelText = computed(() => {
    const { level } = this.event();
    return level === 'NATIONAL' ? this.area() : `${label(LEVEL_LABELS, level)} · ${this.area()}`;
  });

  /** Una carta "spenta": evento annullato o con le iscrizioni chiuse. */
  protected readonly off = computed(() => this.event().status === 'CANCELLED' || this.event().availability === 'CLOSED');

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
