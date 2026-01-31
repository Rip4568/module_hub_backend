import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestHelper } from './test-helper';
import { TenantModuleService } from '../src/modules/tenant-module/tenant-module.service';

describe('Vehicles (e2e)', () => {
    let app: INestApplication;
    let token: string;
    let tenantId: string;
    let createdVehicleId: string = '';
    let tenantModuleService: TenantModuleService;

    beforeAll(async () => {
        try {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            app = moduleFixture.createNestApplication();
            await app.init();

            tenantModuleService = app.get<TenantModuleService>(TenantModuleService);

            token = TestHelper.getEnv<string>('test_token');
            tenantId = TestHelper.getEnv<string>('test_tenantId');

            if (!token || !tenantId) {
                throw new Error('Test environment variables not found.');
            }

            // Ensure Fleet Module is Active
            const isEnabled = await tenantModuleService.isModuleEnabled(tenantId, 'fleet_management');
            if (!isEnabled) {
                console.log('Activating Fleet Module for test...');
                await tenantModuleService.activateModule(tenantId, 'fleet_management');
                console.log('Fleet Module Activated');
            }

        } catch (e) {
            console.error('Startup Error:', e);
            throw e;
        }
    });

    afterAll(async () => {
        if (app) await app.close();
    });

    const uniqueSuffix = Date.now();
    const newVehicle = {
        type: 'CAR',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2024,
        color: 'White',
        plate: `ABC${uniqueSuffix.toString().substring(7)}`, // Short plate
        fuelType: 'FLEX',
        photos: []
    };

    it('/vehicles (POST) - Create Vehicle', async () => {
        const response = await request(app.getHttpServer())
            .post('/vehicles')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .send(newVehicle)
            .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.plate).toEqual(newVehicle.plate);
        createdVehicleId = response.body.id;
        console.log('Created Vehicle ID:', createdVehicleId);
    });

    it('/vehicles (GET) - List Vehicles', async () => {
        const response = await request(app.getHttpServer())
            .get('/vehicles')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        const found = response.body.find((v: any) => v.id === createdVehicleId);
        expect(found).toBeDefined();
    });

    it('/vehicles/:id (GET) - Get One', async () => {
        const response = await request(app.getHttpServer())
            .get(`/vehicles/${createdVehicleId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .expect(200);

        expect(response.body.id).toEqual(createdVehicleId);
    });

    it('/vehicles/:id (PUT) - Update Vehicle', async () => {
        const response = await request(app.getHttpServer())
            .put(`/vehicles/${createdVehicleId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .send({
                color: 'Black'
            })
            .expect(200);

        expect(response.body.color).toEqual('Black');
    });

    it('/vehicles/:id (DELETE) - Delete Vehicle', async () => {
        await request(app.getHttpServer())
            .delete(`/vehicles/${createdVehicleId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .expect(200);

        await request(app.getHttpServer())
            .get(`/vehicles/${createdVehicleId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .expect(404);
    });
});
