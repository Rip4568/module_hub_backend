import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TestHelper } from './test-helper';

export interface E2EAuthContext {
  token: string;
  refreshToken: string;
  tenantId: string;
  email: string;
  password: string;
}

export async function createE2EApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.init();
  return app;
}

export async function authenticateE2EUser(app: INestApplication): Promise<E2EAuthContext> {
  const uniqueSuffix = Date.now();
  const credentials = {
    email: `e2e_user_${uniqueSuffix}@test.com`,
    password: 'password123',
    name: 'E2E User',
    tenantName: `E2E Tenant ${uniqueSuffix}`,
  };

  const registerResponse = await request(app.getHttpServer())
    .post('/auth/register')
    .send(credentials)
    .expect(201);

  const tenantId = registerResponse.body.tenantId as string;

  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      email: credentials.email,
      password: credentials.password,
      tenantId,
    })
    .expect(201);

  const token = loginResponse.body.token as string;
  const refreshToken = loginResponse.body.refreshToken as string;

  TestHelper.saveEnv('test_tenantId', tenantId);
  TestHelper.saveEnv('test_token', token);
  TestHelper.saveEnv('test_refreshToken', refreshToken);

  return {
    token,
    refreshToken,
    tenantId,
    email: credentials.email,
    password: credentials.password,
  };
}

export async function loadOrCreateAuthContext(app: INestApplication): Promise<E2EAuthContext> {
  const token = TestHelper.getEnv<string>('test_token');
  const refreshToken = TestHelper.getEnv<string>('test_refreshToken');
  const tenantId = TestHelper.getEnv<string>('test_tenantId');

  if (token && refreshToken && tenantId) {
    return {
      token,
      refreshToken,
      tenantId,
      email: '',
      password: '',
    };
  }

  return authenticateE2EUser(app);
}
