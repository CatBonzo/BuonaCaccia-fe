import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { Api } from '../api/api';
import { mockAuthFindAll } from '../api/functions';
import { MockUserResponse } from '../api/models';
import { ApiError } from '../core/api-error';
import { SessionService } from '../core/session.service';

/** Accesso di prova: si sceglie uno degli utenti finti del backend. Sara' sostituito da Keycloak. */
@Component({
  selector: 'app-login',
  imports: [ButtonModule, ProgressBarModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly api = inject(Api);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly users = signal<MockUserResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Le iniziali nel tondo: aiutano a riconoscere a colpo d'occhio chi e' chi nell'elenco. */
  protected initials(user: MockUserResponse): string {
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  }

  constructor() {
    this.api.invoke(mockAuthFindAll).then(
      (response) => {
        this.users.set(response.payload ?? []);
        this.loading.set(false);
      },
      (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    );
  }

  protected enter(user: MockUserResponse): void {
    this.session.login(user);
    void this.router.navigate(['/eventi']);
  }
}
