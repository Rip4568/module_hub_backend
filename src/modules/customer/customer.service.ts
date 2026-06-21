import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

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

    async findAll(tenantId: string, page = 1, limit = 20): Promise<PaginatedResult<Customer>> {
        const [data, total] = await this.customerRepository.findAndCount({
            where: { tenantId },
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: string, tenantId: string): Promise<Customer> {
        const customer = await this.customerRepository.findOne({ where: { id, tenantId } });
        if (!customer) {
            throw new NotFoundException(`Customer with ID ${id} not found`);
        }
        return customer;
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto, tenantId: string): Promise<Customer> {
        await this.customerRepository.update({ id, tenantId }, updateCustomerDto);
        return this.findOne(id, tenantId);
    }

    async remove(id: string, tenantId: string): Promise<void> {
        await this.customerRepository.delete({ id, tenantId });
    }

    async getOrCreate(tenantId: string, data: { email: string; name: string; phone?: string; document?: string }): Promise<Customer> {
        let customer = await this.customerRepository.findOne({
            where: { tenantId, email: data.email },
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
