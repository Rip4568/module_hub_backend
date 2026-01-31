import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { INestApplication } from '@nestjs/common';
import { StockLocationType } from '../src/modules/product/entities/stock-level.entity';

describe.skip('Inventory Flow (e2e)', () => {
    let app: INestApplication;
    let authToken: string; // Retrieve this if auth is enabled
    let tenantId: string;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // TODO: Setup Auth Token (Login as Superadmin or Tenant Admin)
        // For now, assuming we can mock or use a seed user.
        // If auth is strictly required, we need a login helper.
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/inventory/transfer (POST)', () => {
        // 1. Create a transfer
        return request(app.getHttpServer())
            .post('/api/inventory/transfer')
            //.set('Authorization', `Bearer ${authToken}`)
            .send({
                productId: 'SOME_PRODUCT_UUID', // Need a real ID
                quantity: 10,
                fromType: StockLocationType.WAREHOUSE,
                toType: StockLocationType.VEHICLE,
                toId: 'SOME_VEHICLE_UUID'
            })
            .expect(201)
            .expect((res) => {
                expect(res.body.destination.quantity).toBe(10);
            });
    });
});
