import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';
import { CreateDeliveryDto, CreateIndependentDeliveryDto } from './dto/create-delivery.dto';
import { DeliveryDocumentType } from './entities/delivery-document.entity';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { Permissions } from '../../common/constants/permissions';

@Controller('deliveries')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) { }

  @Get('track/:trackingCode')
  @RequiresPermission(Permissions.READ_DELIVERY)
  trackByCode(@CurrentTenant() tenantId: string, @Param('trackingCode') trackingCode: string) {
    return this.deliveryService.findByTrackingCode(trackingCode, tenantId);
  }

  @Get()
  @RequiresPermission(Permissions.READ_DELIVERY)
  findAll(@CurrentTenant() tenantId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.deliveryService.findAll(tenantId, page, limit);
  }

  @Post('independent')
  @RequiresPermission(Permissions.CREATE_DELIVERY)
  createIndependent(@CurrentTenant() tenantId: string, @Body() dto: CreateIndependentDeliveryDto) {
    return this.deliveryService.createIndependent({ ...dto, tenantId });
  }

  @Post()
  @RequiresPermission(Permissions.CREATE_DELIVERY)
  create(@CurrentTenant() tenantId: string, @Body() createDeliveryDto: CreateDeliveryDto) {
    return this.deliveryService.create({ ...createDeliveryDto, tenantId });
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_DELIVERY)
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.deliveryService.findOne(id, tenantId);
  }

  @Patch(':id')
  @RequiresPermission(Permissions.UPDATE_DELIVERY)
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() payload: Partial<CreateDeliveryDto>) {
    return this.deliveryService.update(id, payload, tenantId);
  }

  @Patch(':id/status')
  @RequiresPermission(Permissions.UPDATE_DELIVERY)
  updateStatus(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: { status: string }) {
    return this.deliveryService.updateStatus(id, body.status, tenantId);
  }

  @Post(':id/start')
  @RequiresPermission(Permissions.UPDATE_DELIVERY)
  start(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.deliveryService.start(id, tenantId);
  }

  @Patch(':id/location')
  @RequiresPermission(Permissions.UPDATE_DELIVERY)
  updateLocation(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() location: { lat: number; lng: number; batteryLevel?: number; timestamp?: Date },
    @Req() req: AuthenticatedRequest
  ) {
    return this.deliveryService.updateLocation(id, location, req.user.userId, tenantId);
  }

  @Post(':id/documents')
  @RequiresPermission(Permissions.UPDATE_DELIVERY)
  uploadDocument(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() document: { type: DeliveryDocumentType; url: string },
    @Req() req: AuthenticatedRequest
  ) {
    return this.deliveryService.uploadDocument(id, document, req.user.userId, tenantId);
  }

  @Post(':id/complete')
  @RequiresPermission(Permissions.COMPLETE_DELIVERY)
  complete(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() proof: CompleteDeliveryDto) {
    return this.deliveryService.complete(id, proof, tenantId);
  }
}
