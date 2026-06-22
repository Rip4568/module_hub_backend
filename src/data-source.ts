import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const isSQLite = process.env.DB_TYPE === 'sqlite';

export const AppDataSource = new DataSource(
  isSQLite
    ? {
        type: 'sqlite',
        database: process.env.DB_DATABASE || './module_hub.sqlite',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        subscribers: [],
        synchronize: false,
        logging: process.env.NODE_ENV !== 'production',
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        subscribers: [],
        synchronize: false,
        logging: process.env.NODE_ENV !== 'production',
      },
);
