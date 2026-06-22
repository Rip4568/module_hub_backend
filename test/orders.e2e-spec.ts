import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { authenticateE2EUser, createE2EApp } from './e2e-auth.helper';

describe('Orders without inventory (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let tenantId: string;

  beforeAll(async () => {
    app = await createE2EApp();
    const auth = await authenticateE2EUser(app);
    token = auth.token;
    tenantId = auth.tenantId;

    for (const moduleId of ['ecommerce', 'order_management']) {
      await request(app.getHttpServer())
        .post(`/tenant-modules/${moduleId}/activate`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', tenantId)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });
    }

    await request(app.getHttpServer())
      .post('/tenant-modules/inventory/deactivate')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .expect((res) => {
        expect([200, 201, 404]).toContain(res.status);
      });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('creates order without inventory module active', async () => {
    const productResponse = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .send({
        name: `Order E2E Product ${Date.now()}`,
        price: 49.9,
        sku: `ORD-SKU-${Date.now()}`,
        trackInventory: true,
        stock: 50,
      })
      .expect(201);

    const orderResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .send({
        customerName: 'E2E Customer',
        customerEmail: 'e2e-order@test.com',
        shippingAddress: {
          street: 'Rua Teste',
          number: '42',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01000-000',
          country: 'BR',
        },
        items: [
          {
            productId: productResponse.body.id,
            quantity: 2,
          },
        ],
      })
      .expect(201);

    expect(orderResponse.body).toHaveProperty('id');
    expect(orderResponse.body.status).toBe('PENDING');
    expect(orderResponse.body.items).toHaveLength(1);
    expect(Number(orderResponse.body.total)).toBeCloseTo(99.8, 1);
  });
});
