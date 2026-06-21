import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';

@Injectable()
export class ReportService {
  constructor(private dataSource: DataSource) {}

  async getSalesReport(tenantId: string, startDate?: Date, endDate?: Date) {
    const qb = this.dataSource
      .getRepository(Order)
      .createQueryBuilder('order')
      .where('order.tenantId = :tenantId', { tenantId })
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .addSelect('COALESCE(SUM(order.total), 0)', 'totalSales')
      .groupBy('order.status');

    if (startDate) {
      qb.andWhere('order.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('order.createdAt <= :endDate', { endDate });
    }

    const byStatus = await qb.getRawMany();

    const summaryQb = this.dataSource
      .getRepository(Order)
      .createQueryBuilder('order')
      .where('order.tenantId = :tenantId', { tenantId })
      .select('COUNT(order.id)', 'totalOrders')
      .addSelect('COALESCE(SUM(order.total), 0)', 'totalRevenue');

    if (startDate) {
      summaryQb.andWhere('order.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      summaryQb.andWhere('order.createdAt <= :endDate', { endDate });
    }

    const summary = await summaryQb.getRawOne();

    return {
      summary: {
        totalOrders: Number(summary?.totalOrders || 0),
        totalRevenue: Number(summary?.totalRevenue || 0),
      },
      byStatus: byStatus.map((row) => ({
        status: row.status,
        count: Number(row.count),
        totalSales: Number(row.totalSales),
      })),
    };
  }

  async getFleetStatus(tenantId: string) {
    const byStatus = await this.dataSource
      .getRepository(Vehicle)
      .createQueryBuilder('vehicle')
      .where('vehicle.tenantId = :tenantId', { tenantId })
      .select('vehicle.status', 'status')
      .addSelect('COUNT(vehicle.id)', 'count')
      .groupBy('vehicle.status')
      .getRawMany();

    const total = byStatus.reduce((sum, row) => sum + Number(row.count), 0);

    return {
      total,
      byStatus: byStatus.map((row) => ({
        status: row.status,
        count: Number(row.count),
      })),
    };
  }
}
