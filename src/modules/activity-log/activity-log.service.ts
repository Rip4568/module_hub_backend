import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';

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

  async findAll(tenantId: string) {
      return this.activityLogRepository.find({ where: { tenantId } });
  }

  async findOne(tenantId: string, id: string) {
      const log = await this.activityLogRepository.findOne({ where: { id, tenantId } });
      if (!log) {
          throw new NotFoundException(`Activity log with ID ${id} not found`);
      }
      return log;
  }
}
