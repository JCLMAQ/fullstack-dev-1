import { Phone, PhoneType, Prisma } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PhonesService {
  constructor(private prisma: PrismaClientService) {}

  /**
   * Récupère tous les téléphones avec pagination et filtres
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PhoneWhereUniqueInput;
    where?: Prisma.PhoneWhereInput;
    orderBy?: Prisma.PhoneOrderByWithRelationInput;
    include?: Prisma.PhoneInclude;
  } = {}) {
    const { skip, take, cursor, where, orderBy, include } = params;
    return this.prisma.phone.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include,
    });
  }

  /**
   * Récupère un téléphone par ID
   */
  async findOne(
    phoneWhereUniqueInput: Prisma.PhoneWhereUniqueInput,
    include?: Prisma.PhoneInclude
  ): Promise<Phone | null> {
    return this.prisma.phone.findUnique({
      where: phoneWhereUniqueInput,
      include,
    });
  }

  /**
   * Récupère un téléphone avec ses relations
   */
  async findOneWithRelations(
    where: Prisma.PhoneWhereUniqueInput,
    include: Prisma.PhoneInclude
  ) {
    return this.prisma.phone.findUnique({
      where,
      include,
    });
  }

  /**
   * Crée un nouveau téléphone
   */
  async create(data: Prisma.PhoneCreateInput): Promise<Phone> {
    // Si ce téléphone est marqué comme primaire, désactiver les autres téléphones primaires de l'utilisateur
    if (data.isPrimary) {
      await this.prisma.phone.updateMany({
        where: {
          userId: typeof data.user === 'string' ? data.user : data.user.connect?.id,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    return this.prisma.phone.create({
      data,
      include: {
        user: true,
      },
    });
  }

  /**
   * Met à jour un téléphone
   */
  async update(params: {
    where: Prisma.PhoneWhereUniqueInput;
    data: Prisma.PhoneUpdateInput;
    include?: Prisma.PhoneInclude;
  }): Promise<Phone> {
    const { where, data, include } = params;

    // Si on marque ce téléphone comme primaire, désactiver les autres
    if (data.isPrimary === true) {
      const phone = await this.prisma.phone.findUnique({ where });
      if (phone) {
        await this.prisma.phone.updateMany({
          where: {
            userId: phone.userId,
            isPrimary: true,
            id: { not: phone.id },
          },
          data: {
            isPrimary: false,
          },
        });
      }
    }

    return this.prisma.phone.update({
      data,
      where,
      include: include || {
        user: true,
      },
    });
  }

  /**
   * Supprime un téléphone
   */
  async delete(where: Prisma.PhoneWhereUniqueInput): Promise<Phone> {
    return this.prisma.phone.delete({
      where,
    });
  }

  /**
   * Récupère les téléphones d'un utilisateur
   */
  async findByUser(userId: string) {
    return this.prisma.phone.findMany({
      where: {
        userId,
      },
      include: {
        user: true,
      },
      orderBy: [
        { isPrimary: 'desc' }, // Téléphone primaire en premier
        { phoneType: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Récupère les téléphones par type
   */
  async findByType(phoneType: PhoneType) {
    return this.prisma.phone.findMany({
      where: {
        phoneType,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Récupère le téléphone primaire d'un utilisateur
   */
  async findPrimaryByUser(userId: string): Promise<Phone | null> {
    return this.prisma.phone.findFirst({
      where: {
        userId,
        isPrimary: true,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Définit un téléphone comme primaire
   */
  async setPrimary(phoneId: number): Promise<Phone> {
    const phone = await this.prisma.phone.findUnique({
      where: { id: phoneId },
    });

    if (!phone) {
      throw new Error('Téléphone non trouvé');
    }

    // Désactiver tous les autres téléphones primaires de cet utilisateur
    await this.prisma.phone.updateMany({
      where: {
        userId: phone.userId,
        isPrimary: true,
        id: { not: phoneId },
      },
      data: {
        isPrimary: false,
      },
    });

    // Activer ce téléphone comme primaire
    return this.prisma.phone.update({
      where: { id: phoneId },
      data: { isPrimary: true },
      include: {
        user: true,
      },
    });
  }

  /**
   * Recherche des téléphones par numéro
   */
  async searchByNumber(searchTerm: string) {
    return this.prisma.phone.findMany({
      where: {
        OR: [
          { number: { contains: searchTerm, mode: 'insensitive' } },
          { countryCode: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Compte le nombre de téléphones par filtre
   */
  async count(where?: Prisma.PhoneWhereInput): Promise<number> {
    return this.prisma.phone.count({ where });
  }

  /**
   * Valide le format d'un numéro de téléphone
   */
  validatePhoneNumber(countryCode: string, number: string): boolean {
    // Validation basique - peut être étendue selon les besoins
    const phoneRegex = /^[0-9+\-\s()]+$/;
    return phoneRegex.test(countryCode + number) && number.length >= 7;
  }
}
