import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { RegionDto } from '../../api/models';
import { AVAILABILITY_LABELS, CATEGORY_LABELS } from '../../core/labels';

/** I filtri scelti dalla persona; un campo vuoto vuol dire "nessun filtro". */
export interface FiltriEventi {
  q: string;
  region: string;
  category: string;
  availability: string;
  startFrom: string;
  startTo: string;
}

/** La barra di ricerca del catalogo: testo, regione e categoria sempre in vista, il resto sotto "Altri filtri". */
@Component({
  selector: 'app-filtri-eventi',
  imports: [FormsModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule, SelectModule],
  templateUrl: './filtri-eventi.component.html',
  styleUrl: './filtri-eventi.component.scss',
})
export class FiltriEventiComponent {
  readonly regions = input<RegionDto[]>([]);
  /** Premuto "Cerca" (o Invio) o "Azzera filtri": porta i filtri a chi mostra l'elenco. */
  readonly cerca = output<FiltriEventi>();

  /** Le tendine hanno sempre la voce "Tutte" in testa: il valore vuoto vuol dire "nessun filtro". */
  protected readonly regionOptions = computed(() => [{ code: '', name: 'Tutte le regioni' }, ...this.regions()]);
  protected readonly categoryOptions = [{ code: '', name: 'Tutte le categorie' }, ...Object.entries(CATEGORY_LABELS).map(([code, name]) => ({ code, name }))];
  protected readonly availabilityOptions = [{ code: '', name: 'Qualsiasi disponibilità' }, ...Object.entries(AVAILABILITY_LABELS).map(([code, name]) => ({ code, name }))];
  protected readonly moreFilters = signal(false);

  protected q = '';
  protected region = '';
  protected category = '';
  protected availability = '';
  protected startFrom = '';
  protected startTo = '';

  /** Quanti filtri nascosti sotto "Altri filtri" sono attivi, da mostrare sul pulsante chiuso. */
  protected activeFilters(): number {
    return [this.availability, this.startFrom, this.startTo].filter(Boolean).length;
  }

  protected apply(): void {
    this.cerca.emit({
      q: this.q,
      region: this.region,
      category: this.category,
      availability: this.availability,
      startFrom: this.startFrom,
      startTo: this.startTo,
    });
  }

  protected reset(): void {
    this.q = this.region = this.category = this.availability = this.startFrom = this.startTo = '';
    this.apply();
  }
}
