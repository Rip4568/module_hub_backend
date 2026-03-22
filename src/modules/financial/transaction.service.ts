import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async create(tenantId: string, createTransactionDto: CreateTransactionDto): Promise<Transaction> {
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

  async getKPIs(tenantId: string) {
    const transactions = await this.transactionRepository.find({ where: { tenantId } });

    let totalIncome = 0;
    let totalExpense = 0;
    let pendingCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    for (const tx of transactions) {
      const amount = Number(tx.amount || 0);
      if (tx.type === 'CREDIT') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }

      if (tx.status === TransactionStatus.PENDING) pendingCount += 1;
      if (tx.status === TransactionStatus.COMPLETED) completedCount += 1;
      if (tx.status === TransactionStatus.CANCELLED) cancelledCount += 1;
    }

    return {
      totalTransactions: transactions.length,
      completedCount,
      pendingCount,
      cancelledCount,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }
}
