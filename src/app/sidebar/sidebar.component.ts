import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuService } from '../core/menu.service';
import { SessionService } from '../core/session.service';

/** Menu laterale: le voci cambiano con i permessi della persona e sono divise in gruppi. */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  protected readonly menu = inject(MenuService);
  protected readonly session = inject(SessionService);
}
