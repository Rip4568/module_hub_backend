import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TenantModuleService } from '../src/modules/tenant-module/tenant-module.service';
import { authenticateE2EUser, createE2EApp } from './e2e-auth.helper';

describe('Vehicle Creation 500 Repro', () => {
  let app: INestApplication;
  let token: string;
  let tenantId: string;
  let tenantModuleService: TenantModuleService;

  beforeAll(async () => {
    app = await createE2EApp();
    tenantModuleService = app.get(TenantModuleService);

    const auth = await authenticateE2EUser(app);
    token = auth.token;
    tenantId = auth.tenantId;

    await tenantModuleService.activateModule(tenantId, 'fleet_management');
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should create vehicle without 500', async () => {
    const payload = {
      type: 'CAR',
      brand: 'Toyota',
      model: 'Corolla Repro',
      year: 2024,
      color: 'Blue',
      plate: `REPRO-${Date.now()}`,
      fuelType: 'FLEX',
      photos: [],
    };

    const res = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
