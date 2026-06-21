import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { normalizePagination } from '../../common/utils/pagination.util';

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
      const { page: safePage, limit: safeLimit, skip } = normalizePagination(page, limit);
      const [data, total] = await this.activityLogRepository.findAndCount({
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

  async findOne(tenantId: string, id: string) {
      const log = await this.activityLogRepository.findOne({ where: { id, tenantId } });
      if (!log) {
          throw new NotFoundException(`Activity log with ID ${id} not found`);
      }
      return log;
  }
}
