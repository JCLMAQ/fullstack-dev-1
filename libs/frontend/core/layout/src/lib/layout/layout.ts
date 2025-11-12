import { Component, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { ResponsiveService } from '../services/responsive/responsive-service';
import { CustomSidenav } from './custom-sidenav/custom-sidenav';
import { Header } from './header/header';

@Component({
  selector: 'lib-layout',
  imports: [
    MatSidenavModule,
    CustomSidenav,
    Header,
    RouterOutlet,
    MatButtonModule,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  responsiveService = inject(ResponsiveService);
  readonly sidenav = viewChild.required(MatSidenav);

  backDrop() {
    if (this.responsiveService.isMobile()) {
      this.responsiveService.isMenuBarOpen.set(
        !this.responsiveService.isMenuBarOpen(),
      );
    }
  }
}
