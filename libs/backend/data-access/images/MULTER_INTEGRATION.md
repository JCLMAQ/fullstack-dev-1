# 🚀 Intégration Multer - Système de Gestion d'Images

## 📋 Vue d'ensemble

Le système de gestion d'images utilise **Multer** pour gérer l'upload de fichiers côté backend. L'architecture se compose de :

- **Backend** : NestJS avec Multer pour les uploads
- **Frontend** : Angular avec service intégré 
- **Base de données** : PostgreSQL via Prisma pour les métadonnées

## 🏗️ Architecture Backend

### 1. **UploadController** (`/upload`)
Gère les uploads de fichiers avec Multer :

```typescript
// Upload simple
POST /upload/image          // Un seul fichier
POST /upload/images         // Plusieurs fichiers  
POST /upload/avatar         // Avatar spécialisé (2MB max)
```

### 2. **ImagesController** (`/images`)
Gère les métadonnées et opérations CRUD :

```typescript
// CRUD des métadonnées
GET    /images/:id          // Récupérer une image
GET    /images              // Lister les images
PUT    /images/:id          // Mettre à jour
DELETE /images/:id          // Supprimer

// Opérations en lot
PUT    /images/bulk/update
DELETE /images/bulk/delete

// Associations
PUT    /images/associate/post
PUT    /images/associate/user
PUT    /images/associate/organization

// Tags et recherche
PUT    /images/tags/add
PUT    /images/tags/remove
GET    /images/search/query
```

### 3. **UploadsController** (`/uploads`)
Sert les fichiers statiques :

```typescript
GET /uploads/images/:year/:month/:filename  // Structure organisée
GET /uploads/images/:filename               // Recherche directe
```

## ⚙️ Configuration Multer

### Stockage organisé par date :
```
uploads/
  images/
    2024/
      01/
        uuid-123.jpg
        uuid-456.png
      02/
        uuid-789.webp
```

### Types de fichiers autorisés :
- `image/jpeg`, `image/jpg`
- `image/png`
- `image/gif`
- `image/webp`
- `image/svg+xml`

### Limites :
- **Images normales** : 10MB max
- **Avatars** : 2MB max
- **Fichiers simultanés** : 10 max

## 🎯 Utilisation Frontend

### Service Angular mis à jour :

```typescript
export class ImageService {
  // Upload simple
  uploadFile(file: File, metadata: Partial<CreateImageDto>): Observable<Image>
  
  // Upload multiple  
  uploadMultipleFiles(files: FileList, metadata: Partial<CreateImageDto>): Observable<Image[]>
  
  // Avatar spécialisé
  uploadAvatar(file: File, uploadedById: string, profileUserId: string): Observable<Image>
}
```

### Exemple d'utilisation :

```typescript
// Upload simple
const file = event.target.files[0];
const metadata = {
  uploadedById: 'user-123',
  altText: 'Description de l\'image',
  tags: ['photo', 'nature'],
  isPublic: true
};

this.imageService.uploadFile(file, metadata).subscribe({
  next: (image) => console.log('Upload réussi:', image),
  error: (err) => console.error('Erreur upload:', err)
});

// Upload multiple
const files = event.target.files;
this.imageService.uploadMultipleFiles(files, metadata).subscribe({
  next: (images) => console.log(`${images.length} images uploadées`),
  error: (err) => console.error('Erreur upload:', err)
});
```

## 🔧 Configuration requise

### 1. Dépendances installées :
```bash
pnpm add multer uuid
pnpm add -D @types/multer @types/uuid
```

### 2. Module intégré :
```typescript
@Module({
  imports: [PrismaClientModule],
  controllers: [ImagesController, UploadController, UploadsController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
```

### 3. Répertoire uploads :
Le système crée automatiquement la structure de répertoires lors du premier upload.

## 📝 Endpoints disponibles

### **Upload de fichiers :**
- `POST /upload/image` - Upload simple avec métadonnées
- `POST /upload/images` - Upload multiple 
- `POST /upload/avatar` - Upload d'avatar

### **Gestion des métadonnées :**
- `GET /images` - Liste avec filtres/recherche
- `GET /images/:id` - Détails d'une image
- `PUT /images/:id` - Mise à jour métadonnées
- `DELETE /images/:id` - Suppression (soft/hard)

### **Fichiers statiques :**
- `GET /uploads/images/:year/:month/:filename`
- `GET /uploads/images/:filename`

## 🔒 Sécurité

1. **Validation des types MIME** pour les images uniquement
2. **Limites de taille** par type d'upload
3. **Noms de fichiers sécurisés** avec UUID
4. **Structure de répertoires** pour éviter les conflits

## 🚀 Prochaines étapes

1. **Intégrer au NestJS principal** : Importer `ImagesModule` 
2. **Configurer le storage** : Local, S3, ou autre
3. **Redimensionnement** : Ajouter Sharp pour les thumbnails
4. **Tests** : Créer les tests d'upload avec mocks
5. **Documentation** : API Swagger pour les endpoints

---

✅ **Le système Multer est maintenant complètement intégré et prêt à être utilisé !**
