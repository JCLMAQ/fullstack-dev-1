import { Category, Prisma } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaClientService) {}

  // Create a new category
  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    try {
      return await this.prisma.category.create({
        data,
        include: {
          Posts: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create category: ${getErrorMessage(error)}`);
    }
  }

  // Find all categories with optional filtering and pagination
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CategoryWhereUniqueInput;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput;
  }): Promise<Category[]> {
    try {
      const { skip, take, cursor, where, orderBy } = params;
      return await this.prisma.category.findMany({
        skip,
        take,
        cursor,
        where: {
          ...where,
          isDeleted: 0, // Always exclude deleted categories by default
        },
        orderBy: orderBy || { orderCategory: 'asc' },
        include: {
          Posts: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${getErrorMessage(error)}`);
    }
  }

  // Find a single category by ID
  async findOne(id: string): Promise<Category> {
    try {
      const category = await this.prisma.category.findFirst({
        where: {
          id,
          isDeleted: 0,
        },
        include: {
          Posts: true,
        },
      });

      if (!category) {
        throw new Error(`Category with ID ${id} not found`);
      }

      return category;
    } catch (error) {
      throw new Error(`Failed to fetch category: ${getErrorMessage(error)}`);
    }
  }

  // Update a category
  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    try {
      // Check if category exists and is not deleted
      await this.findOne(id);

      return await this.prisma.category.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          Posts: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to update category: ${getErrorMessage(error)}`);
    }
  }

  // Soft delete a category
  async remove(id: string): Promise<Category> {
    try {
      // Check if category exists and is not already deleted
      await this.findOne(id);

      return await this.prisma.category.update({
        where: { id },
        data: {
          isDeleted: 1,
          isDeletedDT: new Date(),
          updatedAt: new Date(),
        },
        include: {
          Posts: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to delete category: ${getErrorMessage(error)}`);
    }
  }

  // Find categories by publication status
  async findByPublished(published: boolean): Promise<Category[]> {
    try {
      return await this.findAll({
        where: { published },
      });
    } catch (error) {
      throw new Error(`Failed to fetch categories by published status: ${getErrorMessage(error)}`);
    }
  }

  // Find public categories
  async findPublicCategories(): Promise<Category[]> {
    try {
      return await this.findAll({
        where: {
          isPublic: true,
          published: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch public categories: ${getErrorMessage(error)}`);
    }
  }

  // Search categories by name
  async searchCategories(searchTerm: string): Promise<Category[]> {
    try {
      return await this.findAll({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to search categories: ${getErrorMessage(error)}`);
    }
  }

  // Update category order
  async updateCategoryOrder(id: string, newOrder: number): Promise<Category> {
    try {
      return await this.update(id, {
        orderCategory: newOrder,
      });
    } catch (error) {
      throw new Error(`Failed to update category order: ${getErrorMessage(error)}`);
    }
  }

  // Get categories ordered by creation date
  async findCategoriesByCreationDate(ascending = true): Promise<Category[]> {
    try {
      return await this.findAll({
        orderBy: {
          createdAt: ascending ? 'asc' : 'desc',
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch categories by creation date: ${getErrorMessage(error)}`);
    }
  }

  // Get categories with posts count
  async findCategoriesWithPostsCount(): Promise<(Category & { _count: { Posts: number } })[]> {
    try {
      return await this.prisma.category.findMany({
        where: {
          isDeleted: 0,
        },
        include: {
          Posts: true,
          _count: {
            select: {
              Posts: true,
            },
          },
        },
        orderBy: { orderCategory: 'asc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch categories with posts count: ${getErrorMessage(error)}`);
    }
  }

  // Get categories by sequence range
  async findCategoriesBySequenceRange(minSeq: number, maxSeq: number): Promise<Category[]> {
    try {
      return await this.findAll({
        where: {
          numSeq: {
            gte: minSeq,
            lte: maxSeq,
          },
        },
        orderBy: { numSeq: 'asc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch categories by sequence range: ${getErrorMessage(error)}`);
    }
  }

  // Update category publication status
  async updatePublicationStatus(id: string, published: boolean): Promise<Category> {
    try {
      return await this.update(id, {
        published,
      });
    } catch (error) {
      throw new Error(`Failed to update category publication status: ${getErrorMessage(error)}`);
    }
  }

  // Update category visibility
  async updateVisibility(id: string, isPublic: boolean): Promise<Category> {
    try {
      return await this.update(id, {
        isPublic,
      });
    } catch (error) {
      throw new Error(`Failed to update category visibility: ${getErrorMessage(error)}`);
    }
  }

  // Get categories by order range
  async findCategoriesByOrderRange(minOrder: number, maxOrder: number): Promise<Category[]> {
    try {
      return await this.findAll({
        where: {
          orderCategory: {
            gte: minOrder,
            lte: maxOrder,
          },
        },
        orderBy: { orderCategory: 'asc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch categories by order range: ${getErrorMessage(error)}`);
    }
  }

  // Find category by name (exact match)
  async findByName(name: string): Promise<Category | null> {
    try {
      return await this.prisma.category.findFirst({
        where: {
          name,
          isDeleted: 0,
        },
        include: {
          Posts: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to find category by name: ${getErrorMessage(error)}`);
    }
  }

  // Get most popular categories (by post count)
  async findMostPopularCategories(limit = 10): Promise<(Category & { _count: { Posts: number } })[]> {
    try {
      return await this.prisma.category.findMany({
        where: {
          isDeleted: 0,
          published: true,
          isPublic: true,
        },
        include: {
          Posts: true,
          _count: {
            select: {
              Posts: true,
            },
          },
        },
        orderBy: {
          Posts: {
            _count: 'desc',
          },
        },
        take: limit,
      });
    } catch (error) {
      throw new Error(`Failed to fetch most popular categories: ${getErrorMessage(error)}`);
    }
  }

  // Update category name
  async updateName(id: string, name: string): Promise<Category> {
    try {
      return await this.update(id, {
        name,
      });
    } catch (error) {
      throw new Error(`Failed to update category name: ${getErrorMessage(error)}`);
    }
  }
}
