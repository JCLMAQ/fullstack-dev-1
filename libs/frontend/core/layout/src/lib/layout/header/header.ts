import { Component, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav } from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { AppStore } from '@fe/stores';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from '../../services/responsive/responsive-service';
import { ThemeService } from '../../services/themes/theme-service';
import { DictionaryStore } from '../../store/dictionary/dictionary.store';

@Component({
  selector: 'lib-header',
  imports: [
    MatToolbar,
    MatIcon,
    MatButtonModule,
    MatMenuModule,
    MatDivider,
    // TitleCasePipe,
    TranslatePipe,
    // FlagComponent
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  dictionaryStore = inject(DictionaryStore);
  ngxtranslateService = inject(TranslateService);
  themeService = inject(ThemeService);
  responsiveService = inject(ResponsiveService);
  appStore = inject(AppStore);
  router = inject(Router);

  readonly sidenav = viewChild.required(MatSidenav);

  collapsed = this.responsiveService.isCollapsed;
  barOpen = this.responsiveService.isMenuBarOpen;

  currentLang = signal(this.ngxtranslateService.getCurrentLang()); // get current language

  setLanguage(language: string) {
    this.dictionaryStore.switchLanguage(language);
    this.currentLang.set(language);
    this.ngxtranslateService.use(language);
    // this.dictionaryStore.setDictionary(this.dictionaryStore._dictionaries[language]);
  }
  toggleMenu() {
    if (!this.barOpen()) {
      this.barOpen.set(!this.barOpen());
    } else {
      if (!this.collapsed()) {
        this.collapsed.set(!this.collapsed());
      } else {
        this.barOpen.set(!this.barOpen());
        this.collapsed.set(!this.collapsed());
      }
    }
  }

    login() {
    this.router.navigate(['/login']);
  }

  navigate(route: string) {
    // Routes qui sont sous pages/
    const pageRoutes = ['picto', 'carousselpicture', 'picture', 'choice'];

    if (pageRoutes.includes(route)) {
      this.router.navigate([`/pages/${route}`]);
    } else if (route === 'file') {
      // Route spécifique pour les fichiers
      this.router.navigate(['/files']);
    } else {
      // Routes directes (comme users)
      this.router.navigate([`/${route}`]);
    }
  }

  toggleDarkMode() {
    this.themeService.switchLightDarkTheme();
  }
}
