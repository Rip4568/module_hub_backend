import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import { StockLevel, StockLocationType } from './entities/stock-level.entity';
import { InventoryMovement, InventoryMovementType } from './entities/inventory-movement.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { TransferInventoryDto, AdjustInventoryDto } from './dto/inventory-operation.dto';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../../common/context/request.context';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockLevel)
    private stockLevelRepository: Repository<StockLevel>,
    @InjectRepository(InventoryMovement)
    private movementRepository: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private dataSource: DataSource,
    private readonly cls: ClsService,
  ) {}

  private getTenantId(): string {
    return this.cls.get(RequestContext.TENANT_ID);
  }

  private resolveIds(type: StockLocationType, id?: string) {
    if (type === StockLocationType.WAREHOUSE) {
      return { warehouseId: 'DEFAULT', vehicleId: null };
    }
    if (type === StockLocationType.VEHICLE) {
      if (!id) throw new BadRequestException('Vehicle ID is required for VEHICLE location type');
      return { warehouseId: null, vehicleId: id };
    }
    return { warehouseId: null, vehicleId: null };
  }

  async getStockLevel(
    manager: EntityManager,
    productId: string,
    variantId: string | null,
    locationType: StockLocationType,
    locationId?: string,
  ): Promise<StockLevel> {
    const tenantId = this.getTenantId();
    const { warehouseId, vehicleId } = this.resolveIds(locationType, locationId);

    const where: any = {
      tenant: { id: tenantId },
      productId,
      locationType,
    };
    if (variantId) where.variantId = variantId;
    else where.variantId = null; // Important for products without variants

    if (warehouseId) where.warehouseId = warehouseId;
    if (vehicleId) where.vehicleId = vehicleId;

    let stockLevel = await manager.findOne(StockLevel, { where });

    if (!stockLevel) {
      stockLevel = manager.create(StockLevel, {
        tenant: { id: tenantId },
        productId,
        variantId: variantId || undefined,
        locationType,
        warehouseId: warehouseId || undefined,
        vehicleId: vehicleId || undefined,
        quantity: 0,
      });
    }
    return stockLevel;
  }

  async transfer(dto: TransferInventoryDto) {
    return this.dataSource.transaction(async (manager) => {
      const { productId, variantId, quantity, fromType, fromId, toType, toId } = dto;

      const sourceStock = await this.getStockLevel(
        manager,
        productId,
        variantId || null,
        fromType,
        fromId,
      );
      if (sourceStock.quantity < quantity) {
        throw new BadRequestException('Insufficient stock at source location');
      }

      const destinationStock = await this.getStockLevel(
        manager,
        productId,
        variantId || null,
        toType,
        toId,
      );

      sourceStock.quantity = Number(sourceStock.quantity) - quantity;
      destinationStock.quantity = Number(destinationStock.quantity) + quantity;

      await manager.save(sourceStock);
      await manager.save(destinationStock);

      const movement = manager.create(InventoryMovement, {
        tenant: { id: this.getTenantId() },
        type: InventoryMovementType.TRANSFER,
        originLocationType: fromType,
        originReferenceId: fromType === StockLocationType.VEHICLE ? fromId || '' : 'DEFAULT',
        destinationLocationType: toType,
        destinationReferenceId: toType === StockLocationType.VEHICLE ? toId || '' : 'DEFAULT',
        productId,
        variantId: variantId || undefined,
        quantity,
      });
      await manager.save(movement);

      return { source: sourceStock, destination: destinationStock };
    });
  }

  async adjust(dto: AdjustInventoryDto) {
    return this.dataSource.transaction(async (manager) => {
      const { productId, variantId, quantity, locationType, locationId, reason } = dto;

      const stockLevel = await this.getStockLevel(
        manager,
        productId,
        variantId || null,
        locationType,
        locationId,
      );

      const oldQty = Number(stockLevel.quantity);
      const newQty = oldQty + quantity;

      if (newQty < 0) {
        throw new BadRequestException('Stock cannot be negative');
      }

      stockLevel.quantity = newQty;
      await manager.save(stockLevel);

      const movement = manager.create(InventoryMovement, {
        tenant: { id: this.getTenantId() },
        type: InventoryMovementType.ADJUSTMENT,
        originLocationType: locationType,
        originReferenceId:
          locationType === StockLocationType.VEHICLE ? locationId || '' : 'DEFAULT',
        destinationLocationType: locationType, // Same for adjustment? Or null? Let's keep same.
        destinationReferenceId:
          locationType === StockLocationType.VEHICLE ? locationId || '' : 'DEFAULT',
        productId,
        variantId: variantId || undefined,
        quantity,
        reason,
      });
      await manager.save(movement);

      // Update Product/Variant total cache if needed (optional, but good for consistency)
      // For now, staying with StockLevel as source.

      return stockLevel;
    });
  }

  /**
   *
   * @param manager
   * @param productId
   * @param variantId
   * @param quantity
   * @param locationType
   * @param locationId Where the stock is, can be on the vehicle or any place that suport
   * @param orderId
   */
  async deductStockForOrder(
    manager: EntityManager,
    productId: string,
    variantId: string | null,
    quantity: number,
    locationType: StockLocationType,
    locationId?: string, // vehicleId
    orderId?: string,
  ) {
    const stockLevel = await this.getStockLevel(
      manager,
      productId,
      variantId,
      locationType,
      locationId,
    );

    if (stockLevel.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for product ${productId} at ${locationType}`,
      );
    }

    stockLevel.quantity = Number(stockLevel.quantity) - quantity;
    await manager.save(stockLevel);

    const movement = manager.create(InventoryMovement, {
      tenant: { id: this.getTenantId() },
      type: InventoryMovementType.SALE,
      originLocationType: locationType,
      originReferenceId: locationType === StockLocationType.VEHICLE ? locationId || '' : 'DEFAULT',
      productId,
      variantId: variantId || undefined,
      quantity: -quantity,
    });

    movement.referenceId = orderId;
    await manager.save(movement);
  }

  async getMovements(productId: string, locationType?: StockLocationType, locationId?: string) {
    const where: any = {
      tenant: { id: this.getTenantId() },
      productId,
    };
    if (locationType) {
      where.originLocationType = locationType; // Or destination? Maybe complex.
      // Valid requirement: "Extrato". Usually means movements involving this context.
      // Let's keep simple: Filter by productId mainly.
    }
    return this.movementRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
