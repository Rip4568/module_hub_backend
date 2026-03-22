import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ActivityLog } from './entities/activity-log.entity';

describe('ActivityLogService', () => {
  let service: ActivityLogService;

  const activityLogRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogService,
        { provide: getRepositoryToken(ActivityLog), useValue: activityLogRepositoryMock },
      ],
    }).compile();

    service = module.get<ActivityLogService>(ActivityLogService);
  });

  it('returns tenant-scoped logs in findAll', async () => {
    activityLogRepositoryMock.find.mockResolvedValue([{ id: 'log-1', tenantId: 'tenant-1' }]);

    const result = await service.findAll('tenant-1');

    expect(result).toEqual([{ id: 'log-1', tenantId: 'tenant-1' }]);
    expect(activityLogRepositoryMock.find).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1' } });
  });

  it('throws NotFoundException when activity log is not found by tenant and id', async () => {
    activityLogRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('tenant-1', 'log-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
