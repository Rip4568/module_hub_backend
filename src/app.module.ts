import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseConfigService } from './config/database.config';

// Core Modules
import { TenantModule } from './modules/tenant/tenant.module';
import { TenantModuleModule } from './modules/tenant-module/tenant-module.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { CustomerModule } from './modules/customer/customer.module';

// Business Modules
import { OrganizationModule } from './modules/organization/organization.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { DriverModule } from './modules/driver/driver.module';
import { FinancialModule } from './modules/financial/financial.module';
import { DocumentModule } from './modules/document/document.module';
import { ReportModule } from './modules/report/report.module';
import { DriverPortalModule } from './modules/driver-portal/driver-portal.module';

// Infrastructure
import { StorageModule } from './infrastructure/storage/storage.module';
import { EmailModule } from './infrastructure/email/email.module';

// Common
import { ClsModule, ClsMiddleware } from 'nestjs-cls';
import { TenantContextMiddleware } from './common/middlewares/tenant-context.middleware';
import { TenantSubscriber } from './common/subscribers/tenant.subscriber';
import { BillingEnforcementGuard } from './common/guards/billing-enforcement.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
      skipIf: () => process.env.NODE_ENV === 'test',
    }),
    EventEmitterModule.forRoot(),
    StorageModule,
    EmailModule,
    ClsModule.forRoot({
      global: true,
      middleware: { mount: false },
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfigService,
    }),

    // Core
    TenantModule,
    TenantModuleModule,
    UserModule,
    AuthModule,
    RoleModule,
    PermissionModule,
    ActivityLogModule,
    CustomerModule,

    // Business
    OrganizationModule,
    CategoryModule,
    ProductModule,
    OrderModule,
    DeliveryModule,
    VehicleModule,
    DriverModule,
    FinancialModule,
    DocumentModule,
    ReportModule,
    DriverPortalModule,
  ],
  controllers: [],
  providers: [
    TenantSubscriber,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: BillingEnforcementGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ClsMiddleware, TenantContextMiddleware).forRoutes('*');
  }
}
