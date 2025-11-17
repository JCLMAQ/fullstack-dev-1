# Guide d'utilisation - Mise à jour d'image de profil réactive

Le store de l'application a été adapté pour permettre la mise à jour réactive de l'image de profil de l'utilisateur.

## Nouvelles méthodes disponibles dans l'AppStore

### 1. `updateUserProfileImage(userId: string, photoUrl: string)`

Met à jour l'image de profil avec une URL existante.

### 2. `uploadAndUpdateProfileImage(file: File, userId: string)`

Upload une nouvelle image et met à jour le profil utilisateur en une seule opération.

### 3. `refreshUserData()`

Rafraîchit les données utilisateur depuis le serveur.

## Exemple d'utilisation dans un composant

```typescript
import { Component, inject, signal } from '@angular/core';
import { AppStore } from '@fe/stores';

@Component({
  selector: 'app-profile-image-updater',
  standalone: true,
  template: `
    <div class="profile-image-section">
      <!-- Affichage de l'image actuelle (réactive) -->
      <img 
        [src]="appStore.user()?.photoUrl ?? 'assets/default-avatar.png'" 
        [alt]="appStore.user()?.fullName ?? 'Photo de profil'"
        class="profile-image"
      />
      
      <!-- Upload d'une nouvelle image -->
      <input 
        #fileInput
        type="file" 
        accept="image/*"
        (change)="onFileSelected($event)"
        style="display: none"
      />
      
      <button 
        (click)="fileInput.click()"
        [disabled]="isUploading()"
      >
        @if (isUploading()) {
          Chargement...
        } @else {
          Changer la photo
        }
      </button>
      
      <!-- Bouton pour rafraîchir -->
      <button (click)="refreshUser()">
        Actualiser
      </button>
    </div>
  `,
  styles: [`
    .profile-image {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #ccc;
    }
    
    .profile-image-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    
    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      background-color: #007bff;
      color: white;
      cursor: pointer;
    }
    
    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  `]
})
export class ProfileImageUpdaterComponent {
  appStore = inject(AppStore);
  isUploading = signal(false);

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    const currentUser = this.appStore.user();
    if (!currentUser) {
      console.error('Utilisateur non connecté');
      return;
    }

    try {
      this.isUploading.set(true);
      
      // Utiliser la méthode du store qui gère tout automatiquement
      await this.appStore.uploadAndUpdateProfileImage(file, currentUser.email);
      
      // L'interface sera automatiquement mise à jour grâce à la réactivité des signaux
      console.log('Image mise à jour avec succès!');
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    } finally {
      this.isUploading.set(false);
      // Réinitialiser l'input
      input.value = '';
    }
  }

  async refreshUser() {
    try {
      await this.appStore.refreshUserData();
      console.log('Données utilisateur actualisées');
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
    }
  }

  // Méthode alternative pour mettre à jour avec une URL
  async updateWithUrl(newImageUrl: string) {
    const currentUser = this.appStore.user();
    if (!currentUser) return;

    try {
      await this.appStore.updateUserProfileImage(currentUser.email, newImageUrl);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  }
}
```

## Points importants

### Réactivité automatique

- L'image de profil est affichée via `appStore.user()?.photoUrl`
- Dès que l'image est mise à jour dans le store, l'interface se met à jour automatiquement
- Aucune gestion manuelle des subscriptions n'est nécessaire

### Gestion des erreurs

- Les méthodes du store affichent automatiquement des messages d'erreur via MatSnackBar
- Les erreurs sont également propagées pour permettre une gestion personnalisée

### Synchronisation

- Le store met à jour à la fois l'état local et les données côté serveur
- Le service d'authentification est automatiquement synchronisé
- Le localStorage est mis à jour automatiquement

## Utilisation dans d'autres composants

L'image mise à jour sera automatiquement visible dans tous les composants qui utilisent `appStore.user()?.photoUrl`, comme :

- Le header de l'application
- La barre latérale
- Les profils utilisateur
- Etc.

## API Endpoints utilisés

- `POST /api/upload/avatar` - Upload de l'image
- `PUT /api/users/:id` - Mise à jour des données utilisateur
- `GET /api/auths/auth/loggedUser/:email` - Récupération des données utilisateur

## Types TypeScript

Les méthodes sont typées et retournent des promesses avec les données utilisateur mises à jour, permettant une utilisation sûre et une autocomplétion dans l'IDE.
