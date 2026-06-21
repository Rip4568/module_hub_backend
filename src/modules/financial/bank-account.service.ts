import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
  ) {}

  async create(createAccountDto: any): Promise<BankAccount> {
    const account = this.bankAccountRepository.create(createAccountDto as BankAccount);
    return this.bankAccountRepository.save(account);
  }

  async findAll(
    organizationId: string,
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<BankAccount>> {
    const [data, total] = await this.bankAccountRepository.findAndCount({
      where: { organizationId, tenantId },
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

  async findOne(id: string, tenantId: string): Promise<BankAccount> {
    const account = await this.bankAccountRepository.findOne({ where: { id, tenantId } });
    if (!account) {
      throw new NotFoundException(`BankAccount with ID ${id} not found`);
    }
    return account;
  }
}
