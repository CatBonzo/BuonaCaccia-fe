import { Component, inject } from '@angular/core';
import { SessionService } from '../../core/session.service';

@Component({
  selector: 'app-home',
  template: `
    <h1>Ciao {{ session.user()?.firstName }}</h1>
    <p data-testid="roles">Ruoli: {{ session.roles().join(', ') }}</p>
    <p data-testid="entitlements">Permessi: {{ session.entitlements().join(', ') || 'nessuno' }}</p>
  `,
})
export class Home {
  protected readonly session = inject(SessionService);
}
