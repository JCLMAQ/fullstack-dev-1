import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { fileMimetypeFilter } from './file-mimetype-filter';


export function ApiFile(
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  fieldName: string = 'file',
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  required: boolean = false,
  localOptions?: MulterOptions,
) {
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName, localOptions)),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: required ? [fieldName] : [],
        properties: {
          [fieldName]: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
  );
}

// Specific decorator for image file
export function ApiImageFile(
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  fileName: string = 'image',
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  required: boolean = false,
) {
  return ApiFile(fileName, required, {
    fileFilter: fileMimetypeFilter('image'),
  });
}

// Specific decorator for pdf file
export function ApiPdfFile(
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  fileName: string = 'document',
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  required: boolean = false,
) {
  return ApiFile(fileName, required, {
    fileFilter: fileMimetypeFilter('pdf'),
  });
}
