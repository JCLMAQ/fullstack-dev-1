import { PhoneType, Prisma } from '@db/prisma';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { PhonesService } from './phones.service';

// Helper pour récupérer le message d'erreur
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

@Controller('phones')
export class PhonesController {
  constructor(private phonesService: PhonesService) {}

  /**
   * Récupère tous les téléphones avec pagination et filtres
   */
  @Get()
  async getAllPhones(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('userId') userId?: string,
    @Query('phoneType') phoneType?: string,
    @Query('isPrimary') isPrimary?: string,
    @Query('search') search?: string
  ) {
    try {
      const params: {
        skip?: number;
        take?: number;
        where?: Prisma.PhoneWhereInput;
        orderBy?: Prisma.PhoneOrderByWithRelationInput;
        include?: Prisma.PhoneInclude;
      } = {
        include: {
          user: true,
        },
        orderBy: {
          isPrimary: 'desc',
        },
      };

      if (skip) params.skip = parseInt(skip);
      if (take) params.take = parseInt(take);

      // Construction des filtres
      const where: Prisma.PhoneWhereInput = {};

      if (userId) {
        where.userId = userId;
      }

      if (phoneType && Object.values(PhoneType).includes(phoneType as PhoneType)) {
        where.phoneType = phoneType as PhoneType;
      }

      if (isPrimary !== undefined) {
        where.isPrimary = isPrimary === 'true';
      }

      if (search) {
        where.OR = [
          { number: { contains: search, mode: 'insensitive' } },
          { countryCode: { contains: search, mode: 'insensitive' } },
          { extension: { contains: search, mode: 'insensitive' } },
        ];
      }

      params.where = where;

      const phones = await this.phonesService.findAll(params);
      const total = await this.phonesService.count(where);

      return {
        data: phones,
        total,
        skip: parseInt(skip || '0'),
        take: parseInt(take || '10'),
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des téléphones: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère un téléphone par son ID
   */
  @Get(':id')
  async getPhoneById(@Param('id') id: string) {
    try {
      const phoneId = parseInt(id);
      if (isNaN(phoneId)) {
        throw new HttpException('ID invalide', HttpStatus.BAD_REQUEST);
      }

      const phone = await this.phonesService.findOneWithRelations(
        { id: phoneId },
        { user: true }
      );

      if (!phone) {
        throw new HttpException('Téléphone non trouvé', HttpStatus.NOT_FOUND);
      }

      return phone;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la récupération du téléphone: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Crée un nouveau téléphone
   */
  @Post()
  async createPhone(@Body() createPhoneDto: Prisma.PhoneCreateInput) {
    try {
      // Validation du numéro de téléphone
      const countryCode = createPhoneDto.countryCode || '';
      const number = createPhoneDto.number || '';

      if (!this.phonesService.validatePhoneNumber(countryCode, number)) {
        throw new HttpException(
          'Format de numéro de téléphone invalide',
          HttpStatus.BAD_REQUEST
        );
      }

      const phone = await this.phonesService.create(createPhoneDto);
      return phone;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la création du téléphone: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Met à jour un téléphone
   */
  @Put(':id')
  async updatePhone(
    @Param('id') id: string,
    @Body() updatePhoneDto: Prisma.PhoneUpdateInput
  ) {
    try {
      const phoneId = parseInt(id);
      if (isNaN(phoneId)) {
        throw new HttpException('ID invalide', HttpStatus.BAD_REQUEST);
      }

      const existingPhone = await this.phonesService.findOne({ id: phoneId });
      if (!existingPhone) {
        throw new HttpException('Téléphone non trouvé', HttpStatus.NOT_FOUND);
      }

      // Validation du numéro si modifié
      if (updatePhoneDto.countryCode || updatePhoneDto.number) {
        const countryCode = (updatePhoneDto.countryCode as string) || existingPhone.countryCode;
        const number = (updatePhoneDto.number as string) || existingPhone.number;

        if (!this.phonesService.validatePhoneNumber(countryCode, number)) {
          throw new HttpException(
            'Format de numéro de téléphone invalide',
            HttpStatus.BAD_REQUEST
          );
        }
      }

      const phone = await this.phonesService.update({
        where: { id: phoneId },
        data: updatePhoneDto,
      });
      return phone;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la mise à jour du téléphone: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Supprime un téléphone
   */
  @Delete(':id')
  async removePhone(@Param('id') id: string) {
    try {
      const phoneId = parseInt(id);
      if (isNaN(phoneId)) {
        throw new HttpException('ID invalide', HttpStatus.BAD_REQUEST);
      }

      const existingPhone = await this.phonesService.findOne({ id: phoneId });
      if (!existingPhone) {
        throw new HttpException('Téléphone non trouvé', HttpStatus.NOT_FOUND);
      }

      const phone = await this.phonesService.delete({ id: phoneId });
      return {
        message: 'Téléphone supprimé avec succès',
        phone,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la suppression du téléphone: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les téléphones d'un utilisateur
   */
  @Get('user/:userId')
  async getPhonesByUser(@Param('userId') userId: string) {
    try {
      const phones = await this.phonesService.findByUser(userId);
      return phones;
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des téléphones de l'utilisateur: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les téléphones par type
   */
  @Get('type/:phoneType')
  async getPhonesByType(@Param('phoneType') phoneType: string) {
    try {
      if (!Object.values(PhoneType).includes(phoneType as PhoneType)) {
        throw new HttpException('Type de téléphone invalide', HttpStatus.BAD_REQUEST);
      }

      const phones = await this.phonesService.findByType(phoneType as PhoneType);
      return phones;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la récupération des téléphones par type: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère le téléphone primaire d'un utilisateur
   */
  @Get('user/:userId/primary')
  async getPrimaryPhoneByUser(@Param('userId') userId: string) {
    try {
      const phone = await this.phonesService.findPrimaryByUser(userId);
      if (!phone) {
        throw new HttpException(
          'Aucun téléphone primaire trouvé pour cet utilisateur',
          HttpStatus.NOT_FOUND
        );
      }
      return phone;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la récupération du téléphone primaire: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Définit un téléphone comme primaire
   */
  @Patch(':id/primary')
  async setPrimaryPhone(@Param('id') id: string) {
    try {
      const phoneId = parseInt(id);
      if (isNaN(phoneId)) {
        throw new HttpException('ID invalide', HttpStatus.BAD_REQUEST);
      }

      const phone = await this.phonesService.setPrimary(phoneId);
      return {
        message: 'Téléphone défini comme primaire avec succès',
        phone,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la définition du téléphone primaire: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Recherche des téléphones par numéro
   */
  @Get('search/:searchTerm')
  async searchPhones(@Param('searchTerm') searchTerm: string) {
    try {
      if (searchTerm.length < 3) {
        throw new HttpException(
          'Le terme de recherche doit contenir au moins 3 caractères',
          HttpStatus.BAD_REQUEST
        );
      }

      const phones = await this.phonesService.searchByNumber(searchTerm);
      return phones;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la recherche de téléphones: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
