import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { authenticateE2EUser, createE2EApp } from './e2e-auth.helper';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('/auth/register (POST)', async () => {
    const uniqueSuffix = Date.now();
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `register_${uniqueSuffix}@test.com`,
        password: 'password123',
        name: 'Register User',
        tenantName: `Register Tenant ${uniqueSuffix}`,
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toEqual(`register_${uniqueSuffix}@test.com`);
    expect(response.body.tenantId).toBeDefined();
  });

  it('/auth/login (POST) and /auth/refresh (POST)', async () => {
    const auth = await authenticateE2EUser(app);

    expect(auth.token).toBeTruthy();
    expect(auth.refreshToken).toBeTruthy();

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: auth.refreshToken })
      .expect(201);

    expect(refreshResponse.body).toHaveProperty('token');
    expect(refreshResponse.body).toHaveProperty('refreshToken');
    expect(refreshResponse.body.user).toBeDefined();
  });

  it('/auth/refresh (POST) rejects invalid token', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid-token' })
      .expect(401);
  });
});
