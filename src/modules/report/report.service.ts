import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';

@Injectable()
export class ReportService {
  constructor(private dataSource: DataSource) {}

  async getSalesReport(tenantId: string, startDate?: Date, endDate?: Date) {
    const qb = this.dataSource.getRepository(Order).createQueryBuilder('order')
        .where('order.tenantId = :tenantId', { tenantId })
        .select('SUM(order.total)', 'totalSales')
        .addSelect('COUNT(order.id)', 'count')
        .addSelect('order.status', 'status')
        .groupBy('order.status');

    if (startDate) {
        qb.andWhere('order.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
        qb.andWhere('order.createdAt <= :endDate', { endDate });
    }

    return qb.getRawMany();
  }

  async getFleetStatus(tenantId: string) {
      return this.dataSource.getRepository(Vehicle).createQueryBuilder('vehicle')
        .where('vehicle.tenantId = :tenantId', { tenantId })
        .select('vehicle.status', 'status')
        .addSelect('COUNT(vehicle.id)', 'count')
        .groupBy('vehicle.status')
        .getRawMany();
  }
}
