import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '@fe/auth';
import {
  patchState,
  SignalStoreFeature,
  signalStoreFeature,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { initialAppSlice } from '../../app-store/app.slice';

/* tslint:disable:object-literal-type */
export function withAppAuthFeatures(): SignalStoreFeature {
  return signalStoreFeature(
    withState(initialAppSlice),
    withProps(() => ({
      _authService: inject(AuthService),
      _router: inject(Router),
      _snackbar: inject(MatSnackBar),
    })),
    withMethods((store) => ({
      login: async (email: string, password: string) => {

        try {
          if (!email || !password) {
            store._snackbar.open('Enter an email and password.', 'Close', {
              verticalPosition: 'top',
              horizontalPosition: 'right',
            });
            return;
          }

          const loginResponse = await store._authService.login(email, password);
          console.log('user after login: ', loginResponse);

          patchState(store, {
            user: loginResponse.user,
            authToken: loginResponse.access_token,
          });

          store._router.navigate(['/dashboard']);
        } catch (error) {
          store._snackbar.open('Invalid email or password', 'Close', {
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
          console.error(error);
          // Optional: track error
        }
      },

      logout: async () => {
        await store._authService.logout();
        // patchState(store, { user: undefined });
        store._router.navigate(['/home']);
      },

      register: async (
        email: string,
        password: string,
        confirmPassword: string,
      ) => {
        try {
          if (!email || !password || !confirmPassword) {
            store._snackbar.open(
              'Enter an email and password + confirm password.',
              'Close',
              {
                verticalPosition: 'top',
                horizontalPosition: 'right',
              },
            );
            return;
          }

          // const response =
          await store._authService.register(email, password, confirmPassword);
          store._snackbar.open('Registration done', 'Close', {
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
          // Optional: track success

          store._router.navigate(['/login']);
        } catch (error) {
          store._snackbar.open(
            'Invalid email, password or confirm password',
            'Close',
            {
              verticalPosition: 'top',
              horizontalPosition: 'right',
            },
          );
          console.error(error);
          // Optional: track error
        }
      },
    })),
  );
}
