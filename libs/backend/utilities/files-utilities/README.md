# Système de Stockage Dual pour Fichiers

Ce module implémente un système de stockage dual pour les fichiers, permettant de stocker les données soit dans la base de données (PostgreSQL BLOB) soit dans le système de fichiers local, selon la configuration de la variable d'environnement `FILES_STORAGE_DB`.

## 🏗️ Architecture

### Composants Principaux

1. **Interfaces de Stockage** (`interfaces/storage.interfaces.ts`)
   - `IStorageProvider`: Interface commune pour tous les providers
   - `StorageFile`: Structure des données de fichier  
   - `StorageResult`: Résultat des opérations de stockage
   - `FileRetrievalResult`: Résultat de récupération de fichier

2. **Providers de Stockage**
   - `DatabaseStorageProvider`: Stockage en base de données (BLOB)
   - `FilesystemStorageProvider`: Stockage dans le système de fichiers

3. **Service Principal** (`services/file-storage.service.ts`)
   - Orchestrateur qui choisit automatiquement le provider selon `FILES_STORAGE_DB`
   - API unifiée pour toutes les opérations de fichiers

## ⚙️ Configuration

### Variables d'Environnement

```bash
FILES_STORAGE_DB=1          # 1=database, 0=filesystem (défaut)
FILES_STORAGE_DEST=./files  # Répertoire pour filesystem
```

### Schéma Prisma

Le modèle `File` a été étendu avec le champ `binaryData`:
```prisma
binaryData        Bytes?  // File content stored as binary data
```

## 🚀 Utilisation

### Configuration du Module

```typescript
import { FileStorageModule, EnhancedFilesService } from '@backend/utilities/files-utilities';

@Module({
  imports: [FileStorageModule],
  providers: [EnhancedFilesService],
})
export class AppModule {}
```

### API Endpoints

```bash
POST   /dual-storage/upload                    # Upload fichier
GET    /dual-storage/download/:fileId          # Télécharger fichier  
DELETE /dual-storage/:fileId                   # Supprimer fichier
GET    /dual-storage/stats                     # Statistiques stockage
POST   /dual-storage/migrate/:fileId/:target   # Migration stockage
```

## 🔄 Basculement Dynamique

1. Modifiez `FILES_STORAGE_DB` dans `.env`
2. Redémarrez l'application
3. Utilisez l'API de migration pour les fichiers existants

## 📊 Comparaison des Modes

| Critère | Base de Données | Système Fichiers |
|---------|----------------|------------------|
| Performance | 🟡 Moyenne | 🟢 Excellente |
| Intégrité | 🟢 ACID | 🟡 Manuelle |
| Sauvegarde | 🟢 Automatique | 🟡 Séparée |
| Taille max | 🟡 1GB | 🟢 Illimitée |

## 🛠️ Développement  

### Build & Tests

```bash
nx build files-utilities
nx test files-utilities
```

### Génération Prisma

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

---

**Architecture Evolutive**: Facilement extensible avec nouveaux providers (S3, Azure, etc.).
