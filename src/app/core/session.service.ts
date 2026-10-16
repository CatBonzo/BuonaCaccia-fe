import { Injectable, computed, signal } from '@angular/core';
import { MockUserResponse } from '../api/models';

const STORAGE_KEY = 'buonacaccia.session';
const ENTITLEMENT_PREFIX = 'agesci:entitlement:';

/** Chi e' entrato (login mock, poi Keycloak) e cosa puo' fare: ruoli e permessi vengono dal token, mai dedotti. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly current = signal<MockUserResponse | null>(this.restore());

  readonly user = this.current.asReadonly();
  readonly loggedIn = computed(() => this.current() !== null);
  readonly token = computed(() => this.current()?.accessToken ?? null);
  readonly fullName = computed(() => {
    const u = this.current();
    return u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : '';
  });
  readonly roles = computed(() => this.current()?.authentication?.role ?? []);
  readonly entitlements = computed(() =>
    (this.current()?.authentication?.entitlement ?? []).map((e) => e.replace(ENTITLEMENT_PREFIX, '')),
  );

  login(user: MockUserResponse): void {
    this.current.set(user);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      /* sessionStorage non disponibile: la sessione dura fino al ricaricamento */
    }
  }

  logout(): void {
    this.current.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nulla da pulire */
    }
  }

  /** Controlla un permesso nella forma breve, es. `evento:gestione`. */
  can(entitlement: string): boolean {
    return this.entitlements().includes(entitlement);
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  private restore(): MockUserResponse | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as MockUserResponse) : null;
    } catch {
      return null;
    }
  }
}
