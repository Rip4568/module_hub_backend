import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  async log(data: Partial<ActivityLog>) {
    const log = this.activityLogRepository.create(data);
    return this.activityLogRepository.save(log);
  }

  async findAll(tenantId: string, page = 1, limit = 20): Promise<PaginatedResult<ActivityLog>> {
      const [data, total] = await this.activityLogRepository.findAndCount({
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

  async findOne(tenantId: string, id: string) {
      const log = await this.activityLogRepository.findOne({ where: { id, tenantId } });
      if (!log) {
          throw new NotFoundException(`Activity log with ID ${id} not found`);
      }
      return log;
  }
}
