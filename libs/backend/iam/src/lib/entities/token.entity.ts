import { Token, TokenType, User } from '@db/prisma';
import { ApiProperty } from "@nestjs/swagger";

export class TokenEntity implements Token {

  constructor(partial: Partial<TokenEntity>) {
    Object.assign(this, partial);
  }

  // Propriétés requises par l'interface Token de Prisma
  @ApiProperty({
    description: 'Identifiant unique du token',
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
    description: 'Identifiant du token',
    example: 'token-abc-123'
  })
  tokenId!: string | null;

  @ApiProperty({
    description: 'Type de token',
    enum: TokenType
  })
  type!: TokenType;

  @ApiProperty({
    description: 'Token email pour validation',
    example: 'email-token-xyz'
  })
  emailToken!: string | null;

  @ApiProperty({
    description: 'Validité du token',
    example: true
  })
  valid!: boolean;

  @ApiProperty({
    description: 'Date d\'expiration du token'
  })
  expiration!: Date;

  @ApiProperty({
    description: 'ID de l\'utilisateur propriétaire du token',
    example: 'user-123'
  })
  userId!: string;

  // Relations optionnelles
  user?: User;
}
