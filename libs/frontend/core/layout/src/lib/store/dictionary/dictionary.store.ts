import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { inject } from '@angular/core';
import { DICTIONARIES_TOKEN } from '@fe/tokens';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { DictionaryService } from '../../services/dictionaries/dictionary-service';
import { NotificationService } from '../../services/notifications/notification-service';
import { withBusy } from '../custom-store-features/with-busy/with-busy.feature';
import { Dictionary } from './dictionary-token.model';
import { initialDictionarySlice } from './dictionary.slice';
import {
  changeLanguageDictionary,
  resetLanguagesDictionaries,
  switchLanguageDictionary,
} from './dictionary.updaters';

export const DictionaryStore = signalStore(
  { providedIn: 'root' },
  withState(initialDictionarySlice),
  withBusy(),
  withProps((_) => {
    const _dictionariesService = inject(DictionaryService);
    const _languages = _dictionariesService.languages;
    const _dictionaries = inject(DICTIONARIES_TOKEN);

    return {
      _dictionariesService,
      _dictionaries,
      _languages,
      _notifications: inject(NotificationService),
    };
  }),
  withMethods((store) => {
    const dictionaries = inject(DICTIONARIES_TOKEN);
    const languages = Object.keys(dictionaries);
    return {
      changeLanguage: () =>
        patchState(store, changeLanguageDictionary(languages)),
      switchLanguage: (language: string) =>
        patchState(store, switchLanguageDictionary(language)),
      setDictionary: (dictionary: Dictionary) =>
        patchState(store, { selectedDictionary: dictionary }),
      _resetLanguages: () =>
        patchState(store, resetLanguagesDictionaries(languages)),
    };
  }),
  withHooks((store) => ({
    onInit: () => {
      const dictionaries = inject(DICTIONARIES_TOKEN);
      const languages = Object.keys(dictionaries);
      patchState(store, {
        possibleLanguages: languages,
        selectedLanguage: languages[0],
      });
    },
  })),
  withDevtools('dictionary-store'),
);
