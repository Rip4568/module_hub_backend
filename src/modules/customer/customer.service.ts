import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
    constructor(
        @InjectRepository(Customer)
        private customerRepository: Repository<Customer>,
    ) { }

    async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
        const customer = this.customerRepository.create(createCustomerDto);
        return this.customerRepository.save(customer);
    }

    async findAll(tenantId: string): Promise<Customer[]> {
        return this.customerRepository.find({
            where: { tenantId } as any
        });
    }

    async findOne(id: string): Promise<Customer> {
        const customer = await this.customerRepository.findOne({ where: { id } });
        if (!customer) {
            throw new Error(`Customer with ID ${id} not found`);
        }
        return customer;
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
        await this.customerRepository.update(id, updateCustomerDto);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.customerRepository.delete(id);
    }

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
