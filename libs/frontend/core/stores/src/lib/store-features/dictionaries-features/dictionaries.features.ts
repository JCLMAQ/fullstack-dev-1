import { computed, inject } from '@angular/core';
import { DICTIONARIES_TOKEN } from '@fe/tokens';
import {
  patchState,
  signalStoreFeature,
  SignalStoreFeature,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { getDictionary } from './dictionaries.helpers';
import { initialDictionariesSlice } from './dictionaries.slice';
import { changeLanguage } from './dictionaries.updaters';

// Base on Koby-Hary-Udemy NGRX Signals Courses

export function withDictionariesFeatures(): SignalStoreFeature {
  return signalStoreFeature(
    withState(initialDictionariesSlice),
    withProps(() => ({
      _dictionaries: inject(DICTIONARIES_TOKEN),
    })),
    withComputed((store) => {
      return {
        selectedDictionary: computed(() =>
          getDictionary(store.selectedLanguage(), store._dictionaries),
        ),
      };
    }),
    withMethods((store) => {
      const languages = Object.keys(store._dictionaries);
      return {
        changeLanguage: () => patchState(store, changeLanguage(languages)),
      };
    }),
    withHooks((store) => ({
      onInit: () => {
        const languages = Object.keys(store._dictionaries);
        patchState(store, {
          possibleLanguages: languages,
          selectedLanguage: languages[0],
        });
      },
    })),
  );
}
