import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withProps, withState } from '@ngrx/signals';
// import { User } from '@db/prisma-client';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '@fe/auth';
import { DICTIONARIES_TOKEN } from '@fe/tokens';
import { withAppAuthFeatures } from '../store-features/authentication-features/authentication.features';
import { withDictionariesFeatures } from '../store-features/dictionaries-features/dictionaries.features';
import { initialAppSlice } from './app.slice';

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialAppSlice),
  withProps(() => ({
    _authService: inject(AuthService),
    _router: inject(Router),
    _snackbar: inject(MatSnackBar),
    _dictionaries: inject(DICTIONARIES_TOKEN),
  })),

  withComputed((store) => ({
    user: computed(() => store._authService.user()),
    authToken: computed(() => store._authService.authToken()),
  })),

  // Auth part
  withAppAuthFeatures(), // Add: login(), logout(), register()

  // Languages part
  withDictionariesFeatures(), // Add  selectedLanguage, possibleLanguages, selectedDictionary, changeLanguage()
);
