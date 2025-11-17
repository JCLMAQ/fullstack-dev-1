import { HttpClient } from '@angular/common/http';
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
import { firstValueFrom } from 'rxjs';
import { initialAppSlice } from '../../app-store/app.slice';

/* tslint:disable:object-literal-type */
export function withAppAuthFeatures(): SignalStoreFeature {
  return signalStoreFeature(
    withState(initialAppSlice),
    withProps(() => ({
      _authService: inject(AuthService),
      _router: inject(Router),
      _snackbar: inject(MatSnackBar),
      _httpClient: inject(HttpClient),
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

      /**
       * Met à jour l'image de profil de l'utilisateur via une URL
       * @param userId - ID de l'utilisateur
       * @param photoUrl - Nouvelle URL de l'image
       */
      updateUserProfileImage: async (userId: string, photoUrl: string) => {
        try {
          const currentUser = store._authService.user();
          if (!currentUser) {
            store._snackbar.open('Utilisateur non connecté', 'Close', {
              verticalPosition: 'top',
              horizontalPosition: 'right',
            });
            return;
          }

          // Appeler l'API pour mettre à jour l'utilisateur
          await firstValueFrom(
            store._httpClient.put<{ id: string; photoUrl: string }>(`/api/users/${userId}`, {
              photoUrl: photoUrl
            })
          );

          // Mettre à jour l'utilisateur local avec la nouvelle image
          const updatedUserData = {
            ...currentUser,
            photoUrl: photoUrl
          };

          // Mettre à jour le store avec les nouvelles données
          patchState(store, {
            user: updatedUserData,
          });

          // Mettre à jour le service d'authentification
          store._authService.updateUserData(updatedUserData);

          store._snackbar.open('Image de profil mise à jour avec succès', 'Close', {
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });

          return updatedUserData;

        } catch (error) {
          console.error('Erreur lors de la mise à jour de l\'image de profil:', error);
          store._snackbar.open(
            'Erreur lors de la mise à jour de l\'image de profil',
            'Close',
            {
              verticalPosition: 'top',
              horizontalPosition: 'right',
            },
          );
          throw error;
        }
      },

      /**
       * Upload et met à jour l'image de profil de l'utilisateur
       * @param file - Fichier image à uploader
       * @param userId - ID de l'utilisateur
       */
      uploadAndUpdateProfileImage: async (file: File, userId: string) => {
        try {
          const currentUser = store._authService.user();
          if (!currentUser) {
            store._snackbar.open('Utilisateur non connecté', 'Close', {
              verticalPosition: 'top',
              horizontalPosition: 'right',
            });
            return;
          }

          // 1. Upload l'image via l'endpoint avatar
          const formData = new FormData();
          formData.append('avatar', file);
          formData.append('uploadedById', userId);
          formData.append('profileUserId', userId);

          const uploadResponse = await firstValueFrom(
            store._httpClient.post<{ data: { storageUrl: string; id: string } }>(`/api/upload/avatar`, formData)
          );

          const newPhotoUrl = uploadResponse.data.storageUrl;

          // 2. Mettre à jour l'utilisateur avec la nouvelle URL
          await firstValueFrom(
            store._httpClient.put<{ id: string; photoUrl: string }>(`/api/users/${userId}`, {
              photoUrl: newPhotoUrl
            })
          );

          // 3. Mettre à jour l'état local
          const updatedUserData = {
            ...currentUser,
            photoUrl: newPhotoUrl
          };

          patchState(store, {
            user: updatedUserData,
          });

          store._authService.updateUserData(updatedUserData);

          store._snackbar.open('Image de profil uploadée et mise à jour avec succès', 'Close', {
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });

          return updatedUserData;

        } catch (error) {
          console.error('Erreur lors de l\'upload de l\'image de profil:', error);
          store._snackbar.open(
            'Erreur lors de l\'upload de l\'image de profil',
            'Close',
            {
              verticalPosition: 'top',
              horizontalPosition: 'right',
            },
          );
          throw error;
        }
      },

      /**
       * Rafraîchit les données de l'utilisateur depuis le serveur
       */
      refreshUserData: async () => {
        try {
          const updatedUser = await store._authService.fetchUser();
          if (updatedUser) {
            patchState(store, {
              user: updatedUser,
            });
          }
        } catch (error) {
          console.error('Erreur lors du rafraîchissement des données utilisateur:', error);
        }
      },
    })),
  );
}
