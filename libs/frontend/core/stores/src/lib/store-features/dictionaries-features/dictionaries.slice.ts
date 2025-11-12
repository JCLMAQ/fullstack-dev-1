import { Dictionary } from './dictionary.model';

export type DictionariesSlice = {
  readonly selectedLanguage: string;
  readonly possibleLanguages: string[];
  readonly selectedDictionary: Dictionary | null;
};

export const initialDictionariesSlice: DictionariesSlice = {
  selectedLanguage: '',
  possibleLanguages: [],
  selectedDictionary: null,
};
