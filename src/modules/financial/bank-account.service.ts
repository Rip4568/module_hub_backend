import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';

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

  async findAll(organizationId: string): Promise<BankAccount[]> {
    return this.bankAccountRepository.find({ where: { organizationId } });
  }

  async findOne(id: string): Promise<BankAccount> {
    const account = await this.bankAccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`BankAccount with ID ${id} not found`);
    }
    return account;
  }
}
