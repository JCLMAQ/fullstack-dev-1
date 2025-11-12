import { ValidationArguments, registerDecorator } from 'class-validator';

export function IsJsonObject() {
  // From Managing JSON data with Prisma and PostgreSQL: https://www.notion.so/jclmaq5510/Managing-JSON-data-with-Prisma-and-PostgreSQL-c0b898f35b724860a973ed65d58dbb6c?pvs=4
    return function (object: object, propertyName: string) {
      registerDecorator({
        name: 'isJsonObject',
        target: object.constructor,
        propertyName: propertyName,
        validator: {
          validate(value: unknown) {
            return (
              typeof value === 'object' && value !== null && !Array.isArray(value)
            );
          },
          defaultMessage(validationArguments?: ValidationArguments): string {
            return `${validationArguments?.property} must be a valid object`;
          },
        },
      });
    };
  }

 // export default IsJsonObject;
