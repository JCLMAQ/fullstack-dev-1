import { PrismaClient } from '@db/prisma';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,

});

@Injectable()
export class PrismaClientService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter });
  }

  async onModuleInit() {
    try {
        await this.$connect();
        console.log('✅ Prisma connected to database');
      } catch (error) {
        console.error('❌ Failed to connect to database:', error);
        throw error;
      }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
