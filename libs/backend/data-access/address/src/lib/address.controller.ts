import { Address, AddressType, Prisma } from '@db/prisma';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { AddressService } from './address.service';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  // Create a new address
  @Post()
  async create(@Body() createAddressDto: Prisma.AddressCreateInput): Promise<Address> {
    try {
      return await this.addressService.create(createAddressDto);
    } catch (error) {
      throw new HttpException(
        `Failed to create address: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get all addresses with optional filters
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
  ): Promise<Address[]> {
    try {
      const where: Prisma.AddressWhereInput = {};

      if (userId) where.userId = userId;
      if (type && Object.values(AddressType).includes(type as AddressType)) {
        where.addressType = type as AddressType;
      }
      if (city) where.city = { contains: city, mode: 'insensitive' };
      if (country) where.country = { contains: country, mode: 'insensitive' };

      return await this.addressService.findAll({
        skip: skip ? parseInt(skip, 10) : undefined,
        take: take ? parseInt(take, 10) : undefined,
        where,
      });
    } catch (error) {
      throw new HttpException(
        `Failed to fetch addresses: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get address by ID
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Address> {
    try {
      return await this.addressService.findOne(id);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch address: ${getErrorMessage(error)}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  // Update address
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAddressDto: Prisma.AddressUpdateInput,
  ): Promise<Address> {
    try {
      return await this.addressService.update(id, updateAddressDto);
    } catch (error) {
      throw new HttpException(
        `Failed to update address: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Delete address
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Address> {
    try {
      return await this.addressService.remove(id);
    } catch (error) {
      throw new HttpException(
        `Failed to delete address: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get addresses by user
  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string): Promise<Address[]> {
    try {
      return await this.addressService.findByUser(userId);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch addresses for user: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get addresses by type
  @Get('type/:type')
  async findByType(@Param('type') type: string): Promise<Address[]> {
    try {
      if (!Object.values(AddressType).includes(type as AddressType)) {
        throw new HttpException('Invalid address type', HttpStatus.BAD_REQUEST);
      }
      return await this.addressService.findByType(type as AddressType);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch addresses by type: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get primary address for user
  @Get('user/:userId/primary')
  async getPrimaryAddress(@Param('userId') userId: string): Promise<Address | null> {
    try {
      return await this.addressService.getPrimaryAddress(userId);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch primary address: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Set address as primary
  @Post(':id/primary')
  async setPrimary(@Param('id', ParseIntPipe) id: number): Promise<Address> {
    try {
      return await this.addressService.setPrimary(id);
    } catch (error) {
      throw new HttpException(
        `Failed to set address as primary: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Search addresses by location
  @Get('search/query')
  async searchAddresses(@Query('q') searchTerm: string): Promise<Address[]> {
    try {
      if (!searchTerm) {
        throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
      }
      return await this.addressService.searchAddresses(searchTerm);
    } catch (error) {
      throw new HttpException(
        `Failed to search addresses: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get addresses by city
  @Get('city/:city')
  async findByCity(@Param('city') city: string): Promise<Address[]> {
    try {
      return await this.addressService.findByCity(city);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch addresses by city: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get addresses by country
  @Get('country/:country')
  async findByCountry(@Param('country') country: string): Promise<Address[]> {
    try {
      return await this.addressService.findByCountry(country);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch addresses by country: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
