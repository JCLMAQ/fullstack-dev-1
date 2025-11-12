import { InjectionToken } from '@angular/core';
import { Dictionaries } from '../models/dictionary.model';

export const DICTIONARIES_TOKEN = new InjectionToken<Dictionaries>(
  'DICTIONARIES_TOKEN',
);
