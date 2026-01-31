import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestHelper } from './test-helper';
import { TenantModuleService } from '../src/modules/tenant-module/tenant-module.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

describe('Products (e2e)', () => {
    let app: INestApplication;
    let token: string;
    let tenantId: string;
    let tenantModuleService: TenantModuleService;

    beforeAll(async () => {
        try {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            console.log('App Module Compiled');
            app = moduleFixture.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ transform: true }));
            app.useGlobalFilters(new GlobalExceptionFilter());
            await app.init();
            console.log('App Initialized');

            tenantModuleService = app.get<TenantModuleService>(TenantModuleService);

            token = TestHelper.getEnv<string>('test_token');
            tenantId = TestHelper.getEnv<string>('test_tenantId');

            if (!token || !tenantId) {
                throw new Error('Test environment variables not found.');
            }

            // Ensure Ecommerce Module is Active
            const isEnabled = await tenantModuleService.isModuleEnabled(tenantId, 'ecommerce');
            if (!isEnabled) {
                console.log('Activating Ecommerce Module for test...');
                await tenantModuleService.activateModule(tenantId, 'ecommerce');
                console.log('Ecommerce Module Activated');
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

    it('/products (POST) - Create Duplicate SKU', async () => {
        const duplicateProduct = {
            ...newProduct,
            name: 'Another Name'
        };

        const res = await request(app.getHttpServer())
            .post('/products')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .send(duplicateProduct);

        expect(res.status).toBe(409);
        expect(res.body.message).toContain('Duplicate entry');
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
