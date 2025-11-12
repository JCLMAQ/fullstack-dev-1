import { Controller } from '@nestjs/common';

@Controller('files-utilities')
export class FilesUtilitiesController {
  // Contrôleur simple sans injection pour éviter l'erreur de service inutilisé
}
