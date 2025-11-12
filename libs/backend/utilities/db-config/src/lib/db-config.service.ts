import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DbConfigService {


 /*
    *   DataBase config
  */

 constructor(
  private configService: ConfigService,
  private prisma: PrismaClientService,
) {}


async searchConfigParam(configItemName: string): Promise<string> {
  // Search for config parameter in the DB, and if not found use the one in the .env config file
  // Return "" if no value found
  try {
    const configItem = await this.prisma.configParam.findUnique({
      where: { name: configItemName }
    });

    // If no config item in DB or value is null, use env file
    if (!configItem || configItem.value === null) {
      return this.configService.get<string>(configItemName) || "";
    }

    return configItem.value;
  } catch {
    // If DB error, fallback to env file
    return this.configService.get<string>(configItemName) || "";
  }
}

async searchConfigParamEnvFirst(configItemName: string): Promise<string | undefined> {
  // Search for config parameter in .env config file first, and if not found use the one in the DB
  // Return undefined if no value found anywhere
  try {
    const valueFromEnvFile = this.configService.get<string>(configItemName);

    // If env file has a value and it's not empty, use it
    if (valueFromEnvFile && valueFromEnvFile !== "") {
      return valueFromEnvFile;
    }

    // Otherwise, try to get from DB
    const configItem = await this.prisma.configParam.findUnique({
      where: { name: configItemName }
    });

    return configItem?.value || undefined;
  } catch {
    // If DB error, return env value or undefined
    const valueFromEnvFile = this.configService.get<string>(configItemName);
    return valueFromEnvFile || undefined;
  }
}

objectToArray(objectToConvert: { [x: string]: unknown }): Array<{ [key: string]: unknown }> {
  // Convert an Object to an Array
  return Object.keys(objectToConvert).map(key => ({
    [key]: objectToConvert[key]
  }));
}




}
