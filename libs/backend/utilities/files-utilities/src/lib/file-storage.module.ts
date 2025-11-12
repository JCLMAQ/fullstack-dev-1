import { PrismaClientModule } from '@db/prisma-client';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseStorageProvider } from './providers/database-storage.provider';
import { FilesystemStorageProvider } from './providers/filesystem-storage.provider';
import { FileStorageService } from './services/file-storage.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaClientModule
  ],
  providers: [
    DatabaseStorageProvider,
    {
      provide: FilesystemStorageProvider,
      useFactory: (configService: ConfigService) => {
        const basePath = configService.get<string>('FILES_STORAGE_DEST') || './files';
        return new FilesystemStorageProvider(basePath);
      },
      inject: [ConfigService]
    },
    FileStorageService,
    {
      provide: 'STORAGE_CONFIG',
      useFactory: (configService: ConfigService) => {
        const useDatabase = configService.get<string>('FILES_STORAGE_DB') === '1' ||
                          configService.get<string>('FILES_STORAGE_DB')?.toLowerCase() === 'true';

        const basePath = configService.get<string>('FILES_STORAGE_DEST') || './files';

        return {
          useDatabase,
          basePath
        };
      },
      inject: [ConfigService]
    }
  ],
  exports: [
    DatabaseStorageProvider,
    FilesystemStorageProvider,
    FileStorageService,
    'STORAGE_CONFIG'
  ]
})
export class FileStorageModule {}
