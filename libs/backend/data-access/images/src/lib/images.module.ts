import { PrismaClientModule } from '@db/prisma-client';
import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { UploadController } from './upload.controller';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [PrismaClientModule],
  controllers: [ImagesController, UploadController, UploadsController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
