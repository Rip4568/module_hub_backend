import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestHelper } from './test-helper';

describe('Modules (e2e)', () => {
    let app: INestApplication;
    let token: string;
    let tenantId: string;

    beforeAll(async () => {
        try {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            app = moduleFixture.createNestApplication();
            await app.init();

            token = TestHelper.getEnv<string>('test_token');
            tenantId = TestHelper.getEnv<string>('test_tenantId');

            if (!token || !tenantId) {
                throw new Error('Test environment variables (token or tenantId) not found. Run auth.e2e-spec.ts first.');
            }

            console.log('Modules E2E: Using Token:', token.substring(0, 10) + '...');
            console.log('Modules E2E: Using TenantId:', tenantId);

        } catch (e) {
            console.error('Startup Error:', e);
            throw e;
        }
    });

    afterAll(async () => {
        if (app) await app.close();
    });

    it('Activate Fleet Module (Access Control Verification)', async () => {
        const moduleId = 'fleet_management';

        // 1. Ensure Module is Deactivated first
        // This allows us to prove that access is forbidden when module is off.
        console.log('Deactivating Fleet Module to test access control...');
        await request(app.getHttpServer())
            .post(`/tenant-modules/${moduleId}/deactivate`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .expect((res) => {
                if (res.status !== 201 && res.status !== 200 && res.status !== 404) {
                    console.warn('Deactivation returned status:', res.status);
                }
            });

        // 2. Verify Access is FORBIDDEN (403)
        console.log('Verifying 403 Forbidden when module is inactive...');
        await request(app.getHttpServer())
            .get('/vehicles')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .expect(403)
            .expect((res) => {
                expect(res.body.message).toContain('not enabled');
            });

        // 3. Activate Module
        console.log('Activating Fleet Module...');
        await request(app.getHttpServer())
            .post(`/tenant-modules/${moduleId}/activate`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .expect(201)
            .expect((res) => {
                expect(res.body.moduleId).toBe(moduleId);
                expect(res.body.isActive).toBe(true);
            });

        console.log('Fleet Module Activated');
    });

    it('/vehicles (GET) - Verify Access', async () => {
        // This endpoint requires 'fleet_management' module to be active
        const response = await request(app.getHttpServer())
            .get('/vehicles')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        console.log('Access to /vehicles verified, count:', response.body.length);
    });
});
