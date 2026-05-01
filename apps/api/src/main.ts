import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    bufferLogs: false,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');

  // Security
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // Compression
  app.use(compression());

  // CORS
  const allowedOrigins = configService.get<string>('app.allowedOrigins', 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  const isDev = nodeEnv !== 'production';
  // In dev, allow any localhost/127.0.0.1 origin (including dynamic preview ports like :50988)
  const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        (isDev && localhostRegex.test(origin))
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy violation: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Refresh-Token'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
  });

  // Global prefix & versioning
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false,
    }),
  );

  // Global interceptors
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger (non-production only or always with auth)
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('EV Trips Community API')
      .setDescription('Backend API for the EV Trips Community platform')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT access token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User profile management')
      .addTag('Vehicles', 'EV vehicle management')
      .addTag('Trips', 'Trip management and discovery')
      .addTag('Comments', 'Trip comments and interactions')
      .addTag('Charging Stations', 'Charging station management')
      .addTag('Notifications', 'User notifications')
      .addTag('Lookup', 'Static lookup data')
      .addTag('Reports', 'Content reporting')
      .addTag('Media', 'File and media uploads')
      .addTag('Admin', 'Admin panel operations')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
      },
    });

    logger.log(`Swagger docs available at: http://localhost:${port}/${apiPrefix}/docs`);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  // Bind to 0.0.0.0 explicitly. Some container runtimes (CranL among them)
  // can't reach the upstream when Node defaults to the IPv6 wildcard, which
  // surfaces as a 502 from the edge proxy even though the process logs
  // "running on port X" perfectly happily.
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  logger.log(`EV Trips Community API running on ${host}:${port} [${nodeEnv}]`);
  logger.log(`API prefix: /${apiPrefix}/v1`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', err);
  process.exit(1);
});
