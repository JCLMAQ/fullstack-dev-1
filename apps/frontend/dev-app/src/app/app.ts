import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';


@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'dev-app';

  ngxtranslateService = inject(TranslateService);
 constructor() {
    const translateService = this.ngxtranslateService;
    translateService.addLangs(['en','fr']);

    translateService.use(translateService.getBrowserLang() || 'en'); // use browser language by default
    // get current language
  }
  currentLang = signal(this.ngxtranslateService.getCurrentLang() )// get current language

}
