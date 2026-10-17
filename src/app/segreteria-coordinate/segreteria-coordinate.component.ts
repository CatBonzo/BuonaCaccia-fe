import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../api/api';
import { regionFindAll } from '../api/fn/regions/region-find-all';
import { regionSettingsGet } from '../api/fn/region-settings/region-settings-get';
import { regionSettingsSave } from '../api/fn/region-settings/region-settings-save';
import { RegionDto, RegionSettingsDto } from '../api/models';
import { ApiError, ApiErrorDetail } from '../core/api-error';
import { SessionService } from '../core/session.service';

/** Intestatario e IBAN che il socio vede per il bonifico: la segreteria cura la propria regione, l'amministrazione tutte e quelle nazionali. */
@Component({
  selector: 'app-segreteria-coordinate',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './segreteria-coordinate.component.html',
  styleUrl: './segreteria-coordinate.component.scss',
})
export class SegreteriaCoordinateComponent {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly session = inject(SessionService);

  protected readonly regions = signal<RegionDto[]>([]);
  protected readonly settings = signal<RegionSettingsDto | null>(null);
  protected readonly error = signal<{ message: string; details: ApiErrorDetail[] } | null>(null);
  /** Chi non e' una segreteria regionale (l'amministrazione) sceglie la regione; la segreteria ha la propria. */
  protected key = this.session.regionCode();

  constructor() {
    if (!this.key) {
      this.api.invoke(regionFindAll).then((r) => this.regions.set([{ code: 'NAT', name: 'Nazionale' }, ...(r.payload ?? [])]), () => undefined);
    } else {
      this.load();
    }
  }

  protected load(): void {
    this.error.set(null);
    this.api.invoke(regionSettingsGet, { key: this.key }).then(
      (r) => this.settings.set({ ...r.payload }),
      (e: ApiError) => this.error.set({ message: e.message, details: [] }),
    );
  }

  protected save(): void {
    this.error.set(null);
    this.api.invoke(regionSettingsSave, { key: this.key, body: this.settings()! }).then(
      (r) => {
        this.settings.set({ ...r.payload });
        this.snackBar.open('Coordinate salvate.', 'Chiudi', { duration: 4000 });
      },
      (e: ApiError) => this.error.set({ message: e.message, details: e.details }),
    );
  }
}
