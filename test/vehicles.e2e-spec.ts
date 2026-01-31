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
            app.useGlobalPipes(new ValidationPipe({ transform: true }));
            app.useGlobalFilters(new GlobalExceptionFilter());
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
        TestHelper.saveEnv('test_vehicleId', createdVehicleId);
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

    it('/vehicles (POST) - Create Vehicle Validation Error', async () => {
        const invalidVehicle = {
            type: 'CAR',
            // Missing brand
            // Missing model
            year: 2024,
            plate: 'INVALID'
            // Missing other fields might trigger 400
        };

        await request(app.getHttpServer())
            .post('/vehicles')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .send(invalidVehicle)
            .expect(400); // Expect Bad Request
    });

    it('/vehicles (POST) - Create Duplicate Vehicle (Plate)', async () => {
        // Attempt to create a vehicle with the SAME plate as the one created in the first test
        const duplicateVehicle = {
            ...newVehicle,
            model: 'Another Model' // Even if other fields differ, plate must be unique
        };

        const res = await request(app.getHttpServer())
            .post('/vehicles')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .send(duplicateVehicle);

        expect(res.status).toBe(409); // Conflict
        expect(res.body.message).toContain('Duplicate entry');
    });

    it('/vehicles/:id (DELETE) - Delete Vehicle', async () => {
        // Create a temporary vehicle for deletion testing
        const tempVehicle = { ...newVehicle, plate: `DEL-${Date.now()}` };
        const createRes = await request(app.getHttpServer())
            .post('/vehicles')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .send(tempVehicle)
            .expect(201);

        const idToDelete = createRes.body.id;

        await request(app.getHttpServer())
            .delete(`/vehicles/${idToDelete}`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .expect(200);

        await request(app.getHttpServer())
            .get(`/vehicles/${idToDelete}`)
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .expect(404);
    });
});
