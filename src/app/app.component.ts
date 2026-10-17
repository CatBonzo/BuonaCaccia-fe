import { Component, inject, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MenuService } from './core/menu.service';
import { FooterComponent } from './footer/footer.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';

/** La pagina madre: barra in alto, menu laterale, la pagina scelta dal link e il piede. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSidenavModule, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly menu = inject(MenuService);
  private readonly sidenav = viewChild(MatSidenav);

  constructor() {
    // Sul telefono il menu si chiude da solo dopo aver scelto una pagina.
    inject(Router).events.subscribe((e) => {
      if (e instanceof NavigationEnd && this.menu.narrow()) void this.sidenav()?.close();
    });
  }
}
