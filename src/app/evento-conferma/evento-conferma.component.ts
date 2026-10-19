import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface EventoConfermaData {
  /** `delete` chiede solo conferma; `cancel` chiede anche il motivo, che ricevono tutti gli iscritti. */
  azione: 'delete' | 'cancel';
  titolo: string;
}

/** Finestra di conferma per eliminare o annullare un evento. Chiude con `true` (elimina) o con il motivo scritto (annulla). */
@Component({
  selector: 'app-evento-conferma',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './evento-conferma.component.html',
  styleUrl: './evento-conferma.component.scss',
})
export class EventoConfermaComponent {
  protected readonly data = inject<EventoConfermaData>(MAT_DIALOG_DATA);
  protected reason = '';
}
