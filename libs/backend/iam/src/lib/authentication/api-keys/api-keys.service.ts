import { ApiKey } from '@db/prisma';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { HashingService } from '../../hashing/hashing.service';
import { GeneratedApiKeyPayload } from '../../interfaces/Generated-ApiKey-Payload';



import { ApiKeysRepository } from './api-key.repository';

@Injectable()
export class ApiKeysService {
  constructor(private readonly hashingService: HashingService,
    private readonly apiKeyRepository: ApiKeysRepository) {}

  async createAndHash(id: string): Promise<GeneratedApiKeyPayload> {
    const apiKey = this.generateApiKey(id);
    const hashedKey = await this.hashingService.hash(apiKey);
    return { apiKey, hashedKey };
  }

  async validate(apiKey: string, hashedKey: string): Promise<boolean> {
    return this.hashingService.compare(apiKey, hashedKey);
  }

  extractIdFromApiKey(apiKey: string): string {
    const [id] = Buffer.from(apiKey, 'base64').toString('ascii').split(' ');
    return id;
  }

  private generateApiKey(id: string): string {
    const apiKey = `${id} ${randomUUID()}`;
    return Buffer.from(apiKey).toString('base64');
  }

  async createUserApiKey(userId: string): Promise<ApiKey> {
    const uuid = randomUUID();
    const payload = await this.createAndHash(uuid);
    const data = {
      uuid: randomUUID(),
      key: payload.hashedKey,
      user: { connect: {id: userId}}
    }
    const apiUserKey = await this.apiKeyRepository.createApiKey(data)
    return apiUserKey;
  }

  async deleteAllApiKeyOfOneUser(userId: string): Promise<boolean> {
    // Delete all the ApiKey related to the specified User
    const done = await this.apiKeyRepository.deleteApiKeys(userId);
    return done
  }

  async deleteOneSpecificApiKeyOfOneUser( userId: string, apiKey: string) : Promise<boolean> {
    // Search for the apiKey
    const allApiKeys: ApiKey[]= await this.apiKeyRepository.findAllApiKeyforOneUser(userId);
    const apiKeyToDelete = allApiKeys.find(element => (this.validate(apiKey, element.key)));
    if(!apiKeyToDelete)  return false
    // Delete the ApiKey
    const done = await this.apiKeyRepository.deleteOneApiKey(userId, apiKeyToDelete.id)
    return done
  }
}
