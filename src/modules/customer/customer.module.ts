import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerService } from './customer.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantRepository } from '../../common/repositories/tenant.repository';
import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';

@Module({
    imports: [TypeOrmModule.forFeature([Customer])],
    providers: [
        CustomerService,
        {
            provide: getRepositoryToken(Customer),
            inject: [DataSource, ClsService],
            useFactory: (dataSource: DataSource, cls: ClsService) => {
                return new TenantRepository(Customer, dataSource.manager, dataSource.createQueryRunner(), cls);
            },
        },
    ],
    exports: [CustomerService],
})
export class CustomerModule { }
