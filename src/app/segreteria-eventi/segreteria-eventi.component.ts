import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../api/api';
import { eventCancel } from '../api/fn/events/event-cancel';
import { eventDelete } from '../api/fn/events/event-delete';
import { eventCloseRegistrations } from '../api/fn/events/event-close-registrations';
import { eventManaged, EventManaged$Params } from '../api/fn/events/event-managed';
import { eventPublish } from '../api/fn/events/event-publish';
import { EventDto } from '../api/models';
import { ApiError } from '../core/api-error';
import { STATUS_LABELS, label } from '../core/labels';
import { SessionService } from '../core/session.service';
import { EventoConfermaComponent } from '../evento-conferma/evento-conferma.component';

const PAGE_SIZE = 12;

/** Gli eventi della propria regione, in qualunque stato, in una tabella: si vede, si modifica, si elimina; le altre azioni stanno nel menu della riga. */
@Component({
  selector: 'app-segreteria-eventi',
  imports: [
    CurrencyPipe, DatePipe, FormsModule, RouterLink, MatButtonModule, MatChipsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatMenuModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule, MatTableModule, MatTooltipModule,
  ],
  templateUrl: './segreteria-eventi.component.html',
  styleUrl: './segreteria-eventi.component.scss',
})
export class SegreteriaEventiComponent {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  protected readonly session = inject(SessionService);

  protected readonly events = signal<EventDto[]>([]);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly statuses = Object.entries(STATUS_LABELS);
  protected readonly labelOf = label;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly pageSize = PAGE_SIZE;
  protected status = '';
  protected q = '';
  protected sort = 'createdAt,desc';
  protected readonly sorts = [
    ['createdAt,desc', 'Più recenti'],
    ['startDate,asc', 'Data di inizio'],
    ['title,asc', 'Titolo'],
  ];

  protected readonly columns = ['evento', 'stato', 'date', 'luogo', 'iscritti', 'quota', 'azioni'];

  constructor() {
    this.load(0);
  }

  protected filter(): void {
    this.load(0);
  }

  protected onPage(event: PageEvent): void {
    this.load(event.pageIndex);
  }

  /** Le azioni possibili le decide il backend (`availableActions`): qui si legge solo l'elenco. */
  protected can(e: EventDto, action: NonNullable<EventDto['availableActions']>[number]): boolean {
    return !!e.availableActions?.includes(action);
  }

  protected publish(e: EventDto): void {
    this.act(this.api.invoke(eventPublish, { id: e.id!, body: { version: e.version } }), 'Evento pubblicato.');
  }

  protected close(e: EventDto): void {
    this.act(this.api.invoke(eventCloseRegistrations, { id: e.id!, body: { version: e.version } }), 'Iscrizioni chiuse.');
  }

  /** Chiede il motivo in una finestra e poi annulla l'evento: il motivo lo ricevono tutti gli iscritti. */
  protected cancel(e: EventDto): void {
    this.dialog
      .open<EventoConfermaComponent, unknown, string>(EventoConfermaComponent, { data: { azione: 'cancel', titolo: e.title } })
      .afterClosed()
      .subscribe((reason) => {
        if (reason) this.act(this.api.invoke(eventCancel, { id: e.id!, body: { reason, version: e.version! } }), 'Evento annullato.');
      });
  }

  protected remove(e: EventDto): void {
    this.dialog
      .open<EventoConfermaComponent, unknown, boolean>(EventoConfermaComponent, { data: { azione: 'delete', titolo: e.title } })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.act(this.api.invoke(eventDelete, { id: e.id! }), 'Evento eliminato.');
      });
  }

  private act(request: Promise<unknown>, success: string): void {
    this.error.set(null);
    request.then(
      () => {
        this.snackBar.open(success, 'Chiudi', { duration: 4000 });
        this.load(this.pageIndex());
      },
      (e: ApiError) => this.error.set(e.details.length ? e.details.map((d) => d.message).join(' ') : e.message),
    );
  }

  private load(page: number): void {
    this.loading.set(true);
    const params: EventManaged$Params = { page, size: PAGE_SIZE };
    if (this.q.trim()) params.q = this.q.trim();
    params.sort = this.sort;
    if (this.status) params.status = this.status as EventManaged$Params['status'];
    this.api.invoke(eventManaged, params).then(
      (response) => {
        this.events.set(response.payload?.content ?? []);
        this.total.set(response.payload?.totalElements ?? 0);
        this.pageIndex.set(response.payload?.page ?? page);
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    );
  }
}
