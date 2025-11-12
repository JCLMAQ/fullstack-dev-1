import { PrismaClientModule } from '@db/prisma-client';
import { Module } from '@nestjs/common';
import { PhonesController } from './phones.controller';
import { PhonesService } from './phones.service';

@Module({
  imports: [PrismaClientModule],
  controllers: [PhonesController],
  providers: [PhonesService],
  exports: [PhonesService],
})
export class PhonesModule {}
