import { Dictionaries, Dictionary } from '@fe/tokens';
export function getDictionaryHelper(
  language: string,
  dictionaries: Dictionaries,
): Dictionary {
  // Return the dictionary of the selected language
  return dictionaries[language] ?? Object.values(dictionaries)[0];
}

export function translateFromDictionary(
  key: string,
  dictionary: Dictionary | null,
): string {
  // Translate using the selected dictionary according the key
  if (!dictionary) return key;
  return dictionary[key] ?? key;
}

export function translateFromDictionaryToPair(
  key: string,
  dictionary: Dictionary | null,
): { key: string; name: string } {
  // Return the translated key with the format: key, name: translated key
  return { key, name: translateFromDictionary(key, dictionary) };
}

export function translateFromDictionaryToPairs(
  keys: string[],
  dictionary: Dictionary | null,
): { key: string; name: string }[] {
  // Return all the translated key within the array's key under the format [ key, name: translated key ]
  return keys.map((key) => translateFromDictionaryToPair(key, dictionary));
}
