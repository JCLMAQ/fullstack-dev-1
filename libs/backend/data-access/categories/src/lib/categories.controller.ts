import { Category, Prisma } from '@db/prisma';
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
    Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Create a new category
  @Post()
  async create(@Body() createCategoryDto: Prisma.CategoryCreateInput): Promise<Category> {
    try {
      return await this.categoriesService.create(createCategoryDto);
    } catch (error) {
      throw new HttpException(
        `Failed to create category: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get all categories with optional filters
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
  ): Promise<Category[]> {
    try {
      const where: Prisma.CategoryWhereInput = {};

      if (published !== undefined) where.published = published === 'true';
      if (isPublic !== undefined) where.isPublic = isPublic === 'true';

      return await this.categoriesService.findAll({
        skip: skip ? parseInt(skip, 10) : undefined,
        take: take ? parseInt(take, 10) : undefined,
        where,
      });
    } catch (error) {
      throw new HttpException(
        `Failed to fetch categories: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get category by ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Category> {
    try {
      return await this.categoriesService.findOne(id);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch category: ${getErrorMessage(error)}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  // Update category
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: Prisma.CategoryUpdateInput,
  ): Promise<Category> {
    try {
      return await this.categoriesService.update(id, updateCategoryDto);
    } catch (error) {
      throw new HttpException(
        `Failed to update category: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Delete category (soft delete)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Category> {
    try {
      return await this.categoriesService.remove(id);
    } catch (error) {
      throw new HttpException(
        `Failed to delete category: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get categories by publication status
  @Get('published/:status')
  async findByPublished(@Param('status') status: string): Promise<Category[]> {
    try {
      const published = status === 'true';
      return await this.categoriesService.findByPublished(published);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch categories by published status: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get public categories
  @Get('visibility/public')
  async findPublicCategories(): Promise<Category[]> {
    try {
      return await this.categoriesService.findPublicCategories();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch public categories: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Search categories by name
  @Get('search/query')
  async searchCategories(@Query('q') searchTerm: string): Promise<Category[]> {
    try {
      if (!searchTerm) {
        throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
      }
      return await this.categoriesService.searchCategories(searchTerm);
    } catch (error) {
      throw new HttpException(
        `Failed to search categories: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Update category order
  @Patch(':id/order')
  async updateCategoryOrder(
    @Param('id') id: string,
    @Body('orderCategory') newOrder: number,
  ): Promise<Category> {
    try {
      if (typeof newOrder !== 'number') {
        throw new HttpException('Order must be a number', HttpStatus.BAD_REQUEST);
      }
      return await this.categoriesService.updateCategoryOrder(id, newOrder);
    } catch (error) {
      throw new HttpException(
        `Failed to update category order: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get categories ordered by creation date
  @Get('sort/creation-date')
  async findCategoriesByCreationDate(@Query('ascending') ascending?: string): Promise<Category[]> {
    try {
      const isAscending = ascending !== 'false'; // Default to true
      return await this.categoriesService.findCategoriesByCreationDate(isAscending);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch categories by creation date: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get categories with posts count
  @Get('analytics/posts-count')
  async findCategoriesWithPostsCount(): Promise<(Category & { _count: { Posts: number } })[]> {
    try {
      return await this.categoriesService.findCategoriesWithPostsCount();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch categories with posts count: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get categories by sequence range
  @Get('sequence/range')
  async findCategoriesBySequenceRange(
    @Query('min') min: string,
    @Query('max') max: string,
  ): Promise<Category[]> {
    try {
      const minSeq = parseInt(min, 10);
      const maxSeq = parseInt(max, 10);

      if (isNaN(minSeq) || isNaN(maxSeq)) {
        throw new HttpException('Min and max sequence values must be numbers', HttpStatus.BAD_REQUEST);
      }

      if (minSeq > maxSeq) {
        throw new HttpException('Min sequence cannot be greater than max sequence', HttpStatus.BAD_REQUEST);
      }

      return await this.categoriesService.findCategoriesBySequenceRange(minSeq, maxSeq);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch categories by sequence range: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Update category publication status
  @Patch(':id/publication')
  async updatePublicationStatus(
    @Param('id') id: string,
    @Body('published') published: boolean,
  ): Promise<Category> {
    try {
      if (typeof published !== 'boolean') {
        throw new HttpException('Published status must be a boolean', HttpStatus.BAD_REQUEST);
      }
      return await this.categoriesService.updatePublicationStatus(id, published);
    } catch (error) {
      throw new HttpException(
        `Failed to update category publication status: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Update category visibility
  @Patch(':id/visibility')
  async updateVisibility(
    @Param('id') id: string,
    @Body('isPublic') isPublic: boolean,
  ): Promise<Category> {
    try {
      if (typeof isPublic !== 'boolean') {
        throw new HttpException('Visibility status must be a boolean', HttpStatus.BAD_REQUEST);
      }
      return await this.categoriesService.updateVisibility(id, isPublic);
    } catch (error) {
      throw new HttpException(
        `Failed to update category visibility: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get categories by order range
  @Get('order/range')
  async findCategoriesByOrderRange(
    @Query('min') min: string,
    @Query('max') max: string,
  ): Promise<Category[]> {
    try {
      const minOrder = parseInt(min, 10);
      const maxOrder = parseInt(max, 10);

      if (isNaN(minOrder) || isNaN(maxOrder)) {
        throw new HttpException('Min and max order values must be numbers', HttpStatus.BAD_REQUEST);
      }

      if (minOrder > maxOrder) {
        throw new HttpException('Min order cannot be greater than max order', HttpStatus.BAD_REQUEST);
      }

      return await this.categoriesService.findCategoriesByOrderRange(minOrder, maxOrder);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch categories by order range: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Find category by name
  @Get('name/:name')
  async findByName(@Param('name') name: string): Promise<Category | null> {
    try {
      return await this.categoriesService.findByName(name);
    } catch (error) {
      throw new HttpException(
        `Failed to find category by name: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get most popular categories
  @Get('analytics/popular')
  async findMostPopularCategories(@Query('limit') limit?: string): Promise<(Category & { _count: { Posts: number } })[]> {
    try {
      const categoryLimit = limit ? parseInt(limit, 10) : 10;
      if (isNaN(categoryLimit) || categoryLimit <= 0) {
        throw new HttpException('Limit must be a positive number', HttpStatus.BAD_REQUEST);
      }
      return await this.categoriesService.findMostPopularCategories(categoryLimit);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch most popular categories: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Update category name
  @Patch(':id/name')
  async updateName(
    @Param('id') id: string,
    @Body('name') name: string,
  ): Promise<Category> {
    try {
      if (!name || typeof name !== 'string') {
        throw new HttpException('Name is required and must be a string', HttpStatus.BAD_REQUEST);
      }
      return await this.categoriesService.updateName(id, name);
    } catch (error) {
      throw new HttpException(
        `Failed to update category name: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
