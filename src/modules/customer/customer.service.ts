import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomerService {
    constructor(
        @InjectRepository(Customer)
        private customerRepository: Repository<Customer>,
    ) { }

    async getOrCreate(tenantId: string, data: { email: string; name: string; phone?: string; document?: string }): Promise<Customer> {
        let customer = await this.customerRepository.findOne({
            where: { tenantId, email: data.email } as any,
        });

        if (!customer) {
            customer = this.customerRepository.create({
                ...data,
                tenantId,
            });
            customer = await this.customerRepository.save(customer);
        }

        return customer;
    }
}
