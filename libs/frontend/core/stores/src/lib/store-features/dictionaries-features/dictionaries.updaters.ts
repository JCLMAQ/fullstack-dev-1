import { PartialStateUpdater } from '@ngrx/signals';
import { DictionariesSlice } from './dictionaries.slice';

export function changeLanguage(
  languages: string[],
): PartialStateUpdater<DictionariesSlice> {
  return (state) => {
    const index = languages.indexOf(state.selectedLanguage) ?? -1;
    const nextIndex = (index + 1) % languages.length;
    const selectedLanguage = languages[nextIndex];
    return { selectedLanguage };
  };
}
