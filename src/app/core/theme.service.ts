import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | null;

/** Il tema scelto dalla persona: null vuol dire "come il sistema". La scelta resta nel browser. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(read());
  private readonly dark = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

  constructor() {
    // Con "come il sistema" il tema segue il sistema anche mentre la pagina e' aperta.
    this.dark?.addEventListener('change', () => this.apply());
    this.apply();
  }

  /** Sistema, chiaro, scuro e di nuovo sistema: tre passi in giro con un solo pulsante. */
  cycle(): void {
    const next: Theme = this.theme() === null ? 'light' : this.theme() === 'light' ? 'dark' : null;
    this.theme.set(next);
    const root = document.documentElement;
    if (next) root.dataset['theme'] = next;
    else delete root.dataset['theme'];
    this.apply();
    try {
      if (next) localStorage.setItem('bc-theme', next);
      else localStorage.removeItem('bc-theme');
    } catch {
      // Senza memoria del browser la scelta vale solo per questa visita.
    }
  }

  /** PrimeNG cambia colori con la classe `app-dark`: la mettiamo quando il tema in uso e' scuro. */
  private apply(): void {
    const t = this.theme();
    const dark = t === 'dark' || (t === null && !!this.dark?.matches);
    document.documentElement.classList.toggle('app-dark', dark);
  }
}

function read(): Theme {
  try {
    const t = localStorage.getItem('bc-theme');
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}
