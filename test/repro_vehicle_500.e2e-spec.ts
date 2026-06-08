
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestHelper } from './test-helper';

import { TenantModuleService } from '../src/modules/tenant-module/tenant-module.service';

describe('Vehicle Creation 500 Repro', () => {
    let app: INestApplication;
    let token: string;
    let tenantId: string;
    let tenantModuleService: TenantModuleService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new ValidationPipe({ transform: true }));
        await app.init();

        token = TestHelper.getEnv('test_token');
        tenantId = TestHelper.getEnv('test_tenantId');

        tenantModuleService = app.get(TenantModuleService);

        if (!token || !tenantId) {
            console.warn('Skipping test: No token or tenantId found in env. Run auth tests first.');
        } else {
            await tenantModuleService.activateModule(tenantId, 'fleet_management');
        }
    });

    afterAll(async () => {
        if (app) await app.close();
    });

    it('should create vehicle without 500', async () => {
        if (!token) return;

        const payload = {
            type: 'CAR',
            brand: 'Toyota',
            model: 'Corolla Repro',
            year: 2024,
            plate: `ABC-${Date.now()}`.substring(0, 8),
            status: 'ACTIVE'
        };

        const res = await request(app.getHttpServer())
            .post('/api/vehicles')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .send(payload);

        if (res.status === 500) {
            console.error('500 Error Body:', res.body);
        }

        expect(res.status).not.toBe(500);
        expect(res.status).toBe(201);
    });
});
