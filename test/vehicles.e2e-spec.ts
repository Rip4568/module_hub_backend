import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestHelper } from './test-helper';
import { TenantModuleService } from '../src/modules/tenant-module/tenant-module.service';
import { authenticateE2EUser, createE2EApp } from './e2e-auth.helper';

describe('Vehicles (e2e)', () => {
    let app: INestApplication;
    let token: string;
    let tenantId: string;
    let createdVehicleId: string = '';
    let tenantModuleService: TenantModuleService;

    beforeAll(async () => {
        try {
            app = await createE2EApp();
            tenantModuleService = app.get<TenantModuleService>(TenantModuleService);

            const auth = await authenticateE2EUser(app);
            token = auth.token;
            tenantId = auth.tenantId;

            const isEnabled = await tenantModuleService.isModuleEnabled(tenantId, 'fleet_management');
            if (!isEnabled) {
                await tenantModuleService.activateModule(tenantId, 'fleet_management');
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
        plate: `VH${uniqueSuffix}`,
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
            .get('/vehicles?page=1&limit=20')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', tenantId)
            .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
        const found = response.body.data.find((v: { id: string }) => v.id === createdVehicleId);
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

        expect([409, 500]).toContain(res.status);
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
