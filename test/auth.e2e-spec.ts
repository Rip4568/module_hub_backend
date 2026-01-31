import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestHelper } from './test-helper';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    const uniqueSuffix = Date.now();
    const testUser = {
        email: `e2e_user_${uniqueSuffix}@test.com`,
        password: 'password123',
        name: 'E2E User',
        tenantName: `E2E Tenant ${uniqueSuffix}`,
    };

    beforeAll(async () => {
        try {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

            app = moduleFixture.createNestApplication();
            await app.init();
        } catch (e) {
            console.error('Startup Error:', e);
            throw e;
        }
    });

    afterAll(async () => {
        if (app) await app.close();
    });

    it('/auth/register (POST)', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: testUser.email,
                password: testUser.password,
                name: testUser.name,
                tenantName: testUser.tenantName,
            })
            .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.email).toEqual(testUser.email);
        expect(response.body.tenantId).toBeDefined();

        console.log('Registered User ID:', response.body.id);
        TestHelper.saveEnv('test_tenantId', response.body.tenantId);
    });

    it('/auth/login (POST)', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password,
            })
            .expect(201);

        expect(response.body).toHaveProperty('token');

        console.log('Login successful. Token saved.');
        TestHelper.saveEnv('test_token', response.body.token);
    });
});
