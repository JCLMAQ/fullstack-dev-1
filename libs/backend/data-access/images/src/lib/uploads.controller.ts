import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';

@Controller('uploads')
export class UploadsController {
  @Get('images/:year/:month/:filename')
  async serveUploadedFile(
    @Param('year') year: string,
    @Param('month') month: string,
    @Param('filename') filename: string,
    @Res() res: { sendFile: (path: string) => void }
  ): Promise<void> {
    const filePath = join(process.cwd(), 'uploads', 'images', year, month, filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Fichier non trouvé');
    }

    res.sendFile(filePath);
  }

  @Get('images/:filename')
  async serveDirectFile(
    @Param('filename') filename: string,
    @Res() res: { sendFile: (path: string) => void }
  ): Promise<void> {
    // Recherche dans tous les répertoires année/mois
    const searchPaths = [
      // Année/mois courants
      join(process.cwd(), 'uploads', 'images', String(new Date().getFullYear()), String(new Date().getMonth() + 1).padStart(2, '0')),
      // Répertoire racine uploads/images (legacy)
      join(process.cwd(), 'uploads', 'images')
    ];

    for (const searchPath of searchPaths) {
      const filePath = join(searchPath, filename);
      if (existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }

    throw new NotFoundException('Fichier non trouvé');
  }
}
