import { Address, AddressType, Prisma } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaClientService) {}

  // Create a new address
  async create(data: Prisma.AddressCreateInput): Promise<Address> {
    try {
      // If this address is set as primary, unset other primary addresses for the same user
      if (data.isPrimary) {
        await this.unsetPrimaryAddresses(data.user.connect?.id as string);
      }

      return await this.prisma.address.create({
        data,
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create address: ${getErrorMessage(error)}`);
    }
  }

  // Find all addresses with optional filters
  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.AddressWhereInput;
    orderBy?: { [key: string]: 'asc' | 'desc' };
    include?: Prisma.AddressInclude;
  }): Promise<Address[]> {
    const { skip, take, where, orderBy, include } = params || {};

    try {
      return await this.prisma.address.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        include: include || {
          user: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch addresses: ${getErrorMessage(error)}`);
    }
  }

  // Find address by ID
  async findOne(id: number): Promise<Address> {
    try {
      const address = await this.prisma.address.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      if (!address) {
        throw new NotFoundException(`Address with ID ${id} not found`);
      }

      return address;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch address: ${getErrorMessage(error)}`);
    }
  }

  // Update address
  async update(id: number, data: Prisma.AddressUpdateInput): Promise<Address> {
    try {
      const existingAddress = await this.prisma.address.findUnique({
        where: { id },
      });

      if (!existingAddress) {
        throw new NotFoundException(`Address with ID ${id} not found`);
      }

      // If this address is being set as primary, unset other primary addresses for the same user
      if (data.isPrimary === true) {
        await this.unsetPrimaryAddresses(existingAddress.userId);
      }

      return await this.prisma.address.update({
        where: { id },
        data,
        include: {
          user: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update address: ${getErrorMessage(error)}`);
    }
  }

  // Delete address
  async remove(id: number): Promise<Address> {
    try {
      const existingAddress = await this.prisma.address.findUnique({
        where: { id },
      });

      if (!existingAddress) {
        throw new NotFoundException(`Address with ID ${id} not found`);
      }

      return await this.prisma.address.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete address: ${getErrorMessage(error)}`);
    }
  }

  // Find addresses by user
  async findByUser(userId: string): Promise<Address[]> {
    try {
      return await this.prisma.address.findMany({
        where: { userId },
        orderBy: [
          { isPrimary: 'desc' }, // Primary addresses first
          { createdAt: 'desc' },  // Then by creation date
        ],
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch addresses for user: ${getErrorMessage(error)}`);
    }
  }

  // Find addresses by type
  async findByType(type: AddressType): Promise<Address[]> {
    try {
      return await this.prisma.address.findMany({
        where: { addressType: type },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch addresses by type: ${getErrorMessage(error)}`);
    }
  }

  // Get primary address for user
  async getPrimaryAddress(userId: string): Promise<Address | null> {
    try {
      return await this.prisma.address.findFirst({
        where: {
          userId,
          isPrimary: true,
        },
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch primary address: ${getErrorMessage(error)}`);
    }
  }

  // Set address as primary
  async setPrimary(id: number): Promise<Address> {
    try {
      const address = await this.prisma.address.findUnique({
        where: { id },
      });

      if (!address) {
        throw new NotFoundException(`Address with ID ${id} not found`);
      }

      // Unset other primary addresses for this user
      await this.unsetPrimaryAddresses(address.userId);

      // Set this address as primary
      return await this.prisma.address.update({
        where: { id },
        data: { isPrimary: true },
        include: {
          user: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to set address as primary: ${getErrorMessage(error)}`);
    }
  }

  // Search addresses by location
  async searchAddresses(searchTerm: string): Promise<Address[]> {
    try {
      return await this.prisma.address.findMany({
        where: {
          OR: [
            { street: { contains: searchTerm, mode: 'insensitive' } },
            { city: { contains: searchTerm, mode: 'insensitive' } },
            { state: { contains: searchTerm, mode: 'insensitive' } },
            { zipCode: { contains: searchTerm, mode: 'insensitive' } },
            { country: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to search addresses: ${getErrorMessage(error)}`);
    }
  }

  // Find addresses by city
  async findByCity(city: string): Promise<Address[]> {
    try {
      return await this.prisma.address.findMany({
        where: {
          city: {
            equals: city,
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch addresses by city: ${getErrorMessage(error)}`);
    }
  }

  // Find addresses by country
  async findByCountry(country: string): Promise<Address[]> {
    try {
      return await this.prisma.address.findMany({
        where: {
          country: {
            equals: country,
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch addresses by country: ${getErrorMessage(error)}`);
    }
  }

  // Private helper method to unset primary addresses for a user
  private async unsetPrimaryAddresses(userId: string): Promise<void> {
    await this.prisma.address.updateMany({
      where: {
        userId,
        isPrimary: true,
      },
      data: { isPrimary: false },
    });
  }
}
