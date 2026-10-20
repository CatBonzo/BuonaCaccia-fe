import { DecimalPipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MessageModule } from '@openng/optimus-ui/message';
import { PanelModule } from '@openng/optimus-ui/panel';
import { Api } from '../api/api';
import { eventAttachmentContent } from '../api/fn/event-attachments/event-attachment-content';
import { eventAttachmentDelete } from '../api/fn/event-attachments/event-attachment-delete';
import { eventAttachmentList } from '../api/fn/event-attachments/event-attachment-list';
import { eventAttachmentUpload } from '../api/fn/event-attachments/event-attachment-upload';
import { EventAttachmentDto } from '../api/models';
import { ApiError } from '../core/api-error';
import { FileDownload } from '../core/file-download';

/** File allegati a un evento: chiunque li scarica, la segreteria (con `editable`) li carica e li toglie. */
@Component({
  selector: 'app-evento-allegati',
  imports: [DecimalPipe, MatButtonModule, MessageModule, PanelModule],
  templateUrl: './evento-allegati.component.html',
  styleUrl: './evento-allegati.component.scss',
})
export class EventoAllegatiComponent {
  private readonly api = inject(Api);
  private readonly files = inject(FileDownload);
  private readonly snackBar = inject(MatSnackBar);

  readonly eventId = input.required<string>();
  readonly editable = input(false);

  protected readonly items = signal<EventAttachmentDto[]>([]);
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  constructor() {
    effect(() => this.load(this.eventId()));
  }

  private load(id: string): void {
    this.api.invoke(eventAttachmentList, { id }).then(
      (response) => this.items.set(response.payload ?? []),
      () => this.items.set([]),
    );
  }

  protected async download(a: EventAttachmentDto): Promise<void> {
    this.files.save(await this.api.invoke(eventAttachmentContent, { id: a.eventId!, attachmentId: a.id! }), a.name ?? 'allegato');
  }

  protected async onPick(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.error.set('');
    this.busy.set(true);
    try {
      await this.api.invoke(eventAttachmentUpload, { id: this.eventId(), body: { file } });
      this.load(this.eventId());
      this.snackBar.open('Allegato caricato.', undefined, { duration: 3000 });
    } catch (e) {
      const err = e as ApiError;
      this.error.set(err.details?.[0]?.message ?? err.message);
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(a: EventAttachmentDto): Promise<void> {
    this.error.set('');
    try {
      await this.api.invoke(eventAttachmentDelete, { id: a.eventId!, attachmentId: a.id! });
      this.load(this.eventId());
    } catch (e) {
      this.error.set((e as ApiError).message);
    }
  }
}
