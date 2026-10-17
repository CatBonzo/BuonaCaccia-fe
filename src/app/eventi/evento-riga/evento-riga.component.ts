import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EventDto } from '../../api/models';
import { AVAILABILITY_LABELS, CATEGORY_LABELS, STATUS_LABELS, label } from '../../core/labels';

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** Stato dei posti in tre toni: aperto, quasi pieno, chiuso. Serve a colorare il segno a sinistra della riga. */
export function seatTone(availability: string | undefined): 'ok' | 'warn' | 'closed' {
  if (availability === 'OPEN') return 'ok';
  if (availability === 'LIMITED' || availability === 'HEAVY_OVERBOOKING') return 'warn';
  return 'closed';
}

/** La branca in minuscolo breve, per scegliere il colore della data nello stile. */
export function categoryKey(category: string | undefined): string {
  return { LC: 'lc', EG: 'eg', RS: 'rs', LEADER_TRAINING: 'leader', ASSOCIATION: 'assoc' }[category ?? ''] ?? 'assoc';
}

/** Una riga del catalogo: i giorni a sinistra, titolo e luogo, posti e quota a destra. Tutta la riga porta al dettaglio. */
@Component({
  selector: 'li[app-evento-riga]',
  imports: [DatePipe, CurrencyPipe, RouterLink, MatIconModule],
  templateUrl: './evento-riga.component.html',
  styleUrl: './evento-riga.component.scss',
  host: {
    class: 'event',
    '[attr.data-event]': 'event().code',
    '[attr.data-tone]': 'tone()',
    '[attr.data-cat]': 'cat()',
  },
})
export class EventoRigaComponent {
  readonly event = input.required<EventDto>();

  protected readonly tone = computed(() => seatTone(this.event().availability));
  protected readonly cat = computed(() => categoryKey(this.event().category));
  protected readonly availabilityText = computed(() => label(AVAILABILITY_LABELS, this.event().availability));
  protected readonly categoryText = computed(() => label(CATEGORY_LABELS, this.event().category));
  protected readonly statusText = computed(() => label(STATUS_LABELS, this.event().status));

  /** Giorni dell'evento ("10–12" o "10") per il blocco della data. */
  protected readonly days = computed(() => {
    const { startDate = '', endDate = '' } = this.event();
    const start = Number(startDate.slice(8, 10));
    const end = Number(endDate.slice(8, 10));
    if (startDate === endDate) return String(start);
    return startDate.slice(0, 7) === endDate.slice(0, 7) ? `${start}–${end}` : `${start}`;
  });

  protected readonly month = computed(() => MONTHS[Number((this.event().startDate ?? '').slice(5, 7)) - 1]?.slice(0, 3) ?? '');
}
