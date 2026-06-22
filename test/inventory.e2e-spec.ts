import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestHelper } from './test-helper';
import { TenantModuleService } from '../src/modules/tenant-module/tenant-module.service';
import { StockLocationType } from '../src/modules/product/entities/stock-level.entity';
import { loadOrCreateAuthContext, createE2EApp } from './e2e-auth.helper';

describe('Inventory Flow (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let tenantId: string;
  let productId: string;
  let vehicleId: string;
  let tenantModuleService: TenantModuleService;

  beforeAll(async () => {
    try {
      app = await createE2EApp();
      tenantModuleService = app.get<TenantModuleService>(TenantModuleService);

      const auth = await loadOrCreateAuthContext(app);
      token = auth.token;
      tenantId = auth.tenantId;
      productId = TestHelper.getEnv<string>('test_productId');
      vehicleId = TestHelper.getEnv<string>('test_vehicleId');

      if (!productId || !vehicleId) {
        throw new Error(
          'Test environment variables missing. Run products and vehicles tests first.',
        );
      }

      const modules = ['ecommerce', 'fleet_management', 'inventory'];
      for (const mod of modules) {
        const isEnabled = await tenantModuleService.isModuleEnabled(tenantId, mod);
        if (!isEnabled) {
          await tenantModuleService.activateModule(tenantId, mod);
        }
      }
    } catch (e) {
      console.error('Startup Error:', e);
      throw e;
    }
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('/inventory/adjust (POST) - Initialize Stock in Warehouse', async () => {
    console.log(`Adjusting stock for Product ${productId} in WAREHOUSE`);
    const response = await request(app.getHttpServer())
      .post('/inventory/adjust')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .send({
        productId: productId,
        quantity: 100,
        locationType: StockLocationType.WAREHOUSE,
        // locationId: 'DEFAULT', // Omitted, service defaults to 'DEFAULT'
        reason: 'Initial Stock',
      })
      .expect((res) => {
        if (res.status !== 201) {
          console.log('Adjust Error:', JSON.stringify(res.body, null, 2));
        }
      })
      .expect(201); // 201 Created

    expect(Number(response.body.quantity)).toBe(100);
  });

  it('/inventory/transfer (POST) - Transfer to Vehicle', async () => {
    console.log(`Transferring stock to Vehicle ${vehicleId}`);
    const response = await request(app.getHttpServer())
      .post('/inventory/transfer')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .send({
        productId: productId,
        quantity: 10,
        fromType: StockLocationType.WAREHOUSE,
        // fromId: 'DEFAULT',
        toType: StockLocationType.VEHICLE,
        toId: vehicleId,
      })
      .expect(201);

    // Verify Source Reduced
    expect(Number(response.body.source.quantity)).toBe(90);
    // Verify Destination Increased
    expect(Number(response.body.destination.quantity)).toBe(10);
  });
  it('/inventory/transfer (POST) - Insufficient Stock', async () => {
    await request(app.getHttpServer())
      .post('/inventory/transfer')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .send({
        productId: productId,
        quantity: 1000, // Exceeds stock (90)
        fromType: StockLocationType.WAREHOUSE,
        toType: StockLocationType.VEHICLE,
        toId: vehicleId,
      })
      .expect(400); // Expect Bad Request
  });

  it('/inventory/adjust (POST) - Invalid Request (Missing ID)', async () => {
    await request(app.getHttpServer())
      .post('/inventory/adjust')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .send({
        // productId: productId, // Missing Product ID
        quantity: 10,
      })
      .expect(400);
  });
});
