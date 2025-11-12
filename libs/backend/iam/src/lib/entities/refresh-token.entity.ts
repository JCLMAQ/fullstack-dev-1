import { RefreshToken } from '@db/prisma';
import { ApiProperty } from "@nestjs/swagger";

export class RefreshTokenEntity implements RefreshToken {

  constructor(partial: Partial<RefreshTokenEntity>) {
    Object.assign(this, partial);
  }

  // Propriétés requises par l'interface RefreshToken de Prisma
  @ApiProperty({
    description: 'Identifiant unique du refresh token',
    example: 1
  })
  id!: number;

  createdAt!: Date;
  updatedAt!: Date;
  published!: boolean;
  isPublic!: boolean;
  isDeleted!: number;
  isDeletedDT!: Date | null;

  @ApiProperty({
    description: 'ID de l\'utilisateur propriétaire du token',
    example: 'user-123'
  })
  userId!: string;

  @ApiProperty({
    description: 'Identifiant unique du token',
    example: 'token-abc-123'
  })
  tokenId!: string;
}
