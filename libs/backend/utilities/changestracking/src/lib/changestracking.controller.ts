import { Controller } from '@nestjs/common';
import { ChangestrackingService } from './changestracking.service';

@Controller('changestracking')
export class ChangestrackingController {
  constructor(private changestrackingService: ChangestrackingService) {}
}
