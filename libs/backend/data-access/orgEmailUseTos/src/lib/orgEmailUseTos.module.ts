import { PrismaClientModule } from '@db/prisma-client';
import { Module } from '@nestjs/common';
import { OrgEmailUseTosController } from './orgEmailUseTos.controller';
import { OrgEmailUseTosService } from './orgEmailUseTos.service';

@Module({
  imports: [PrismaClientModule],
  controllers: [OrgEmailUseTosController],
  providers: [OrgEmailUseTosService],
  exports: [OrgEmailUseTosService],
})
export class OrgEmailUseTosModule {}
