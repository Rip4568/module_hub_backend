import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { authenticateE2EUser, createE2EApp } from './e2e-auth.helper';

describe('Modules (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let tenantId: string;

  beforeAll(async () => {
    app = await createE2EApp();
    const auth = await authenticateE2EUser(app);
    token = auth.token;
    tenantId = auth.tenantId;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('activates fleet module and enforces access control', async () => {
    const moduleId = 'fleet_management';

    await request(app.getHttpServer())
      .post(`/tenant-modules/${moduleId}/deactivate`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .expect((res) => {
        expect([200, 201, 404]).toContain(res.status);
      });

    await request(app.getHttpServer())
      .get('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toContain('not enabled');
      });

    await request(app.getHttpServer())
      .post(`/tenant-modules/${moduleId}/activate`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .expect(201)
      .expect((res) => {
        expect(res.body.moduleId).toBe(moduleId);
        expect(res.body.isActive).toBe(true);
      });
  });

  it('/vehicles (GET) - Verify Access after activation', async () => {
    const response = await request(app.getHttpServer())
      .get('/vehicles?page=1&limit=20')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
