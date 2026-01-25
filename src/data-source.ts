import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { TenantSubscriber } from './common/subscribers/tenant.subscriber';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    subscribers: [TenantSubscriber],
    synchronize: false, // Always false for migrations
    logging: true,
});
