# Système de Gestion d'Images

Ce module fournit un système complet de gestion d'images pour les applications Angular avec :
- Galerie d'images avec sélection multiple
- Visualiseur d'images avec zoom et navigation  
- Gestionnaire d'upload avec drag & drop
- Service HTTP complet pour les opérations CRUD

## Composants Disponibles

### 1. ImageManagementComponent (Composant Principal)
Composant principal qui combine tous les autres composants dans une interface complète avec onglets.

```typescript
import { ImageManagementComponent } from '@fe/shared/components/image-mgt';

// Dans votre template
<lib-image-management
  [showAssociations]="true"
  [associationType]="'user'"
  [uploadedById]="currentUserId"
  [showAdminTab]="isAdmin">
</lib-image-management>
```

### 2. Autres Composants
- `ImageGalleryComponent`: Galerie avec grille responsive
- `ImageViewerComponent`: Visualiseur modal avec zoom
- `ImageUploadManagerComponent`: Upload avancé avec métadonnées
- `ImageUploaderComponent`: Upload simple
- `ImageService`: Service HTTP pour toutes les opérations

## Utilisation

Consultez les exemples dans le code source pour l'utilisation détaillée de chaque composant.

## Tests

Run `nx test image-mgt` to execute the unit tests.


🎯 Système Complet de Gestion d'Images
5 Composants Créés :
ImageManagementComponent - Composant principal avec interface complète (onglets, recherche, filtres)
ImageGalleryComponent - Galerie avec grille responsive et sélection multiple
ImageViewerComponent - Visualiseur modal avec zoom et navigation
ImageUploadManagerComponent - Upload avancé avec drag & drop et métadonnées
ImageUploaderComponent - Upload simple (existant, conservé)
Service Complet :
ImageService - 20+ méthodes HTTP pour toutes les opérations CRUD avec le backend
Fonctionnalités Implémentées :
✅ Interface utilisateur complète avec Material Design
✅ Recherche et filtrage par type, visibilité, utilisateur
✅ Upload drag & drop avec barres de progression
✅ Galerie responsive avec sélection multiple
✅ Visualiseur full-screen avec zoom et navigation clavier
✅ Gestion des métadonnées (tags, descriptions, associations)
✅ Actions en lot (suppression multiple)
✅ Pagination côté client
✅ Internationalisation (ngx-translate)
✅ Responsive design (mobile-friendly)

Utilisation Simple :
// Composant complet tout-en-un
<lib-image-management
  [showAdminTab]="isAdmin"
  [showAssociations]="true">
</lib-image-management>

// Ou composants individuels
<lib-image-gallery [images]="images"></lib-image-gallery>
<lib-image-upload-manager [multiple]="true"></lib-image-upload-manager>