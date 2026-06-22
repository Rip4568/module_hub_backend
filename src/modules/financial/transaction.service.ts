import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus, TransactionType } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { normalizePagination } from '../../common/utils/pagination.util';

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

  async findAll(tenantId: string, page = 1, limit = 20): Promise<PaginatedResult<Transaction>> {
    const { page: safePage, limit: safeLimit, skip } = normalizePagination(page, limit);
    const [data, total] = await this.transactionRepository.findAndCount({
      where: { tenantId },
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
    const aggregates = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('COUNT(tx.id)', 'totalTransactions')
      .addSelect(
        `COALESCE(SUM(CASE WHEN tx.type = :creditType THEN tx.amount ELSE 0 END), 0)`,
        'totalIncome',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN tx.type != :creditType THEN tx.amount ELSE 0 END), 0)`,
        'totalExpense',
      )
      .where('tx.tenantId = :tenantId', { tenantId })
      .setParameter('creditType', TransactionType.CREDIT)
      .getRawOne();

    const statusCounts = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('tx.status', 'status')
      .addSelect('COUNT(tx.id)', 'count')
      .where('tx.tenantId = :tenantId', { tenantId })
      .groupBy('tx.status')
      .getRawMany();

    const countByStatus = (status: TransactionStatus) =>
      Number(statusCounts.find((row) => row.status === status)?.count || 0);

    const totalIncome = Number(aggregates?.totalIncome || 0);
    const totalExpense = Number(aggregates?.totalExpense || 0);

    return {
      totalTransactions: Number(aggregates?.totalTransactions || 0),
      completedCount: countByStatus(TransactionStatus.COMPLETED),
      pendingCount: countByStatus(TransactionStatus.PENDING),
      cancelledCount: countByStatus(TransactionStatus.CANCELLED),
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }
}
