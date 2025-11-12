# backend-data-access-images

Cette bibliothèque fournit une gestion complète des images pour l'application.

## Fonctionnalités

- Gestion du téléchargement et du stockage d'images
- Support de multiples backends de stockage (local, S3, Cloudinary)
- Traitement d'images et génération de variants
- Extraction et gestion des métadonnées d'images
- Association avec utilisateurs, posts, organisations et histoires
- Système de tags et de catégorisation
- Opérations en lot et analytics

## Installation et Utilisation

### 1. Importer le module dans votre application

```typescript
import { Module } from '@nestjs/common';
import { ImagesModule } from '@be/images';

@Module({
  imports: [
    ImagesModule, // Ajouter le module images
  ],
})
export class AppModule {}
```

### 2. Utiliser le service dans vos composants

```typescript
import { Injectable } from '@nestjs/common';
import { ImagesService } from '@be/images';

@Injectable()
export class MonService {
  constructor(private readonly imagesService: ImagesService) {}

  async creerImage(imageData: ImageCreateData) {
    return await this.imagesService.createImage(imageData);
  }
}
```

## API Endpoints

Le contrôleur expose automatiquement les endpoints suivants :

### CRUD Operations
- `POST /images` - Créer une image
- `GET /images/:id` - Récupérer une image par ID
- `GET /images` - Lister les images avec filtres et pagination
- `PUT /images/:id` - Mettre à jour une image
- `DELETE /images/:id` - Supprimer une image (soft/hard delete)

### Opérations en Lot
- `PUT /images/bulk/update` - Mise à jour en lot
- `DELETE /images/bulk/delete` - Suppression en lot

### Gestion des Associations
- `PUT /images/associate/post` - Associer à un post
- `PUT /images/associate/user` - Associer à un utilisateur
- `PUT /images/associate/organization` - Associer à une organisation
- `PUT /images/associate/story` - Associer à une histoire

### Analytics et Recherche
- `GET /images/analytics/statistics` - Statistiques générales
- `GET /images/search/query` - Recherche textuelle
- `GET /images/tags/:tags` - Rechercher par tags

## Exemples d'utilisation

### Créer une image
```bash
POST /api/images
{
  "filename": "photo.jpg",
  "originalName": "ma-photo.jpg", 
  "mimeType": "image/jpeg",
  "fileSize": 1024000,
  "uploadedById": "user-uuid"
}
```

### Rechercher des images
```bash
GET /api/images?uploadedById=user-uuid&take=10&skip=0
```

### Associer à un post
```bash
PUT /api/images/associate/post
{
  "imageIds": ["img1", "img2"],
  "targetId": "post-uuid"
}
```

## Tests

Run `nx test backend-data-access-images` to execute the unit tests via [Jest](https://jestjs.io).



Schéma PostgreSQL Optimisé pour les Images
1. Modèle Image Complet
Métadonnées complètes : filename, originalName, mimeType, fileSize, dimensions
Stockage flexible : type de stockage, chemin, URL publique, bucketName
Relations multiples : User, Organization, Post, Story
Système de tags : recherche et catégorisation
Variants JSON : pour différentes tailles/formats
Indexation optimisée pour PostgreSQL
1. Service Backend Complet
CRUD complet : création, lecture, mise à jour, suppression
Opérations en lot : pour l'efficacité
Recherche avancée : par tags, type MIME, utilisateur
Analytics : statistiques de stockage et d'utilisation
Gestion des associations : avec les différentes entités
Pagination : pour les grandes collections
1. Fonctionnalités Clés
Structure PostgreSQL Optimisée
Types UUID pour les IDs
Indexes composites pour les requêtes courantes
Relations bidirectionnelles avec cascade
Soft delete avec deletedAt
Arrays PostgreSQL pour les tags
JSON pour les variants

Utilisation : 

# Créer une image
POST /api/images
{
  "filename": "photo.jpg",
  "originalName": "ma-photo.jpg", 
  "mimeType": "image/jpeg",
  "fileSize": 1024000,
  "uploadedById": "user-uuid"
}

# Rechercher des images
GET /api/images?uploadedById=user-uuid&take=10&skip=0

# Associer à un post  
PUT /api/images/associate/post
{
  "imageIds": ["img1", "img2"],
  "targetId": "post-uuid"
}

# Statistiques
GET /api/images/analytics/statistics


Parfait ! J'ai créé un contrôleur complet pour la gestion des images. Voici ce qui a été implémenté :

✅ Contrôleur ImagesController Complet
🎯 Fonctionnalités Principales
1. CRUD Operations
POST /images - Créer une image
GET /images/:id - Récupérer une image par ID
GET /images - Lister les images avec filtres et pagination
PUT /images/:id - Mettre à jour une image
DELETE /images/:id - Supprimer une image (soft/hard delete)
2. Opérations en Lot
PUT /images/bulk/update - Mise à jour en lot
DELETE /images/bulk/delete - Suppression en lot
3. Gestion des Associations
PUT /images/associate/post - Associer à un post
PUT /images/associate/user - Associer à un utilisateur
PUT /images/associate/organization - Associer à une organisation
PUT /images/associate/story - Associer à une histoire
4. Gestion des Tags
PUT /images/tags/add - Ajouter des tags
PUT /images/tags/remove - Supprimer des tags
GET /images/tags/:tags - Rechercher par tags
5. Métadonnées
PUT /images/:id/metadata - Mettre à jour les métadonnées
6. Analytics et Statistiques
GET /images/analytics/statistics - Statistiques générales
GET /images/:id/usage - Statistiques d'utilisation d'une image
7. Recherche Avancée
GET /images/search/query - Recherche textuelle
8. Utilitaires
GET /images/utility/unused - Images non utilisées
GET /images/utility/duplicates - Images dupliquées
9. Récupération
GET /images/deleted/list - Images supprimées
PUT /images/deleted/recover - Récupérer des images
DELETE /images/deleted/cleanup - Nettoyer les anciennes images
🛡️ Sécurité & Validation
DTOs typés pour toutes les entrées
Validation automatique avec ValidationPipe
Gestion d'erreurs complète avec messages en français
Types stricts TypeScript pour toutes les réponses
📡 Format de Réponse Standard

# Integration avec Multer

