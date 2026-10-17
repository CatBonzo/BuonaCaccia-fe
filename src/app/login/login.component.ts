import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Api } from '../api/api';
import { mockAuthFindAll } from '../api/functions';
import { MockUserResponse } from '../api/models';
import { ApiError } from '../core/api-error';
import { SessionService } from '../core/session.service';

/** Accesso di prova: email e password come in un accesso vero, ma gli utenti sono quelli finti del backend e la password e' libera. Sara' sostituito da Keycloak. */
@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatProgressBarModule],
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
  protected readonly email = signal('');
  protected readonly password = signal('');
  /** Messaggio per le funzioni che nell'accesso di prova non esistono (password dimenticata, registrazione). */
  protected readonly notice = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);

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

  /** Accesso con email e password: l'email deve essere di un utente di prova, la password basta che ci sia. */
  protected submit(event: Event): void {
    event.preventDefault();
    this.notice.set(null);
    const email = this.email().trim().toLowerCase();
    if (!email || !this.password()) {
      this.formError.set('Scrivi email e password.');
      return;
    }
    const user = this.users().find((u) => u.email?.toLowerCase() === email || u.username?.toLowerCase() === email);
    if (!user) {
      this.formError.set('Non trovo questo utente di prova. Scegline uno dall\'elenco qui sotto.');
      return;
    }
    this.enter(user);
  }

  /** "Accedi con Google" e' finto: entra come il socio di prova. */
  protected google(): void {
    const user = this.users().find((u) => u.username === 'socio') ?? this.users()[0];
    if (user) this.enter(user);
  }

  /** Riempie l'email con quella dell'utente scelto nell'elenco. */
  protected pick(user: MockUserResponse): void {
    this.email.set(user.email ?? user.username ?? '');
    this.password.set('prova');
    this.formError.set(null);
  }

  protected unavailable(what: string): void {
    this.notice.set(`${what} non e' disponibile nell'accesso di prova.`);
  }

  protected enter(user: MockUserResponse): void {
    this.session.login(user);
    void this.router.navigate(['/eventi']);
  }
}
