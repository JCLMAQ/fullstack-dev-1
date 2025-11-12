import { Injectable, Logger } from '@nestjs/common';
import { EnhancedFilesService, FileUploadDto } from '../services/enhanced-files-simple.service';
import { FileStorageService } from '../services/file-storage.service';

/**
 * Service de démonstration du système de stockage dual
 *
 * Ce service montre comment utiliser le système de stockage dual dans différents contextes.
 * Il peut être intégré dans n'importe quelle application NestJS.
 */
@Injectable()
export class FileStorageDemoService {
  private readonly logger = new Logger(FileStorageDemoService.name);

  constructor(
    private readonly enhancedFilesService: EnhancedFilesService,
    private readonly fileStorageService: FileStorageService
  ) {}

  /**
   * Démonstration d'upload simple
   */
  async demoSimpleUpload(): Promise<void> {
    this.logger.log('=== Démonstration Upload Simple ===');

    // Simulation d'un fichier à uploader
    const mockFile = {
      buffer: Buffer.from('Contenu de démonstration du fichier', 'utf-8'),
      originalName: 'demo.txt',
      mimeType: 'text/plain',
      size: 32,
      encoding: 'utf-8'
    };

    const uploadDto: FileUploadDto = {
      ...mockFile,
      ownerId: 'demo-user-123',
      category: 'demo',
      tags: ['test', 'demo'],
      isPublic: false
    };

    try {
      const result = await this.enhancedFilesService.uploadFile(uploadDto);
      this.logger.log(`✅ Fichier uploadé avec succès: ${result.id}`);
      this.logger.log(`   - Nom: ${result.filename}`);
      this.logger.log(`   - Taille: ${result.fileSize} bytes`);
      this.logger.log(`   - Stockage: ${this.fileStorageService.getProviderType()}`);
    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'upload:', error);
    }
  }

  /**
   * Démonstration du téléchargement
   */
  async demoDownload(fileId: string): Promise<void> {
    this.logger.log('=== Démonstration Téléchargement ===');

    try {
      const fileData = await this.enhancedFilesService.downloadFile(fileId);
      this.logger.log(`✅ Fichier téléchargé avec succès: ${fileData.filename}`);
      this.logger.log(`   - Taille: ${fileData.size} bytes`);
      this.logger.log(`   - Type: ${fileData.mimeType}`);
      this.logger.log(`   - Contenu: ${fileData.buffer.toString('utf-8').substring(0, 50)}...`);
    } catch (error) {
      this.logger.error('❌ Erreur lors du téléchargement:', error);
    }
  }

  /**
   * Démonstration des statistiques
   */
  async demoStats(): Promise<void> {
    this.logger.log('=== Démonstration Statistiques ===');

    try {
      const stats = await this.enhancedFilesService.getStorageStats();
      this.logger.log('✅ Statistiques récupérées:');
      this.logger.log(`   - Type de stockage: ${stats.combined.storageType}`);
      this.logger.log(`   - Nombre total de fichiers: ${stats.combined.totalFiles}`);
      this.logger.log(`   - Taille totale: ${(stats.combined.totalSize / 1024).toFixed(2)} KB`);
    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération des stats:', error);
    }
  }

  /**
   * Démonstration de la migration
   */
  async demoMigration(fileId: string, targetStorage: 'database' | 'filesystem'): Promise<void> {
    this.logger.log('=== Démonstration Migration ===');

    const currentStorage = this.fileStorageService.getProviderType();
    this.logger.log(`Stockage actuel: ${currentStorage}`);
    this.logger.log(`Stockage cible: ${targetStorage}`);

    if (currentStorage === targetStorage) {
      this.logger.log('⚠️  Le fichier est déjà dans le système de stockage cible');
      return;
    }

    try {
      await this.enhancedFilesService.migrateFileStorage(fileId, targetStorage);
      this.logger.log(`✅ Migration réussie vers ${targetStorage}`);
    } catch (error) {
      this.logger.error('❌ Erreur lors de la migration:', error);
    }
  }

  /**
   * Démonstration complète du workflow
   */
  async demoCompleteWorkflow(): Promise<void> {
    this.logger.log('=== Démonstration Workflow Complet ===');

    // 1. Affichage de la configuration actuelle
    this.logger.log(`Configuration: ${this.fileStorageService.getProviderType()} storage`);
    this.logger.log(`Environment FILES_STORAGE_DB: ${process.env['FILES_STORAGE_DB']}`);

    // 2. Upload d'un fichier de test
    const mockFile = {
      buffer: Buffer.from('Fichier de test pour démonstration complète', 'utf-8'),
      originalName: 'test-workflow.txt',
      mimeType: 'text/plain',
      size: 42,
      encoding: 'utf-8'
    };

    const uploadDto: FileUploadDto = {
      ...mockFile,
      ownerId: 'workflow-demo-user',
      category: 'workflow-test',
      tags: ['demo', 'workflow', 'complet'],
      isPublic: true
    };

    let fileId: string;

    try {
      // Upload
      const uploadResult = await this.enhancedFilesService.uploadFile(uploadDto);
      fileId = uploadResult.id;
      this.logger.log(`✅ 1. Upload réussi: ${fileId}`);

      // Vérification d'existence
      const exists = await this.enhancedFilesService.fileExists(fileId);
      this.logger.log(`✅ 2. Vérification existence: ${exists}`);

      // Téléchargement
      const downloadResult = await this.enhancedFilesService.downloadFile(fileId);
      this.logger.log(`✅ 3. Téléchargement réussi: ${downloadResult.filename}`);

      // Statistiques
      const stats = await this.enhancedFilesService.getStorageStats();
      this.logger.log(`✅ 4. Stats récupérées: ${stats.combined.totalFiles} fichiers`);

      // Test de migration si possible
      const currentStorage = this.fileStorageService.getProviderType();
      const targetStorage = currentStorage === 'database' ? 'filesystem' : 'database';

      this.logger.log(`5. Test de migration de ${currentStorage} vers ${targetStorage}...`);
      await this.enhancedFilesService.migrateFileStorage(fileId, targetStorage);
      this.logger.log(`✅ 5. Migration réussie vers ${targetStorage}`);

      // Vérification après migration
      const stillExists = await this.enhancedFilesService.fileExists(fileId);
      this.logger.log(`✅ 6. Vérification post-migration: ${stillExists}`);

      // Nettoyage final
      await this.enhancedFilesService.deleteFile(fileId);
      this.logger.log(`✅ 7. Nettoyage final: fichier supprimé`);

      this.logger.log('🎉 Workflow complet terminé avec succès !');

    } catch (error) {
      this.logger.error('❌ Erreur dans le workflow:', error);
    }
  }

  /**
   * Test de performance avec plusieurs fichiers
   */
  async demoPerformanceTest(fileCount = 10): Promise<void> {
    this.logger.log(`=== Test de Performance (${fileCount} fichiers) ===`);

    const startTime = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploadPromises: Promise<any>[] = [];

    // Upload en parallèle
    for (let i = 0; i < fileCount; i++) {
      const mockFile = {
        buffer: Buffer.from(`Contenu du fichier de test ${i}`, 'utf-8'),
        originalName: `perf-test-${i}.txt`,
        mimeType: 'text/plain',
        size: 25 + i.toString().length,
        encoding: 'utf-8'
      };

      const uploadDto: FileUploadDto = {
        ...mockFile,
        ownerId: 'perf-test-user',
        category: 'performance-test',
        tags: ['perf', 'test', `batch-${Math.floor(i / 5)}`],
        isPublic: false
      };

      uploadPromises.push(this.enhancedFilesService.uploadFile(uploadDto));
    }

    try {
      const results = await Promise.all(uploadPromises);
      const uploadTime = Date.now() - startTime;

      this.logger.log(`✅ ${fileCount} fichiers uploadés en ${uploadTime}ms`);
      this.logger.log(`   - Moyenne: ${(uploadTime / fileCount).toFixed(2)}ms par fichier`);
      this.logger.log(`   - Stockage: ${this.fileStorageService.getProviderType()}`);

      // Test de téléchargement en parallèle
      const downloadStartTime = Date.now();
      const downloadPromises = results.map(result =>
        this.enhancedFilesService.downloadFile(result.id)
      );

      await Promise.all(downloadPromises);
      const downloadTime = Date.now() - downloadStartTime;

      this.logger.log(`✅ ${fileCount} fichiers téléchargés en ${downloadTime}ms`);
      this.logger.log(`   - Moyenne: ${(downloadTime / fileCount).toFixed(2)}ms par fichier`);

      // Nettoyage
      const deletePromises = results.map(result =>
        this.enhancedFilesService.deleteFile(result.id)
      );
      await Promise.all(deletePromises);

      this.logger.log(`✅ Nettoyage terminé`);
      this.logger.log(`🎯 Test de performance terminé avec succès !`);

    } catch (error) {
      this.logger.error('❌ Erreur dans le test de performance:', error);
    }
  }

  /**
   * Démonstration de gestion d'erreurs
   */
  async demoErrorHandling(): Promise<void> {
    this.logger.log('=== Démonstration Gestion d\'Erreurs ===');

    // Test 1: Fichier inexistant
    try {
      await this.enhancedFilesService.downloadFile('fichier-inexistant-123');
    } catch {
      this.logger.log('✅ 1. Erreur fichier inexistant correctement gérée');
    }

    // Test 2: Upload avec données invalides
    try {
      const invalidUpload: FileUploadDto = {
        buffer: Buffer.alloc(0), // Buffer vide
        originalName: '',
        mimeType: '',
        size: 0,
        ownerId: '' // Owner ID vide
      };
      await this.enhancedFilesService.uploadFile(invalidUpload);
    } catch {
      this.logger.log('✅ 2. Erreur données invalides correctement gérée');
    }

    // Test 3: Migration fichier inexistant
    try {
      await this.enhancedFilesService.migrateFileStorage('inexistant-456', 'database');
    } catch {
      this.logger.log('✅ 3. Erreur migration fichier inexistant correctement gérée');
    }

    this.logger.log('🛡️  Tests de gestion d\'erreurs terminés');
  }
}
