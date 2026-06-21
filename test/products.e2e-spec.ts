import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestHelper } from './test-helper';
import { TenantModuleService } from '../src/modules/tenant-module/tenant-module.service';
import { authenticateE2EUser, createE2EApp } from './e2e-auth.helper';

describe('Products (e2e)', () => {
    let app: INestApplication;
    let token: string;
    let tenantId: string;
    let tenantModuleService: TenantModuleService;

    beforeAll(async () => {
        try {
            app = await createE2EApp();
            tenantModuleService = app.get<TenantModuleService>(TenantModuleService);

            const auth = await authenticateE2EUser(app);
            token = auth.token;
            tenantId = auth.tenantId;

            const isEnabled = await tenantModuleService.isModuleEnabled(tenantId, 'ecommerce');
            if (!isEnabled) {
                await tenantModuleService.activateModule(tenantId, 'ecommerce');
            }

        } catch (e) {
            console.error('Startup Error:', e);
            throw e;
        }
    });

    afterAll(async () => {
        if (app) await app.close();
    });

    const newProduct = {
        name: 'E2E Test Product',
        price: 99.90,
        sku: `SKU-${Date.now()}`,
        trackInventory: true,
        stock: 100 // Initial stock
    };

    it('/products (POST) - Create Product', async () => {
        const response = await request(app.getHttpServer())
            .post('/products')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .send(newProduct)
            .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toEqual(newProduct.name);

        const productId = response.body.id;
        console.log('Created Product ID:', productId);
        TestHelper.saveEnv('test_productId', productId);
    });

    it('/products (POST) - Allows duplicate SKU in current schema', async () => {
        const duplicateProduct = {
            ...newProduct,
            name: 'Another Name'
        };

        const res = await request(app.getHttpServer())
            .post('/products')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .send(duplicateProduct);

        expect(res.status).toBe(201);
        expect(res.body.name).toEqual('Another Name');
    });

    it('/products (POST) - Validation Error (Missing Name)', async () => {
        const invalidProduct = {
            price: 10
        };

        await request(app.getHttpServer())
            .post('/products')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .send(invalidProduct)
            .expect(400);
    });
});
