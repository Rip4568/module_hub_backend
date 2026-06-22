import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  authenticateE2EUser,
  completeE2EOnboarding,
  createE2EApp,
} from './e2e-auth.helper';

describe('Onboarding (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('registers tenant with starter plan and no billable modules in DB', async () => {
    const uniqueSuffix = Date.now();
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `onboarding_${uniqueSuffix}@test.com`,
        password: 'password123',
        name: 'Onboarding User',
        tenantName: `Onboarding Tenant ${uniqueSuffix}`,
      })
      .expect(201);

    const tenantId = registerResponse.body.user.tenantId as string;
    const token = registerResponse.body.token as string;

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .expect(200);

    expect(meResponse.body.plan).toBe('starter');
    expect(meResponse.body.onboardingCompleted).toBe(false);
    expect(meResponse.body.billableCount).toBe(0);

    const usageResponse = await request(app.getHttpServer())
      .get('/tenant-modules/usage')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .expect(403);

    expect(usageResponse.body.code).toBe('ONBOARDING_REQUIRED');
  });

  it('blocks business routes until onboarding is completed', async () => {
    const auth = await authenticateE2EUser(app, { skipOnboarding: true });

    await request(app.getHttpServer())
      .get('/vehicles')
      .set('Authorization', `Bearer ${auth.token}`)
      .set('x-tenant-id', auth.tenantId)
      .expect(403)
      .expect((res) => {
        expect(res.body.code).toBe('ONBOARDING_REQUIRED');
      });

    await request(app.getHttpServer())
      .get('/onboarding/status')
      .set('Authorization', `Bearer ${auth.token}`)
      .set('x-tenant-id', auth.tenantId)
      .expect(200)
      .expect((res) => {
        expect(res.body.onboardingCompleted).toBe(false);
        expect(res.body.billableCount).toBe(0);
        expect(res.body.requiredModuleCount).toBe(1);
        expect(res.body.suggestedModules).toHaveLength(4);
      });
  });

  it('completes onboarding by activating exactly one suggested module', async () => {
    const auth = await authenticateE2EUser(app, { skipOnboarding: true });

    await completeE2EOnboarding(app, auth.token, auth.tenantId, 'ecommerce');

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${auth.token}`)
      .set('x-tenant-id', auth.tenantId)
      .expect(200);

    expect(meResponse.body.onboardingCompleted).toBe(true);
    expect(meResponse.body.billableCount).toBe(1);
    expect(meResponse.body.activeModules).toContain('ecommerce');

    await request(app.getHttpServer())
      .post('/onboarding/complete')
      .set('Authorization', `Bearer ${auth.token}`)
      .set('x-tenant-id', auth.tenantId)
      .send({ moduleId: 'inventory' })
      .expect(409);
  });

  it('allows module activation during onboarding via tenant-modules endpoint', async () => {
    const auth = await authenticateE2EUser(app, { skipOnboarding: true });

    await request(app.getHttpServer())
      .post('/tenant-modules/inventory/activate')
      .set('Authorization', `Bearer ${auth.token}`)
      .set('x-tenant-id', auth.tenantId)
      .expect(201)
      .expect((res) => {
        expect(res.body.moduleId).toBe('inventory');
        expect(res.body.isActive).toBe(true);
      });
  });

  it('rejects deactivation of essential modules', async () => {
    const auth = await authenticateE2EUser(app);

    await request(app.getHttpServer())
      .post('/tenant-modules/tenant/deactivate')
      .set('Authorization', `Bearer ${auth.token}`)
      .set('x-tenant-id', auth.tenantId)
      .expect(400)
      .expect((res) => {
        expect(res.body.code).toBe('ESSENTIAL_MODULE');
      });
  });
});
