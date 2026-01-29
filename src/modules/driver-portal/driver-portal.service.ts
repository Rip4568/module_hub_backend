import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../driver/entities/driver.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { DriverVehicle } from '../driver/entities/driver-vehicle.entity';
import { Tenant } from '../tenant/entities/tenant.entity';

@Injectable()
export class DriverPortalService {
    constructor(
        @InjectRepository(Driver)
        private driverRepository: Repository<Driver>,
        @InjectRepository(DriverVehicle)
        private driverVehicleRepository: Repository<DriverVehicle>,
        @InjectRepository(Tenant)
        private tenantRepository: Repository<Tenant>,
    ) { }

    /**
     * Returns the driver profile for the specific tenant context
     */
    async getProfile(tenantId: string, userId: string) {
        const driver = await this.driverRepository.findOne({
            where: { userId, tenantId },
            relations: ['user', 'vehicles', 'vehicles.vehicle']
        });

        if (!driver) {
            throw new NotFoundException('Driver profile not found for this tenant');
        }

        return driver;
    }

    /**
     * Returns all tenants where the user is registered as a driver
     */
    async getMyTenants(userId: string) {
        // Find all driver records for this user across all tenants
        const drivers = await this.driverRepository.find({
            where: { userId },
            select: ['tenantId', 'id', 'status']
        });

        if (!drivers.length) return [];

        const tenantIds = drivers.map(d => d.tenantId);
        if (!tenantIds.length) return [];

        // Fetch tenant details
        // Note: We need to use specific query to avoid RLS if enabled, or assume this is a global query
        // Since we are looking for tenants by ID, and we have the IDs, it should be fine.
        // However, if RLS (TenantContext) is strict, it might block looking up other tenants.
        // Assuming we can search tenants by ID generally.
        const tenants = await this.tenantRepository.createQueryBuilder('tenant')
            .where('tenant.id IN (:...ids)', { ids: tenantIds })
            .getMany();

        return tenants.map(t => ({
            ...t,
            driverProfile: drivers.find(d => d.tenantId === t.id)
        }));
    }

    /**
     * List available vehicles for the driver in this tenant
     */
    async getAvailableVehicles(tenantId: string) {
        return [];
    }

    async exportData(tenantId: string, userId: string, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Buffer> {
        const driver = await this.getProfile(tenantId, userId);

        // Mock data fetching - in real app would fetch orders/trips history
        const history = [
            { date: '2024-01-01', type: 'TRIP', amount: 150.00, status: 'COMPLETED' },
            { date: '2024-01-02', type: 'TRIP', amount: 200.00, status: 'COMPLETED' },
        ];

        const Workbook = require('exceljs').Workbook; // Dynamic import or use standard import if top-level allowed
        const workbook = new Workbook();
        const sheet = workbook.addWorksheet('History');

        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        sheet.addRows(history);

        if (format === 'csv') {
            return await workbook.csv.writeBuffer();
        } else {
            return await workbook.xlsx.writeBuffer();
        }
    }
}
