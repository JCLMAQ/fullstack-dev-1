import * as Prisma from '@db/prisma';
import { Organization } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaClientService) {}

  async organization(
    organizationWhereUniqueInput: Prisma.OrganizationWhereUniqueInput
  ): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: organizationWhereUniqueInput,
    });
  }

  async organizations(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.OrganizationWhereUniqueInput;
    where?: Prisma.OrganizationWhereInput;
    orderBy?: Prisma.OrganizationOrderByWithRelationInput;
    include?: Prisma.OrganizationInclude;
  }): Promise<Organization[]> {
    const { skip, take, cursor, where, orderBy, include } = params;
    return this.prisma.organization.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include,
    }) as Promise<Organization[]>;
  }

  async createOrganization(data: Prisma.OrganizationCreateInput): Promise<Organization> {
    return this.prisma.organization.create({
      data,
    });
  }

  async updateOrganization(params: {
    where: Prisma.OrganizationWhereUniqueInput;
    data: Prisma.OrganizationUpdateInput;
  }): Promise<Organization> {
    const { data, where } = params;
    return this.prisma.organization.update({
      data,
      where,
    });
  }

  async deleteOrganization(where: Prisma.OrganizationWhereUniqueInput): Promise<Organization> {
    return this.prisma.organization.delete({
      where,
    });
  }

  // Méthodes spécifiques aux organisations

  async getOrganizationWithRelations(
    organizationWhereUniqueInput: Prisma.OrganizationWhereUniqueInput,
    includeOptions?: {
      members?: boolean;
      posts?: boolean;
      groups?: boolean;
      files?: boolean;
      tasks?: boolean;
      todos?: boolean;
      orgEmails?: boolean;
      orgDomains?: boolean;
      subOrganizations?: boolean;
      mainOrganization?: boolean;
    }
  ): Promise<Organization | null> {
    const include: Prisma.OrganizationInclude = {};

    if (includeOptions?.members) include.Members = true;
    if (includeOptions?.posts) include.Posts = true;
    if (includeOptions?.groups) include.Groups = true;
    if (includeOptions?.files) include.Files = true;
    if (includeOptions?.tasks) include.Tasks = true;
    if (includeOptions?.todos) include.Todos = true;
    if (includeOptions?.orgEmails) include.OrgEmails = true;
    if (includeOptions?.orgDomains) include.OrgDomains = true;
    if (includeOptions?.subOrganizations) include.OrgEntity = true;
    if (includeOptions?.mainOrganization) include.mainOrg = true;

    return this.prisma.organization.findUnique({
      where: organizationWhereUniqueInput,
      include,
    }) as Promise<Organization | null>;
  }

  async getSubOrganizations(parentOrgId: string): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      where: {
        mainOrgId: parentOrgId,
        isDeleted: 0,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getRootOrganizations(): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      where: {
        mainOrgId: null,
        isDeleted: 0,
      },
      orderBy: { name: 'asc' },
    });
  }
}
