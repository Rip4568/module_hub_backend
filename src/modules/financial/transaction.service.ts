import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from './entities/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async create(tenantId: string, createTransactionDto: any): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      tenantId,
    } as Transaction);
    return this.transactionRepository.save(transaction);
  }

  async findAll(tenantId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({ where: { tenantId } });
  }

  async findOne(tenantId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({ where: { id, tenantId } });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async approve(tenantId: string, id: string): Promise<Transaction> {
      const transaction = await this.findOne(tenantId, id);
      transaction.status = TransactionStatus.COMPLETED;
      transaction.processedAt = new Date();
      return this.transactionRepository.save(transaction);
  }

  async cancel(tenantId: string, id: string): Promise<Transaction> {
      const transaction = await this.findOne(tenantId, id);
      transaction.status = TransactionStatus.CANCELLED;
      return this.transactionRepository.save(transaction);
  }
}
