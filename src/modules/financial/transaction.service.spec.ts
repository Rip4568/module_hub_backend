import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Transaction, TransactionStatus, TransactionType } from './entities/transaction.entity';

describe('TransactionService', () => {
  let service: TransactionService;

  const createQueryBuilderMock = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  };

  const transactionRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => createQueryBuilderMock),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: getRepositoryToken(Transaction), useValue: transactionRepositoryMock },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('throws NotFoundException when tenant-scoped transaction does not exist', async () => {
    transactionRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('tenant-1', 'tx-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('approves transaction and sets processedAt', async () => {
    const transaction = {
      id: 'tx-1',
      status: TransactionStatus.PENDING,
      processedAt: null,
    } as unknown as Transaction;
    jest.spyOn(service, 'findOne').mockResolvedValue(transaction);
    transactionRepositoryMock.save.mockImplementation(async (entity) => entity);

    const updated = await service.approve('tenant-1', 'tx-1');

    expect(updated.status).toBe(TransactionStatus.COMPLETED);
    expect(updated.processedAt).toBeInstanceOf(Date);
  });

  it('calculates KPI aggregates via SQL', async () => {
    createQueryBuilderMock.getRawOne.mockResolvedValue({
      totalTransactions: '3',
      totalIncome: '150',
      totalExpense: '50',
    });
    createQueryBuilderMock.getRawMany.mockResolvedValue([
      { status: TransactionStatus.COMPLETED, count: '1' },
      { status: TransactionStatus.PENDING, count: '1' },
      { status: TransactionStatus.CANCELLED, count: '1' },
    ]);

    const kpis = await service.getKPIs('tenant-1');

    expect(kpis).toEqual({
      totalTransactions: 3,
      completedCount: 1,
      pendingCount: 1,
      cancelledCount: 1,
      totalIncome: 150,
      totalExpense: 50,
      balance: 100,
    });
    expect(transactionRepositoryMock.createQueryBuilder).toHaveBeenCalled();
  });
});
