import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { normalizePagination } from '../../common/utils/pagination.util';

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
    const { page: safePage, limit: safeLimit, skip } = normalizePagination(page, limit);
    const [data, total] = await this.bankAccountRepository.findAndCount({
      where: { organizationId, tenantId },
      skip,
      take: safeLimit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
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
