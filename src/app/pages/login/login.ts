import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Api } from '../../api/api';
import { mockAuthFindAll } from '../../api/functions';
import { MockUserResponse } from '../../api/models';
import { ApiError } from '../../core/api-error';
import { SessionService } from '../../core/session.service';

/** Accesso di prova: si sceglie uno degli utenti finti del backend. Sara' sostituito da Keycloak. */
@Component({
  selector: 'app-login',
  imports: [MatCardModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly api = inject(Api);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly users = signal<MockUserResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

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
    void this.router.navigate(['/']);
  }
}
