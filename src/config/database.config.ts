import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbType = this.configService.get<string>('DB_TYPE', 'postgres');

    if (dbType === 'sqlite') {
      return {
        type: 'sqlite',
        database: this.configService.get<string>('DB_DATABASE', './module_hub.sqlite'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: this.configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
      };
    }

    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      username: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_DATABASE'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: this.configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
    };
  }
}
