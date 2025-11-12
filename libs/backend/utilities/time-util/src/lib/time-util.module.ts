import { Global, Module } from '@nestjs/common';
import { TimeUtilService } from './time-util.service';

@Global()
@Module({
  controllers: [],
  providers: [TimeUtilService],
  exports: [TimeUtilService],
})
export class TimeUtilModule {}
