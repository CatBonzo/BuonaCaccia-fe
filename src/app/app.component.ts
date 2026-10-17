import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { MenuService } from './core/menu.service';
import { FooterComponent } from './footer/footer.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';

/** La pagina madre: barra in alto, menu laterale (cassetto sul telefono), la pagina scelta dal link e il piede. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DrawerModule, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly menu = inject(MenuService);
  protected readonly drawer = signal(false);

  constructor() {
    // Sul telefono il menu si chiude da solo dopo aver scelto una pagina.
    inject(Router).events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.drawer.set(false);
    });
  }
}
