import { Module, Global } from '@nestjs/common';
import { ChangestrackingController } from './changestracking.controller';
import { ChangestrackingService } from './changestracking.service';

@Global()
@Module({
  controllers: [ChangestrackingController],
  providers: [ChangestrackingService],
  exports: [ChangestrackingService],
})
export class ChangestrackingModule {}
