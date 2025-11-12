import { inject, Injectable } from '@angular/core';
import { DICTIONARIES_TOKEN, Dictionary } from '@fe/tokens';
import { TranslateService } from '@ngx-translate/core';
import { getDictionaryHelper } from '../../store/dictionary/dictionary.helpers';

@Injectable({
  providedIn: 'root',
})
export class DictionaryService {
  readonly ngxtranslateService = inject(TranslateService);

  readonly #dictionaries = inject(DICTIONARIES_TOKEN);

  readonly languages = Object.keys(this.#dictionaries);

  private dictionaryOf(language: string) {
    // Return the dictionary of the passed language
    return getDictionaryHelper(language, this.#dictionaries);
  }

  getDictionary(language: string): Dictionary {
    // Return the dictionary of the passed language key (en, fr, ...) and fix the ngx translate to use it
    if (!this.languages.includes(language)) {
      throw new Error(`Language ${language} not found in dictionaries`);
    }
    this.ngxtranslateService.use(language);
    return this.dictionaryOf(language);
  }
}
