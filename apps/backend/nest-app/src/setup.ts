// setup.ts
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClsMiddleware } from 'nestjs-cls';
// According https://medium.com/ayuth/proper-way-to-create-response-dto-in-nest-js-2d58b9e42bf9

// import dotenv from 'dotenv';
// const config = dotenv.config()

// !!! Nestjs use .developement.env by default ????

export function setup(app: INestApplication) {

      // app.enableShutdownHooks()

  /* Nestjs has a built-in validation pipe: The ValidationPipe provides a convenient approach
    to enforce validation rules for all incoming client payloads,
    where the validation rules are declared with decorators from the class-validator package.
 */
   app.useGlobalPipes(new ValidationPipe({  // see https://www.notion.so/jclmaq5510/Validation-and-Transformation-9a2da8a694004fc8a0f2e64445ae3892
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }));

  /* NestJS has a built-in ClassSerializerInterceptor that can be used to transform objects.
    You will use this interceptor to remove the password field from the response object.
    The ClassSerializerInterceptor uses the class-transformer package to define how to transform objects.
    Use the @Exclude() decorator to exclude the password field in the UserEntity class
  */
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      strategy: 'excludeAll',
    }),
  );

  const globalPrefix = process.env.NEST_SERVER_GLOBAL_PREFIX ||'api';
  app.setGlobalPrefix(globalPrefix);

  // NestJS CLS - create and mount the middleware manually here
  app.use(
    new ClsMiddleware({
        /* useEnterWith: true */
    }).use,
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle(process.env.SET_APP_TITLE  || 'API Documentation')
    .setDescription(process.env.SET_APP_DESCRIPTION || 'The API description')
    .setVersion(process.env.SET_APP_VERSION || '1.0')
    .addTag(process.env.SET_APP_ADDTAG || 'api')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/doc', app, document);

  return app;
}

/* implementation within main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setup(app);
  await app.listen(3000);
}
bootstrap();
*/
