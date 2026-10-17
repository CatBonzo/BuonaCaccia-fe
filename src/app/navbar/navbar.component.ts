import { Component, inject, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MenuService } from '../core/menu.service';
import { SessionService } from '../core/session.service';
import { ThemeService } from '../core/theme.service';

/** Barra in alto: il nome, il pulsante del menu sul telefono, il tema e la persona che ha fatto l'accesso. */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, MatButtonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected readonly session = inject(SessionService);
  protected readonly menu = inject(MenuService);
  protected readonly themes = inject(ThemeService);
  private readonly router = inject(Router);

  /** I collegamenti del sito: sono gli stessi per tutti. "Home" porta alla radice, che oggi apre il catalogo; "Eventi" e' il catalogo. */
  protected readonly links = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'eventi', label: 'Eventi', path: '/eventi' },
    { id: 'aiuto', label: 'Aiuto', path: '/aiuto' },
    { id: 'info', label: 'Info', path: '/info' },
  ];

  /** Il pulsante del menu e' premuto: lo apre o lo chiude chi contiene il cassetto. */
  readonly menuToggle = output<void>();

  protected logout(): void {
    this.session.logout();
    void this.router.navigate(['/eventi']);
  }
}
