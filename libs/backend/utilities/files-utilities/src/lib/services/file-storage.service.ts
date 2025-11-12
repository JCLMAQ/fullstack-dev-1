import { Inject, Injectable, Logger } from '@nestjs/common';
import {
    FileRetrievalResult,
    IStorageProvider,
    StorageFile,
    StorageResult
} from '../interfaces/storage.interfaces';
import { DatabaseStorageProvider } from '../providers/database-storage.provider';
import { FilesystemStorageProvider } from '../providers/filesystem-storage.provider';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly storageProvider: IStorageProvider;

  constructor(
    private readonly databaseProvider: DatabaseStorageProvider,
    private readonly filesystemProvider: FilesystemStorageProvider,
    @Inject('STORAGE_CONFIG') private config?: { useDatabase?: boolean; basePath?: string }
  ) {
    // Détermine le provider à utiliser selon FILES_STORAGE_DB
    const useDatabase = this.shouldUseDatabase();
    this.storageProvider = useDatabase ? this.databaseProvider : this.filesystemProvider;

    this.logger.log(`Initialized with ${useDatabase ? 'database' : 'filesystem'} storage`);
  }

  /**
   * Détermine si on doit utiliser le stockage en base de données
   */
  private shouldUseDatabase(): boolean {
    // Priorité : config injectée > variable d'environnement > défaut (filesystem)
    if (this.config?.useDatabase !== undefined) {
      return this.config.useDatabase;
    }

    const envValue = process.env['FILES_STORAGE_DB'];
    return envValue === '1' || envValue?.toLowerCase() === 'true';
  }

  /**
   * Stocke un fichier selon la stratégie configurée
   */
  async store(file: StorageFile, fileId: string): Promise<StorageResult> {
    try {
      this.logger.debug(`Storing file ${fileId} (${file.size} bytes) using ${this.getProviderType()}`);
      const result = await this.storageProvider.store(file, fileId);

      if (result.success) {
        this.logger.log(`Successfully stored file ${fileId}`);
      } else {
        this.logger.error(`Failed to store file ${fileId}: ${result.error}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error storing file ${fileId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown storage error'
      };
    }
  }

  /**
   * Récupère un fichier selon la stratégie configurée
   */
  async retrieve(fileId: string): Promise<FileRetrievalResult> {
    try {
      this.logger.debug(`Retrieving file ${fileId} using ${this.getProviderType()}`);
      const result = await this.storageProvider.retrieve(fileId);

      if (result.success) {
        this.logger.debug(`Successfully retrieved file ${fileId}`);
      } else {
        this.logger.warn(`File ${fileId} not found`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error retrieving file ${fileId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown retrieval error'
      };
    }
  }

  /**
   * Supprime un fichier selon la stratégie configurée
   */
  async delete(fileId: string): Promise<StorageResult> {
    try {
      this.logger.debug(`Deleting file ${fileId} using ${this.getProviderType()}`);
      const result = await this.storageProvider.delete(fileId);

      if (result.success) {
        this.logger.log(`Successfully deleted file ${fileId}`);
      } else {
        this.logger.error(`Failed to delete file ${fileId}: ${result.error}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error deleting file ${fileId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deletion error'
      };
    }
  }

  /**
   * Vérifie si un fichier existe selon la stratégie configurée
   */
  async exists(fileId: string): Promise<boolean> {
    try {
      return await this.storageProvider.exists(fileId);
    } catch (error) {
      this.logger.error(`Error checking existence of file ${fileId}:`, error);
      return false;
    }
  }

  /**
   * Récupère les métadonnées d'un fichier
   */
  async getMetadata(fileId: string): Promise<Record<string, unknown> | null> {
    try {
      return await this.storageProvider.getMetadata(fileId);
    } catch (error) {
      this.logger.error(`Error getting metadata for file ${fileId}:`, error);
      return null;
    }
  }

  /**
   * Récupère les statistiques de stockage
   */
  async getStats(): Promise<Record<string, unknown>> {
    try {
      const baseStats = await this.storageProvider.getStats();
      return {
        ...baseStats,
        storageType: this.getProviderType(),
        useDatabase: this.shouldUseDatabase()
      };
    } catch (error) {
      this.logger.error('Error getting storage stats:', error);
      return {
        storageType: this.getProviderType(),
        useDatabase: this.shouldUseDatabase(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Nettoie les fichiers orphelins (si supporté par le provider)
   */
  async cleanup(): Promise<StorageResult> {
    try {
      this.logger.log(`Starting cleanup with ${this.getProviderType()} storage`);

      if ('cleanup' in this.storageProvider && typeof this.storageProvider.cleanup === 'function') {
        const result = await this.storageProvider.cleanup();

        if (result.success) {
          this.logger.log('Cleanup completed successfully');
        } else {
          this.logger.error(`Cleanup failed: ${result.error}`);
        }

        return result;
      } else {
        this.logger.warn(`Cleanup not supported by ${this.getProviderType()} provider`);
        return {
          success: true,
          message: `Cleanup not supported by ${this.getProviderType()} provider`
        };
      }
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown cleanup error'
      };
    }
  }

  /**
   * Sauvegarde les fichiers (si supporté par le provider)
   */
  async backup(destinationPath?: string): Promise<StorageResult> {
    try {
      this.logger.log(`Starting backup with ${this.getProviderType()} storage`);

      if ('backup' in this.storageProvider && typeof this.storageProvider.backup === 'function') {
        const result = await this.storageProvider.backup(destinationPath);

        if (result.success) {
          this.logger.log('Backup completed successfully');
        } else {
          this.logger.error(`Backup failed: ${result.error}`);
        }

        return result;
      } else {
        this.logger.warn(`Backup not supported by ${this.getProviderType()} provider`);
        return {
          success: true,
          message: `Backup not supported by ${this.getProviderType()} provider`
        };
      }
    } catch (error) {
      this.logger.error('Error during backup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown backup error'
      };
    }
  }

  /**
   * Retourne le type de provider actuellement utilisé
   */
  getProviderType(): 'database' | 'filesystem' {
    return this.shouldUseDatabase() ? 'database' : 'filesystem';
  }

  /**
   * Retourne le provider actuellement utilisé (pour tests ou usage avancé)
   */
  getCurrentProvider(): IStorageProvider {
    return this.storageProvider;
  }

  /**
   * Bascule dynamiquement vers un autre provider (pour tests ou migration)
   * ⚠️ Attention : cette méthode change la configuration en cours d'exécution
   */
  switchProvider(useDatabase: boolean): void {
    const newProvider = useDatabase ? this.databaseProvider : this.filesystemProvider;

    if (newProvider !== this.storageProvider) {
      this.logger.warn(`Switching storage provider from ${this.getProviderType()} to ${useDatabase ? 'database' : 'filesystem'}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.storageProvider as any) = newProvider;

      // Mise à jour de la config si elle existe
      if (this.config) {
        this.config.useDatabase = useDatabase;
      }
    }
  }
}
